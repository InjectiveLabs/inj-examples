import { useWallet } from "@/hooks/useWallet";
import { injectiveTestnet } from "@/config/wagmi";

export function NetworkBadge() {
  const { chain, isConnected } = useWallet();
  if (!isConnected) return null;

  const isCorrect = chain?.id === injectiveTestnet.id;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-inj-full font-whyte text-label-sm font-medium border ${
        isCorrect
          ? "bg-inj-green/20 border-inj-green/40 text-inj-lime"
          : "bg-red-900/40 border-red-600/40 text-red-400"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isCorrect ? "bg-inj-lime" : "bg-red-400"
        }`}
      />
      {isCorrect ? chain?.name : "Wrong Network"}
    </span>
  );
}
