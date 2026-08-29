import { useConnect } from 'wagmi'
import ninjaLogo from '../../ninja-labs-logo.svg'

export function ConnectWallet() {
  const { connect, connectors, isPending } = useConnect()

  const handleConnect = () => {
    const connector = connectors[0]
    if (connector) connect({ connector })
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center animate-fade-in max-w-md w-full">
        {/* Glow orb */}
        <div className="relative mb-10">
          <div
            className="w-32 h-32 mx-auto rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(108,99,255,0.2) 0%, rgba(108,99,255,0.05) 60%, transparent 100%)',
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5">
                <path d="M20 12V22H4V12" />
                <path d="M22 7H2v5h20V7z" />
                <path d="M12 22V7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={ninjaLogo}
            alt="Ninja Labs HQ"
            className="h-9 w-auto opacity-90"
            style={{ filter: 'invert(1)' }}
          />
        </div>

        <h1 className="text-3xl font-bold mb-3">
          USDC <span className="gradient-text">CCTP</span> Demo
        </h1>
        <p className="text-[#A0A0B8] mb-2 text-base leading-relaxed">
          Learn how to transfer USDC cross-chain using Circle's Cross-Chain Transfer Protocol on Injective EVM Testnet.
        </p>
        <p className="text-[#A0A0B8] mb-10 text-sm leading-relaxed">
          Connect your MetaMask wallet to get started.
        </p>

        <button
          className="btn-primary text-base px-8 py-3.5 w-full max-w-xs mx-auto justify-center"
          onClick={handleConnect}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              {/* MetaMask fox icon */}
              <svg width="20" height="20" viewBox="0 0 35 33" fill="none">
                <path d="M32.9582 1L19.8241 10.7183L22.2361 4.9321L32.9582 1Z" fill="#E17726"/>
                <path d="M2.04834 1L15.0619 10.8028L12.764 4.9321L2.04834 1Z" fill="#E27625"/>
                <path d="M28.229 23.5334L24.6724 28.9616L32.2 31.0083L34.3208 23.6535L28.229 23.5334Z" fill="#E27625"/>
                <path d="M0.692383 23.6535L2.80007 31.0083L10.3277 28.9616L6.77108 23.5334L0.692383 23.6535Z" fill="#E27625"/>
                <path d="M9.93281 14.9025L7.86914 18.0694L15.3158 18.4097L15.0619 10.3564L9.93281 14.9025Z" fill="#E27625"/>
                <path d="M25.0698 14.9025L19.8646 10.2563L19.7241 18.4097L27.1363 18.0694L25.0698 14.9025Z" fill="#E27625"/>
                <path d="M10.3277 28.9616L14.8496 26.7949L10.9311 23.7091L10.3277 28.9616Z" fill="#E27625"/>
                <path d="M20.1519 26.7949L24.6724 28.9616L24.0704 23.7091L20.1519 26.7949Z" fill="#E27625"/>
              </svg>
              Connect MetaMask
            </>
          )}
        </button>

        {/* Feature tags */}
        <div className="flex flex-wrap gap-2 justify-center mt-10">
          {['Injective Testnet', 'Circle CCTP v2', 'Cross-chain USDC', 'Open Source'].map(tag => (
            <span key={tag} className="badge-info">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
