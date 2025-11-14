import { ethers } from "ethers";

// Detect wallet type
function detectWallet() {
  if (window.ethereum) {
    if (window.ethereum.isRabby) {
      return "Rabby";
    } else if (window.ethereum.isMetaMask) {
      return "MetaMask";
    } else {
      return "Unknown Wallet";
    }
  }
  return null;
}

export async function connectWallet() {
  const walletType = detectWallet();

  if (window.ethereum) {
    try {
      console.log(`🔗 Connecting to ${walletType}...`);

      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      console.log(`✅ Connected to ${walletType}`);
      return signer;
    } catch (error) {
      throw new Error(`Kết nối ${walletType} thất bại: ${error.message}`);
    }
  } else {
    throw new Error("Vui lòng cài đặt Rabby Wallet hoặc MetaMask!");
  }
}

// Add network to wallet
export async function addNetwork(networkConfig) {
  if (window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [networkConfig],
      });
    } catch (error) {
      console.error("Failed to add network:", error);
      throw error;
    }
  }
}

// Switch to specific network
export async function switchNetwork(chainId) {
  if (window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
    } catch (error) {
      console.error("Failed to switch network:", error);
      throw error;
    }
  }
}
