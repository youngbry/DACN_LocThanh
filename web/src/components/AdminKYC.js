import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  ABI as CONTRACT_ABI,
} from "../blockchain/MotorbikeNFT";
import "./AdminKYC.css";

const AdminKYC = () => {
  const [kycRequests, setKycRequests] = useState([]);
  const [expandedId, setExpandedId] = useState(null); // Changed from selectedRequest to expandedId
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [zoomedImage, setZoomedImage] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    fetchKycRequests();
  }, []);

  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLocked]);

  const handleMouseEnter = (src) => {
    if (!isLocked) {
      setZoomedImage(src);
    }
  };

  const handleMouseLeave = () => {
    if (!isLocked) {
      setZoomedImage(null);
    }
  };

  const handleImageClick = (src) => {
    setZoomedImage(src);
    setIsLocked(true);
    setZoomScale(1);
  };

  const handleOverlayClick = () => {
    setIsLocked(false);
    setZoomedImage(null);
    setZoomScale(1);
  };

  const handleZoomWheel = (e) => {
    if (!isLocked) return;
    const delta = -e.deltaY * 0.001;
    setZoomScale((prev) => Math.min(Math.max(1, prev + delta), 5));
  };

  const fetchKycRequests = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/kyc/requests?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setKycRequests(data);
      }
    } catch (error) {
      console.error("Error fetching KYC requests:", error);
    }
  };

  // Filter and sort requests
  const filteredRequests = kycRequests
    .filter((req) => {
      const matchesStatus =
        filterStatus === "all" || req.status === filterStatus;
      const matchesSearch =
        searchTerm === "" ||
        req.walletAddress.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by createdAt descending (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setShowRejectInput(false);
      setMessage("");
    } else {
      setExpandedId(id);
      setShowRejectInput(false);
      setMessage("");
    }
  };

  const handleApproveKYC = async (request) => {
    try {
      setLoading(true);
      setMessage("Đang thực hiện xác thực trên Blockchain...");

      const { walletAddress, id: requestId } = request;

      if (typeof window.ethereum === "undefined")
        throw new Error("Ví không khả dụng");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // 1. Gọi Smart Contract
      const tx = await contract.verifyUser(walletAddress, true);
      await tx.wait();

      // 2. Cập nhật Backend
      const response = await fetch(`http://localhost:4000/api/kyc/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, requestId }),
      });

      if (!response.ok) throw new Error("Lỗi cập nhật backend");

      setMessage("✅ Xác thực KYC thành công!");
      
      // Update local state immediately
      setKycRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "verified" } : req
        )
      );
    } catch (error) {
      console.error("KYC Approval Error:", error);
      setMessage("❌ Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectKYC = async (request) => {
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      setLoading(true);
      const { walletAddress, id: requestId } = request;
      const response = await fetch(`http://localhost:4000/api/kyc/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          reason: rejectReason,
          requestId,
        }),
      });

      if (!response.ok) throw new Error("Lỗi cập nhật backend");

      setMessage("🚫 Đã từ chối yêu cầu KYC");
      
      // Update local state immediately
      setKycRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "rejected", rejectReason: rejectReason } : req
        )
      );

      setShowRejectInput(false);
      setRejectReason("");
    } catch (error) {
      console.error("KYC Reject Error:", error);
      setMessage("❌ Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to ensure image source is valid
  const getImageSrc = (imgData) => {
    if (!imgData) return "https://via.placeholder.com/300x200?text=No+Image";
    // Handle dummy data from testing
    if (imgData.includes("stored_base64_")) {
      return "https://via.placeholder.com/300x200?text=Demo+Image";
    }
    if (imgData.startsWith("data:image")) return imgData;
    // If it's a base64 string without prefix, add it (assuming jpeg)
    return `data:image/jpeg;base64,${imgData}`;
  };

  return (
    <div className="admin-kyc-management">
      <div className="management-header">
        <button onClick={() => window.history.back()} className="back-btn">
          ← Quay lại Dashboard
        </button>
        <h1>🪪 Quản lý yêu cầu KYC</h1>
        <div className="header-actions">
          <button onClick={fetchKycRequests} className="refresh-btn">
            🔄 Làm mới
          </button>
        </div>
      </div>

      <div className="control-bar">
        <div className="filter-group">
          <button
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            Tất cả
          </button>
          <button
            className={`filter-btn ${
              filterStatus === "pending" ? "active" : ""
            }`}
            onClick={() => setFilterStatus("pending")}
          >
            Chờ duyệt
          </button>
          <button
            className={`filter-btn ${
              filterStatus === "verified" ? "active" : ""
            }`}
            onClick={() => setFilterStatus("verified")}
          >
            Đã duyệt
          </button>
          <button
            className={`filter-btn ${
              filterStatus === "rejected" ? "active" : ""
            }`}
            onClick={() => setFilterStatus("rejected")}
          >
            Đã từ chối
          </button>
        </div>
        <div className="search-group">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm theo địa chỉ ví..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="admin-content">
        <div className="kyc-content-card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ví</th>
                  <th>Họ tên</th>
                  <th>Số CCCD</th>
                  <th>Điểm khớp</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "#94a3b8",
                      }}
                    >
                      Không có yêu cầu nào
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <React.Fragment key={req.id}>
                      <tr
                        className={expandedId === req.id ? "expanded-row" : ""}
                      >
                        <td>
                          <span
                            title={req.walletAddress}
                            style={{
                              fontFamily: "monospace",
                              color: "#6366f1",
                            }}
                          >
                            {req.walletAddress.substring(0, 6)}...
                            {req.walletAddress.substring(38)}
                          </span>
                        </td>
                        <td>{req.fullName}</td>
                        <td>{req.idNumber}</td>
                        <td>
                          <span
                            className={
                              req.matchScore > 80 ? "text-green" : "text-red"
                            }
                          >
                            {req.matchScore}%
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${req.status}`}>
                            {req.status === "pending"
                              ? "Chờ duyệt"
                              : req.status === "verified"
                              ? "Đã duyệt"
                              : "Đã từ chối"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="action-btn"
                            onClick={() => toggleExpand(req.id)}
                          >
                            {expandedId === req.id
                              ? "🔼 Thu gọn"
                              : "👁️ Chi tiết"}
                          </button>
                        </td>
                      </tr>
                      {expandedId === req.id && (
                        <tr className="detail-row">
                          <td colSpan="6">
                            <div className="detail-content">
                              <div className="kyc-detail-grid">
                                <div className="kyc-info">
                                  <h4>Thông tin cá nhân</h4>
                                  <p>
                                    <strong>Họ tên:</strong> {req.fullName}
                                  </p>
                                  <p>
                                    <strong>Số CCCD:</strong> {req.idNumber}
                                  </p>
                                  <p>
                                    <strong>Ngày sinh:</strong> {req.dob}
                                  </p>
                                  <p>
                                    <strong>Giới tính:</strong> {req.gender}
                                  </p>
                                  <p>
                                    <strong>Địa chỉ:</strong> {req.address}
                                  </p>
                                  <p>
                                    <strong>Ví:</strong> {req.walletAddress}
                                  </p>
                                  {req.status === "rejected" && (
                                    <p className="text-red">
                                      <strong>Lý do từ chối:</strong>{" "}
                                      {req.rejectReason}
                                    </p>
                                  )}
                                </div>

                                <div className="kyc-actions">
                                  <h4>Hành động</h4>
                                  {req.status === "pending" ? (
                                    <div className="action-buttons">
                                      {!showRejectInput ? (
                                        <>
                                          <button
                                            className="approve-btn"
                                            onClick={() =>
                                              handleApproveKYC(req)
                                            }
                                            disabled={loading}
                                          >
                                            ✅ Duyệt
                                          </button>
                                          <button
                                            className="reject-btn"
                                            onClick={() =>
                                              setShowRejectInput(true)
                                            }
                                            disabled={loading}
                                          >
                                            🚫 Từ chối
                                          </button>
                                        </>
                                      ) : (
                                        <div className="reject-form">
                                          <input
                                            type="text"
                                            placeholder="Nhập lý do từ chối..."
                                            value={rejectReason}
                                            onChange={(e) =>
                                              setRejectReason(e.target.value)
                                            }
                                            className="reject-input"
                                          />
                                          <div className="reject-actions">
                                            <button
                                              className="confirm-reject-btn"
                                              onClick={() =>
                                                handleRejectKYC(req)
                                              }
                                              disabled={loading}
                                            >
                                              Xác nhận từ chối
                                            </button>
                                            <button
                                              className="cancel-btn"
                                              onClick={() =>
                                                setShowRejectInput(false)
                                              }
                                            >
                                              Hủy
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div
                                      className={`status-badge ${req.status}`}
                                      style={{
                                        width: "100%",
                                        textAlign: "center",
                                        padding: "15px",
                                      }}
                                    >
                                      {req.status === "verified"
                                        ? "Đã duyệt thành công"
                                        : "Đã từ chối"}
                                    </div>
                                  )}
                                  {message && (
                                    <div className="message">{message}</div>
                                  )}
                                </div>
                              </div>

                              <div className="images-section">
                                <h3>Hình ảnh xác thực</h3>
                                <div className="images-grid">
                                  <div className="image-card">
                                    <span>Mặt trước CCCD</span>
                                    <img
                                      src={getImageSrc(req.images?.idCardFront)}
                                      alt="Front"
                                      onMouseEnter={() =>
                                        handleMouseEnter(
                                          getImageSrc(req.images?.idCardFront)
                                        )
                                      }
                                      onMouseLeave={handleMouseLeave}
                                      onClick={() =>
                                        handleImageClick(
                                          getImageSrc(req.images?.idCardFront)
                                        )
                                      }
                                      title="Click để phóng to"
                                    />
                                  </div>
                                  <div className="image-card">
                                    <span>Mặt sau CCCD</span>
                                    <img
                                      src={getImageSrc(req.images?.idCardBack)}
                                      alt="Back"
                                      onMouseEnter={() =>
                                        handleMouseEnter(
                                          getImageSrc(req.images?.idCardBack)
                                        )
                                      }
                                      onMouseLeave={handleMouseLeave}
                                      onClick={() =>
                                        handleImageClick(
                                          getImageSrc(req.images?.idCardBack)
                                        )
                                      }
                                      title="Click để phóng to"
                                    />
                                  </div>
                                  <div className="image-card">
                                    <span>Ảnh khuôn mặt (Selfie)</span>
                                    <img
                                      src={getImageSrc(req.images?.selfie)}
                                      alt="Selfie"
                                      onMouseEnter={() =>
                                        handleMouseEnter(
                                          getImageSrc(req.images?.selfie)
                                        )
                                      }
                                      onMouseLeave={handleMouseLeave}
                                      onClick={() =>
                                        handleImageClick(
                                          getImageSrc(req.images?.selfie)
                                        )
                                      }
                                      title="Click để phóng to"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {zoomedImage && (
        <div
          className={`zoom-overlay ${isLocked ? "locked" : ""}`}
          onClick={isLocked ? handleOverlayClick : undefined}
          onWheel={isLocked ? handleZoomWheel : undefined}
          style={{ pointerEvents: isLocked ? "auto" : "none" }}
        >
          <img
            src={zoomedImage}
            alt="Zoomed"
            style={{ transform: `scale(${zoomScale})` }}
          />
        </div>
      )}
    </div>
  );
};

export default AdminKYC;
