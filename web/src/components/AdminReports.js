import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  ABI as CONTRACT_ABI,
} from "../blockchain/MotorbikeNFT";
import "./AdminReports.css"; // Đảm bảo CSS đúng

const AdminReports = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminAddress, setAdminAddress] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [pending, setPending] = useState({});
  const [noteMap, setNoteMap] = useState({});

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      setLoading(true);
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (!accounts.length) return;

      const user = accounts[0];
      setAdminAddress(user);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      const owner = await contract.owner();
      const isOwner = owner.toLowerCase() === user.toLowerCase();
      setIsAdmin(isOwner);

      if (isOwner) loadReports();
    } catch (err) {
      console.error("Init error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      setLoadingReports(true);
      const res = await fetch("/api/reports");
      const list = await res.json();

      setReports(
        (list || []).map((r) => ({
          ...r,
          resolved: r.status === "resolved",
        }))
      );
    } catch (err) {
      console.error("Load report error:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  const sendReply = async (id) => {
    try {
      setPending((p) => ({ ...p, ["report_" + id]: true }));

      const note = noteMap[id]?.trim() || "Phản hồi từ admin";

      await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          adminNote: note,
          resolvedBy: adminAddress,
        }),
      });

      await loadReports();
      setNoteMap((m) => ({ ...m, [id]: "" }));

      alert(`Đã phản hồi báo cáo #${id}`);
    } catch (err) {
      alert("Lỗi xử lý báo cáo");
    } finally {
      setPending((p) => ({ ...p, ["report_" + id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="admin-reports loading-page">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-reports denied">
        <div className="denied-card">
          <h2>🚫 Bạn không có quyền truy cập</h2>
          <Link to="/admin" className="btn-back">
            ← Quay về Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-reports">
      {/* Top bar */}
      <div className="reports-topbar">
        <Link to="/admin" className="top-btn back">
          ← Quay lại Admin Dashboard
        </Link>
        <button className="top-btn refresh" onClick={loadReports}>
          🔄 Làm mới
        </button>
      </div>

      {/* Header */}
      <div className="reports-header-card">
        <div className="reports-title">
          <span className="title-icon">📢</span>
          <div>
            <h1>Báo cáo từ người dùng</h1>
            <p>Theo dõi và xử lý các phản hồi từ hệ thống.</p>
          </div>
        </div>

        <div className="admin-wallet-box">
          <div className="label">Admin</div>
          <div className="address">
            {adminAddress.slice(0, 8)}...{adminAddress.slice(-4)}
          </div>
          <div className="status">
            <span></span> Verified
          </div>
        </div>
      </div>

      {/* Report List */}
      <div className="reports-list-wrapper">
        {loadingReports ? (
          <div className="loading-reports">
            <div className="spinner"></div> Đang tải...
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-box">Chưa có báo cáo nào.</div>
        ) : (
          <div className="reports-list">
            {reports.map((r) => (
              <div
                key={r.id}
                className={`report-card ${r.resolved ? "resolved" : "pending"}`}
              >
                <div className="report-card-header">
                  <span className="rid">#R{r.id}</span>
                  {r.tokenId && <span className="rtoken">NFT #{r.tokenId}</span>}
                  <span className={`rstatus ${r.resolved ? "ok" : "wait"}`}>
                    {r.resolved ? "Đã xử lý" : "Chưa xử lý"}
                  </span>
                </div>

                <div className="report-card-body">
                  <p>
                    <strong>Danh mục: </strong>
                    {r.category}
                  </p>
                  {r.subject && (
                    <p>
                      <strong>Tiêu đề: </strong>
                      {r.subject}
                    </p>
                  )}
                  <p>
                    <strong>Nội dung: </strong>
                    {r.message}
                  </p>

                  {r.contact?.email && (
                    <p>
                      <strong>Email: </strong> {r.contact.email}
                    </p>
                  )}

                  <p>
                    <strong>Thời gian: </strong>
                    {new Date(r.createdAt).toLocaleString("vi-VN")}
                  </p>

                  {r.resolved && (
                    <div className="admin-note-box">
                      <strong>Phản hồi admin: </strong>
                      <div>{r.adminNote || "(Không có ghi chú)"}</div>
                    </div>
                  )}
                </div>

                {!r.resolved && (
                  <div className="report-actions">
                    <textarea
                      placeholder="Nhập ghi chú gửi người dùng..."
                      value={noteMap[r.id] || ""}
                      onChange={(e) =>
                        setNoteMap((m) => ({ ...m, [r.id]: e.target.value }))
                      }
                    />

                    <button
                      className="btn-send"
                      disabled={pending["report_" + r.id]}
                      onClick={() => sendReply(r.id)}
                    >
                      📨 Gửi phản hồi
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
