import { useState, useEffect } from "react";
import { useUSDCVault } from "@/hooks/useUSDCVault";
import { useWallet } from "@/hooks/useWallet";

const EXPLORER = "https://testnet.blockscout.injective.network";

export function VaultForm() {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [lastAction, setLastAction] = useState<"deposit" | "withdraw" | null>(null);

  const { isConnected, isOnCorrectNetwork } = useWallet();
  const {
    usdcBalanceFormatted,
    userDepositFormatted,
    vaultBalanceFormatted,
    deposit,
    withdraw,
    withdrawAll,
    isLoading,
    isTxPending,
    isTxSuccess,
    error,
    txHash,
  } = useUSDCVault();

  // Clear input after tx confirmed
  useEffect(() => {
    if (isTxSuccess) {
      if (lastAction === "deposit") setDepositAmount("");
      if (lastAction === "withdraw") setWithdrawAmount("");
    }
  }, [isTxSuccess]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLastAction("deposit");
    try { await deposit(depositAmount); } catch { /* shown below */ }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLastAction("withdraw");
    try { await withdraw(withdrawAmount); } catch { /* shown below */ }
  };

  const handleWithdrawAll = async () => {
    setLastAction("withdraw");
    try { await withdrawAll(); } catch { /* shown below */ }
  };

  if (!isConnected) {
    return (
      <div className="card flex items-center justify-center min-h-[120px]">
        <p className="text-inj-muted font-marist text-body-md">
          Connect your wallet to use the vault
        </p>
      </div>
    );
  }

  if (!isOnCorrectNetwork) {
    return (
      <div className="card border-inj-amber/40 text-inj-amber text-center">
        Switch to Injective Testnet to continue
      </div>
    );
  }

  const busy = isLoading || isTxPending;

  return (
    <div className="space-y-inj-lg">

      {/* ── Vault Stats ── */}
      <div className="card">
        <h2 className="font-marist text-xl font-bold text-inj-snow mb-inj-md">
          USDC Vault
        </h2>

        <div className="grid grid-cols-3 gap-3">
          {/* Wallet */}
          <div className="card-inner">
            <p className="font-whyte text-label-sm text-inj-muted mb-1">Your Wallet</p>
            <p className="font-marist text-lg font-bold text-inj-snow">
              {parseFloat(usdcBalanceFormatted).toFixed(2)}
            </p>
            <p className="font-whyte text-label-xs text-inj-muted">USDC</p>
          </div>

          {/* Your Deposit */}
          <div className="card-inner border-inj-lime/30">
            <p className="font-whyte text-label-sm text-inj-muted mb-1">Your Deposit</p>
            <p className="font-marist text-lg font-bold text-inj-lime">
              {parseFloat(userDepositFormatted).toFixed(2)}
            </p>
            <p className="font-whyte text-label-xs text-inj-muted">USDC</p>
          </div>

          {/* Total in Vault */}
          <div className="card-inner border-inj-ocean/30">
            <p className="font-whyte text-label-sm text-inj-muted mb-1">Total in Vault</p>
            <p className="font-marist text-lg font-bold text-inj-ocean">
              {parseFloat(vaultBalanceFormatted).toFixed(2)}
            </p>
            <p className="font-whyte text-label-xs text-inj-muted">USDC</p>
          </div>
        </div>

        {/* Faucet link */}
        <a
          href="https://faucet.circle.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full mt-inj-md
                     border border-inj-border rounded-inj-md py-2.5
                     font-whyte text-label-sm text-inj-muted
                     hover:border-inj-ocean/50 hover:text-inj-snow transition-colors"
        >
          <span className="text-inj-lime">💧</span>
          Get Testnet USDC — Circle Faucet
          <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* ── TX Status Banners ── */}
      {txHash && isTxPending && (
        <div className="banner-pending flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span>
            Waiting for confirmation…{" "}
            <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
               className="underline font-semibold hover:opacity-80">
              View tx →
            </a>
          </span>
        </div>
      )}

      {txHash && isTxSuccess && (
        <div className="banner-success space-y-1">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span className="font-semibold">
              Transaction confirmed!{" "}
              <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                 className="underline hover:opacity-80">
                View on Explorer →
              </a>
            </span>
          </div>
          <p className="font-mono text-xs opacity-70 break-all pl-6">{txHash}</p>
        </div>
      )}

      {error && (
        <div className="banner-error">{error}</div>
      )}

      {/* ── Deposit ── */}
      <div className="card">
        <h3 className="font-marist text-lg font-bold text-inj-snow mb-inj-md">
          Deposit USDC
        </h3>
        <form onSubmit={handleDeposit} className="space-y-inj-md">
          <div>
            <label className="block font-whyte text-label-sm text-inj-muted mb-2">
              Amount (USDC)
            </label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
              disabled={busy}
              className="input-dark"
            />
            <p className="font-whyte text-label-xs text-inj-muted mt-1">
              Wallet: {parseFloat(usdcBalanceFormatted).toFixed(2)} USDC available
            </p>
          </div>
          <button type="submit" disabled={busy || !depositAmount} className="btn-primary w-full">
            {isLoading && lastAction === "deposit"
              ? "Sending…"
              : isTxPending && lastAction === "deposit"
              ? "Confirming…"
              : `Deposit ${depositAmount || "0"} USDC`}
          </button>
        </form>
      </div>

      {/* ── Withdraw ── */}
      <div className="card">
        <h3 className="font-marist text-lg font-bold text-inj-snow mb-inj-md">
          Withdraw USDC
        </h3>
        <form onSubmit={handleWithdraw} className="space-y-inj-md">
          <div>
            <label className="block font-whyte text-label-sm text-inj-muted mb-2">
              Amount (USDC)
            </label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              max={userDepositFormatted}
              required
              disabled={busy}
              className="input-dark"
            />
            <p className="font-whyte text-label-xs text-inj-muted mt-1">
              Available: {parseFloat(userDepositFormatted).toFixed(2)} USDC in vault
            </p>
          </div>
          <div className="flex gap-inj-sm">
            <button type="submit" disabled={busy || !withdrawAmount} className="btn-primary flex-1">
              {isLoading && lastAction === "withdraw"
                ? "Sending…"
                : isTxPending && lastAction === "withdraw"
                ? "Confirming…"
                : `Withdraw ${withdrawAmount || "0"} USDC`}
            </button>
            <button
              type="button"
              onClick={handleWithdrawAll}
              disabled={busy || parseFloat(userDepositFormatted) === 0}
              className="btn-secondary px-inj-lg"
            >
              All
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
