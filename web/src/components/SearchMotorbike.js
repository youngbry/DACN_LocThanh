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
      setStatus("Không tìm thấy hoặc lỗi: " + err.message);
    }
  };

  return (
    <div>
      <h2>Tra cứu thông tin xe máy</h2>
  <button onClick={handleConnectWallet} type="button">Kết nối ví Ethereum</button>
      <div style={{ margin: "10px 0", color: "green" }}>{status}</div>
      <form onSubmit={handleSearch}>
        <label>Token ID (NFT):</label>
        <input type="number" value={tokenId} onChange={e => setTokenId(e.target.value)} required /><br />
        <button type="submit">Tra cứu</button>
      </form>
      {info && (
        <div style={{marginTop:20}}>
          <h3>Thông tin xe máy</h3>
          <p>Số khung (VIN): {info.vin}</p>
          <p>Số máy: {info.engineNumber}</p>
          <p>Model: {info.model}</p>
          <p>Màu sắc: {info.color}</p>
          <p>Năm sản xuất: {info.year}</p>
          <p>Chủ sở hữu: {info.owner}</p>
        </div>
      )}
    </div>
  );
}

export default SearchMotorbike;
