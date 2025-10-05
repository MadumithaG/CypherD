import os, time, random
from typing import List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from dotenv import load_dotenv

from .db import init_db, engine, User, Wallet, Tx, get_user_by_email, get_wallet_by_user, get_wallet, upsert_wallet, insert_tx, list_txs_for_address
from .models import RegisterIn, LoginIn, TokenOut, CreateWalletIn, WalletOut, PrepareTransferIn, PrepareTransferOut, ExecuteTransferIn, HistoryOut, TxOut
from .auth import get_session, hash_password, verify_password, create_access_token, get_current_user
from .approvals import create_approval, pop_approval
from .prices import quote_usd_to_eth
from .notify import send_email
from .utils import eth_to_wei, wei_to_eth, usd_to_usdc_units, is_address

load_dotenv()

app = FastAPI(title="CypherD Mock Wallet API")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

# -------------------- AUTH --------------------
@app.post("/auth/register", response_model=TokenOut)
def register(body: RegisterIn, session: Session = Depends(get_session)):
    if get_user_by_email(session, body.email):
        raise HTTPException(400, "Email already registered")
    user = User(email=body.email, password_hash=hash_password(body.password), created_at=int(time.time()))
    session.add(user)
    session.commit()
    token = create_access_token({"sub": user.email})
    return TokenOut(access_token=token)

