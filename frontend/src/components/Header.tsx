import { useNavigate } from 'react-router-dom'

export default function Header() {
  const nav = useNavigate()
  const isAuthed = !!localStorage.getItem('token')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('privkey')
    localStorage.removeItem('mnemonic')
    nav('/login')
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-neutral-950/70 border-b border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandIcon />
          <div>
            <div className="text-2xl font-black leading-none brand">Ledgerly</div>
            <div className="text-[10px] tracking-widest text-neutral-400 uppercase">
              simple · secure · signed
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          {isAuthed ? (
            <button className="btn" onClick={logout}>Logout</button>
          ) : (
            <>
              <button className="btn" onClick={() => nav('/login')}>Login</button>
              <button className="btn" onClick={() => nav('/register')}>Register</button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

function BrandIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#67e8f9"/>
          <stop offset="100%" stopColor="#34d399"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#brandGrad)"/>
      {/* stylized “L” tick / signature cross */}
      <path d="M7 12h10M12 7v10" stroke="black" strokeWidth="1.5" opacity=".85" />
    </svg>
  )
}
