const LINKS = [
  {
    title: 'Circle Faucet',
    desc: 'Get testnet USDC on multiple chains',
    url: 'https://faucet.circle.com',
    emoji: '💧',
    badge: 'USDC',
  },
  {
    title: 'Injective Testnet Faucet',
    desc: 'Get testnet INJ for gas fees',
    url: 'https://testnet.faucet.injective.network/',
    emoji: '⚡',
    badge: 'INJ',
  },
  {
    title: 'Blockscout Explorer',
    desc: 'View transactions on Injective testnet',
    url: 'https://testnet.blockscout.injective.network',
    emoji: '🔍',
    badge: 'Explorer',
  },
  {
    title: 'Injective Bridge',
    desc: 'Bridge assets to Injective',
    url: 'https://testnet.bridge.injective.network',
    emoji: '🌉',
    badge: 'Bridge',
  },
]

export function FaucetLinks() {
  return (
    <div className="card p-5">
      <div className="text-sm font-semibold mb-4 text-[#A0A0B8] uppercase tracking-wider">
        Quick Links & Faucets
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LINKS.map(({ title, desc, url, emoji, badge }) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 p-3 rounded-xl border border-[rgba(108,99,255,0.1)] hover:border-[rgba(108,99,255,0.35)] hover:bg-[rgba(108,99,255,0.05)] transition-all"
          >
            <span className="text-2xl leading-none mt-0.5">{emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-white group-hover:text-[#A78BFA] transition-colors truncate">
                  {title}
                </span>
                <span className="badge-info text-[10px] flex-shrink-0">{badge}</span>
              </div>
              <div className="text-xs text-[#A0A0B8] truncate">{desc}</div>
            </div>
            <svg className="w-4 h-4 text-[#A0A0B8] flex-shrink-0 mt-0.5 group-hover:text-[#A78BFA] transition-colors"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15,3 21,3 21,9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  )
}
