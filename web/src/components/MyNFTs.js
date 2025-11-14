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
    <div className="my-nfts">
      <div className="my-nfts-header">
        <h1>🏍️ NFT của tôi</h1>
        <div className="header-info">
          <div className="user-info">
            <span className="user-label">Địa chỉ ví:</span>
            <span className="user-address">
              {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
            </span>
          </div>
          <div className="nft-count">
            <span className="count-number">{myNFTs.length}</span>
            <span className="count-label">NFT sở hữu</span>
          </div>
        </div>
      </div>

      {myNFTs.length === 0 ? (
        <div className="no-nfts">
          <div className="no-nfts-icon">🏍️</div>
          <h3>Bạn chưa sở hữu NFT nào</h3>
          <p>Hãy đăng ký xe hoặc mua NFT từ người khác để bắt đầu</p>
          <div className="no-nfts-actions">
            <Link to="/register" className="action-btn primary">
              Đăng ký xe mới
            </Link>
            <Link to="/all-nfts" className="action-btn secondary">
              Xem tất cả NFT
            </Link>
          </div>
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
  );
};

export default MyNFTs;
