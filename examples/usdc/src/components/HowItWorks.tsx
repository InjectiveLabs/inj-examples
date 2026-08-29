const STEPS = [
  {
    icon: '🔥',
    title: 'Burn',
    subtitle: 'Source Chain',
    desc: 'USDC is burned on the source chain via the TokenMessenger contract. A message is emitted containing the transfer details.',
    color: '#F87171',
    bg: 'rgba(248,113,113,0.1)',
    border: 'rgba(248,113,113,0.2)',
  },
  {
    icon: '📡',
    title: 'Attest',
    subtitle: 'Circle API',
    desc: "Circle's attestation service (Iris API) monitors the source chain and signs the burn message, producing an off-chain attestation.",
    color: '#FDE047',
    bg: 'rgba(253,224,71,0.1)',
    border: 'rgba(253,224,71,0.2)',
  },
  {
    icon: '✅',
    title: 'Mint',
    subtitle: 'Destination Chain',
    desc: "The signed attestation is submitted to the MessageTransmitter on the destination chain, which mints an equivalent amount of USDC.",
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.1)',
    border: 'rgba(74,222,128,0.2)',
  },
  {
    icon: '💸',
    title: 'Arrive',
    subtitle: 'Done!',
    desc: 'Native USDC arrives in the recipient wallet on the destination chain. No wrapping, no liquidity pools — true cross-chain.',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.1)',
    border: 'rgba(167,139,250,0.2)',
  },
]

export function HowItWorks() {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold mb-1">How CCTP Works</h2>
      <p className="text-[#A0A0B8] text-sm mb-6">
        Circle's Cross-Chain Transfer Protocol enables native USDC movement between blockchains via a burn-and-mint mechanism.
      </p>

      <div className="relative">
        {/* Desktop: horizontal stepper */}
        <div className="hidden sm:flex items-start gap-0">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex-1 relative">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="absolute top-6 left-1/2 w-full h-px"
                  style={{ background: 'linear-gradient(to right, rgba(108,99,255,0.3), rgba(108,99,255,0.1))' }} />
              )}
              <div className="flex flex-col items-center text-center px-2">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 z-10 relative"
                  style={{ background: step.bg, border: `1px solid ${step.border}` }}
                >
                  {step.icon}
                </div>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mb-3"
                  style={{ background: step.bg, color: step.color, border: `1px solid ${step.border}` }}
                >
                  {i + 1}
                </div>
                <div className="font-semibold text-sm text-white mb-0.5">{step.title}</div>
                <div className="text-[10px] text-[#6C63FF] font-medium mb-2 uppercase tracking-wider">{step.subtitle}</div>
                <div className="text-xs text-[#A0A0B8] leading-relaxed">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: vertical stepper */}
        <div className="sm:hidden space-y-4">
          {STEPS.map((step, i) => (
            <div key={step.title}>
              <div className="flex gap-4 items-start">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: step.bg, border: `1px solid ${step.border}` }}
                  >
                    {step.icon}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-px h-6 mt-2"
                      style={{ background: 'linear-gradient(to bottom, rgba(108,99,255,0.3), transparent)' }} />
                  )}
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-white">{step.title}</span>
                    <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: step.color }}>
                      {step.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-[#A0A0B8] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="mt-6 p-3 rounded-xl" style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)' }}>
        <p className="text-xs text-[#A0A0B8]">
          <span className="text-[#A78BFA] font-medium">Why CCTP?</span>{' '}
          Traditional bridges wrap tokens, creating fragmented liquidity. CCTP burns native USDC on the source chain and mints native USDC on the destination — one unified asset, no bridge risk.
        </p>
      </div>
    </div>
  )
}
