import React, { useState } from "react";
import { connectWallet } from "../utils/wallet";
import { ABI, CONTRACT_ADDRESS } from "../blockchain/MotorbikeNFT";
import { ethers } from "ethers";
import { getKycStatus } from "../utils/kycUtils";

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
      const userAddr = await signer.getAddress();

      // Check KYC
      const kycStatus = await getKycStatus(userAddr);
      if (kycStatus !== "verified") {
        alert(
          "Bạn cần xác thực tài khoản (eKYC) trước khi thực hiện giao dịch này!"
        );
        return;
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.transferFrom(
        userAddr,
        to,
        Number(tokenId)
      );
      await tx.wait();
      setStatus(`Chuyển nhượng NFT #${tokenId} cho ${to} thành công!`);
    } catch (err) {
      const msg = (err && (err.code === 4001 || err.code === 'ACTION_REJECTED' || /user rejected/i.test(err.message)))
        ? 'Giao dịch đã bị từ chối bởi người dùng (hãy xác nhận "Sign" trong ví).'
        : (err && err.message) ? err.message : String(err);
      setStatus('Lỗi: ' + msg + ' (xem console để biết chi tiết)');
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Chuyển nhượng NFT xe máy</h2>
      <div className="muted">Nhập Token ID và địa chỉ ví nhận để chuyển quyền sở hữu.</div>
      <div style={{marginTop:12}}>
        <button className="btn" onClick={handleConnectWallet} type="button">Kết nối ví Ethereum</button>
        <div className="status">{status}</div>
      </div>

      <form onSubmit={handleTransfer} style={{marginTop:12}}>
        <div className="form-row">
          <label>Token ID (NFT)</label>
          <input type="number" value={tokenId} onChange={e => setTokenId(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Địa chỉ ví nhận</label>
          <input type="text" value={to} onChange={e => setTo(e.target.value)} required />
        </div>
        <div className="form-actions">
          <button className="btn" type="submit">Chuyển nhượng NFT</button>
        </div>
      </form>
    </div>
  );
}

export default TransferNFT;
