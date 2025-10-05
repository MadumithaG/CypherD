import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth, walletApi } from '../api'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string|null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    try {
      await auth.login(email, password)
      // check if wallet exists
      try {
        await walletApi.me()
        nav('/dashboard')
      } catch {
        nav('/setup')
      }
    } catch (e:any) {
      setErr(e?.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Welcome back</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {err && <div className="text-red-400 text-sm">{err}</div>}
          <button className="btn w-full">Log in</button>
        </form>
        <p className="mt-4 text-sm text-neutral-400">No account? <Link to="/register" className="link">Register</Link></p>
      </div>
    </div>
  )
}
