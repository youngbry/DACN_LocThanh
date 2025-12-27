import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";

import {
  CONTRACT_ADDRESS,
  ABI as CONTRACT_ABI,
} from "../blockchain/MotorbikeNFT";

import TransactionHistory from "./TransactionHistory"; // Import TransactionHistory
import "./UserDashboard.css"; // ⭐ IMPORT CSS

const UserDashboard = () => {
  const [userAddress, setUserAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aliases, setAliases] = useState({}); // State lưu tên gợi nhớ
  const [balance, setBalance] = useState("0"); // State lưu số dư ví
  const [provider, setProvider] = useState(null); // State lưu provider

  const [stats, setStats] = useState({
    myNFTCount: 0,
    totalSystemNFTs: 0,
  });
  const [kycStatus, setKycStatus] = useState(null);
  const [kycData, setKycData] = useState(null);
  const [showKycInfo, setShowKycInfo] = useState(false);

  const checkKycStatus = async (address) => {
    try {
      const res = await fetch(`http://localhost:4000/api/kyc/requests?t=${Date.now()}`);
      if (res.ok) {
        const requests = await res.json();
        const myRequests = requests.filter(
          (r) => r.walletAddress.toLowerCase() === address.toLowerCase()
        );

        // Ưu tiên trạng thái đã xác thực
        const verifiedRequest = myRequests.find((r) => r.status === "verified");
        // Nếu không có verified, lấy cái mới nhất
        const latestRequest = myRequests.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0];

        if (verifiedRequest) {
          setKycStatus("verified");
          setKycData(verifiedRequest);
        } else if (latestRequest) {
          setKycStatus(latestRequest.status);
          setKycData(latestRequest);
        }
      }
    } catch (error) {
      console.error("Error checking KYC status:", error);
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

  const connectAndLoadData = useCallback(async () => {
    try {
      setLoading(true);

      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);

        if (accounts.length > 0) {
          const userAddr = accounts[0];
          setUserAddress(userAddr);
          setIsConnected(true);
          setProvider(provider); // Lưu provider để dùng cho TransactionHistory

          // Lấy số dư ví
          const balanceWei = await provider.getBalance(userAddr);
          setBalance(ethers.formatEther(balanceWei));

          // Load tên gợi nhớ từ LocalStorage
          const savedAliases = localStorage.getItem(`nft_aliases_${userAddr}`);
          if (savedAliases) {
            setAliases(JSON.parse(savedAliases));
          }

          await loadUserNFTs(provider, userAddr);
          checkKycStatus(userAddr);
        }
      }
    } catch (err) {
      console.error("Lỗi khi kết nối ví:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    connectAndLoadData();
  }, [connectAndLoadData]);

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
          <div className="user-stat-icon">💰</div>
          <div className="user-stat-number">
            {parseFloat(balance).toFixed(4)} ETH
          </div>
          <div className="user-stat-label">SỐ DƯ VÍ</div>
        </div>

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

      {/* KYC Banner */}
      <div 
        className={`kyc-banner ${kycStatus === "verified" ? "clickable" : ""}`}
        onClick={() => kycStatus === "verified" && setShowKycInfo(true)}
        style={{ cursor: kycStatus === "verified" ? "pointer" : "default" }}
      >
        <div className="kyc-content">
          <h3>
            {kycStatus === "verified"
              ? "✅ Tài khoản đã xác thực"
              : kycStatus === "pending"
              ? "⏳ Đang chờ duyệt hồ sơ"
              : "🔐 Xác thực danh tính (eKYC)"}
          </h3>
          <p>
            {kycStatus === "verified"
              ? "Bạn đã hoàn tất xác thực danh tính. Tài khoản của bạn đã được bảo vệ."
              : kycStatus === "pending"
              ? "Hồ sơ của bạn đang được Admin xem xét. Vui lòng quay lại sau."
              : "Xác thực tài khoản để tăng độ tin cậy và bảo mật khi giao dịch."}
          </p>
        </div>

        {kycStatus === "verified" ? (
          <div className="kyc-status-badge">
            <span>🛡️ Đã xác thực</span>
          </div>
        ) : kycStatus === "pending" ? (
          <button className="kyc-btn disabled">Đang chờ duyệt...</button>
        ) : (
          <Link to="/kyc" className="kyc-btn">
            Xác thực ngay ➡️
          </Link>
        )}
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
                {/* KHÔNG CÒN user-nft-banner */}

                <div className="user-nft-content">
                  <div className="user-nft-info">
                    <span className="user-nft-id">#{nft.tokenId}</span>
                    <h3 className="user-nft-title">
                      {aliases[nft.tokenId] ? (
                        <>
                          {aliases[nft.tokenId]}
                          <span
                            style={{
                              fontSize: "0.8em",
                              color: "#64748b",
                              fontWeight: "normal",
                              marginLeft: "6px",
                            }}
                          >
                            ({nft.model})
                          </span>
                        </>
                      ) : (
                        nft.model
                      )}
                    </h3>
                  </div>

                  <div className="user-nft-actions">
                    <Link
                      to={`/user/nft/${nft.tokenId}`}
                      className="user-nft-btn primary small"
                    >
                      Chi tiết
                    </Link>

                    <Link
                      to={`/user/sell/${nft.tokenId}`}
                      className="user-nft-btn secondary small"
                      onClick={(e) => {
                        if (kycStatus !== "verified") {
                          e.preventDefault();
                          alert(
                            "Bạn cần xác thực tài khoản (eKYC) trước khi giao dịch!"
                          );
                        }
                      }}
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

      {/* TRANSACTION HISTORY */}
      {isConnected && provider && (
        <TransactionHistory userAddress={userAddress} provider={provider} />
      )}

      {/* KYC Info Modal */}
      {showKycInfo && kycData && (
        <div className="kyc-modal-overlay" onClick={() => setShowKycInfo(false)}>
          <div className="kyc-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="kyc-modal-header">
              <h3>Thông tin cá nhân</h3>
              <button
                className="close-btn"
                onClick={() => setShowKycInfo(false)}
              >
                ×
              </button>
            </div>
            <div className="kyc-modal-body">
              <div className="info-row">
                <label>Họ tên:</label>
                <span>{kycData.fullName}</span>
              </div>
              <div className="info-row">
                <label>Số CCCD:</label>
                <span>{kycData.idNumber}</span>
              </div>
              <div className="info-row">
                <label>Ngày sinh:</label>
                <span>{kycData.dob}</span>
              </div>
              <div className="info-row">
                <label>Giới tính:</label>
                <span>{kycData.gender}</span>
              </div>
              <div className="info-row">
                <label>Địa chỉ:</label>
                <span>{kycData.address}</span>
              </div>
              <div className="info-row">
                <label>Quốc tịch:</label>
                <span>{kycData.nationality || "Việt Nam"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
