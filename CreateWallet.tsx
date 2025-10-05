// frontend/src/components/CreateWallet.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { walletApi } from '../api'
import { createWallet, importFromMnemonic } from '../wallet'

type Gen = { address: string; privateKey: string; mnemonic: string }

export default function CreateWallet() {
  const nav = useNavigate()
  const [mode, setMode] = useState<'create' | 'import'>('create')

  // creation state
  const [gen, setGen] = useState<Gen | null>(null)
  const [mnemonic, setMnemonic] = useState('')
  const [index, setIndex] = useState(0)

  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleCreate() {
    setErr(null)
    const w = createWallet()
    setGen(w)
    setMnemonic(w.mnemonic)
  }

  function handleMode(m: 'create' | 'import') {
    setMode(m)
    setErr(null)
    if (m === 'create' && !gen) handleCreate() // auto-generate on first open
  }

  async function saveAndContinue() {
    try {
      setSaving(true)
      setErr(null)
      let w: Gen
      if (mode === 'create') {
        if (!gen) handleCreate()
        w = (gen ?? createWallet())
      } else {
        w = importFromMnemonic(mnemonic, index) as Gen
      }
      // persist locally
      localStorage.setItem('privkey', w.privateKey)
      localStorage.setItem('mnemonic', w.mnemonic)
      // register with backend (creates random 1–10 ETH balance)
      await walletApi.create(w.address)
      nav('/dashboard')
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Failed to create wallet')
    } finally {
      setSaving(false)
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-black mb-2">Wallet setup</h1>
      <p className="text-neutral-400 mb-6">Generate a new wallet or import an existing 12-word phrase.</p>

      <div className="card space-y-5">
        <div className="flex gap-3">
          <button className={'btn ' + (mode === 'create' ? '' : 'opacity-60')} onClick={() => handleMode('create')}>
            Create
          </button>
          <button className={'btn ' + (mode === 'import' ? '' : 'opacity-60')} onClick={() => handleMode('import')}>
            Import
          </button>
        </div>

        {mode === 'create' && (
          <div className="space-y-4">
            {!gen && (
              <button className="btn" onClick={handleCreate}>
                Generate 12-word phrase
              </button>
            )}

            {gen && (
              <>
                <div className="text-neutral-300 text-sm">Your 12-word recovery phrase (save it safely):</div>
                <div className="grid grid-cols-3 gap-2">
                  {gen.mnemonic.split(' ').map((w, i) => (
                    <div key={i} className="rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm">
                      <span className="text-neutral-400 mr-2">{i + 1}.</span>
                      <span className="font-semibold">{w}</span>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="text-sm">
                    <div className="label">Address</div>
                    <div className="font-mono break-all">{gen.address}</div>
                    <button className="link mt-1" onClick={() => copy(gen.address)}>Copy address</button>
                  </div>
                  <div className="text-sm">
                    <div className="label">Private key</div>
                    <div className="font-mono break-all">{gen.privateKey}</div>
                    <button className="link mt-1" onClick={() => copy(gen.privateKey)}>Copy private key</button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="btn" onClick={handleCreate}>Regenerate</button>
                </div>
              </>
            )}
          </div>
        )}

        {mode === 'import' && (
          <div>
            <label className="label">Mnemonic (12 words)</label>
            <textarea
              className="input h-28"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="twelve words separated by spaces"
            />
            <label className="label mt-3">HD Index</label>
            <input className="input" type="number" value={index} min={0} onChange={(e) => setIndex(parseInt(e.target.value || '0'))} />
          </div>
        )}

        {err && <div className="text-red-400 text-sm">{err}</div>}

        <div className="flex gap-3">
          <button className="btn" onClick={saveAndContinue} disabled={saving}>
            {saving ? 'Saving…' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
