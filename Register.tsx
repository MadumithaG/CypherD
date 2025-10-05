import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../api'

export default function Register() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string|null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    try {
      await auth.register(email, password)
      nav('/setup')
    } catch (e:any) {
      setErr(e?.response?.data?.detail || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Create your account</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Choose a strong password" />
          </div>
          {err && <div className="text-red-400 text-sm">{err}</div>}
          <button className="btn w-full">Register</button>
        </form>
        <p className="mt-4 text-sm text-neutral-400">Already have an account? <Link to="/login" className="link">Log in</Link></p>
      </div>
    </div>
  )
}
