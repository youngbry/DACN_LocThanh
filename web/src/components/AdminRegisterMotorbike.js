
import React, { useState } from "react";
import { connectWallet } from "../utils/wallet";
import { ABI, CONTRACT_ADDRESS } from "../blockchain/MotorbikeNFT";
import { ethers } from "ethers";

function AdminRegisterMotorbike() {
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState("");

  const handleConnectWallet = async () => {
    try {
      const signer = await connectWallet();
      const address = await signer.getAddress();
      setWalletAddress(address);
      setStatus("Kết nối ví thành công: " + address);
    } catch (err) {
      setStatus(err.message);
    }
  };

  const [form, setForm] = useState({
    vin: "",
    engineNumber: "",
    model: "",
    color: "",
    year: "",
    to: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!window.ethereum) throw new Error("Vui lòng cài đặt MetaMask!");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.mint(
        form.to,
        form.vin,
        form.engineNumber,
        form.model,
        form.color,
        Number(form.year)
      );
      await tx.wait();
      setStatus("Đăng ký NFT xe máy thành công!");
    } catch (err) {
      setStatus("Lỗi: " + err.message);
    }
  };

  return (
    <div>
      <h2>Đăng ký xe máy (Admin)</h2>
      <button onClick={handleConnectWallet} type="button">
        Kết nối ví Ethereum
      </button>
      <div style={{ margin: "10px 0", color: "green" }}>{status}</div>
      <form onSubmit={handleSubmit}>
        <label>Số khung (VIN):</label>
        <input type="text" name="vin" value={form.vin} onChange={handleChange} required /><br />
        <label>Số máy:</label>
        <input type="text" name="engineNumber" value={form.engineNumber} onChange={handleChange} required /><br />
        <label>Model:</label>
        <input type="text" name="model" value={form.model} onChange={handleChange} required /><br />
        <label>Màu sắc:</label>
        <input type="text" name="color" value={form.color} onChange={handleChange} required /><br />
        <label>Năm sản xuất:</label>
        <input type="number" name="year" value={form.year} onChange={handleChange} required /><br />
        <label>Địa chỉ ví người nhận:</label>
        <input type="text" name="to" value={form.to} onChange={handleChange} required /><br />
        <button type="submit">Đăng ký NFT xe máy</button>
      </form>
    </div>
  );
}

export default AdminRegisterMotorbike;
