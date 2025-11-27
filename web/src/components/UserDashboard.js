import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  ABI as CONTRACT_ABI,
} from "../blockchain/MotorbikeNFT";

import "./UserDashboard.css"; // ⭐ IMPORT CSS MỚI

const UserDashboard = () => {
  const [userAddress, setUserAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    myNFTCount: 0,
    totalSystemNFTs: 0,
  });

  useEffect(() => {
    connectAndLoadData();
  }, []);

  const connectAndLoadData = async () => {
    try {
      setLoading(true);

      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);

        if (accounts.length > 0) {
          const userAddr = accounts[0];
          setUserAddress(userAddr);
          setIsConnected(true);

          await loadUserNFTs(provider, userAddr);
        }
      }
    } catch (err) {
      console.error("Lỗi khi kết nối ví:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserNFTs = async (provider, userAddr) => {
    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      const total = await contract.totalSupply();
      const userNFTs = [];

      for (let i = 0; i < total; i++) {
        try {
          const owner = await contract.ownerOf(i);

          if (owner.toLowerCase() === userAddr.toLowerCase()) {
            const nftData = await contract.getMotorbike(i);
            userNFTs.push({
              tokenId: i,
              vin: nftData.vin,
              engineNumber: nftData.engineNumber,
              model: nftData.model,
              color: nftData.color,
              year: nftData.year.toString(),
            });
          }
        } catch {}
      }

      setMyNFTs(userNFTs);
      setStats({
        myNFTCount: userNFTs.length,
        totalSystemNFTs: Number(total),
      });
    } catch (error) {
      console.error("Lỗi load NFT:", error);
    }
  };

  const connectWallet = () => {
    if (typeof window.ethereum !== "undefined") {
      connectAndLoadData();
    } else {
      alert("Bạn cần cài MetaMask hoặc Rabby!");
    }
  };

  if (!isConnected) {
    return (
      <div className="user-dashboard">
        <div className="no-nft">
          <h2>👤 User Dashboard</h2>
          <p>Kết nối ví để xem NFT của bạn</p>
          <button className="user-nft-btn primary" onClick={connectWallet}>
            Kết nối ví của tôi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">

      {/* HEADER */}
      <div className="user-header">
        <div>
          <h1>🏍️ Motorbike NFT Dashboard</h1>
          <p>Quản lý tài sản NFT xe máy của bạn</p>
        </div>

        <div className="user-wallet">
          <div className="user-wallet-label">Ví đã kết nối</div>

          <div className="user-wallet-address">
            {userAddress.slice(0, 8)}...{userAddress.slice(-5)}
          </div>

          <div className="user-wallet-status">
            <span></span> Online
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="user-stats">
        <div className="user-stat-card">
          <div className="user-stat-icon">🏍️</div>
          <div className="user-stat-number">{stats.myNFTCount}</div>
          <div className="user-stat-label">NFT CỦA TÔI</div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon">🌐</div>
          <div className="user-stat-number">{stats.totalSystemNFTs}</div>
          <div className="user-stat-label">TỔNG NFT HỆ THỐNG</div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="quick-actions">
        <h2>Thao tác nhanh</h2>

        <div className="quick-action-grid">
          <Link to="/my-nfts" className="quick-action-card">
            <div className="quick-action-icon">🏍️</div>
            <div>
              <h3>NFT của tôi</h3>
              <p>Xem và quản lý tài sản NFT bạn đang sở hữu.</p>
            </div>
          </Link>

          <Link to="/marketplace" className="quick-action-card">
            <div className="quick-action-icon">🛒</div>
            <div>
              <h3>Chợ NFT</h3>
              <p>Mua bán & khám phá các NFT xe máy.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* NFT LIST */}
      {loading ? (
        <div className="no-nft">
          <h2>⏳ Đang tải dữ liệu...</h2>
        </div>
      ) : myNFTs.length === 0 ? (
        <div className="no-nft">
          <h2>Bạn chưa có NFT nào</h2>
          <p>Hãy truy cập Marketplace để mua NFT đầu tiên.</p>
        </div>
      ) : (
        <div className="user-nft-section">
          <h2>NFT của tôi ({myNFTs.length})</h2>

          <div className="user-nft-grid">
            {myNFTs.map((nft) => (
              <div className="user-nft-card" key={nft.tokenId}>
                <div className="user-nft-banner">🏍️</div>

                <div className="user-nft-content">
                  <h3 className="user-nft-title">
                    {nft.model} ({nft.year})
                  </h3>

                  <div className="nft-spec-row">
                    <span className="label">VIN</span>
                    <span className="value">{nft.vin}</span>
                  </div>

                  <div className="nft-spec-row">
                    <span className="label">Số máy</span>
                    <span className="value">{nft.engineNumber}</span>
                  </div>

                  <div className="nft-spec-row">
                    <span className="label">Màu</span>
                    <span className="value">{nft.color}</span>
                  </div>

                  <div className="user-nft-actions">
                    <Link
                      to={`/user/nft/${nft.tokenId}`}
                      className="user-nft-btn primary"
                    >
                      Chi tiết
                    </Link>

                    <Link
                      to={`/user/sell/${nft.tokenId}`}
                      className="user-nft-btn secondary"
                    >
                      Bán
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default UserDashboard;
