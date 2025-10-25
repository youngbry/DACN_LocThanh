import React, { useState } from "react";
import { connectWallet } from "../utils/wallet";
import { ABI, CONTRACT_ADDRESS } from "../blockchain/MotorbikeNFT";
import { ethers } from "ethers";

function TransferNFT() {
  const [status, setStatus] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [to, setTo] = useState("");

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setStatus("Kết nối ví thành công");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      if (!window.ethereum) throw new Error("Vui lòng cài đặt MetaMask!");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.transferFrom(await signer.getAddress(), to, Number(tokenId));
      await tx.wait();
      setStatus(`Chuyển nhượng NFT #${tokenId} cho ${to} thành công!`);
    } catch (err) {
      setStatus("Lỗi: " + err.message);
    }
  };

  return (
    <div>
      <h2>Chuyển nhượng NFT xe máy</h2>
  <button onClick={handleConnectWallet} type="button">Kết nối ví Ethereum</button>
      <div style={{ margin: "10px 0", color: "green" }}>{status}</div>
      <form onSubmit={handleTransfer}>
        <label>Token ID (NFT):</label>
        <input type="number" value={tokenId} onChange={e => setTokenId(e.target.value)} required /><br />
        <label>Địa chỉ ví nhận:</label>
        <input type="text" value={to} onChange={e => setTo(e.target.value)} required /><br />
        <button type="submit">Chuyển nhượng NFT</button>
      </form>
    </div>
  );
}

export default TransferNFT;
