const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script mint hàng loạt NFT từ file CSV hoặc JSON
 *
 * Cách dùng:
 * 1. Tạo file danh sách xe (vehicles.json hoặc vehicles.csv)
 * 2. Chạy: npx hardhat run scripts/batch-mint.js --network localhost
 *
 * Format JSON:
 * [
 *   {
 *     "recipientAddress": "0x...",
 *     "vin": "RLHPC4508P5123456",
 *     "engineNumber": "PC45E-5123456",
 *     "model": "Honda Winner X 150",
 *     "color": "Đen nhám",
 *     "year": "2023"
 *   }
 * ]
 *
 * Format CSV:
 * recipientAddress,vin,engineNumber,model,color,year
 * 0x...,RLHPC4508P5123456,PC45E-5123456,Honda Winner X 150,Đen nhám,2023
 */

async function main() {
  console.log("🚀 Bắt đầu batch mint NFT...\n");

  // Đọc địa chỉ contract từ file
  const nftAddressFile = path.join(__dirname, "MotorbikeNFT-address.txt");
  if (!fs.existsSync(nftAddressFile)) {
    console.error("❌ Không tìm thấy file địa chỉ contract!");
    console.error(
      "Vui lòng deploy contract trước: npx hardhat run scripts/deploy-and-update-web.js --network localhost"
    );
    process.exit(1);
  }

  const CONTRACT_ADDRESS = fs.readFileSync(nftAddressFile, "utf-8").trim();
  console.log("📍 Contract NFT:", CONTRACT_ADDRESS);

  // Đọc ABI
  const abiFile = path.join(__dirname, "MotorbikeNFT-abi.json");
  const ABI = JSON.parse(fs.readFileSync(abiFile, "utf-8"));

  // Chỉ hỗ trợ CSV (chấm phẩy ;)
  const csvFile = path.join(__dirname, "vehicles.csv");

  let vehicles = [];

  if (fs.existsSync(csvFile)) {
    console.log("📄 Đọc file:", csvFile);
    
    // Đọc buffer và tự động nhận diện encoding (UTF-8 hoặc Windows-1258)
    const buffer = fs.readFileSync(csvFile);
    let content;
    try {
      const decoder = new TextDecoder("utf-8", { fatal: true });
      content = decoder.decode(buffer);
    } catch (e) {
      console.log("⚠️ Phát hiện file không phải UTF-8, đang thử đọc bằng Windows-1258...");
      try {
        const decoder = new TextDecoder("windows-1258");
        content = decoder.decode(buffer);
      } catch (e2) {
        // Fallback
        content = buffer.toString("latin1");
      }
    }

    vehicles = parseCSV(content);
  } else {
    console.error("❌ Không tìm thấy file vehicles.csv!");
    console.error("Tạo file mẫu vehicles.csv (dấu chấm phẩy ;):");
    const sample =
      "recipientAddress;vin;engineNumber;model;color;year\n" +
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8;RLHPC4508P5123456;PC45E-5123456;Honda Winner X 150;Đen nhám;2023\n";
    fs.writeFileSync(csvFile, sample);
    console.log("✅ Đã tạo file mẫu:", csvFile);
    console.log("Vui lòng chỉnh sửa file và chạy lại script.");
    process.exit(1);
  }

  if (vehicles.length === 0) {
    console.error("❌ File rỗng hoặc không đúng định dạng!");
    process.exit(1);
  }

  console.log(`✅ Đã load ${vehicles.length} xe từ file\n`);

  // Kết nối contract
  const [signer] = await ethers.getSigners();
  console.log("👤 Signer:", await signer.getAddress());

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  // Kiểm tra owner
  try {
    const owner = await contract.owner();
    const signerAddr = await signer.getAddress();
    if (owner.toLowerCase() !== signerAddr.toLowerCase()) {
      console.warn(`⚠️  Cảnh báo: Bạn không phải owner contract!`);
      console.warn(`Owner: ${owner}, Bạn: ${signerAddr}`);
    }
  } catch (e) {
    console.warn("⚠️  Không kiểm tra được owner:", e.message);
  }

  console.log("\n🔄 Bắt đầu mint...\n");

  const results = [];

  for (let i = 0; i < vehicles.length; i++) {
    const v = vehicles[i];
    const num = i + 1;

    console.log(`[${num}/${vehicles.length}] ${v.model} (${v.vin})`);

    try {
      // Validate dữ liệu
      if (!v.recipientAddress || !v.vin || !v.engineNumber) {
        results.push({
          index: num,
          status: "❌ SKIP",
          reason: "Thiếu thông tin bắt buộc",
          vehicle: v,
        });
        console.log(`  ❌ SKIP: Thiếu thông tin\n`);
        continue;
      }

      // Kiểm tra trùng lặp
      const vinUsed = await contract.isVinUsed(v.vin);
      if (vinUsed) {
        results.push({
          index: num,
          status: "❌ SKIP",
          reason: `VIN ${v.vin} đã tồn tại`,
          vehicle: v,
        });
        console.log(`  ❌ SKIP: VIN đã tồn tại\n`);
        continue;
      }

      const engineUsed = await contract.isEngineNumberUsed(v.engineNumber);
      if (engineUsed) {
        results.push({
          index: num,
          status: "❌ SKIP",
          reason: `Số máy ${v.engineNumber} đã tồn tại`,
          vehicle: v,
        });
        console.log(`  ❌ SKIP: Số máy đã tồn tại\n`);
        continue;
      }

      // Mint NFT
      console.log(`  ⏳ Đang mint...`);
      const tx = await contract.mint(
        v.recipientAddress,
        v.vin,
        v.engineNumber,
        v.model || "",
        v.color || "",
        parseInt(v.year) || 0
      );

      console.log(`  📝 TX hash: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`  ✅ Confirmed (block ${receipt.blockNumber})`);

      // Lấy token ID
      let tokenId = null;
      const mintEvent = receipt.logs.find(
        (log) => log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
      );
      if (mintEvent && mintEvent.topics && mintEvent.topics[3]) {
        tokenId = parseInt(mintEvent.topics[3], 16);
        console.log(`  🏷️  Token ID: ${tokenId}`);
      }

      results.push({
        index: num,
        status: "✅ SUCCESS",
        tokenId,
        txHash: tx.hash,
        vehicle: v,
      });

      console.log("");
    } catch (err) {
      console.error(`  ❌ ERROR: ${err.message}\n`);
      results.push({
        index: num,
        status: "❌ ERROR",
        reason: err.message,
        vehicle: v,
      });
    }

    // Delay nhỏ giữa các transaction
    if (i < vehicles.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Tổng kết
  console.log("\n" + "=".repeat(60));
  console.log("📊 KẾT QUẢ BATCH MINT");
  console.log("=".repeat(60));

  const success = results.filter((r) => r.status === "✅ SUCCESS");
  const skipped = results.filter((r) => r.status === "❌ SKIP");
  const errors = results.filter((r) => r.status === "❌ ERROR");

  console.log(`✅ Thành công: ${success.length}`);
  console.log(`⏭️  Bỏ qua: ${skipped.length}`);
  console.log(`❌ Lỗi: ${errors.length}`);
  console.log(`📦 Tổng cộng: ${results.length}`);

  // Ghi kết quả vào file
  const resultFile = path.join(__dirname, "batch-mint-results.json");
  fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Đã lưu kết quả chi tiết vào: ${resultFile}`);

  // Hiển thị danh sách thành công
  if (success.length > 0) {
    console.log("\n✅ Các NFT đã mint thành công:");
    success.forEach((r) => {
      console.log(
        `  #${r.tokenId} - ${r.vehicle.model} (${r.vehicle.vin}) → ${r.vehicle.recipientAddress}`
      );
    });
  }

  // Hiển thị danh sách bỏ qua
  if (skipped.length > 0) {
    console.log("\n⏭️  Các xe đã bỏ qua:");
    skipped.forEach((r) => {
      console.log(`  ${r.vehicle.vin}: ${r.reason}`);
    });
  }

  // Hiển thị danh sách lỗi
  if (errors.length > 0) {
    console.log("\n❌ Các xe gặp lỗi:");
    errors.forEach((r) => {
      console.log(`  ${r.vehicle.vin}: ${r.reason}`);
    });
  }

  console.log("\n🎉 Hoàn tất!\n");
}

// Parse CSV helper
function parseCSV(csvContent) {
  const text = csvContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const lines = text.split("\n");
  if (lines.length < 1) return [];

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
        obj[header] = values[index] || "";
      });
      return obj;
    });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
