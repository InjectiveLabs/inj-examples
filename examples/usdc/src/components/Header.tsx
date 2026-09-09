import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { injectiveEVMTestnet } from '../wagmi'

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy address'}
      className="flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:bg-[rgba(108,99,255,0.15)]"
      style={{ border: '1px solid rgba(108,99,255,0.2)' }}
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}

export function Header() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const isCorrectChain = chainId === injectiveEVMTestnet.id

  const handleConnect = () => {
    // injected({ target: 'metaMask' }) registers as 'metaMask'
    const connector = connectors[0]
    if (connector) connect({ connector })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(108,99,255,0.12)] backdrop-blur-md"
      style={{ background: 'rgba(10,10,15,0.85)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-lg">Injective</span>
          <div className="hidden sm:block h-5 w-px bg-[rgba(108,99,255,0.3)]" />
          <div className="hidden sm:block text-xs text-[#A0A0B8] font-medium tracking-widest uppercase">
            USDC CCTP Demo
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Network badge */}
          {isConnected && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
                isCorrectChain
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
              onClick={() => !isCorrectChain && switchChain({ chainId: injectiveEVMTestnet.id })}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isCorrectChain ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
              {isCorrectChain ? 'Injective Testnet' : 'Switch Network'}
            </div>
          )}

          {/* Wallet button */}
          {!isConnected ? (
            <button
              className="btn-primary text-sm"
              onClick={handleConnect}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 3H8L2 7h20L16 3Z" />
                  </svg>
                  Connect Wallet
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                className="btn-secondary text-sm"
                onClick={() => disconnect()}
              >
                <span className="w-2 h-2 rounded-full bg-[#6C63FF]" />
                {truncateAddress(address!)}
              </button>
              <CopyButton text={address!} />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
