// frontend/src/components/SendForm.tsx
import { useEffect, useMemo, useState } from 'react'
import { walletApi } from '../api'
import { signMessage, importFromMnemonic } from '../wallet'

type Prep = {
  approval_id: string
  message: string
  expires_at: number
  amount_eth: string
  usd_amount?: string
  amount_wei?: string
}

export default function SendForm({ onSuccess }: { onSuccess: () => void }) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState<'ETH' | 'USD'>('ETH')

  const [prep, setPrep] = useState<Prep | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0) // seconds
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // Countdown for approval expiry
  useEffect(() => {
    if (!prep) return
    const tick = () => {
      const t = Math.max(0, Math.floor((prep.expires_at - Date.now()) / 1000))
      setTimeLeft(t)
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [prep])

  // Pretty-print the approval JSON (fallback to raw if parse fails)
  const prettyApproval = useMemo(() => {
    if (!prep?.message) return ''
    try {
      return JSON.stringify(JSON.parse(prep.message), null, 2)
    } catch {
      return prep.message
    }
  }, [prep])

  async function handlePrepare() {
    setErr(null); setMsg(null); setBusy(true)
    try {
      const p = await walletApi.prepare(recipient.trim(), amount.trim(), unit)
      setPrep(p)
      setMsg('Approval created. Please sign before it expires.')
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Failed to prepare approval')
    } finally {
      setBusy(false)
    }
  }

  async function handleSignAndExecute() {
    if (!prep) return
    setErr(null); setMsg(null); setBusy(true)
    try {
      if (Date.now() > prep.expires_at) {
        setPrep(null)
        throw new Error('Approval expired. Please prepare again.')
      }
      const pk = localStorage.getItem('privkey')
      if (!pk) throw new Error('No private key found. Create/import a wallet first.')

      const sig = await signMessage(pk, prep.message)
      await walletApi.execute(prep.approval_id, sig)
      setMsg('✅ Transfer successful')
      setPrep(null)
      setRecipient(''); setAmount('')
      onSuccess()
    } catch (e: any) {
      setErr(e?.response?.data?.detail || e?.message || 'Failed to execute transfer')
    } finally {
      setBusy(false)
    }
  }

  function cancelApproval() {
    setPrep(null); setMsg(null); setErr(null); setTimeLeft(0)
  }

  // HD index 7 quick-fill (bonus)
  function fillRecipientIndex7() {
    const m = localStorage.getItem('mnemonic')
    if (!m) { setErr('No mnemonic found. Create/import a wallet first.'); return }
    const w7 = importFromMnemonic(m, 7)
    setRecipient(w7.address)
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-3">Send</h3>

      {/* Step 1: Prepare */}
      {!prep && (
        <div className="space-y-3">
          <div>
            <label className="label">Recipient Address</label>
            <input
              className="input"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder="0x..."
            />
            <div className="flex justify-end">
              <button type="button" className="link text-xs" onClick={fillRecipientIndex7}>
                Use my HD index 7 address
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="label">Amount</label>
              <input
                className="input"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={unit === 'ETH' ? '0.5' : '1000'}
              />
            </div>
            <div>
              <label className="label">Unit</label>
              <select
                className="input"
                value={unit}
                onChange={e => setUnit(e.target.value as 'ETH' | 'USD')}
              >
                <option>ETH</option>
                <option>USD</option>
              </select>
            </div>
          </div>

          <button className="btn w-full" onClick={handlePrepare} disabled={busy}>
            Prepare approval
          </button>
          {msg && <div className="text-sm text-neutral-300">{msg}</div>}
          {err && <div className="text-sm text-red-400">{err}</div>}
        </div>
      )}

      {/* Step 2: Sign & Execute with countdown */}
      {prep && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
            <div className="text-xs text-neutral-400 mb-1">Approval message</div>
            <pre className="font-mono text-xs whitespace-pre-wrap break-words">
              {prettyApproval}
            </pre>
            <div className="mt-2 text-sm">
              <span className="text-neutral-400">Amount:</span>{' '}
              <b>{prep.amount_eth} ETH</b>
              {prep.usd_amount ? (
                <span className="text-neutral-400"> ({`$${prep.usd_amount}`} USD)</span>
              ) : null}
            </div>
            <div className={`mt-1 text-sm ${timeLeft <= 5 ? 'text-red-400' : 'text-neutral-300'}`}>
              Expires in <b>{timeLeft}s</b>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="btn flex-1"
              onClick={handleSignAndExecute}
              disabled={busy || timeLeft <= 0}
            >
              {timeLeft <= 0 ? 'Expired – Prepare again' : (busy ? 'Signing…' : 'Sign & Execute')}
            </button>
            <button className="btn flex-1 opacity-70" onClick={cancelApproval} disabled={busy}>
              Cancel
            </button>
          </div>

          {msg && <div className="text-sm text-neutral-300">{msg}</div>}
          {err && <div className="text-sm text-red-400">{err}</div>}
        </div>
      )}
    </div>
  )
}
