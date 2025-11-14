import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  ABI as CONTRACT_ABI,
} from "../blockchain/MotorbikeNFT";
import "./NFTDetail.css";

const NFTDetail = () => {
  const { tokenId } = useParams();
  const [nft, setNft] = useState(null);
  const [ownershipHistory, setOwnershipHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  // Use userAddress to avoid eslint warning
  console.log("Current user address:", userAddress);

  useEffect(() => {
    loadNFTDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId]);

  const loadNFTDetail = async () => {
    try {
      setLoading(true);

      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const userAddr = accounts.length > 0 ? accounts[0] : "";
        setUserAddress(userAddr);

        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          provider
        );

        // Lấy thông tin NFT
        const nftData = await contract.getMotorbike(tokenId);
        const owner = await contract.ownerOf(tokenId);
        let isLocked = false;
        let lockReason = "";
        try {
          isLocked = await contract.locked(tokenId);
          if (isLocked) lockReason = await contract.lockReason(tokenId);
        } catch (lockErr) {
          // ignore if older contract
        }

        setNft({
          tokenId: tokenId,
          vin: nftData.vin,
          engineNumber: nftData.engineNumber,
          model: nftData.model,
          color: nftData.color,
          year: nftData.year.toString(),
          currentOwner: owner,
          locked: isLocked,
          lockReason: lockReason,
        });

        // Kiểm tra quyền sở hữu
        setIsOwner(owner.toLowerCase() === userAddr.toLowerCase());

        // Lấy lịch sử chuyển quyền
        await loadOwnershipHistory(provider, contract, tokenId);
      }
    } catch (error) {
      console.error("Lỗi load NFT detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOwnershipHistory = async (provider, contract, tokenId) => {
    try {
      // Lấy tất cả Transfer events cho tokenId này
      const filter = contract.filters.Transfer(null, null, tokenId);
      const events = await contract.queryFilter(filter);

      const history = [];

      for (let event of events) {
        const block = await provider.getBlock(event.blockNumber);
        const timestamp = new Date(block.timestamp * 1000);

        history.push({
          from: event.args.from,
          to: event.args.to,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: timestamp,
        });
      }

      // Sắp xếp theo thời gian (cũ nhất trước)
      history.sort((a, b) => a.blockNumber - b.blockNumber);
      setOwnershipHistory(history);
    } catch (error) {
      console.error("Lỗi load ownership history:", error);
    }
  };

  const formatAddress = (address) => {
    if (address === ethers.ZeroAddress) return "Mint (Tạo mới)";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date) => {
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Đã copy địa chỉ!");
  };

  if (loading) {
    return (
      <div className="nft-detail-loading">
        <div className="spinner"></div>
        <p>Đang tải thông tin NFT...</p>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="nft-not-found">
        <div className="not-found-icon">❌</div>
        <h2>NFT không tồn tại</h2>
        <p>NFT với ID #{tokenId} không được tìm thấy</p>
        <Link to="/" className="back-btn">
          ← Quay về Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="nft-detail">
      <div className="nft-detail-header">
        <h1>🏍️ Chi tiết NFT #{tokenId}</h1>
        <div className="ownership-status">
          {isOwner ? (
            <span className="owner-badge">✅ Bạn là chủ sở hữu</span>
          ) : (
            <span className="not-owner-badge">👁️ Chế độ xem</span>
          )}
          {nft.locked && (
            <span
              className="locked-badge"
              title={nft.lockReason || "NFT đã khóa"}
            >
              🔒 Đã khóa
            </span>
          )}
        </div>
      </div>

      <div className="nft-content">
        <div className="nft-info-section">
          <div className="nft-card-main">
            <div className="nft-card-header">
              <span className="nft-id">#{tokenId}</span>
              <span className="nft-year">{nft.year}</span>
            </div>

            <div className="nft-card-body">
              <h2 className="nft-model">{nft.model}</h2>

              <div className="nft-specifications">
                <div className="spec-item">
                  <div className="spec-icon">🆔</div>
                  <div className="spec-content">
                    <span className="spec-label">Số khung (VIN)</span>
                    <span className="spec-value">{nft.vin}</span>
                  </div>
                </div>

                <div className="spec-item">
                  <div className="spec-icon">⚙️</div>
                  <div className="spec-content">
                    <span className="spec-label">Số máy</span>
                    <span className="spec-value">{nft.engineNumber}</span>
                  </div>
                </div>

                <div className="spec-item">
                  <div className="spec-icon">🎨</div>
                  <div className="spec-content">
                    <span className="spec-label">Màu sắc</span>
                    <span className="spec-value">{nft.color}</span>
                  </div>
                </div>

                <div className="spec-item">
                  <div className="spec-icon">📅</div>
                  <div className="spec-content">
                    <span className="spec-label">Năm sản xuất</span>
                    <span className="spec-value">{nft.year}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="current-owner-section">
            <h3>👤 Chủ sở hữu hiện tại</h3>
            <div className="owner-card">
              <div className="owner-address">
                <span className="address-text">{nft.currentOwner}</span>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(nft.currentOwner)}
                >
                  📋
                </button>
              </div>
              {isOwner && !nft.locked && (
                <div className="owner-actions">
                  <Link
                    to={`/user/sell/${tokenId}`}
                    className="action-btn sell"
                  >
                    💸 Chuyển nhượng xe này
                  </Link>
                  <Link
                    to={`/user/list/${tokenId}`}
                    className="action-btn list"
                  >
                    🏪 Đăng bán
                  </Link>
                </div>
              )}
              {isOwner && nft.locked && (
                <div className="owner-actions">
                  <button
                    className="action-btn disabled"
                    disabled
                    title={nft.lockReason || "NFT đã khóa"}
                  >
                    🔒 NFT đã khóa
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ownership-history-section">
          <h3>📜 Lịch sử sở hữu</h3>
          <div className="history-timeline">
            {ownershipHistory.map((record, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-marker">
                  <div className="marker-dot"></div>
                  {index < ownershipHistory.length - 1 && (
                    <div className="marker-line"></div>
                  )}
                </div>

                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-date">
                      {formatDate(record.timestamp)}
                    </span>
                    <span className="timeline-block">
                      Block #{record.blockNumber}
                    </span>
                  </div>

                  <div className="timeline-transfer">
                    <div className="transfer-from">
                      <span className="transfer-label">Từ:</span>
                      <span className="transfer-address">
                        {formatAddress(record.from)}
                      </span>
                    </div>
                    <div className="transfer-arrow">→</div>
                    <div className="transfer-to">
                      <span className="transfer-label">Đến:</span>
                      <span className="transfer-address">
                        {formatAddress(record.to)}
                      </span>
                    </div>
                  </div>

                  <div className="timeline-hash">
                    <span className="hash-label">TX:</span>
                    <span className="hash-value">
                      {record.transactionHash.slice(0, 10)}...
                    </span>
                    <button
                      className="copy-btn small"
                      onClick={() => copyToClipboard(record.transactionHash)}
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="nft-detail-footer">
        <Link to="/my-nfts" className="back-btn">
          ← NFT của tôi
        </Link>
        <Link to="/" className="home-btn">
          🏠 Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NFTDetail;
