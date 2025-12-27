import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  ABI as CONTRACT_ABI,
} from "../blockchain/MotorbikeNFT";
import { getKycStatus } from "../utils/kycUtils";
import "./NFTDetail.css";

const NFTDetail = () => {
  const { tokenId } = useParams();

  const [nft, setNft] = useState(null);
  const [ownershipHistory, setOwnershipHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userAddress, setUserAddress] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const [tokenReports, setTokenReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    loadNFTDetail();
    // eslint-disable-next-line
  }, [tokenId]);

  // ================================
  // LOAD NFT DETAILS
  // ================================
  const loadNFTDetail = async () => {
    try {
      setLoading(true);

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const userAddr = accounts[0];
        setUserAddress(userAddr);

        const status = await getKycStatus(userAddr);
        setKycStatus(status);

        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          provider
        );

        // Fetch NFT Info
        const data = await contract.getMotorbike(tokenId);
        const owner = await contract.ownerOf(tokenId);

        let locked = false;
        let lockReason = "";

        try {
          locked = await contract.locked(tokenId);
          if (locked) lockReason = await contract.lockReason(tokenId);
        } catch {}

        setNft({
          tokenId,
          vin: data.vin,
          engineNumber: data.engineNumber,
          model: data.model,
          color: data.color,
          year: data.year.toString(),
          currentOwner: owner,
          locked,
          lockReason,
        });

        setIsOwner(owner.toLowerCase() === userAddr.toLowerCase());

        if (locked) {
          fetchTokenReports(tokenId);
        }

        await loadOwnershipHistory(provider, contract, tokenId);
      }
    } catch (err) {
      console.error("Error loading NFT:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // LOAD TRANSFER HISTORY
  // ================================
  const loadOwnershipHistory = async (provider, contract, tokenId) => {
    try {
      const filter = contract.filters.Transfer(null, null, tokenId);
      const events = await contract.queryFilter(filter);

      const formatted = [];

      for (let ev of events) {
        const block = await provider.getBlock(ev.blockNumber);

        formatted.push({
          from: ev.args.from,
          to: ev.args.to,
          timestamp: new Date(block.timestamp * 1000),
          blockNumber: ev.blockNumber,
          tx: ev.transactionHash,
        });
      }

      formatted.sort((a, b) => a.blockNumber - b.blockNumber);

      setOwnershipHistory(formatted);
    } catch (err) {
      console.error("History load error:", err);
    }
  };

  // ================================
  // REPORT MANAGEMENT
  // ================================
  const fetchTokenReports = async (tid) => {
    try {
      setLoadingReports(true);
      const res = await fetch("/api/reports");
      const data = await res.json();

      const filtered = data
        .filter(
          (r) => String(r.tokenId) === String(tid) && r.category === "unlock"
        )
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === "open" ? -1 : 1;
          return b.createdAt - a.createdAt;
        });

      setTokenReports(filtered);
    } catch (err) {
      console.warn("Report load error:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return;

    try {
      setSubmittingReport(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const wallet = accounts[0];

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "unlock",
          tokenId,
          subject: `Request unlock NFT #${tokenId}`,
          message: reportReason,
          wallet,
        }),
      });

      const info = await res.json();

      setReportMessage(`✅ Gửi báo cáo thành công (#R${info.id})`);
      setReportReason("");
      fetchTokenReports(tokenId);
    } catch (err) {
      setReportMessage("❌ Lỗi gửi báo cáo");
    } finally {
      setSubmittingReport(false);
    }
  };

  const formatAddr = (a) =>
    a === ethers.ZeroAddress ? "Mint" : `${a.slice(0, 6)}...${a.slice(-4)}`;

  const formatDate = (d) =>
    d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // ================================
  // UI RENDER
  // ================================
  if (loading)
    return (
      <div className="nftdetail-loading">
        <div className="spinner"></div>
        <p>Đang tải chi tiết NFT...</p>
      </div>
    );

  if (!nft)
    return (
      <div className="nftdetail-notfound">
        <h2>❌ NFT không tồn tại</h2>
        <Link to="/" className="back-btn">
          ← Về Dashboard
        </Link>
      </div>
    );

  return (
    <div className="nftdetail-container">
      {/* HEADER */}
      <div className="nftdetail-header glass-box">
        <div>
          <h1 className="title">🏍️ NFT #{tokenId}</h1>
          <p className="subtitle">Thông tin chi tiết xe máy NFT</p>
        </div>

        <div className="nft-badges">
          {isOwner ? (
            <span className="badge owner">✔ Chủ sở hữu</span>
          ) : (
            <span className="badge viewer">👁 Xem</span>
          )}
          {nft.locked && <span className="badge locked">🔒 Đã khóa</span>}
        </div>
      </div>

      {/* MAIN INFO */}
      <div className="nftdetail-grid">
        <div className="nft-main glass-box">
          <div className="nft-banner">🏍️</div>

          <h2 className="nft-model">{nft.model}</h2>

          <div className="spec-list">
            <div className="spec">
              <span className="spec-label">🚘 VIN</span>
              <span className="spec-value">{nft.vin}</span>
            </div>
            <div className="spec">
              <span className="spec-label">⚙ Số máy</span>
              <span className="spec-value">{nft.engineNumber}</span>
            </div>
            <div className="spec">
              <span className="spec-label">🎨 Màu sắc</span>
              <span className="spec-value">{nft.color}</span>
            </div>
            <div className="spec">
              <span className="spec-label">📅 Năm SX</span>
              <span className="spec-value">{nft.year}</span>
            </div>
          </div>
        </div>

        {/* OWNER */}
        <div className="owner-box glass-box">
          <h3>👤 Chủ sở hữu</h3>

          <div className="owner-address">
            <span>{nft.currentOwner}</span>
          </div>

          <div className="owner-actions">
            {isOwner && !nft.locked && (
              <>
                <Link
                  className="btn primary"
                  to={`/user/sell/${tokenId}`}
                  onClick={(e) => {
                    if (kycStatus !== "verified") {
                      e.preventDefault();
                      alert(
                        "Bạn cần xác thực tài khoản (eKYC) trước khi thực hiện giao dịch này!"
                      );
                    }
                  }}
                >
                  💸 Chuyển nhượng
                </Link>
                <Link
                  className="btn secondary"
                  to={`/user/list/${tokenId}`}
                  onClick={(e) => {
                    if (kycStatus !== "verified") {
                      e.preventDefault();
                      alert(
                        "Bạn cần xác thực tài khoản (eKYC) trước khi thực hiện giao dịch này!"
                      );
                    }
                  }}
                >
                  🏪 Đăng bán
                </Link>
              </>
            )}

            {isOwner && nft.locked && (
              <button
                className="btn warning"
                onClick={() => setShowReportForm(true)}
              >
                📢 Gửi yêu cầu mở khóa
              </button>
            )}
          </div>

          {/* REPORT LIST */}
          {nft.locked && (
            <div className="report-panel">
              <h4>📢 Yêu cầu mở khóa</h4>

              {loadingReports ? (
                <p>Đang tải...</p>
              ) : tokenReports.length === 0 ? (
                <p>Chưa có báo cáo nào</p>
              ) : (
                tokenReports.map((r) => (
                  <div key={r.id} className="report-item glass-thin">
                    <div className="report-top">
                      <span className="rid">#R{r.id}</span>
                      <span className={`r-status ${r.status}`}>
                        {r.status === "open" ? "⏳ Chờ xử lý" : "✔ Đã xử lý"}
                      </span>
                    </div>
                    <p>{r.message}</p>
                    <div className="r-meta">
                      <span>{new Date(r.createdAt).toLocaleString()}</span>
                      {r.adminNote && (
                        <span className="admin-note">
                          Phản hồi: {r.adminNote}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* HISTORY */}
      <div className="history glass-box">
        <h3>📜 Lịch sử sở hữu</h3>

        <div className="timeline">
          {ownershipHistory.map((h, i) => (
            <div className="timeline-item" key={i}>
              <div className="dot"></div>

              <div className="timeline-content">
                <div className="time-header">
                  <span>{formatDate(h.timestamp)}</span>
                  <span className="block">Block #{h.blockNumber}</span>
                </div>

                <div className="transfer">
                  <span>{formatAddr(h.from)}</span> →{" "}
                  <span>{formatAddr(h.to)}</span>
                </div>

                <div className="tx">TX: {h.tx.slice(0, 10)}...</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="nftdetail-footer">
        <Link to="/my-nfts" className="btn back">
          ← NFT của tôi
        </Link>
        <Link to="/" className="btn home">
          🏠 Dashboard
        </Link>
      </div>

      {/* REPORT MODAL */}
      {showReportForm && (
        <div className="modal-overlay">
          <div className="modal glass-box">
            <h3>📢 Gửi yêu cầu mở khóa NFT #{tokenId}</h3>

            <textarea
              placeholder="Nhập lý do..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />

            <div className="modal-actions">
              <button
                className="btn secondary"
                onClick={() => {
                  setShowReportForm(false);
                  setReportMessage("");
                }}
              >
                Hủy
              </button>
              <button
                className="btn primary"
                disabled={!reportReason.trim()}
                onClick={submitReport}
              >
                Gửi
              </button>
            </div>

            {reportMessage && <p className="report-status">{reportMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTDetail;
