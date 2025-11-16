// Xoá sạch dữ liệu lưu cục bộ (backup + lịch sử + địa chỉ/ABI nếu muốn)
// Chạy: node scripts/clear-local-data.js [--full]
// --full: xoá thêm file địa chỉ & ABI để buộc deploy lại hoàn toàn.

const fs = require("fs");
const path = require("path");

const scriptsDir = __dirname;
const SNAPSHOT_FILE = path.join(scriptsDir, "backup-state.json");
const HISTORY_DIR = path.join(scriptsDir, "backup-history");

const filesOptional = [
  "MotorbikeNFT-address.txt",
  "MotorbikeMarketplace-address.txt",
  "MotorbikeNFT-abi.json",
  "MotorbikeMarketplace-abi.json",
];

const full = process.argv.includes("--full");

function safeUnlink(p) {
  try {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log("✔ Đã xoá:", p);
    }
  } catch (e) {
    console.log("⚠ Không thể xoá", p, e.message);
  }
}

function removeDirRecursive(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.lstatSync(fullPath);
    if (stat.isDirectory()) removeDirRecursive(fullPath);
    else safeUnlink(fullPath);
  }
  try {
    fs.rmdirSync(dir);
    console.log("✔ Đã xoá thư mục:", dir);
  } catch (e) {
    console.log("⚠ Không thể xoá thư mục", dir, e.message);
  }
}

console.log("=== BẮT ĐẦU XOÁ DỮ LIỆU CỤC BỘ ===");
safeUnlink(SNAPSHOT_FILE);
removeDirRecursive(HISTORY_DIR);

if (full) {
  console.log("--full bật: xoá thêm địa chỉ & ABI");
  for (const f of filesOptional) {
    safeUnlink(path.join(scriptsDir, f));
  }
}

console.log(
  "Hoàn tất. Để có chain mới: dừng hardhat node cũ, rồi chạy lại 'npx hardhat node' và redeploy."
);
