// Rabby Wallet specific configurations
export const RABBY_NETWORKS = {
  sepolia: {
    chainId: "0xAA36A7",
    chainName: "Sepolia Testnet",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"],
    blockExplorerUrls: ["https://sepolia.etherscan.io/"],
  },
  mumbai: {
    chainId: "0x13881",
    chainName: "Polygon Mumbai",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
    blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
  },
  bscTestnet: {
    chainId: "0x61",
    chainName: "BSC Testnet",
    nativeCurrency: {
      name: "BNB",
      symbol: "tBNB",
      decimals: 18,
    },
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
    blockExplorerUrls: ["https://testnet.bscscan.com/"],
  },
};

// Auto-add network to Rabby
export async function setupRabbyNetwork(networkName) {
  const network = RABBY_NETWORKS[networkName];
  if (!network) {
    throw new Error(`Network ${networkName} not supported`);
  }

  if (window.ethereum) {
    try {
      // Try to switch first
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      });
    } catch (switchError) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [network],
        });
      } else {
        throw switchError;
      }
    }
  }
}

// Check current network
export async function getCurrentNetwork() {
  if (window.ethereum) {
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      return chainId;
    } catch (error) {
      console.error("Failed to get network:", error);
      return null;
    }
  }
  return null;
}