@app.post("/auth/login", response_model=TokenOut)
def login(body: LoginIn, session: Session = Depends(get_session)):
    user = get_user_by_email(session, body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": user.email})
    return TokenOut(access_token=token)

@app.get("/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email, "id": current_user.id}

# -------------------- WALLETS --------------------
@app.post("/wallets/create", response_model=WalletOut)
def create_wallet(body: CreateWalletIn, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if not is_address(body.address):
        raise HTTPException(400, "Invalid address")
    if get_wallet(session, body.address):
        # If already exists, return it (idempotent)
        w = get_wallet(session, body.address)
        if w.user_id != current_user.id:
            raise HTTPException(400, "Address already taken by another user")
        return WalletOut(address=w.address, balance_eth=f"{wei_to_eth(w.balance_wei):.6f}")
    # make random starting balance 1-10 ETH
    balance_wei = eth_to_wei(round(random.uniform(1.0, 10.0), 6))
    w = Wallet(address=body.address, user_id=current_user.id, balance_wei=balance_wei, created_at=int(time.time()))
    upsert_wallet(session, w)
    return WalletOut(address=w.address, balance_eth=f"{wei_to_eth(w.balance_wei):.6f}")

@app.get("/wallets/me", response_model=WalletOut)
def my_wallet(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    w = get_wallet_by_user(session, current_user.id)
    if not w:
        raise HTTPException(404, "No wallet yet")
    return WalletOut(address=w.address, balance_eth=f"{wei_to_eth(w.balance_wei):.6f}")

# -------------------- TRANSFERS --------------------
@app.post("/transfer/prepare", response_model=PrepareTransferOut)
async def prepare_transfer(body: PrepareTransferIn, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    w = get_wallet_by_user(session, current_user.id)
    if not w:
        raise HTTPException(404, "No wallet yet")
    if not is_address(body.recipient):
        raise HTTPException(400, "Invalid recipient address")
    # compute amount in ETH/wei
    was_usd = (body.unit.upper() == "USD")
    usd_amount = None
    if was_usd:
        usd = float(body.amount_input)
        eth_amt, usd_amt = await quote_usd_to_eth(usd)
        amount_wei = eth_to_wei(eth_amt)
        usd_amount = usd_amt
        eth_amount = eth_amt
    else:
        eth_amount = float(body.amount_input)
        amount_wei = eth_to_wei(eth_amount)
    # approval message with TTL and anti-replay
    exp_ms = int(time.time() * 1000) + 30_000
    # Include a unique approval ID and expiry in message
    tmp = create_approval(
        message="",
        sender=w.address,
        recipient=body.recipient,
        amount_wei=amount_wei,
        was_usd=was_usd,
        usd_amount_cents=int(round((usd_amount or 0.0) * 100))
    )
    message = f"APPROVAL_ID:{tmp.id}|SENDER:{w.address}|RECIPIENT:{body.recipient}|AMOUNT_WEI:{amount_wei}|EXP_MS:{exp_ms}"
    # Update message in store by recreating (simple hack)
    tmp = create_approval(message, w.address, body.recipient, amount_wei, was_usd, int(round((usd_amount or 0.0) * 100)))
    return PrepareTransferOut(
        approval_id=tmp.id,
        message=message,
        expires_at=tmp.expires_at,
        amount_wei=str(amount_wei),
        amount_eth=f"{eth_amount:.6f}",
        usd_amount=(f"{usd_amount:.2f}" if was_usd else None)
    )

@app.post("/transfer/execute")
async def execute_transfer(body: ExecuteTransferIn, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    from eth_account import Account
    from eth_account.messages import encode_defunct

    w = get_wallet_by_user(session, current_user.id)
    if not w:
        raise HTTPException(404, "No wallet yet")

    approval = pop_approval(body.approval_id)
    if not approval:
        raise HTTPException(400, "Approval expired or invalid")

    # Verify signature
    recovered = Account.recover_message(encode_defunct(text=approval.message), signature=body.signature)
    if recovered.lower() != approval.sender.lower():
        raise HTTPException(400, "Invalid signature")

    # If USD, re-quote and enforce 1% slippage
    if approval.was_usd and approval.usd_amount_cents is not None:
        usd = approval.usd_amount_cents / 100.0
        new_eth, _ = await quote_usd_to_eth(usd)
        new_wei = eth_to_wei(new_eth)
        diff = abs(new_wei - approval.amount_wei) / approval.amount_wei
        if diff > 0.01:
            raise HTTPException(400, "Price moved >1%, please retry")

    # Ensure sender balance sufficient
    if w.balance_wei < approval.amount_wei:
        raise HTTPException(400, "Insufficient funds")

    # Credit recipient (create wallet row for recipient if needed but not linked to user)
    recipient_wallet = get_wallet(session, approval.recipient)
    if not recipient_wallet:
        recipient_wallet = Wallet(address=approval.recipient, user_id=-1, balance_wei=0, created_at=int(time.time()))
        upsert_wallet(session, recipient_wallet)

    # Update balances and record tx
    w.balance_wei -= approval.amount_wei
    recipient_wallet.balance_wei += approval.amount_wei
    upsert_wallet(session, w)
    upsert_wallet(session, recipient_wallet)

    tx = Tx(
        ts=int(time.time()),
        sender=approval.sender,
        recipient=approval.recipient,
        amount_wei=approval.amount_wei,
        amount_eth=f"{float(approval.amount_wei) / 1e18:.6f}",
        usd_amount=(f"{approval.usd_amount_cents/100:.2f}" if approval.was_usd else None),
        user_id=current_user.id
    )
    insert_tx(session, tx)

    # Notify
    await send_email(
        to_email=current_user.email,
        subject="CypherD Mock Wallet: Transfer Successful",
        body=f"Sent {tx.amount_eth} ETH to {tx.recipient} at {tx.ts}."
    )

    return {"status": "ok"}

# -------------------- HISTORY --------------------
@app.get("/history", response_model=HistoryOut)
def history(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    w = get_wallet_by_user(session, current_user.id)
    if not w:
        raise HTTPException(404, "No wallet yet")
    items = [
        TxOut(ts=tx.ts, sender=tx.sender, recipient=tx.recipient, amount_eth=tx.amount_eth, usd_amount=tx.usd_amount)
        for tx in list_txs_for_address(session, w.address)
    ]
    return HistoryOut(items=items)
