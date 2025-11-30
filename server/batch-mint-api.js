import express from "express";
import cors from "cors";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Configuration
const PORT = 3002;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Default Hardhat account #0

// Load contract info
const scriptsPath = path.join(__dirname, "..", "scripts");
const CONTRACT_ADDRESS = fs
  .readFileSync(path.join(scriptsPath, "MotorbikeNFT-address.txt"), "utf-8")
  .trim();
const ABI = JSON.parse(
  fs.readFileSync(path.join(scriptsPath, "MotorbikeNFT-abi.json"), "utf-8")
);

console.log("🔧 Batch Mint API Configuration:");
console.log("   RPC:", RPC_URL);
console.log("   Contract:", CONTRACT_ADDRESS);
console.log("   Port:", PORT);

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

console.log("   Admin Wallet:", wallet.address);
console.log("");

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Batch Mint API",
    adminWallet: wallet.address,
    contractAddress: CONTRACT_ADDRESS,
  });
});

// Batch mint endpoint
app.post("/api/batch-mint", async (req, res) => {
  const { vehicles } = req.body;

  if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
    return res.status(400).json({
      error: "Invalid request",
      message: "Vui lòng cung cấp danh sách xe (array of vehicles)",
    });
  }

  console.log(`\n🚀 Nhận yêu cầu batch mint ${vehicles.length} xe...`);

  const results = [];
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // Process each vehicle
  for (let i = 0; i < vehicles.length; i++) {
    const v = vehicles[i];
    const num = i + 1;

    console.log(`[${num}/${vehicles.length}] ${v.model} (${v.vin})`);

    try {
      // Validate required fields
      if (!v.recipientAddress || !v.vin || !v.engineNumber) {
        results.push({
          index: num,
          status: "SKIP",
          reason:
            "Thiếu thông tin bắt buộc (recipientAddress, vin, engineNumber)",
          vehicle: v,
        });
        skipCount++;
        console.log(`  ❌ SKIP: Thiếu thông tin\n`);
        continue;
      }

      // Validate address
      if (!ethers.isAddress(v.recipientAddress)) {
        results.push({
          index: num,
          status: "SKIP",
          reason: `Địa chỉ ví không hợp lệ: ${v.recipientAddress}`,
          vehicle: v,
        });
        skipCount++;
        console.log(`  ❌ SKIP: Địa chỉ không hợp lệ\n`);
        continue;
      }

      // Check for duplicates
      const vinUsed = await contract.isVinUsed(v.vin);
      if (vinUsed) {
        try {
          const vinHash = ethers.keccak256(ethers.toUtf8Bytes(v.vin));
          const existingTokenId = await contract.vinToTokenId(vinHash);
          results.push({
            index: num,
            status: "SKIP",
            reason: `VIN ${v.vin} đã tồn tại (Token ID: ${existingTokenId})`,
            vehicle: v,
            existingTokenId: existingTokenId.toString(),
          });
        } catch {
          results.push({
            index: num,
            status: "SKIP",
            reason: `VIN ${v.vin} đã tồn tại`,
            vehicle: v,
          });
        }
        skipCount++;
        console.log(`  ❌ SKIP: VIN đã tồn tại\n`);
        continue;
      }

      const engineUsed = await contract.isEngineNumberUsed(v.engineNumber);
      if (engineUsed) {
        try {
          const engineHash = ethers.keccak256(
            ethers.toUtf8Bytes(v.engineNumber)
          );
          const existingTokenId = await contract.engineToTokenId(engineHash);
          results.push({
            index: num,
            status: "SKIP",
            reason: `Số máy ${v.engineNumber} đã tồn tại (Token ID: ${existingTokenId})`,
            vehicle: v,
            existingTokenId: existingTokenId.toString(),
          });
        } catch {
          results.push({
            index: num,
            status: "SKIP",
            reason: `Số máy ${v.engineNumber} đã tồn tại`,
            vehicle: v,
          });
        }
        skipCount++;
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

      console.log(`  📝 TX: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`  ✅ Block: ${receipt.blockNumber}`);

      // Extract token ID from event
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
        status: "SUCCESS",
        tokenId: tokenId,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        vehicle: v,
      });
      successCount++;

      console.log("");
    } catch (err) {
      console.error(`  ❌ ERROR: ${err.message}\n`);
      results.push({
        index: num,
        status: "ERROR",
        reason: err.message,
        vehicle: v,
      });
      errorCount++;
    }

    // Small delay between transactions to avoid nonce issues
    if (i < vehicles.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log("\n📊 Hoàn tất:");
  console.log(`   ✅ Thành công: ${successCount}`);
  console.log(`   ⏭️  Bỏ qua: ${skipCount}`);
  console.log(`   ❌ Lỗi: ${errorCount}`);
  console.log("");

  // Return results
  res.json({
    success: true,
    summary: {
      total: vehicles.length,
      success: successCount,
      skipped: skipCount,
      errors: errorCount,
    },
    results: results,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Batch Mint API đang chạy tại http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Batch mint: POST http://localhost:${PORT}/api/batch-mint`);
  console.log("");
  console.log("💡 Sử dụng:");
  console.log("   curl -X POST http://localhost:3002/api/batch-mint \\");
  console.log('     -H "Content-Type: application/json" \\');
  console.log("     -d '{\"vehicles\": [...]}'\n");
});

export default app;
