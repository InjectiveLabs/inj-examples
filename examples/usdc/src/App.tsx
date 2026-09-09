import { useState } from 'react'
import { useAccount } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from './components/Header'
import { ConnectWallet } from './components/ConnectWallet'
import { Dashboard } from './components/Dashboard'
import { CCTPTransfer } from './components/CCTPTransfer'
import { HowItWorks } from './components/HowItWorks'

type Tab = 'dashboard' | 'transfer' | 'how'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'transfer', label: 'CCTP Transfer', icon: '🔥' },
  { id: 'how', label: 'How It Works', icon: '📖' },
]

// Tab animation props (inline to avoid framer-motion Variants typing issues)
const TAB_INITIAL = { opacity: 0, y: 12 }
const TAB_ANIMATE = { opacity: 1, y: 0 }
const TAB_EXIT    = { opacity: 0, y: -8 }
const TAB_TRANSITION = { duration: 0.35, ease: 'easeOut' as const }

export default function App() {
  const { isConnected } = useAccount()
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#0A0A0F' }}>
      {/* Ambient background blobs */}
      <div className="ambient-blob w-[500px] h-[500px] -top-40 -left-32 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)' }} />
      <div className="ambient-blob w-[400px] h-[400px] -bottom-20 -right-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.09) 0%, transparent 70%)', animationDelay: '3s' }} />

      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        {!isConnected ? (
          <ConnectWallet />
        ) : (
          <>
            {/* Tab Bar */}
            <div className="flex gap-2 mb-6 p-1 rounded-2xl w-fit" style={{ background: '#111118', border: '1px solid rgba(108,99,255,0.1)' }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    tab === t.id
                      ? 'bg-[rgba(108,99,255,0.15)] text-[#A78BFA] border border-[rgba(108,99,255,0.35)]'
                      : 'text-[#A0A0B8] hover:text-white hover:bg-[rgba(108,99,255,0.05)]'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content with animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={TAB_INITIAL}
                animate={TAB_ANIMATE}
                exit={TAB_EXIT}
                transition={TAB_TRANSITION}
              >
                {tab === 'dashboard' && <Dashboard />}
                {tab === 'transfer' && <CCTPTransfer />}
                {tab === 'how' && <HowItWorks />}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[rgba(108,99,255,0.1)] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[#A0A0B8] text-sm">
            Built by{' '}
            <a href="https://injective.com" target="_blank" rel="noopener noreferrer" className="text-[#A78BFA] hover:text-white transition-colors">
              Injective Labs
            </a>
            {' '}· USDC CCTP Demo for Injective EVM Testnet
          </div>
          <div className="flex items-center gap-4 text-xs text-[#A0A0B8]">
            <a href="https://developers.circle.com/cctp" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Circle CCTP Docs</a>
            <span>·</span>
            <a href="https://docs.injective.network/developers-defi/usdc-stablecoin" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Injective USDC Docs</a>
            <span>·</span>
            <a href="https://github.com/InjectiveLabs/inj-examples" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
