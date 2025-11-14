import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  ABI as CONTRACT_ABI,
} from "../blockchain/MotorbikeNFT";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [adminAddress, setAdminAddress] = useState("");
  const [stats, setStats] = useState({
    totalNFTs: 0,
    isAdmin: false,
  });

  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // Form state for creating NFT
  const [formData, setFormData] = useState({
    recipientAddress: "",
    vin: "",
    engineNumber: "",
    model: "",
    color: "",
    year: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminStatus = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);

        if (accounts.length > 0) {
          const userAddress = accounts[0];
          setAdminAddress(userAddress);
          setIsConnected(true);

          const contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            provider
          );

          // Check if user is hardcoded admin (bypass contract.owner() call)
          const hardcodedAdmin = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
          const isAdmin =
            userAddress.toLowerCase() === hardcodedAdmin.toLowerCase();

          console.log("🔍 Admin Check:");
          console.log("Hardcoded Admin:", hardcodedAdmin);
          console.log("User Address:", userAddress);
          console.log("Is Hardcoded Admin?", isAdmin);

          // Get total NFTs
          const totalSupply = await contract.totalSupply();

          setStats({
            totalNFTs: Number(totalSupply),
            isAdmin: isAdmin,
          });
          setAdminCheckComplete(true);
        }
      }
    } catch (error) {
      console.error("Lỗi kiểm tra admin:", error);
      setAdminCheckComplete(true);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        await checkAdminStatus();
      } else {
        alert("Vui lòng cài đặt Rabby hoặc MetaMask!");
      }
    } catch (error) {
      console.error("Lỗi kết nối ví:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createAndSendNFT = async (e) => {
    e.preventDefault();

    if (!stats.isAdmin) {
      setMessage("❌ Chỉ admin được ủy quyền mới có thể tạo NFT!");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Pre-validate duplicates on-chain
      try {
        const vinUsed = await contract.isVinUsed(formData.vin);
        const engineUsed = await contract.isEngineNumberUsed(
          formData.engineNumber
        );
        if (vinUsed) {
          setLoading(false);
          // Lấy token ID liên quan tới VIN bị trùng
          try {
            const vinHash = ethers.keccak256(ethers.toUtf8Bytes(formData.vin));
            const existingTokenId = await contract.vinToTokenId(vinHash);
            setMessage(
              `❌ VIN đã tồn tại trong hệ thống (Token ID: ${existingTokenId.toString()}). Không thể tạo trùng.`
            );
          } catch (vinIdErr) {
            console.warn("Không lấy được tokenId của VIN trùng:", vinIdErr);
            setMessage(
              "❌ VIN đã tồn tại trong hệ thống. Không thể tạo trùng."
            );
          }
          return;
        }
        if (engineUsed) {
          setLoading(false);
          try {
            const engineHash = ethers.keccak256(
              ethers.toUtf8Bytes(formData.engineNumber)
            );
            const existingTokenId = await contract.engineToTokenId(engineHash);
            setMessage(
              `❌ Số máy đã tồn tại trong hệ thống (Token ID: ${existingTokenId.toString()}). Không thể tạo trùng.`
            );
          } catch (engIdErr) {
            console.warn("Không lấy được tokenId của Số máy trùng:", engIdErr);
            setMessage(
              "❌ Số máy đã tồn tại trong hệ thống. Không thể tạo trùng."
            );
          }
          return;
        }
      } catch (preErr) {
        console.warn("Không kiểm tra được trùng lặp trước mint:", preErr);
      }

      console.log("🔄 Đang tạo NFT...");
      setMessage("⏳ Đang tạo NFT...");

      // Mint NFT directly to recipient
      const mintTx = await contract.mint(
        formData.recipientAddress, // địa chỉ người nhận
        formData.vin,
        formData.engineNumber,
        formData.model,
        formData.color,
        parseInt(formData.year)
      );

      const mintReceipt = await mintTx.wait();
      console.log("✅ NFT đã được mint thành công");

      // Get the new token ID from mint event
      let newTokenId = null;
      const mintTransferEvent = mintReceipt.logs.find(
        (log) => log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
      );

      if (
        mintTransferEvent &&
        mintTransferEvent.topics &&
        mintTransferEvent.topics[3]
      ) {
        newTokenId = parseInt(mintTransferEvent.topics[3], 16);
        console.log("🏷️ Token ID:", newTokenId);
      }

      setMessage(
        `✅ NFT #${
          newTokenId || "mới"
        } đã được tạo và gửi thành công!\n🎯 Người nhận: ${
          formData.recipientAddress
        }\n📋 TX: ${mintTx.hash}`
      );

      // Reset form
      setFormData({
        recipientAddress: "",
        vin: "",
        engineNumber: "",
        model: "",
        color: "",
        year: "",
      });

      // Update stats
      await checkAdminStatus();
    } catch (error) {
      console.error("Lỗi tạo NFT:", error);
      let errorMessage = "Có lỗi xảy ra khi tạo NFT";

      if (error.message.includes("user rejected")) {
        errorMessage = "Bạn đã từ chối giao dịch";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Không đủ gas fee để thực hiện giao dịch";
      } else if (error.message.includes("Ownable: caller is not the owner")) {
        errorMessage = "Bạn không có quyền admin để tạo NFT";
      } else if (error.message.includes("VIN already exists")) {
        errorMessage = "VIN đã tồn tại trong hệ thống";
      } else if (error.message.includes("Engine number already exists")) {
        errorMessage = "Số máy đã tồn tại trong hệ thống";
      }

      setMessage("❌ " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <button
            onClick={() => window.history.back()}
            className="back-btn"
            title="Quay lại"
          >
            ← Quay lại
          </button>
        </div>
        <div className="admin-connect">
          <div className="connect-card">
            <h1>👨‍💼 Admin Dashboard</h1>
            <p>Kết nối ví để quản lý hệ thống NFT xe máy</p>
            <button className="connect-btn" onClick={connectWallet}>
              Kết nối ví Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!adminCheckComplete) {
    return (
      <div className="admin-dashboard">
        <div className="admin-connect">
          <div className="connect-card">
            <h1>⏳ Đang kiểm tra quyền admin...</h1>
            <p>Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  // Kiểm tra quyền admin
  console.log("📊 Stats check:", stats);
  console.log("📊 stats.isAdmin:", stats.isAdmin);
  console.log("📊 Type of stats.isAdmin:", typeof stats.isAdmin);

  if (!stats.isAdmin) {
    console.log("❌ Access denied - stats.isAdmin is false");
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <button
            onClick={() => window.history.back()}
            className="back-btn"
            title="Quay lại"
          >
            ← Quay lại
          </button>
        </div>
        <div className="access-denied">
          <div className="denied-card">
            <h2>🚫 Truy cập bị từ chối</h2>
            <p>Bạn không có quyền admin để truy cập trang này.</p>
            <div className="access-info">
              <p>
                <strong>Địa chỉ hiện tại:</strong>
              </p>
              <code>{adminAddress}</code>
              <p>
                <strong>Yêu cầu địa chỉ contract owner:</strong>
              </p>
              <code>0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266</code>
            </div>
            <Link to="/user" className="user-btn">
              🏠 Đi đến trang User
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <button
          onClick={() => window.history.back()}
          className="back-btn"
          title="Quay lại"
        >
          ← Quay lại
        </button>
        <h1>👨‍💼 Admin Dashboard</h1>
        <div className="admin-info">
          <span className="admin-label">Admin:</span>
          <span className="admin-address">
            {adminAddress.slice(0, 6)}...{adminAddress.slice(-4)}
          </span>
          <div className="admin-status">✅ Verified</div>
        </div>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">🏍️</div>
          <div className="stat-content">
            <h3>Tổng NFT đã tạo</h3>
            <div className="stat-number">{stats.totalNFTs}</div>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="create-nft-section">
          <h2>🏭 Tạo NFT xe máy mới</h2>
          <form onSubmit={createAndSendNFT} className="create-nft-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="recipientAddress">
                  👤 Địa chỉ ví người nhận *
                </label>
                <input
                  type="text"
                  id="recipientAddress"
                  name="recipientAddress"
                  value={formData.recipientAddress}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vin">🆔 Số khung (VIN) *</label>
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  value={formData.vin}
                  onChange={handleInputChange}
                  placeholder="RLHPC4508M7123456"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="engineNumber">⚙️ Số máy *</label>
                <input
                  type="text"
                  id="engineNumber"
                  name="engineNumber"
                  value={formData.engineNumber}
                  onChange={handleInputChange}
                  placeholder="PC45E7123456"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="model">🏍️ Mẫu xe *</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="Honda Winner X 150"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="color">🎨 Màu sắc *</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="Đen nhám"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="year">📅 Năm sản xuất *</label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="2023"
                  min="1980"
                  max={new Date().getFullYear()}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="create-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Đang tạo NFT...
                </>
              ) : (
                "🏭 Tạo và gửi NFT"
              )}
            </button>
          </form>

          {message && (
            <div
              className={`message ${
                message.includes("✅") ? "success" : "error"
              }`}
            >
              <pre>{message}</pre>
            </div>
          )}
        </div>

        <div className="admin-actions">
          <h3>🛠️ Quản lý hệ thống</h3>
          <div className="action-buttons">
            <Link to="/admin/nfts" className="action-btn">
              📋 Quản lý tất cả NFT
            </Link>
            <Link to="/user" className="action-btn secondary">
              👥 Xem giao diện User
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
