import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import FaceScanStep from "./FaceScanStep";
import "./KYCPage.css";

const KYCPage = () => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Review, 3: Face Scan, 4: Result
  const [walletAddress, setWalletAddress] = useState("");

  const [idCardFront, setIdCardFront] = useState(null);
  const [idCardBack, setIdCardBack] = useState(null);
  const [frontError, setFrontError] = useState("");
  const [backError, setBackError] = useState("");
  const [checkingFront, setCheckingFront] = useState(false);
  const [checkingBack, setCheckingBack] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    dob: "",
    gender: "",
    address: "",
    issueDate: "",
    expiryDate: "",
  });

  const [selfieImage, setSelfieImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    checkWallet();
  }, []);

  const checkWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        const address = accounts[0].address;
        setWalletAddress(address);
        checkKycStatus(address);
      }
    }
  };

  const checkKycStatus = async (address) => {
    try {
      const res = await fetch("http://localhost:4000/api/kyc/requests");
      if (res.ok) {
        const requests = await res.json();
        const myRequest = requests
          .filter(
            (r) => r.walletAddress.toLowerCase() === address.toLowerCase()
          )
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

        if (
          myRequest &&
          (myRequest.status === "pending" || myRequest.status === "verified")
        ) {
          setResult({ data: myRequest, status: myRequest.status });
        }
      }
    } catch (error) {
      console.error("Error checking KYC status:", error);
    }
  };

  const checkImageQuality = async (base64, type) => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/kyc/check-quality",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, type }),
        }
      );
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(err);
      return { valid: false, reason: "Lỗi kết nối server" };
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;

      if (type === "front") {
        setIdCardFront(base64);
        setFrontError("");
      } else {
        setIdCardBack(base64);
        setBackError("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExtractInfo = () => {
    // Bỏ qua bước AI trích xuất, chuyển thẳng sang nhập liệu thủ công
    setStep(2);
  };

  const handleFaceScanComplete = (base64Image) => {
    setSelfieImage(base64Image);
    setStep(4); // Move to final review/submit step
  };

  const handleDateChange = (e, field) => {
    const input = e.target.value.replace(/\D/g, "").substring(0, 8); // Limit to 8 digits
    let formatted = input;

    if (input.length > 4) {
      formatted = `${input.slice(0, 2)}/${input.slice(2, 4)}/${input.slice(4)}`;
    } else if (input.length > 2) {
      formatted = `${input.slice(0, 2)}/${input.slice(2)}`;
    }

    setFormData({ ...formData, [field]: formatted });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:4000/api/kyc/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          idCardFront,
          idCardBack,
          selfieBase64: selfieImage,
          userData: formData, // Gửi kèm dữ liệu đã chỉnh sửa
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Lỗi xác thực");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep2 = async () => {
    if (!formData.idNumber) {
      alert("Vui lòng nhập số CCCD");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/kyc/check-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idNumber: formData.idNumber,
          walletAddress: walletAddress,
        }),
      });
      const data = await res.json();

      if (!data.available) {
        alert(data.message);
        return;
      }

      setStep(3);
    } catch (err) {
      console.error(err);
      alert("Lỗi kiểm tra thông tin");
    }
  };

  return (
    <div className="kyc-container">
      <div className="kyc-card">
        <h2>🔐 Xác thực danh tính (eKYC)</h2>
        <p className="kyc-subtitle">
          Vui lòng hoàn thành các bước để xác minh tài khoản của bạn.
        </p>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div className={`step ${step >= 1 ? "active" : ""}`}>1. Tải ảnh</div>
          <div className={`step ${step >= 2 ? "active" : ""}`}>
            2. Thông tin
          </div>
          <div className={`step ${step >= 3 ? "active" : ""}`}>
            3. Khuôn mặt
          </div>
          <div className={`step ${step >= 4 || result ? "active" : ""}`}>
            4. Kết quả
          </div>
        </div>

        <div className="kyc-content">
          {/* STEP 1: Upload ID Card */}
          {step === 1 && (
            <div className="step-content">
              <h3>📸 Bước 1: Tải lên ảnh CCCD/CMND</h3>

              {/* Front ID */}
              <div className="upload-section">
                <h4>Mặt trước</h4>
                <div className="upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "front")}
                    id="id-front-upload"
                    hidden
                  />
                  <label
                    htmlFor="id-front-upload"
                    className={`upload-label ${frontError ? "error" : ""}`}
                  >
                    {idCardFront ? (
                      <img
                        src={idCardFront}
                        alt="Front ID"
                        className="preview-img"
                      />
                    ) : (
                      <div className="placeholder">
                        <span>📂 Tải ảnh mặt trước</span>
                      </div>
                    )}
                  </label>
                </div>
                {frontError && <p className="error-text">⚠️ {frontError}</p>}
              </div>

              {/* Back ID */}
              <div className="upload-section">
                <h4>Mặt sau</h4>
                <div className="upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "back")}
                    id="id-back-upload"
                    hidden
                  />
                  <label
                    htmlFor="id-back-upload"
                    className={`upload-label ${backError ? "error" : ""}`}
                  >
                    {idCardBack ? (
                      <img
                        src={idCardBack}
                        alt="Back ID"
                        className="preview-img"
                      />
                    ) : (
                      <div className="placeholder">
                        <span>📂 Tải ảnh mặt sau</span>
                      </div>
                    )}
                  </label>
                </div>
                {backError && <p className="error-text">⚠️ {backError}</p>}
              </div>

              {error && <p className="error-text">❌ {error}</p>}

              <button
                className="next-btn"
                disabled={!idCardFront || !idCardBack}
                onClick={handleExtractInfo}
              >
                Tiếp tục nhập thông tin ➡️
              </button>
            </div>
          )}

          {/* STEP 2: Review & Edit Info */}
          {step === 2 && (
            <div className="step-content">
              <h3>📝 Bước 2: Nhập thông tin cá nhân</h3>
              <p>Vui lòng nhập chính xác thông tin trên giấy tờ tùy thân.</p>

              <div className="info-form">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Số CCCD</label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, idNumber: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Năm sinh</label>
                  <input
                    type="text"
                    value={formData.dob}
                    onChange={(e) => handleDateChange(e, "dob")}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                  />
                </div>
                <div className="form-group">
                  <label>Giới tính</label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Nơi thường trú</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Ngày cấp</label>
                  <input
                    type="text"
                    value={formData.issueDate}
                    onChange={(e) => handleDateChange(e, "issueDate")}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                  />
                </div>
                <div className="form-group">
                  <label>Giá trị đến</label>
                  <input
                    type="text"
                    value={formData.expiryDate}
                    onChange={(e) => handleDateChange(e, "expiryDate")}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="btn-group">
                <button className="back-btn" onClick={() => setStep(1)}>
                  ⬅️ Quay lại
                </button>
                <button className="next-btn" onClick={handleNextStep2}>
                  Tiếp tục ➡️
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Face Scan */}
          {step === 3 && (
            <div className="step-content">
              <h3>👤 Bước 3: Quét khuôn mặt</h3>
              <p>Vui lòng giữ khuôn mặt trong khung hình để xác thực.</p>
              <button className="scan-btn" onClick={() => setStep("scanning")}>
                📷 Bắt đầu quét
              </button>
              <div className="btn-group" style={{ marginTop: "15px" }}>
                <button className="back-btn" onClick={() => setStep(2)}>
                  ⬅️ Quay lại
                </button>
              </div>
            </div>
          )}

          {step === "scanning" && (
            <FaceScanStep
              onComplete={handleFaceScanComplete}
              onCancel={() => setStep(3)}
            />
          )}

          {/* STEP 4: Final Review & Submit */}
          {step === 4 && !result && (
            <div className="step-content">
              <h3>🚀 Hoàn tất xác thực</h3>
              <div className="review-images">
                <div className="img-box">
                  <p>Selfie</p>
                  <img src={selfieImage} alt="Selfie" />
                </div>
              </div>

              {error && <div className="error-msg">❌ {error}</div>}

              <div className="btn-group">
                <button className="back-btn" onClick={() => setStep(3)}>
                  ⬅️ Chụp lại
                </button>
                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "⏳ Đang xử lý..." : "🚀 Gửi yêu cầu xác thực"}
                </button>
              </div>
            </div>
          )}

          {/* Result Screen */}
          {result && (
            <div className="result-content">
              <div className="success-icon">
                {result.status === "verified" ? "🛡️" : "✅"}
              </div>
              <h3>
                {result.status === "verified"
                  ? "Tài khoản đã xác thực!"
                  : "Yêu cầu đã được gửi!"}
              </h3>
              <p>
                {result.status === "verified"
                  ? "Bạn đã hoàn tất quá trình eKYC."
                  : "Hệ thống đã ghi nhận thông tin của bạn."}
              </p>

              <div className="result-details">
                <p>
                  <strong>Họ tên:</strong> {result.data?.fullName}
                </p>
                <p>
                  <strong>Số CCCD:</strong> {result.data?.idNumber}
                </p>
                <p>
                  <strong>Ngày sinh:</strong> {result.data?.dob}
                </p>
                <p>
                  <strong>Giới tính:</strong> {result.data?.gender}
                </p>
                <p>
                  <strong>Nơi thường trú:</strong> {result.data?.address}
                </p>
                <p>
                  <strong>Ngày cấp:</strong> {result.data?.issueDate}
                </p>
                <p>
                  <strong>Giá trị đến:</strong> {result.data?.expiryDate}
                </p>
                <p>
                  <strong>Độ khớp khuôn mặt:</strong> {result.data?.matchScore}%
                </p>
                <p
                  className={
                    result.status === "verified"
                      ? "status-verified"
                      : "status-pending"
                  }
                >
                  {result.status === "verified"
                    ? "🛡️ Trạng thái: Đã xác thực"
                    : "⏳ Trạng thái: Chờ Admin duyệt"}
                </p>
              </div>

              <button
                className="back-home-btn"
                onClick={() => (window.location.href = "/user")}
              >
                Về trang chủ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCPage;
