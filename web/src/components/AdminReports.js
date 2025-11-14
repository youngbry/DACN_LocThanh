import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI as CONTRACT_ABI } from "../blockchain/MotorbikeNFT";
import "./AdminReports.css";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const init = async () => {
    try {
      setLoading(true);
      if (typeof window.ethereum === "undefined") return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) return;
      const user = accounts[0];
      setAdminAddress(user);

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const owner = await contract.owner();
      const isOwner = owner.toLowerCase() === user.toLowerCase();
      setIsAdmin(isOwner);
      if (isOwner) await loadReports();
    } catch (err) {
      console.error("Lỗi khởi tạo AdminReports:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      setLoadingReports(true);
      const res = await fetch("/api/reports");
      const list = await res.json();
      const normalized = (list || []).map((r) => ({
        id: r.id,
        tokenId: r.tokenId != null ? String(r.tokenId) : null,
        subject: r.subject,
        message: r.message,
        category: r.category,
        contact: r.contact || {},
        wallet: r.wallet || null,
        status: r.status,
        resolved: r.status === "resolved",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        adminNote: r.adminNote || "",
        resolvedBy: r.resolvedBy || null,
        resolvedAt: r.resolvedAt || null,
        unlockRequested: !!r.unlockRequested,
        unlockDecision: r.unlockDecision,
      }));
      setReports(normalized);
    } catch (err) {
      console.error("Lỗi load báo cáo:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  const sendReply = async (reportId) => {
    try {
      setPending((p) => ({ ...p, ["report_" + reportId]: true }));
      const note = (noteMap[reportId] || "").trim() || "Phản hồi từ admin";
      await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          adminNote: note,
          resolvedBy: adminAddress || "admin",
        }),
      });
      await loadReports();
      setNoteMap((m) => ({ ...m, [reportId]: "" }));
      alert(`✅ Đã gửi phản hồi cho báo cáo #${reportId}`);
    } catch (err) {
      console.error("Lỗi xử lý báo cáo:", err);
      alert("❌ Lỗi xử lý báo cáo: " + (err?.message || "Không rõ lỗi"));
    } finally {
      setPending((p) => ({ ...p, ["report_" + reportId]: undefined }));
    }
  };

  if (loading) {
    return (
      <div className="admin-reports">
        <div className="loading-section">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu báo cáo...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-reports">
        <div className="access-denied">
          <h2>🚫 Truy cập bị từ chối</h2>
          <p>Bạn không có quyền admin để xem trang này.</p>
          <Link to="/admin" className="back-btn">← Quay về Admin Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-reports">
      <div className="reports-header">
        <button onClick={() => window.history.back()} className="back-btn" title="Quay lại">← Quay lại</button>
        <h1>📢 Báo cáo từ người dùng</h1>
        <div className="header-actions">
          <button onClick={loadReports} className="refresh-btn">🔄 Làm mới</button>
        </div>
      </div>

      <div className="reports-section">
        {loadingReports ? (
          <div className="loading-reports"><div className="spinner"></div>Đang tải báo cáo...</div>
        ) : reports.length === 0 ? (
          <p className="no-reports">Chưa có báo cáo nào.</p>
        ) : (
          <div className="reports-list">
            {reports.map((r) => (
              <div key={r.id} className={`report-card ${r.resolved ? "resolved" : "pending"}`}>
                <div className="report-header">
                  <span className="report-id">#R{r.id}</span>
                  {r.tokenId && <span className="report-token">NFT #{r.tokenId}</span>}
                  <span className={`report-status ${r.resolved ? "resolved" : "pending"}`}>
                    {r.resolved ? "✅ Đã xử lý" : "⏳ Chưa xử lý"}
                  </span>
                </div>

                <div className="report-body">
                  <div className="report-field"><strong>Thời gian:</strong> {new Date(r.createdAt).toLocaleString("vi-VN")}</div>
                  <div className="report-field"><strong>Thể loại:</strong> {r.category}</div>
                  {r.subject && <div className="report-field"><strong>Tiêu đề:</strong> {r.subject}</div>}
                  <div className="report-reason"><strong>Nội dung:</strong> {r.message}</div>
                  {(r.contact?.email || r.contact?.phone) && (
                    <div className="report-field"><strong>Liên hệ:</strong> {r.contact?.email || ""} {r.contact?.phone ? `(${r.contact.phone})` : ""}</div>
                  )}
                  {r.wallet && (
                    <div className="report-field"><strong>Ví:</strong> {`${r.wallet.slice(0,6)}...${r.wallet.slice(-4)}`}</div>
                  )}
                  {r.resolved && (
                    <div className="report-admin-note">
                      <strong>Ghi chú admin:</strong> {r.adminNote || "(Không)"} {r.unlockDecision === true && <span className="unlock-tag">🔓 Đã mở khóa</span>}
                    </div>
                  )}
                </div>

                {!r.resolved && (
                  <div className="report-actions">
                    <div className="admin-note">
                      <label>Lời nhắn gửi người dùng</label>
                      <textarea
                        placeholder="Nhập ghi chú phản hồi cho người dùng"
                        value={noteMap[r.id] || ""}
                        onChange={(e) => setNoteMap((m) => ({ ...m, [r.id]: e.target.value }))}
                      />
                    </div>
                    <button className="action-btn primary" onClick={() => sendReply(r.id)} disabled={pending["report_" + r.id]}>
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
