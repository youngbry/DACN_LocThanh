import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { ABI, CONTRACT_ADDRESS } from "../blockchain/MotorbikeNFT";
import "./AdminBatchRegister.css";

function AdminBatchRegister() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [useAutoMode, setUseAutoMode] = useState(true); // Toggle auto/manual mode

  // Reset form
  const handleReset = () => {
    setFile(null);
    setVehicles([]);
    setStatus("");
    setProgress({ current: 0, total: 0 });
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    const resultDiv = document.getElementById("batch-results");
    if (resultDiv) resultDiv.innerHTML = "";
  };

  // Xử lý upload file
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target.result;
        let content = "";

        // 1. Thử decode UTF-8 trước (chuẩn)
        const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
        try {
          content = utf8Decoder.decode(buffer);
        } catch (e) {
          // 2. Nếu lỗi (do file lưu dạng ANSI/Excel cũ), thử decode Windows-1258 (Tiếng Việt)
          console.warn(
            "UTF-8 decoding failed, trying windows-1258 for Vietnamese support..."
          );
          try {
            const win1258Decoder = new TextDecoder("windows-1258");
            content = win1258Decoder.decode(buffer);
          } catch (e2) {
            // Fallback cuối cùng
            const win1252Decoder = new TextDecoder("windows-1252");
            content = win1252Decoder.decode(buffer);
          }
        }

        let parsed = [];

        // Chỉ hỗ trợ CSV
        if (uploadedFile.name.toLowerCase().endsWith(".csv")) {
          parsed = parseCSV(content);
        } else {
          setStatus("❌ Chỉ hỗ trợ file .csv");
          return;
        }

        const validated = validateVehicles(parsed);
        setVehicles(validated);
        setStatus(
          `✅ Đã load ${validated.length} xe từ file ${uploadedFile.name}`
        );
      } catch (err) {
        setStatus(`❌ Lỗi đọc file: ${err.message}`);
        console.error(err);
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  // Parse CSV to array of objects
  const parseCSV = (csvContent) => {
    const text = csvContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    const lines = text.split("\n");
    if (lines.length === 0) return [];

    // Auto-detect delimiter: priority ; then , then \t
    const headerLine = lines[0];
    let delimiter = ",";
    if (headerLine.includes(";")) delimiter = ";";
    else if (headerLine.includes("\t")) delimiter = "\t";

    const parseLine = (line) => {
      const out = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === delimiter && !inQuotes) {
          out.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
      out.push(cur);
      return out.map((v) => v.trim());
    };

    const headers = parseLine(headerLine);
    return lines
      .slice(1)
      .filter(Boolean)
      .map((line) => {
        const values = parseLine(line);
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = (values[index] || "").trim();
        });
        return obj;
      });
  };

  // Validate vehicle data
  const validateVehicles = (data) => {
    return data
      .map((item, index) => {
        // Chuyển đổi các tên field khác nhau về chuẩn
        const vehicle = {
          recipientAddress:
            item.recipientAddress ||
            item.address ||
            item.to ||
            item.wallet ||
            "",
          vin: item.vin || item.VIN || "",
          engineNumber:
            item.engineNumber ||
            item.engine ||
            item.engineNo ||
            item.soMay ||
            "",
          model: item.model || item.Model || "",
          color: item.color || item.Color || item.mau || "",
          year: item.year || item.Year || item.nam || "",
        };

        // Kiểm tra required fields
        if (
          !vehicle.recipientAddress ||
          !vehicle.vin ||
          !vehicle.engineNumber
        ) {
          console.warn(`Dòng ${index + 1} thiếu thông tin bắt buộc:`, vehicle);
          return null;
        }

        return vehicle;
      })
      .filter((v) => v !== null);
  };

  // Mint hàng loạt (Auto mode - qua API)
  const handleAutoMint = async () => {
    if (vehicles.length === 0) {
      setStatus("❌ Không có dữ liệu để mint");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress({ current: 0, total: vehicles.length });
      setStatus("⏳ Đang gửi yêu cầu đến server tự động...");

      const response = await fetch("http://localhost:3002/api/batch-mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vehicles }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Batch mint failed");
      }

      // Update progress
      setProgress({ current: data.summary.total, total: data.summary.total });

      const { success, skipped, errors } = data.summary;
      setStatus(
        `🎉 Hoàn tất! Thành công: ${success}, Bỏ qua: ${skipped}, Lỗi: ${errors}`
      );

      // Display results
      displayResults(data.results);

      console.log("📊 Kết quả từ server:", data);
    } catch (err) {
      console.error("Lỗi auto batch mint:", err);
      setStatus(
        `❌ Lỗi: ${err.message}. Đảm bảo server batch-mint đang chạy (npm run batch-mint)`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Mint hàng loạt (Manual mode - qua MetaMask)
  const handleBatchMint = async () => {
    if (vehicles.length === 0) {
      setStatus("❌ Không có dữ liệu để mint");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress({ current: 0, total: vehicles.length });

      if (!window.ethereum) {
        setStatus("❌ Vui lòng cài đặt Rabby hoặc MetaMask!");
        setIsProcessing(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const results = [];

      for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];
        setProgress({ current: i + 1, total: vehicles.length });
        setStatus(
          `⏳ Đang mint xe ${i + 1}/${vehicles.length}: ${vehicle.model} (${
            vehicle.vin
          })`
        );

        try {
          // Kiểm tra trùng lặp trước
          const vinUsed = await contract.isVinUsed(vehicle.vin);
          const engineUsed = await contract.isEngineNumberUsed(
            vehicle.engineNumber
          );

          if (vinUsed) {
            results.push({
              index: i + 1,
              status: "❌ SKIP",
              reason: `VIN ${vehicle.vin} đã tồn tại`,
              vehicle,
            });
            continue;
          }

          if (engineUsed) {
            results.push({
              index: i + 1,
              status: "❌ SKIP",
              reason: `Số máy ${vehicle.engineNumber} đã tồn tại`,
              vehicle,
            });
            continue;
          }

          // Mint NFT
          const tx = await contract.mint(
            vehicle.recipientAddress,
            vehicle.vin,
            vehicle.engineNumber,
            vehicle.model,
            vehicle.color,
            parseInt(vehicle.year) || 0
          );

          const receipt = await tx.wait();

          results.push({
            index: i + 1,
            status: "✅ SUCCESS",
            txHash: receipt.hash,
            vehicle,
          });
        } catch (err) {
          console.error(err);
          results.push({
            index: i + 1,
            status: "❌ ERROR",
            reason: err.message,
            vehicle,
          });
        }
        // delay
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setStatus(
        `✅ Hoàn tất! Thành công: ${
          results.filter((r) => r.status.includes("SUCCESS")).length
        }`
      );
      displayResults(results);
    } catch (err) {
      setStatus(`❌ Lỗi: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const displayResults = (results) => {
    const resultDiv = document.getElementById("batch-results");
    if (!resultDiv) return;

    const html = `
      <h3>📋 Chi tiết kết quả</h3>
      <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="border: 1px solid #ddd; padding: 8px;">#</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Trạng thái</th>
            <th style="border: 1px solid #ddd; padding: 8px;">VIN</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Model</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Token ID</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          ${results
            .map(
              (r) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${r.index}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${
                r.status.includes("SUCCESS")
                  ? "✅ SUCCESS"
                  : r.status.includes("SKIP")
                  ? "❌ SKIP"
                  : "❌ ERROR"
              }</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${
                r.vehicle.vin
              }</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${
                r.vehicle.model
              }</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${
                r.tokenId || "-"
              }</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${
                r.reason ||
                (r.txHash ? `TX: ${r.txHash.substring(0, 10)}...` : "OK")
              }</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;

    resultDiv.innerHTML = html;
  };

  // Download template
  const downloadTemplate = () => {
    const delimiter = ";";
    const template = `recipientAddress${delimiter}vin${delimiter}engineNumber${delimiter}model${delimiter}color${delimiter}year
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb${delimiter}RLHPC4508P5123456${delimiter}PC45E-5123456${delimiter}Honda Winner X 150${delimiter}Đen nhám${delimiter}2023
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb${delimiter}RLHPC4508P5123457${delimiter}PC45E-5123457${delimiter}Yamaha Exciter 155${delimiter}Xanh dương${delimiter}2024`;

    const blob = new Blob([template], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nft-batch-template-semicolon.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-batch-register">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Quay lại
      </button>
      <h2>📦 Đăng ký NFT hàng loạt (Batch Registration)</h2>
      <p className="description">
        Upload file CSV hoặc JSON chứa danh sách xe máy để tự động mint nhiều
        NFT cùng lúc.
      </p>

      <div className="template-section">
        <h3>📥 Tải template mẫu</h3>
        <button className="btn secondary" onClick={downloadTemplate}>
          Tải template CSV (chấm phẩy ;)
        </button>
      </div>

      <div className="upload-section">
        <h3>📤 Upload file danh sách</h3>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isProcessing}
          ref={fileInputRef}
        />
        {file && <p>File đã chọn: {file.name}</p>}
      </div>

      {vehicles.length > 0 && (
        <div className="preview-section">
          <h3>👀 Xem trước ({vehicles.length} xe)</h3>
          <div className="vehicle-list">
            {vehicles.slice(0, 5).map((v, i) => (
              <div key={i} className="vehicle-item">
                <strong>
                  {i + 1}. {v.model}
                </strong>{" "}
                - VIN: {v.vin} - Số máy: {v.engineNumber} → {v.recipientAddress}
              </div>
            ))}
            {vehicles.length > 5 && (
              <div className="more-items">
                ...và {vehicles.length - 5} xe khác
              </div>
            )}
          </div>
        </div>
      )}

      <div className="action-section">
        <div className="mode-toggle">
          <label>
            <input
              type="radio"
              name="mode"
              checked={useAutoMode}
              onChange={() => setUseAutoMode(true)}
              disabled={isProcessing}
            />
            <span>🤖 Tự động (Không cần xác nhận ví)</span>
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              checked={!useAutoMode}
              onChange={() => setUseAutoMode(false)}
              disabled={isProcessing}
            />
            <span>👤 Thủ công (Xác nhận từng giao dịch)</span>
          </label>
        </div>

        <div
          className="action-buttons"
          style={{ display: "flex", gap: "15px" }}
        >
          <button
            className="btn primary"
            onClick={useAutoMode ? handleAutoMint : handleBatchMint}
            disabled={vehicles.length === 0 || isProcessing}
            style={{ flex: 1 }}
          >
            {isProcessing ? "⏳ Đang xử lý..." : "🚀 Bắt đầu Mint"}
          </button>

          <button
            className="btn secondary"
            onClick={handleReset}
            disabled={isProcessing}
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="progress-section">
          <h3>
            {useAutoMode
              ? "⏳ Đang xử lý trên server (vui lòng chờ)..."
              : `Tiến độ: ${progress.current}/${progress.total}`}
          </h3>
          <div className="custom-progress-track">
            <div
              className={`custom-progress-fill ${
                useAutoMode ? "indeterminate" : ""
              }`}
              style={{
                width: `${
                  progress.total > 0
                    ? (progress.current / progress.total) * 100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      )}

      <div className="status">{status}</div>

      <div id="batch-results" className="results-section"></div>

      <div className="info-section">
        <h3>ℹ️ Hướng dẫn</h3>
        <ul>
          <li>
            <strong>CSV format:</strong> hỗ trợ dấu phẩy (,) hoặc chấm phẩy (;).
            Nếu mở bằng Excel mà tất cả nằm ở cột A, hãy dùng CSV (;) hoặc dùng
            tính năng Data → Text to Columns (Delimiter = Comma).
          </li>
          <li>
            <strong>Chế độ tự động:</strong> Server tự động ký transaction,
            không cần xác nhận ví. Yêu cầu chạy server:{" "}
            <code>cd server && npm run batch-mint</code>
          </li>
          <li>
            <strong>Chế độ thủ công:</strong> Sử dụng ví MetaMask/Rabby, cần xác
            nhận từng transaction
          </li>
          <li>Hệ thống tự động bỏ qua các xe đã có VIN hoặc số máy trùng</li>
          <li>Mỗi transaction sẽ delay 500ms để tránh lỗi nonce</li>
          <li>
            Khuyến nghị lưu CSV với encoding UTF-8 để hiển thị tiếng Việt đúng
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AdminBatchRegister;
