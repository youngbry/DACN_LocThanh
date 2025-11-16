import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  ABI as CONTRACT_ABI,
} from "../blockchain/MotorbikeNFT";
import "./MyNFTs.css";

const MyNFTs = () => {
  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    loadMyNFTs();
  }, []);

  const loadMyNFTs = async () => {
    try {
      setLoading(true);

      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);

        if (accounts.length > 0) {
          const userAddr = accounts[0];
          setUserAddress(userAddr);
          setIsConnected(true);

          const contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            provider
          );
          const totalSupply = await contract.totalSupply();

          const nftList = [];

          for (let i = 0; i < totalSupply; i++) {
            try {
              const owner = await contract.ownerOf(i);
              if (owner.toLowerCase() === userAddr.toLowerCase()) {
                const nft = await contract.getMotorbike(i);
                let isLocked = false;
                let lockReason = "";
                try {
                  isLocked = await contract.locked(i);
                  if (isLocked) {
                    lockReason = await contract.lockReason(i);
                  }
                } catch (lockErr) {
                  // ignore if contract version no lock
                }
                nftList.push({
                  tokenId: i,
                  vin: nft.vin,
                  engineNumber: nft.engineNumber,
                  model: nft.model,
                  color: nft.color,
                  year: nft.year.toString(),
                  owner: owner,
                  locked: isLocked,
                  lockReason: lockReason,
                });
              }
            } catch (error) {
              console.log(`Token ${i} không tồn tại`);
            }
          }

          setMyNFTs(nftList);
        }
      }
    } catch (error) {
      console.error("Lỗi load NFT:", error);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        loadMyNFTs();
      } else {
        alert("Vui lòng cài đặt Rabby hoặc MetaMask!");
      }
    } catch (error) {
      console.error("Lỗi kết nối ví:", error);
    }
  };

  if (loading) {
    return (
      <div className="my-nfts-loading">
        <div className="spinner"></div>
        <p>Đang tải NFT của bạn...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="my-nfts-connect">
        <div className="connect-card">
          <h2>🏍️ NFT của tôi</h2>
          <p>Kết nối ví để xem NFT thuộc sở hữu của bạn</p>
          <button className="connect-btn" onClick={connectWallet}>
            Kết nối ví
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e6f7fb 100%)",
        padding: "2rem 0",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 1.5rem",
        }}
      >
        <div className="my-nfts">
          {/* Header card styled like UserDashboard */}
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              marginBottom: "2rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1.5rem",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "800",
                  marginBottom: "0.5rem",
                  background:
                    "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                🏍️ NFT của tôi
              </h1>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "1.125rem",
                  margin: 0,
                }}
              >
                Danh sách NFT bạn đang sở hữu
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    marginBottom: "0.5rem",
                  }}
                >
                  Ví đã kết nối
                </div>
                <div
                  style={{
                    fontFamily: "Monaco, monospace",
                    fontSize: "0.875rem",
                    color: "#0f172a",
                    background: "#eef6fb",
                    padding: "0.5rem",
                    borderRadius: "8px",
                    marginBottom: "0.5rem",
                  }}
                >
                  {userAddress
                    ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
                    : "-"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#0ea5e9",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#0ea5e9",
                      animation: "pulse 2s infinite",
                    }}
                  ></div>
                  Online
                </div>
              </div>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "1rem 1.25rem",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                  border: "1px solid #e5e7eb",
                  minWidth: "110px",
                  textAlign: "center",
                }}
                title="Số NFT bạn sở hữu"
              >
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#0ea5e9",
                    lineHeight: 1,
                  }}
                >
                  {myNFTs.length}
                </div>
                <div
                  style={{
                    color: "#64748b",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  NFT sở hữu
                </div>
              </div>
            </div>
          </div>

          {myNFTs.length === 0 ? (
            <div className="no-nfts">
              <div className="no-nfts-icon">🏍️</div>
              <h3>Bạn chưa sở hữu NFT nào</h3>
              <p>Hãy đăng ký xe hoặc mua NFT từ người khác để bắt đầu</p>
            </div>
          ) : (
            <div className="nfts-grid">
              {myNFTs.map((nft) => (
                <div key={nft.tokenId} className="nft-card">
                  <div className="nft-card-header">
                    <span className="nft-id">#{nft.tokenId}</span>
                    <span className="nft-year">{nft.year}</span>
                    {nft.locked && (
                      <span
                        className="nft-locked"
                        title={nft.lockReason || "Đã khóa"}
                      >
                        🔒 Locked
                      </span>
                    )}
                  </div>

                  <div className="nft-card-body">
                    <h3 className="nft-model">{nft.model}</h3>

                    <div className="nft-details">
                      <div className="detail-item">
                        <span className="detail-label">VIN:</span>
                        <span className="detail-value">{nft.vin}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Số máy:</span>
                        <span className="detail-value">{nft.engineNumber}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Màu sắc:</span>
                        <span className="detail-value">{nft.color}</span>
                      </div>
                    </div>
                  </div>

                  <div className="nft-card-actions">
                    <Link
                      to={`/user/nft/${nft.tokenId}`}
                      className="action-btn view-detail"
                    >
                      👁️ Chi tiết
                    </Link>
                    {!nft.locked ? (
                      <Link
                        to={`/user/sell/${nft.tokenId}`}
                        className="action-btn sell"
                      >
                        💸 Chuyển nhượng xe
                      </Link>
                    ) : (
                      <button
                        className="action-btn disabled"
                        disabled
                        title={nft.lockReason || "NFT đã khóa"}
                      >
                        🔒 Đã khóa
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="my-nfts-footer">
            <button onClick={loadMyNFTs} className="refresh-btn">
              🔄 Làm mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyNFTs;
