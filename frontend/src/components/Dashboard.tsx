import { useEffect, useState } from 'react'
import { walletApi } from '../api'
import { signMessage } from '../wallet'
import SendForm from './SendForm'

export default function Dashboard() {
  const [wallet, setWallet] = useState<{address:string,balance_eth:string}|null>(null)
  const [hist, setHist] = useState<{items:{ts:number,sender:string,recipient:string,amount_eth:string,usd_amount?:string}[]} | null>(null)

  async function refresh() {
    try {
      const w = await walletApi.me()
      setWallet(w)
      const h = await walletApi.history()
      setHist(h)
    } catch(e) { console.error(e) }
  }

  useEffect(()=>{ refresh() }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Dashboard</h1>
        <button className="btn" onClick={refresh}>Refresh</button>
      </div>

      {wallet && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card col-span-2">
            <div className="text-neutral-400 text-sm">Address</div>
            <div className="font-mono text-lg break-all">{wallet.address}</div>
            <div className="mt-3 text-neutral-400 text-sm">Balance</div>
            <div className="text-3xl font-extrabold">{wallet.balance_eth} <span className="text-neutral-400 text-xl">ETH</span></div>
          </div>
          <div className="card">
            <SendForm onSuccess={refresh} />
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-bold mb-3">History</h2>
        {!hist ? <div className="text-neutral-400">Loading...</div> : (
          <div className="space-y-2">
            {hist.items.length === 0 && <div className="text-neutral-400">No transactions yet</div>}
            {hist.items.map((x,i)=>(
              <div key={i} className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="font-mono text-sm break-all">{x.sender} → {x.recipient}</div>
                <div className="text-right">
                  <div className="font-semibold">{x.amount_eth} ETH {x.usd_amount? <span className="text-neutral-400 text-sm">(${x.usd_amount})</span> : null}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
