import { useWallet } from "@/hooks/useWallet";

export function ConnectWallet() {
  const {
    address,
    isConnected,
    isConnecting,
    balance,
    isOnCorrectNetwork,
    connectWallet,
    disconnect,
    switchToInjective,
  } = useWallet();

  if (isConnected && !isOnCorrectNetwork) {
    return (
      <button
        onClick={switchToInjective}
        className="btn-primary bg-amber-600 hover:bg-amber-500"
      >
        Switch to Injective Testnet
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-inj-sm">
        {/* Balance chip */}
        <div className="flex flex-col px-inj-md py-1.5 bg-inj-navy border border-inj-border rounded-inj-md">
          <span className="font-whyte text-label-xs text-inj-muted">Balance</span>
          <span className="font-marist text-sm font-semibold text-inj-snow">
            {balance ? parseFloat(balance.formatted).toFixed(4) : "0"} INJ
          </span>
        </div>

        {/* Address chip */}
        <div className="flex flex-col px-inj-md py-1.5 bg-inj-navy border border-inj-border rounded-inj-md">
          <span className="font-whyte text-label-xs text-inj-muted">Address</span>
          <span className="font-marist text-sm font-semibold text-inj-ocean font-mono">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
        </div>

        {/* Disconnect */}
        <button
          onClick={() => disconnect()}
          className="px-inj-md py-inj-sm rounded-inj-md font-marist text-sm font-medium
                     border border-inj-border text-inj-muted
                     hover:border-inj-red/50 hover:text-inj-red transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-inj-sm">
      <button
        onClick={() => connectWallet(0)}
        disabled={isConnecting}
        className="btn-primary"
      >
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </button>
    </div>
  );
}
