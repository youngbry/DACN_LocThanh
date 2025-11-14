import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  ABI as CONTRACT_ABI,
} from "../blockchain/MotorbikeNFT";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (error) {
      console.error("Lỗi kết nối:", error);
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

      // Get total supply
      const totalSupply = await contract.totalSupply();

      // Find NFTs owned by user
      const userNFTs = [];

      for (let i = 0; i < totalSupply; i++) {
        try {
          const owner = await contract.ownerOf(i);
          if (owner.toLowerCase() === userAddr.toLowerCase()) {
            const nftData = await contract.getMotorbike(i);

            // Get transfer history
            const transferEvents = await contract.queryFilter(
              contract.filters.Transfer(null, null, i)
            );

            // Sort by block number
            const sortedTransfers = transferEvents.sort(
              (a, b) => a.blockNumber - b.blockNumber
            );

            // Get block timestamps for transfer history
            const transferHistory = [];
            for (const transfer of sortedTransfers) {
              const block = await provider.getBlock(transfer.blockNumber);
              transferHistory.push({
                from: transfer.args.from,
                to: transfer.args.to,
                blockNumber: transfer.blockNumber,
                timestamp: new Date(block.timestamp * 1000),
                transactionHash: transfer.transactionHash,
              });
            }

            userNFTs.push({
              tokenId: i,
              vin: nftData.vin,
              engineNumber: nftData.engineNumber,
              model: nftData.model,
              color: nftData.color,
              year: nftData.year.toString(),
              owner: owner,
              transferHistory: transferHistory,
              transferCount: transferHistory.length,
            });
          }
        } catch (error) {
          console.log(`Token ${i} không tồn tại hoặc lỗi:`, error.message);
        }
      }

      setMyNFTs(userNFTs);
      setStats({
        myNFTCount: userNFTs.length,
        totalSystemNFTs: Number(totalSupply),
      });
    } catch (error) {
      console.error("Lỗi load NFTs:", error);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        await connectAndLoadData();
      } else {
        alert("Vui lòng cài đặt Rabby hoặc MetaMask!");
      }
    } catch (error) {
      console.error("Lỗi kết nối ví:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="user-dashboard">
        <div className="dashboard-header">
          <button
            onClick={() => window.history.back()}
            className="back-btn"
            title="Quay lại"
          >
            ← Quay lại
          </button>
        </div>
        <div className="user-connect">
          <div className="connect-card">
            <h1>👤 User Dashboard</h1>
            <p>Kết nối ví để xem NFT xe máy của bạn</p>
            <button className="connect-btn" onClick={connectWallet}>
              Kết nối ví của tôi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
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
        {/* Modern Header */}
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
                background: "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              🏍️ Motorbike NFT Platform
            </h1>
            <p
              style={{
                color: "#64748b",
                fontSize: "1.125rem",
                margin: 0,
              }}
            >
              Nền tảng quản lý và giao dịch NFT xe máy hiện đại
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                textTransform: "uppercase",
                fontWeight: "600",
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
                color: "#1e293b",
                background: "#f1f5f9",
                padding: "0.5rem",
                borderRadius: "8px",
                marginBottom: "0.5rem",
              }}
            >
              {userAddress.slice(0, 8)}...{userAddress.slice(-6)}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#059669",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#059669",
                  animation: "pulse 2s infinite",
                }}
              ></div>
              Online
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              textAlign: "center",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏍️</div>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: "800",
                color: "#2563eb",
                marginBottom: "0.5rem",
              }}
            >
              {stats.myNFTCount}
            </div>
            <div
              style={{
                color: "#64748b",
                fontWeight: "600",
                textTransform: "uppercase",
                fontSize: "0.875rem",
                letterSpacing: "0.5px",
              }}
            >
              NFT của tôi
            </div>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              textAlign: "center",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌐</div>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: "800",
                color: "#2563eb",
                marginBottom: "0.5rem",
              }}
            >
              {stats.totalSystemNFTs}
            </div>
            <div
              style={{
                color: "#64748b",
                fontWeight: "600",
                textTransform: "uppercase",
                fontSize: "0.875rem",
                letterSpacing: "0.5px",
              }}
            >
              Tổng NFT hệ thống
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.875rem",
              fontWeight: "700",
              color: "#1e293b",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            Thao tác nhanh
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <Link
              to="/my-nfts"
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "2rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                border: "2px solid transparent",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-4px)";
                e.target.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.1)";
                e.target.style.borderColor = "#2563eb";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "none";
                e.target.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.05)";
                e.target.style.borderColor = "transparent";
              }}
            >
              <div style={{ fontSize: "3rem", flexShrink: 0 }}>�️</div>
              <div>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: "0.5rem",
                  }}
                >
                  NFT của tôi
                </h3>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "0.875rem",
                    lineHeight: "1.6",
                    margin: 0,
                  }}
                >
                  Xem và quản lý các NFT xe máy bạn sở hữu
                </p>
              </div>
            </Link>

            <Link
              to="/marketplace"
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "2rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                border: "2px solid transparent",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-4px)";
                e.target.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.1)";
                e.target.style.borderColor = "#2563eb";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "none";
                e.target.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.05)";
                e.target.style.borderColor = "transparent";
              }}
            >
              <div style={{ fontSize: "3rem", flexShrink: 0 }}>🛒</div>
              <div>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: "0.5rem",
                  }}
                >
                  Chợ NFT
                </h3>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "0.875rem",
                    lineHeight: "1.6",
                    margin: 0,
                  }}
                >
                  Mua bán và khám phá các NFT xe máy
                </p>
              </div>
            </Link>

            {/* Admin quick action removed for user-facing page */}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "300px",
              color: "#64748b",
            }}
          >
            <div
              style={{
                width: "3rem",
                height: "3rem",
                border: "3px solid #e2e8f0",
                borderTop: "3px solid #2563eb",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginBottom: "1rem",
              }}
            ></div>
            <div
              style={{
                fontSize: "1.125rem",
                fontWeight: "500",
              }}
            >
              Đang tải dữ liệu...
            </div>
          </div>
        ) : myNFTs.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "#64748b",
            }}
          >
            <div style={{ fontSize: "5rem", marginBottom: "1.5rem" }}>🏍️</div>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: "800",
                color: "#1e293b",
                marginBottom: "1rem",
              }}
            >
              Bạn chưa có NFT nào
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: "1rem",
                lineHeight: "1.6",
                marginBottom: "2rem",
              }}
            >
              Khám phá chợ NFT để mua các NFT xe máy.
            </p>
          </div>
        ) : (
          <div>
            <h2
              style={{
                fontSize: "1.875rem",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              NFT của tôi ({myNFTs.length})
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {myNFTs.map((nft, index) => (
                <div
                  key={index}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                    border: "2px solid transparent",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      background:
                        "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "4rem",
                      color: "white",
                    }}
                  >
                    🏍️
                  </div>

                  <div style={{ padding: "1.5rem" }}>
                    <h3
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: "700",
                        color: "#1e293b",
                        marginBottom: "1rem",
                      }}
                    >
                      {nft.model} ({nft.year})
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.875rem",
                        }}
                      >
                        <span style={{ color: "#64748b" }}>VIN:</span>
                        <span style={{ fontWeight: "500", color: "#1e293b" }}>
                          {nft.vin}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.875rem",
                        }}
                      >
                        <span style={{ color: "#64748b" }}>Số máy:</span>
                        <span style={{ fontWeight: "500", color: "#1e293b" }}>
                          {nft.engineNumber}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.875rem",
                        }}
                      >
                        <span style={{ color: "#64748b" }}>Màu:</span>
                        <span style={{ fontWeight: "500", color: "#1e293b" }}>
                          {nft.color}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                      }}
                    >
                      <Link
                        to={`/user/nft/${nft.tokenId}`}
                        style={{
                          flex: 1,
                          padding: "0.75rem",
                          background: "#2563eb",
                          color: "white",
                          textDecoration: "none",
                          borderRadius: "8px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "0.875rem",
                          transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = "#1d4ed8";
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = "#2563eb";
                        }}
                      >
                        Chi tiết
                      </Link>
                      <Link
                        to={`/user/sell/${nft.tokenId}`}
                        style={{
                          flex: 1,
                          padding: "0.75rem",
                          background: "#f8fafc",
                          color: "#64748b",
                          textDecoration: "none",
                          borderRadius: "8px",
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "0.875rem",
                          border: "1px solid #e2e8f0",
                          transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = "#e2e8f0";
                          e.target.style.color = "#1e293b";
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = "#f8fafc";
                          e.target.style.color = "#64748b";
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
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .grid-responsive { grid-template-columns: 1fr !important; }
        }
      `,
        }}
      />
    </div>
  );
};

export default UserDashboard;
