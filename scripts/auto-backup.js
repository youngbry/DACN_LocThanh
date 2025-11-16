// Auto backup WITHOUT hardhat runtime (runs as plain node process)
// Usage: node scripts/auto-backup.js [intervalSeconds]
// Default interval: 300 (5 phút)
// Đọc ABI + địa chỉ từ các file trong scripts;
// Tạo snapshot: scripts/backup-state.json và lịch sử: scripts/backup-history/backup-<timestamp>.json

const fs = require("fs");
const path = require("path");
const { JsonRpcProvider, Contract } = require("ethers");

const intervalSec = parseInt(process.argv[2] || "300", 10);
const HISTORY_DIR = path.join(__dirname, "backup-history");
const SNAPSHOT_FILE = path.join(__dirname, "backup-state.json");
const RPC_URL = process.env.LOCAL_RPC || "http://127.0.0.1:8545";

async function snapshot() {
  try {
    const nftAddressFile = path.join(__dirname, "MotorbikeNFT-address.txt");
    const marketplaceAddressFile = path.join(
      __dirname,
      "MotorbikeMarketplace-address.txt"
    );
    if (
      !fs.existsSync(nftAddressFile) ||
      !fs.existsSync(marketplaceAddressFile)
    ) {
      console.log("[auto-backup] ⚠️  Chưa tìm thấy file địa chỉ, bỏ qua.");
      return;
    }
    const nftAddress = fs.readFileSync(nftAddressFile, "utf8").trim();
    const marketplaceAddress = fs
      .readFileSync(marketplaceAddressFile, "utf8")
      .trim();

    // Đọc ABI từ file lưu khi deploy
    const nftAbiPath = path.join(__dirname, "MotorbikeNFT-abi.json");
    const marketAbiPath = path.join(__dirname, "MotorbikeMarketplace-abi.json");
    if (!fs.existsSync(nftAbiPath) || !fs.existsSync(marketAbiPath)) {
      console.log("[auto-backup] ⚠️  Thiếu ABI, bỏ qua.");
      return;
    }
    const nftAbi = JSON.parse(fs.readFileSync(nftAbiPath, "utf8"));
    const marketAbi = JSON.parse(fs.readFileSync(marketAbiPath, "utf8"));

    const provider = new JsonRpcProvider(RPC_URL);
    // Kiểm tra mạng sống
    try {
      await provider.getBlockNumber();
    } catch {
      console.log("[auto-backup] ⚠️  RPC không truy cập được.");
      return;
    }

    const nft = new Contract(nftAddress, nftAbi, provider);
    const market = new Contract(marketplaceAddress, marketAbi, provider);

    let total = 0;
    try {
      total = Number(await nft.nextTokenId());
    } catch {
      total = 0;
    }
    const tokens = [];
    for (let i = 0; i < total; i++) {
      try {
        const mb = await nft.getMotorbike(i);
        const owner = await nft.ownerOf(i);
        const locked = await nft.locked(i);
        tokens.push({
          tokenId: i,
          vin: mb.vin,
          engineNumber: mb.engineNumber,
          model: mb.model,
          color: mb.color,
          year: Number(mb.year),
          owner,
          locked,
        });
      } catch {}
    }

    let listings = [];
    try {
      const active = await market.getActiveListings();
      listings = active.map((l) => ({
        tokenId: Number(l.tokenId),
        seller: l.seller,
        price: l.price.toString(),
        listedAt: Number(l.listedAt),
      }));
    } catch {}

    const backup = {
      timestamp: new Date().toISOString(),
      rpc: RPC_URL,
      nftAddress,
      marketplaceAddress,
      tokenCount: total,
      tokens,
      listings,
    };

    if (!fs.existsSync(HISTORY_DIR))
      fs.mkdirSync(HISTORY_DIR, { recursive: true });
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(backup, null, 2));
    const histFile = path.join(
      HISTORY_DIR,
      `backup-${backup.timestamp.replace(/[:]/g, "-")}.json`
    );
    fs.writeFileSync(histFile, JSON.stringify(backup));
    console.log(
      `[auto-backup] ✅ Snapshot (${total} tokens, ${listings.length} listings).`
    );
  } catch (err) {
    console.log("[auto-backup] ❌ Error:", err.message);
  }
}

async function main() {
  console.log(
    `[auto-backup] Khoi dong. Chu ky: ${intervalSec}s | RPC: ${RPC_URL}`
  );
  await snapshot();
  setInterval(snapshot, intervalSec * 1000);
}

main();
