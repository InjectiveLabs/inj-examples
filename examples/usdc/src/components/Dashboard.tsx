import { useAccount, useBalance } from 'wagmi'
import { useUSDCBalance } from '../hooks/useUSDCBalance'
import { CONTRACTS, injectiveEVMTestnet } from '../wagmi'
import { FaucetLinks } from './FaucetLinks'

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="card card-hover p-6 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.2)' }}>
        {icon}
      </div>
      <div>
        <div className="text-[#A0A0B8] text-xs font-medium mb-1">{label}</div>
        <div className="text-xl font-bold text-white">{value}</div>
        {sub && <div className="text-[#A0A0B8] text-xs mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export function Dashboard() {
  const { address } = useAccount()
  const { formatted: usdcBalance, isLoading: usdcLoading } = useUSDCBalance(address)
  const { data: injBalance, isLoading: injLoading } = useBalance({ address })

  const truncated = address ? `${address.slice(0, 10)}...${address.slice(-8)}` : ''

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Wallet address card */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <div className="text-[#A0A0B8] text-xs font-medium mb-1">Connected Wallet</div>
          <div className="font-mono text-sm text-white">{truncated}</div>
        </div>
        <a
          href={`${injectiveEVMTestnet.blockExplorers.default.url}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-xs py-2"
        >
          View on Explorer
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15,3 21,3 21,9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="USDC Balance"
          value={usdcLoading ? '—' : `${usdcBalance ?? '0.00'} USDC`}
          sub={`Contract: ${CONTRACTS.USDC.slice(0, 10)}...`}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          }
        />
        <StatCard
          label="INJ Balance (Gas)"
          value={injLoading ? '—' : `${injBalance ? Number(injBalance.formatted).toFixed(4) : '0.0000'} INJ`}
          sub="Native token for gas fees"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.8">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          }
        />
      </div>

      {/* Contract reference */}
      <div className="card p-5">
        <div className="text-sm font-semibold mb-4 text-[#A0A0B8] uppercase tracking-wider">
          Contract Addresses
        </div>
        <div className="space-y-3">
          {[
            { label: 'USDC Token', addr: CONTRACTS.USDC },
            { label: 'TokenMessengerV2', addr: CONTRACTS.TOKEN_MESSENGER_V2 },
            { label: 'MessageTransmitterV2', addr: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' as `0x${string}` },
          ].map(({ label, addr }) => (
            <div key={addr} className="flex items-center justify-between py-2 border-b border-[rgba(108,99,255,0.08)] last:border-0">
              <span className="text-[#A0A0B8] text-sm">{label}</span>
              <a
                href={`${injectiveEVMTestnet.blockExplorers.default.url}/address/${addr}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-[#A78BFA] hover:text-white transition-colors"
              >
                {addr.slice(0, 8)}...{addr.slice(-6)} ↗
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Faucet Links */}
      <FaucetLinks />
    </div>
  )
}
