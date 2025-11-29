import React, { useState } from "react";
import { ethers } from "ethers";
import { ABI, CONTRACT_ADDRESS } from "../blockchain/MotorbikeNFT";
import "./AdminBatchRegister.css";

function AdminBatchRegister() {
  const [file, setFile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Xử lý upload file
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target.result;
        let parsed = [];

        // Chỉ hỗ trợ CSV (dấu chấm phẩy ;)
        if (uploadedFile.name.endsWith(".csv")) {
          parsed = parseCSV(content);
        } else {
          setStatus("❌ Chỉ hỗ trợ file .csv (dấu chấm phẩy ;)");
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

    reader.readAsText(uploadedFile);
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

  // Mint hàng loạt
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

          // Lấy token ID từ event
          let tokenId = null;
          const mintEvent = receipt.logs.find(
            (log) =>
              log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
          );
          if (mintEvent && mintEvent.topics && mintEvent.topics[3]) {
            tokenId = parseInt(mintEvent.topics[3], 16);
          }

          results.push({
            index: i + 1,
            status: "✅ SUCCESS",
            tokenId,
            txHash: tx.hash,
            vehicle,
          });
        } catch (err) {
          console.error(`Lỗi mint xe ${i + 1}:`, err);
          results.push({
            index: i + 1,
            status: "❌ ERROR",
            reason: err.message,
            vehicle,
          });
        }

        // Delay nhỏ giữa các transaction để tránh nonce issues
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Tổng kết
      const success = results.filter((r) => r.status === "✅ SUCCESS").length;
      const skipped = results.filter((r) => r.status === "❌ SKIP").length;
      const errors = results.filter((r) => r.status === "❌ ERROR").length;

      setStatus(
        `🎉 Hoàn tất! Thành công: ${success}, Bỏ qua: ${skipped}, Lỗi: ${errors}`
      );

      // Log chi tiết
      console.log("📊 Kết quả batch mint:", results);

      // Hiển thị kết quả chi tiết
      displayResults(results);
    } catch (err) {
      console.error("Lỗi batch mint:", err);
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
              <td style="border: 1px solid #ddd; padding: 8px;">${r.status}</td>
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
              <p className="muted">... và {vehicles.length - 5} xe khác</p>
            )}
          </div>
        </div>
      )}

      <div className="action-section">
        <button
          className="btn primary"
          onClick={handleBatchMint}
          disabled={vehicles.length === 0 || isProcessing}
        >
          {isProcessing ? "⏳ Đang xử lý..." : "🚀 Bắt đầu mint hàng loạt"}
        </button>
      </div>

      {isProcessing && (
        <div className="progress-section">
          <h3>
            Tiến độ: {progress.current}/{progress.total}
          </h3>
          <progress value={progress.current} max={progress.total}></progress>
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
            <strong>JSON format:</strong> Array of objects với các field trên
          </li>
          <li>Hệ thống tự động bỏ qua các xe đã có VIN hoặc số máy trùng</li>
          <li>Mỗi transaction sẽ delay 500ms để tránh lỗi nonce</li>
          <li>
            Khuyến nghị lưu CSV với encoding UTF-8 để hiển thị tiếng Việt đúng
          </li>
          <li>Bạn cần ký xác nhận từng transaction trong ví</li>
        </ul>
      </div>
    </div>
  );
}

export default AdminBatchRegister;
