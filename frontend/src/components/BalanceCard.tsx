export default function BalanceCard({ addr, bal }: { addr: string, bal: string }) {
  return (
    <div className="card">
      <div className="text-neutral-400 text-sm">Address</div>
      <div className="font-mono text-lg break-all">{addr}</div>
      <div className="mt-3 text-neutral-400 text-sm">Balance</div>
      <div className="text-3xl font-extrabold">{bal} <span className="text-neutral-400 text-xl">ETH</span></div>
    </div>
  )
}
