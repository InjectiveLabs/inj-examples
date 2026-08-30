import { Link } from "react-router-dom";
import { ConnectWallet } from "@/components/ConnectWallet";
import { NetworkBadge } from "@/components/NetworkBadge";
import { VaultForm } from "@/components/VaultForm";
import { useWallet } from "@/hooks/useWallet";

export function Dashboard() {
  const { isConnected, address, balance } = useWallet();

  return (
    <div className="min-h-screen bg-inj-dark">
      {/* Header */}
      <header className="bg-inj-midnight/80 backdrop-blur-sm border-b border-inj-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-inj-lg h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo.jpg" alt="Logo" className="h-8 w-8 rounded-full object-cover" />
            <span className="font-marist font-bold text-inj-snow text-lg tracking-tight">
              Injective dApp
            </span>
          </Link>
          <div className="flex items-center gap-inj-sm">
            <NetworkBadge />
            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-inj-lg py-inj-xl">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-32 gap-inj-lg">
            <p className="font-marist text-body-md text-inj-muted">
              Connect your wallet to access the USDC Vault
            </p>
            <ConnectWallet />
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-inj-sm mb-inj-xl">
              <div className="card-outline">
                <p className="font-whyte text-label-sm text-inj-muted mb-1">Wallet</p>
                <p className="font-marist text-sm font-semibold text-inj-ocean font-mono">
                  {address?.slice(0, 8)}…{address?.slice(-6)}
                </p>
              </div>
              <div className="card-outline">
                <p className="font-whyte text-label-sm text-inj-muted mb-1">INJ Balance</p>
                <p className="font-marist text-sm font-semibold text-inj-snow">
                  {balance ? parseFloat(balance.formatted).toFixed(4) : "0"} INJ
                </p>
              </div>
              <div className="card-outline col-span-2 md:col-span-1">
                <p className="font-whyte text-label-sm text-inj-muted mb-1">Network</p>
                <span className="tag-builder">Injective Testnet</span>
              </div>
            </div>

            {/* Main content */}
            <div className="max-w-2xl mx-auto">
              <VaultForm />

              {/* MCP card */}
              <div className="card border-inj-ocean/30 mt-inj-xl">
                <div className="flex items-center gap-inj-sm mb-inj-sm">
                  <span className="tag-builder">AI</span>
                  <h3 className="font-marist text-base font-bold text-inj-snow">
                    MCP Integration
                  </h3>
                </div>
                <p className="font-marist text-body-md text-inj-muted mb-inj-md">
                  Connect Claude, Cursor, or VS Code to Injective via the MCP
                  server for natural language on-chain operations.
                </p>
                <a
                  href="https://github.com/InjectiveLabs/mcp-server"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-whyte text-label-sm text-inj-ocean hover:underline"
                >
                  Set up MCP →
                </a>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
