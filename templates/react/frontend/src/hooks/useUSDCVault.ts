import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits, maxUint256 } from "viem";
import { CONTRACT_ADDRESSES, ERC20_ABI, VAULT_ABI, IS_CONTRACT_CONFIGURED } from "@/config/contracts";
import { useAccount } from "wagmi";

export function useUSDCVault() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Read: user USDC wallet balance ──────────────────────────────────────
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.USDC,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // ── Read: USDC allowance for the vault ──────────────────────────────────
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.USDC,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESSES.VAULT] : undefined,
    query: { enabled: !!address },
  });

  // ── Read: user's deposited balance ──────────────────────────────────────
  const { data: userDeposit, refetch: refetchUserDeposit } = useReadContract({
    address: CONTRACT_ADDRESSES.VAULT,
    abi: VAULT_ABI,
    functionName: "getUserDeposit",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // ── Read: total USDC held by the vault ──────────────────────────────────
  const { data: vaultBalance, refetch: refetchVaultBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.VAULT,
    abi: VAULT_ABI,
    functionName: "getVaultBalance",
  });

  // ── Read: total deposited across all users ──────────────────────────────
  const { data: totalDeposited } = useReadContract({
    address: CONTRACT_ADDRESSES.VAULT,
    abi: VAULT_ABI,
    functionName: "totalDeposited",
  });

  // ── Wait for confirmation ────────────────────────────────────────────────
  const { isSuccess: isTxSuccess, isLoading: isTxPending } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // ── Auto-refetch all balances after tx confirmed ─────────────────────────
  useEffect(() => {
    if (isTxSuccess) {
      refetchUsdcBalance();
      refetchAllowance();
      refetchUserDeposit();
      refetchVaultBalance();
    }
  }, [isTxSuccess]);

  const refetchAll = async () => {
    await Promise.all([
      refetchUsdcBalance(),
      refetchAllowance(),
      refetchUserDeposit(),
      refetchVaultBalance(),
    ]);
  };

  // ── Approve vault to spend USDC ─────────────────────────────────────────
  const approveUSDC = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.USDC,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.VAULT, maxUint256],
      });
      // wait for approval tx before proceeding
      setTxHash(hash);
      await refetchAllowance();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Deposit ──────────────────────────────────────────────────────────────
  const deposit = async (amountStr: string) => {
    if (!IS_CONTRACT_CONFIGURED) throw new Error("Vault not configured");
    setIsLoading(true);
    setError(null);
    try {
      const amount = parseUnits(amountStr, 6);

      // Auto-approve if needed
      if (!allowance || (allowance as bigint) < amount) {
        const approveHash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.USDC,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.VAULT, maxUint256],
        });
        setTxHash(approveHash);
        // small pause to let approval propagate
        await new Promise(r => setTimeout(r, 2000));
        await refetchAllowance();
      }

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.VAULT,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [amount],
      });
      setTxHash(hash);
      return hash;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Deposit failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Withdraw ─────────────────────────────────────────────────────────────
  const withdraw = async (amountStr: string) => {
    if (!IS_CONTRACT_CONFIGURED) throw new Error("Vault not configured");
    setIsLoading(true);
    setError(null);
    try {
      const amount = parseUnits(amountStr, 6);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.VAULT,
        abi: VAULT_ABI,
        functionName: "withdraw",
        args: [amount],
      });
      setTxHash(hash);
      return hash;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Withdrawal failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Withdraw all ─────────────────────────────────────────────────────────
  const withdrawAll = async () => {
    if (!IS_CONTRACT_CONFIGURED) throw new Error("Vault not configured");
    setIsLoading(true);
    setError(null);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.VAULT,
        abi: VAULT_ABI,
        functionName: "withdrawAll",
      });
      setTxHash(hash);
      return hash;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Withdrawal failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Wallet USDC balance
    usdcBalance,
    usdcBalanceFormatted: usdcBalance ? formatUnits(usdcBalance as bigint, 6) : "0",
    // User's deposit in the vault
    userDeposit,
    userDepositFormatted: userDeposit ? formatUnits(userDeposit as bigint, 6) : "0",
    // Total vault balance
    vaultBalance,
    vaultBalanceFormatted: vaultBalance ? formatUnits(vaultBalance as bigint, 6) : "0",
    // Total deposited across all users
    totalDeposited,
    totalDepositedFormatted: totalDeposited ? formatUnits(totalDeposited as bigint, 6) : "0",
    // Actions
    deposit,
    withdraw,
    withdrawAll,
    approveUSDC,
    // Tx state
    txHash,
    isTxPending,   // tx sent, waiting for confirmation
    isTxSuccess,   // tx confirmed on-chain
    isLoading,     // local async state
    error,
    refetchAll,
  };
}
