import time, secrets
from dataclasses import dataclass
from typing import Optional

@dataclass
class Approval:
    id: str
    message: str
    expires_at: int  # epoch ms
    sender: str
    recipient: str
    amount_wei: int
    was_usd: bool
    usd_amount_cents: Optional[int] = None  # USD * 100 (for USD-mode)

# In-memory store (hackathon-friendly). Use Redis in prod.
_APPROVALS: dict[str, Approval] = {}

def create_approval(
    message: str,
    sender: str,
    recipient: str,
    amount_wei: int,
    was_usd: bool,
    usd_amount_cents: Optional[int] = None,
    ttl_seconds: int = 30
) -> Approval:
    aid = secrets.token_urlsafe(12)
    exp = int(time.time() * 1000) + ttl_seconds * 1000
    a = Approval(
        id=aid,
        message=message,
        expires_at=exp,
        sender=sender,
        recipient=recipient,
        amount_wei=amount_wei,
        was_usd=was_usd,
        usd_amount_cents=usd_amount_cents
    )
    _APPROVALS[aid] = a
    return a

def pop_approval(approval_id: str) -> Optional[Approval]:
    a = _APPROVALS.pop(approval_id, None)
    if not a:
        return None
    # expire check
    if a.expires_at < int(time.time() * 1000):
        return None
    return a

def set_message(approval_id: str, msg: str):
    """Update the stored approval's message after we build the canonical JSON."""
    a = _APPROVALS.get(approval_id)
    if a:
        a.message = msg
