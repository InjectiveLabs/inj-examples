import { useAccount, useBalance, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { injectiveTestnet } from "@/config/wagmi";

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const { data: balance } = useBalance({
    address,
    query: { enabled: isConnected },
  });

  const isOnCorrectNetwork = chain?.id === injectiveTestnet.id;

  const connectWallet = (connectorIndex = 0) => {
    connect({ connector: connectors[connectorIndex] });
  };

  const switchToInjective = () => {
    switchChain({ chainId: injectiveTestnet.id });
  };

  return {
    address,
    isConnected,
    isConnecting,
    balance,
    chain,
    connectors,
    isOnCorrectNetwork,
    connectWallet,
    disconnect,
    switchToInjective,
  };
}
