import React, { useEffect, useState } from "react";
import "./ReportIssue.css";

const ReportIssue = () => {
  const [form, setForm] = useState({
    category: "unlock", // unlock | listing | mint | other
    tokenId: "",
    subject: "",
    message: "",
    name: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [lookupStatus, setLookupStatus] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [trackedIds, setTrackedIds] = useState([]);
  const [myReports, setMyReports] = useState([]);

  // Load tracked report IDs from localStorage and start polling
  useEffect(() => {
    try {
      const raw = localStorage.getItem("myReports");
      const ids = raw ? JSON.parse(raw) : [];
      if (Array.isArray(ids)) setTrackedIds(ids);
    } catch {}
  }, []);

  useEffect(() => {
    if (trackedIds.length === 0) {
      setMyReports([]);
      return;
    }
    let stop = false;
    const load = async () => {
      try {
        const results = await Promise.all(
          trackedIds.map(async (id) => {
            try {
              const res = await fetch(`/api/reports/${id}`);
              if (!res.ok) return { id, _deleted: true };
              return await res.json();
            } catch {
              return { id, _error: true };
            }
          })
        );
        if (!stop) setMyReports(results.filter(Boolean));
      } catch {}
    };
    load();
    const timer = setInterval(load, 8000); // poll every 8s
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [trackedIds]);

  const addTrackedId = (id) => {
    setTrackedIds((prev) => {
      const next = Array.from(new Set([id, ...prev]));
      localStorage.setItem("myReports", JSON.stringify(next));
      return next;
    });
  };

  const removeTrackedId = (id) => {
    setTrackedIds((prev) => {
      const next = prev.filter((x) => x !== id);
      localStorage.setItem("myReports", JSON.stringify(next));
      return next;
    });
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!form.message.trim()) {
      setStatus("❌ Vui lòng nhập nội dung báo cáo");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          tokenId: form.tokenId || null,
          subject: form.subject || undefined,
          message: form.message,
          contact: { name: form.name, email: form.email },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStatus(`✅ Đã gửi báo cáo #${data.id}. Cảm ơn bạn!`);
      addTrackedId(data.id);
      setForm({
        category: "unlock",
        tokenId: "",
        subject: "",
        message: "",
        name: "",
        email: "",
      });
    } catch (err) {
      console.error(err);
      setStatus("❌ Gửi báo cáo thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const lookup = async (e) => {
    e.preventDefault();
    setLookupStatus("");
    setLookupResult(null);
    const id = lookupId.trim();
    if (!id) {
      setLookupStatus("❌ Vui lòng nhập mã báo cáo");
      return;
    }
    try {
      const res = await fetch(`/api/reports/${id}`);
      if (!res.ok) {
        setLookupStatus("❌ Không tìm thấy báo cáo");
        return;
      }
      const data = await res.json();
      setLookupResult(data);
    } catch (err) {
      console.error(err);
      setLookupStatus("❌ Lỗi tra cứu báo cáo");
    }
  };

  return (
    <div className="report-issue">
      <div className="report-container">
        {/* Header card styled like UserDashboard/MyNFTs */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            borderRadius: "16px",
            padding: "2rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: "800",
                marginBottom: "0.5rem",
                background: "linear-gradient(135deg, #1e40af 0%, #0891b2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              📢 Báo cáo sự cố
            </h1>
            <p
              style={{
                color: "#475569",
                fontSize: "1.125rem",
                margin: 0,
              }}
            >
              Gửi vấn đề bạn gặp phải cho admin. Không cần ví, không tốn gas.
            </p>
          </div>
        </div>

        <form className="report-form" onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label>Loại báo cáo</label>
              <select name="category" value={form.category} onChange={onChange}>
                <option value="unlock">Yêu cầu mở khóa NFT</option>
                <option value="listing">Vấn đề đăng bán/mua</option>
                <option value="mint">Vấn đề đăng ký xe</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div className="form-group">
              <label>Token ID (nếu có)</label>
              <input
                name="tokenId"
                value={form.tokenId}
                onChange={onChange}
                placeholder="VD: 12"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tiêu đề</label>
              <input
                name="subject"
                value={form.subject}
                onChange={onChange}
                placeholder="Tóm tắt ngắn gọn"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full">
              <label>Nội dung báo cáo *</label>
              <textarea
                name="message"
                value={form.message}
                onChange={onChange}
                placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tên liên hệ</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Tên của bạn"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "⏳ Đang gửi..." : "📨 Gửi báo cáo"}
            </button>
          </div>

          {status && (
            <div
              className={`status ${
                status.startsWith("✅") ? "success" : "error"
              }`}
            >
              {status}
            </div>
          )}
        </form>

        <div className="report-lookup">
          <h2>🔎 Tra cứu phản hồi</h2>
          <form onSubmit={lookup} className="lookup-form">
            <input
              placeholder="Nhập mã báo cáo (ví dụ: từ thông báo sau khi gửi)"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
            />
            <button type="submit" className="submit-btn">
              Tra cứu
            </button>
          </form>
          {lookupStatus && (
            <div
              className={`status ${
                lookupStatus.startsWith("✅") ? "success" : "error"
              }`}
            >
              {lookupStatus}
            </div>
          )}
          {lookupResult && (
            <div className="lookup-result">
              <div>
                <strong>Mã:</strong> {lookupResult.id}
              </div>
              <div>
                <strong>Trạng thái:</strong>{" "}
                {lookupResult.status === "resolved" ? "Đã xử lý" : "Chưa xử lý"}
              </div>
              {lookupResult.tokenId && (
                <div>
                  <strong>Token:</strong> #{lookupResult.tokenId}
                </div>
              )}
              <div>
                <strong>Loại:</strong> {lookupResult.category}
              </div>
              <div>
                <strong>Gửi lúc:</strong>{" "}
                {new Date(lookupResult.createdAt).toLocaleString("vi-VN")}
              </div>
              {lookupResult.status === "resolved" && (
                <div className="lookup-admin-note">
                  <strong>Phản hồi từ admin:</strong>
                  <div>{lookupResult.adminNote || "(Không có ghi chú)"}</div>
                  {lookupResult.unlockDecision === true && (
                    <div>🔓 NFT đã được mở khóa</div>
                  )}
                  {lookupResult.unlockDecision === false && (
                    <div>🔒 NFT tiếp tục bị khóa</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {trackedIds.length > 0 && (
          <div className="my-reports">
            <h2>🗂️ Báo cáo của bạn</h2>
            <p>Danh sách các báo cáo bạn đã gửi gần đây. Tự động cập nhật.</p>
            <div className="my-reports-list">
              {myReports.map((r) => (
                <div
                  key={r.id}
                  className={`my-report-card ${
                    r.status === "resolved" ? "resolved" : "pending"
                  }`}
                >
                  <div className="my-report-header">
                    <span className="rid">#R{r.id}</span>
                    {r.tokenId && (
                      <span className="rtoken">NFT #{r.tokenId}</span>
                    )}
                    <span
                      className={`rstatus ${
                        r.status === "resolved" ? "resolved" : "pending"
                      }`}
                    >
                      {r.status === "resolved"
                        ? "✅ Đã xử lý"
                        : "⏳ Chưa xử lý"}
                    </span>
                    <button
                      className="remove-btn"
                      title="Bỏ theo dõi"
                      onClick={() => removeTrackedId(r.id)}
                    >
                      ✖
                    </button>
                  </div>
                  <div className="my-report-body">
                    <div>
                      <strong>Loại:</strong> {r.category}
                    </div>
                    <div>
                      <strong>Gửi lúc:</strong>{" "}
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleString("vi-VN")
                        : "-"}
                    </div>
                    {r.subject && (
                      <div>
                        <strong>Tiêu đề:</strong> {r.subject}
                      </div>
                    )}
                    <div className="msg">
                      <strong>Nội dung:</strong> {r.message}
                    </div>
                    {r.status === "resolved" && (
                      <div className="admin-reply">
                        <strong>Phản hồi từ admin:</strong>
                        <div>{r.adminNote || "(Không có ghi chú)"}</div>
                        {r.unlockDecision === true && (
                          <div>🔓 NFT đã được mở khóa</div>
                        )}
                        {r.unlockDecision === false && (
                          <div>🔒 NFT tiếp tục bị khóa</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportIssue;
