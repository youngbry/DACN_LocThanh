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
                  if (isLocked) lockReason = await contract.lockReason(i);
                } catch {}

                nftList.push({
                  tokenId: i,
                  vin: nft.vin,
                  engineNumber: nft.engineNumber,
                  model: nft.model,
                  color: nft.color,
                  year: nft.year.toString(),
                  locked: isLocked,
                  lockReason,
                });
              }
            } catch {}
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
    if (!window.ethereum) {
      alert("Vui lòng cài đặt MetaMask hoặc Rabby!");
      return;
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
    loadMyNFTs();
  };

  // Loading UI
  if (loading) {
    return (
      <div className="my-nfts-loading">
        <div className="spinner"></div>
        <p>Đang tải NFT của bạn...</p>
      </div>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className="my-nfts-connect">
        <div className="connect-card">
          <h2>🏍️ NFT của tôi</h2>
          <p>Kết nối ví để xem NFT bạn sở hữu</p>
          <button className="connect-btn" onClick={connectWallet}>
            Kết nối ví
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-nfts-container">

      {/* HEADER */}
      <div className="mynft-header">
        <div>
          <h1>🏍️ NFT của tôi</h1>
          <p>Danh sách tài sản NFT xe máy bạn đang sở hữu</p>
        </div>

        <div className="mynft-wallet">
          <div className="wallet-label">Ví đã kết nối</div>
          <div className="wallet-address">
            {userAddress.slice(0, 8)}...{userAddress.slice(-6)}
          </div>

          <div className="wallet-status">
            <span></span> Online
          </div>
        </div>
      </div>

      {/* NFT GRID */}
      {myNFTs.length === 0 ? (
        <div className="no-nfts">
          <div className="no-nfts-icon">🏍️</div>
          <h3>Bạn chưa sở hữu NFT nào</h3>
          <p>Hãy đăng ký xe hoặc mua NFT từ Marketplace.</p>
        </div>
      ) : (
        <div className="nfts-grid">
          {myNFTs.map((nft) => (
            <div className="nft-card" key={nft.tokenId}>

              <div className="nft-card-banner">
                🏍️
              </div>

              <div className="nft-card-content">
                <div className="nft-card-header">
                  <span className="nft-id">#{nft.tokenId}</span>
                  <span className="nft-year">{nft.year}</span>

                  {nft.locked && (
                    <span
                      className="nft-locked"
                      title={nft.lockReason || "NFT đang bị khóa"}
                    >
                      🔒 Locked
                    </span>
                  )}
                </div>

                <h3 className="nft-title">{nft.model}</h3>

                <div className="nft-details">
                  <div className="detail-row">
                    <span className="label">VIN</span>
                    <span className="value">{nft.vin}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Số máy</span>
                    <span className="value">{nft.engineNumber}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Màu</span>
                    <span className="value">{nft.color}</span>
                  </div>
                </div>

                <div className="nft-actions">
                  <Link
                    to={`/user/nft/${nft.tokenId}`}
                    className="nft-btn primary"
                  >
                    👁️ Chi tiết
                  </Link>

                  {!nft.locked ? (
                    <Link
                      to={`/user/sell/${nft.tokenId}`}
                      className="nft-btn secondary"
                    >
                      💸 Chuyển nhượng
                    </Link>
                  ) : (
                    <button className="nft-btn disabled" disabled>
                      🔒 Đã khóa
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mynft-footer">
        <button className="refresh-btn" onClick={loadMyNFTs}>
          🔄 Làm mới
        </button>
      </div>
    </div>
  );
};

export default MyNFTs;
