from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class RegisterIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class CreateWalletIn(BaseModel):
    address: str = Field(description="0x-prefixed address derived client-side")

class WalletOut(BaseModel):
    address: str
    balance_eth: str

class PrepareTransferIn(BaseModel):
    recipient: str
    amount_input: str  # "0.5" or "1000"
    unit: str = Field(pattern="^(ETH|USD)$")

class PrepareTransferOut(BaseModel):
    approval_id: str
    message: str
    expires_at: int
    amount_wei: str
    amount_eth: str
    usd_amount: Optional[str] = None

class ExecuteTransferIn(BaseModel):
    approval_id: str
    signature: str

class TxOut(BaseModel):
    ts: int
    sender: str
    recipient: str
    amount_eth: str
    usd_amount: Optional[str] = None

class HistoryOut(BaseModel):
    items: list[TxOut]
