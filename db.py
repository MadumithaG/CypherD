from sqlmodel import SQLModel, Field, Session, create_engine, select
from typing import Optional
from pathlib import Path
import time, os

DB_PATH = Path(__file__).resolve().parent.parent / "data.sqlite"
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    created_at: int = Field(default_factory=lambda: int(time.time()))

class Wallet(SQLModel, table=True):
    address: str = Field(primary_key=True)
    user_id: int = Field(index=True)
    balance_wei: int
    created_at: int

class Tx(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ts: int
    sender: str
    recipient: str
    amount_wei: int
    amount_eth: str
    usd_amount: Optional[str] = None
    user_id: Optional[int] = None

def init_db():
    SQLModel.metadata.create_all(engine)

def get_user_by_email(session: Session, email: str) -> Optional[User]:
    q = select(User).where(User.email == email)
    return session.exec(q).first()

def get_wallet_by_user(session: Session, user_id: int) -> Optional[Wallet]:
    q = select(Wallet).where(Wallet.user_id == user_id)
    return session.exec(q).first()

def get_wallet(session: Session, address: str) -> Optional[Wallet]:
    return session.get(Wallet, address)

def upsert_wallet(session: Session, w: Wallet):
    session.merge(w)
    session.commit()

def insert_tx(session: Session, tx: Tx):
    session.add(tx)
    session.commit()

def list_txs_for_address(session: Session, address: str):
    q = select(Tx).where((Tx.sender == address) | (Tx.recipient == address)).order_by(Tx.ts.desc())
    return session.exec(q).all()
