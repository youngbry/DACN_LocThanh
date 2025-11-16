// Cấu hình tối giản cho Rabby chỉ dùng mạng Hardhat local.
// ChainId Hardhat: 31337 => hex 0x7A69
export const RABBY_NETWORKS = {
  localhost: {
    chainId: "0x7A69",
    chainName: "Hardhat Localhost",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: ["http://127.0.0.1:8545"],
    blockExplorerUrls: [],
  },
};

// Thêm hoặc chuyển sang mạng localhost nếu cần.
export async function setupLocalhostRabby() {
  const network = RABBY_NETWORKS.localhost;
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network.chainId }],
    });
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [network],
      });
    } else {
      console.error("Không thể chuyển mạng:", err);
    }
  }
}

export async function getCurrentNetwork() {
  if (!window.ethereum) return null;
  try {
    return await window.ethereum.request({ method: "eth_chainId" });
  } catch (e) {
    console.error("Lỗi lấy chainId:", e);
    return null;
  }
}
