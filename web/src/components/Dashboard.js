import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  ABI as CONTRACT_ABI,
} from "../blockchain/MotorbikeNFT";
import "./Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalNFTs: 0,
    myNFTs: 0,
    isConnected: false,
    userAddress: "",
  });
  const [recentNFTs, setRecentNFTs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Kết nối ví
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);

        if (accounts.length > 0) {
          const userAddress = accounts[0];
          const contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            provider
          );

          // Lấy tổng số NFT
          const totalSupply = await contract.totalSupply();

          // Đếm NFT của user
          let myNFTCount = 0;
          const myNFTList = [];

          for (let i = 0; i < totalSupply; i++) {
            try {
              const owner = await contract.ownerOf(i);
              if (owner.toLowerCase() === userAddress.toLowerCase()) {
                myNFTCount++;
                const nft = await contract.getMotorbike(i);
                myNFTList.push({
                  tokenId: i,
                  vin: nft.vin,
                  model: nft.model,
                  color: nft.color,
                  year: nft.year.toString(),
                });
              }
            } catch (error) {
              console.log(`Token ${i} không tồn tại`);
            }
          }

          setStats({
            totalNFTs: Number(totalSupply),
            myNFTs: myNFTCount,
            isConnected: true,
            userAddress: userAddress,
          });

          setRecentNFTs(myNFTList.slice(-3)); // 3 NFT gần nhất
        }
      }
    } catch (error) {
      console.error("Lỗi load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        loadDashboardData();
      } else {
        alert("Vui lòng cài đặt Rabby hoặc MetaMask!");
      }
    } catch (error) {
      console.error("Lỗi kết nối ví:", error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!stats.isConnected) {
    return (
      <div className="dashboard-connect">
        <div className="connect-card">
          <h2>🏍️ Hệ thống quản lý NFT Xe máy</h2>
          <p>Kết nối ví để bắt đầu quản lý NFT của bạn</p>
          <button className="connect-btn" onClick={connectWallet}>
            Kết nối ví
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>🏍️ Dashboard Quản lý NFT</h1>
        <div className="user-info">
          <span className="user-address">
            {stats.userAddress.slice(0, 6)}...{stats.userAddress.slice(-4)}
          </span>
          <div className="status-indicator connected"></div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-content">
            <h3>Tổng NFT hệ thống</h3>
            <p className="stat-number">{stats.totalNFTs}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏍️</div>
          <div className="stat-content">
            <h3>NFT của tôi</h3>
            <p className="stat-number">{stats.myNFTs}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Trạng thái</h3>
            <p className="stat-text">Đã kết nối</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>🚀 Thao tác nhanh</h2>
        <div className="action-grid">
          <Link to="/my-nfts" className="action-card">
            <div className="action-icon">📱</div>
            <h3>NFT của tôi</h3>
            <p>Xem và quản lý NFT thuộc sở hữu</p>
          </Link>

          <Link to="/all-nfts" className="action-card">
            <div className="action-icon">🔍</div>
            <h3>Tất cả NFT</h3>
            <p>Duyệt toàn bộ NFT trong hệ thống</p>
          </Link>

          <Link to="/register" className="action-card">
            <div className="action-icon">➕</div>
            <h3>Đăng ký xe</h3>
            <p>Tạo NFT cho xe mới</p>
          </Link>

          <Link to="/search" className="action-card">
            <div className="action-icon">🔎</div>
            <h3>Tìm kiếm</h3>
            <p>Tìm NFT theo thông tin xe</p>
          </Link>
        </div>
      </div>

      {recentNFTs.length > 0 && (
        <div className="recent-nfts">
          <h2>🏍️ NFT gần đây của bạn</h2>
          <div className="nft-grid">
            {recentNFTs.map((nft) => (
              <Link
                key={nft.tokenId}
                to={`/nft/${nft.tokenId}`}
                className="nft-card"
              >
                <div className="nft-header">
                  <span className="nft-id">#{nft.tokenId}</span>
                  <span className="nft-year">{nft.year}</span>
                </div>
                <h3>{nft.model}</h3>
                <div className="nft-info">
                  <p>
                    <strong>VIN:</strong> {nft.vin}
                  </p>
                  <p>
                    <strong>Màu:</strong> {nft.color}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
