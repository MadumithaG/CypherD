# Ledgerly — simple. secure. signed.

A mock Web3 wallet built for the CypherD hackathon.

- **Frontend:** React + Vite + Tailwind + ethers
- **Backend:** FastAPI (Python) + SQLite
- **USD→ETH:** Skip API quote
- **Security:** 30-second approval window · ECDSA signature verification · ≤1% slippage guard
- **Extras:** Email notifications (SMTP) or console fallback · Quick-send to HD index 7

---

## 1) Prerequisites

- **Node.js ≥ 18**
- **Python ≥ 3.10**
- **Git**
- (Optional) SMTP account for real email notifications

---

## 2) Get the code

```bash
# HTTPS
git clone https://github.com/MadumithaG/CypherD.git
cd CypherD
```
You should see two folders: backend/ and frontend/.

3) Backend setup (FastAPI)
```
Windows PowerShell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

API docs: http://localhost:8000/docs

backend/.env.example

PORT=8000
SECRET_KEY=supersecret_change_me
ACCESS_TOKEN_EXPIRE_MINUTES=90
FALLBACK_ETH_USD=3000
CORS_ORIGINS=http://localhost:5173

# SMTP (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL="Ledgerly <noreply@ledgerly.local>"
```
4) Frontend setup (React + Vite)
```
cd frontend
npm install
npm run dev


App: http://localhost:5173
```

5) How to use (end-to-end)

Register a new account (email + password) → you are logged in (JWT).

Create or Import wallet

Create: generates a 12-word mnemonic, address & private key (shown once—save it).

Import: paste your 12 words; you can set HD index (default 0).

Click Save & Continue → backend registers wallet with a random 1–10 ETH mock balance.

Dashboard

See your address and balance.

History lists past transactions.

Send

Enter Recipient (example: 0x000000000000000000000000000000000000dead)
or click “Use my HD index 7 address” to send to your derived index 7 wallet.

Enter Amount and choose ETH or USD.

Click Prepare approval → an approval JSON appears with Expires in 30s.

Click Sign & Execute → frontend signs; backend verifies, re-quotes USD to enforce ≤1% slippage, updates balances, logs history, and sends a notification (email if SMTP set, else console).

6) Features mapping (to problem statement)

Auth: Login/Register (JWT) 

Create/Import Wallet: 12-word mnemonic, HD derive, stored locally 

Balance: Random 1–10 ETH on first register 

Send ETH/USD: USD uses Skip API quote 

Approval: 30-sec TTL, canonical JSON payload 

Signing: Frontend signs; backend recovers signer address 

Slippage Guard: USD path re-quotes; reject if >1% drift 

Process Transfers: Update balances & record tx 

History: Sender → Recipient, amount ETH (+USD hint) 

Notifications: SMTP email or console fallback 

Bonus: Object (JSON) signing + quick send to HD index 7 

7) Screenshots / GIF

Register page
<img width="1151" height="577" alt="image" src="https://github.com/user-attachments/assets/68987d4f-732a-4e29-80e0-c347d6074dbd" />
<img width="1111" height="672" alt="image" src="https://github.com/user-attachments/assets/7621c884-f26e-4758-a8bd-3537821d73c9" />

<img width="1343" height="611" alt="image" src="https://github.com/user-attachments/assets/b90651b0-570d-48d9-a52b-484f31cd3962" />

wallet setup
<img width="1915" height="717" alt="image" src="https://github.com/user-attachments/assets/06078d8b-7c66-40c6-b33d-de4701a02788" />

can create 
<img width="1354" height="750" alt="image" src="https://github.com/user-attachments/assets/4c7a04cb-7356-4d0b-8ccb-ad07bcee458c" />

or import
<img width="1781" height="789" alt="image" src="https://github.com/user-attachments/assets/10e6686d-b4b2-4df9-946f-d69d4a6c7149" />

dashboard
<img width="1833" height="811" alt="image" src="https://github.com/user-attachments/assets/2f7f1bff-b907-4b7b-91f8-e1fd8d7027ef" />

sign and approve the amount
<img width="550" height="645" alt="image" src="https://github.com/user-attachments/assets/b0d5b88f-0e6e-4743-9618-0c2613b808a0" />

history
<img width="1760" height="301" alt="image" src="https://github.com/user-attachments/assets/6a75370e-903f-4c89-b3b0-a59055bff239" />

8) API quick reference

POST /auth/register { email, password } → { access_token }

POST /auth/login { email, password } → { access_token }

GET /auth/me → { email, id }

POST /wallets/create { address } (JWT) → { address, balance_eth }

GET /wallets/me (JWT) → { address, balance_eth }

POST /transfer/prepare { recipient, amount_input, unit } (JWT) →
{ approval_id, message, expires_at, amount_eth, usd_amount? }
message is canonical JSON (sorted keys, no spaces) to be signed on frontend.

POST /transfer/execute { approval_id, signature } (JWT) → { status: "ok" }

GET /history (JWT) → { items: [ { ts, sender, recipient, amount_eth, usd_amount? } ] }

9) Sample recipient addresses

0x000000000000000000000000000000000000dead

0x1111111111111111111111111111111111111111

0x742d35cc6634c0532925a3b8d4c9db96c728b0b4

Or use the HD index 7 quick button.
