import { ethers } from "ethers";

export async function connectWallet() {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return signer;
    } catch (error) {
      throw new Error("Kết nối ví thất bại");
    }
  } else {
    throw new Error("Vui lòng cài đặt MetaMask!");
  }
}
