# Ledgerly — simple. secure. signed.

A mock Web3 wallet built for the CypherD hackathon.

- Frontend: **React + Vite + Tailwind + ethers**
- Backend: **FastAPI (Python)** + **SQLite**
- USD→ETH: **Skip API** quote
- Security: **30s approval**, **ECDSA signature** verification, **≤1% slippage** guard
- Extras: Email notifications (SMTP) or console fallback, HD index 0→7 quick send


## 1) Clone or download

```bash
# HTTPS
git clone https://github.com/MadumithaG/CypherD.git
cd CypherD
#You should see two folders: backend/ and frontend/.

## Backend setup (FastAPI)
Windows PowerShell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
