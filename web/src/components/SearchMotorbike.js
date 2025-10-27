import React, { useState } from "react";
import { connectWallet } from "../utils/wallet";
import { ABI, CONTRACT_ADDRESS } from "../blockchain/MotorbikeNFT";
import { ethers } from "ethers";

function SearchMotorbike() {
  const [tokenId, setTokenId] = useState("");
  const [info, setInfo] = useState(null);
  const [status, setStatus] = useState("");

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setStatus("Kết nối ví thành công");
    } catch (err) {
      setStatus(err.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      if (!window.ethereum) throw new Error("Vui lòng cài đặt MetaMask!");
      const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const motorbike = await contract.getMotorbike(Number(tokenId));
      const owner = await contract.ownerOf(Number(tokenId));
      setInfo({
        vin: motorbike.vin,
        engineNumber: motorbike.engineNumber,
        model: motorbike.model,
        color: motorbike.color,
        year: motorbike.year,
        owner: owner
      });
      setStatus("");
    } catch (err) {
      setInfo(null);
      const msg = (err && (err.code === 4001 || err.code === 'ACTION_REJECTED' || /user rejected/i.test(err.message)))
        ? 'Giao dịch/tác vụ đã bị từ chối bởi người dùng.'
        : (err && err.message) ? err.message : String(err);
      setStatus('Không tìm thấy hoặc lỗi: ' + msg);
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Tra cứu thông tin xe máy</h2>
      <div className="muted">Nhập Token ID để lấy thông tin và chủ sở hữu.</div>
      <div style={{marginTop:12}}>
        <button className="btn" onClick={handleConnectWallet} type="button">Kết nối ví Ethereum</button>
        <div className="status">{status}</div>
      </div>

      <form onSubmit={handleSearch} style={{marginTop:12}}>
        <div className="form-row">
          <label>Token ID (NFT)</label>
          <input type="number" value={tokenId} onChange={e => setTokenId(e.target.value)} required />
        </div>
        <div className="form-actions">
          <button className="btn" type="submit">Tra cứu</button>
        </div>
      </form>

      {info && (
        <div style={{marginTop:16}}>
          <h3>Thông tin xe máy</h3>
          <p><strong>Số khung (VIN):</strong> {info.vin}</p>
          <p><strong>Số máy:</strong> {info.engineNumber}</p>
          <p><strong>Model:</strong> {info.model}</p>
          <p><strong>Màu sắc:</strong> {info.color}</p>
          <p><strong>Năm sản xuất:</strong> {info.year}</p>
          <p><strong>Chủ sở hữu:</strong> {info.owner}</p>
        </div>
      )}
    </div>
  );
}

export default SearchMotorbike;
