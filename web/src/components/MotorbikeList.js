import React, { useEffect, useState } from "react";
import { ABI, CONTRACT_ADDRESS } from "../blockchain/MotorbikeNFT";
import { ethers } from "ethers";
import NFTOwnershipHistory from "./NFTOwnershipHistory";

function MotorbikeList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedNFT, setSelectedNFT] = useState(null);

  // Try multiple RPC endpoints
  const RPC_ENDPOINTS = ["http://127.0.0.1:8545", "http://localhost:8545"];

  const loadList = async () => {
    setLoading(true);
    setError("");
    try {
      // Try multiple providers
      let provider;
      let connected = false;

      // Try local RPC endpoints first
      for (const rpcUrl of RPC_ENDPOINTS) {
        try {
          console.log(`🔄 Trying RPC: ${rpcUrl}`);
          provider = new ethers.JsonRpcProvider(rpcUrl);
          await provider.getNetwork();
          console.log(`✅ Connected to: ${rpcUrl}`);
          connected = true;
          break;
        } catch (e) {
          console.warn(`❌ RPC ${rpcUrl} failed:`, e.message);
        }
      }

      // Fallback to MetaMask
      if (!connected) {
        try {
          console.log("🔄 Trying MetaMask...");
          if (window.ethereum) {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.getNetwork();
            console.log("✅ Connected via MetaMask");
          } else {
            throw new Error("MetaMask not available");
          }
        } catch (e) {
          throw new Error("Không thể kết nối với bất kỳ mạng blockchain nào");
        }
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      console.log("🔍 Contract Address:", CONTRACT_ADDRESS);
      console.log("🌐 Provider:", provider);

      // Get Transfer events (mint and transfer). We consider all tokenIds emitted by events
      let events = [];
      try {
        console.log("🔄 Querying Transfer events...");
        events = await contract.queryFilter(contract.filters.Transfer());
      } catch (e) {
        // If queryFilter via window.ethereum fails, try direct JSON-RPC provider
        console.warn(
          "queryFilter failed on provider, retrying with JsonRpcProvider",
          e?.message || e
        );
        const rpc = new ethers.JsonRpcProvider(RPC_ENDPOINTS[0]);
        const rpcContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, rpc);
        events = await rpcContract.queryFilter(rpcContract.filters.Transfer());
      }

      console.log(`📋 Found ${events.length} Transfer events`);

      // Map tokenIds (unique)
      const ids = [...new Set(events.map((e) => e.args.tokenId.toString()))];
      console.log("🏷️ Token IDs:", ids);

      const items = [];
      for (const id of ids) {
        try {
          // use RPC provider for reads to avoid permission or account issues
          const rpc = new ethers.JsonRpcProvider(RPC_ENDPOINTS[0]);
          const rpcContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, rpc);
          const motorbike = await rpcContract.getMotorbike(Number(id));
          const owner = await rpcContract.ownerOf(Number(id));
          items.push({
            tokenId: id,
            vin: motorbike.vin || "",
            engineNumber: motorbike.engineNumber || "",
            model: motorbike.model || "",
            color: motorbike.color || "",
            year: motorbike.year ? motorbike.year.toString() : "",
            owner,
          });
        } catch (e) {
          console.warn("read token failed", id, e?.message || e);
        }
      }

      // sort by tokenId numeric
      items.sort((a, b) => Number(a.tokenId) - Number(b.tokenId));
      setList(items);
    } catch (err) {
      console.error("loadList error", err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let pollInterval = null;

    const setup = async () => {
      await loadList();

      // Not all providers support event subscriptions in dev wallets reliably.
      // Use a light polling loop to refresh the list every 5 seconds.
      pollInterval = setInterval(() => {
        if (mounted) loadList().catch(() => {});
      }, 5000);
    };

    setup().catch(() => {});
    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h2>Danh sách NFT đã tạo</h2>
      <div className="muted">
        Danh sách sẽ tự động cập nhật khi có giao dịch mint/transfer trên mạng.
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={loadList}>
          Làm mới
        </button>
      </div>
      {loading && (
        <div className="muted" style={{ marginTop: 10 }}>
          Đang tải...
        </div>
      )}
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      <div style={{ marginTop: 12 }}>
        {list.length === 0 && !loading && (
          <div className="muted">Chưa có NFT nào được phát hành.</div>
        )}
        <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
          {list.map((item) => (
            <div key={item.tokenId} className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  #{item.tokenId} — {item.model || "Xe máy"}
                </div>
                <div className="muted">Owner: {item.owner}</div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div>
                  <strong>VIN:</strong> {item.vin}
                </div>
                <div>
                  <strong>Số máy:</strong> {item.engineNumber}
                </div>
                <div>
                  <strong>Màu:</strong> {item.color}{" "}
                  <strong style={{ marginLeft: 12 }}>Năm:</strong> {item.year}
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() =>
                    setSelectedNFT(
                      selectedNFT === item.tokenId ? null : item.tokenId
                    )
                  }
                  className="btn"
                  style={{ fontSize: "12px", padding: "5px 10px" }}
                >
                  {selectedNFT === item.tokenId
                    ? "Ẩn lịch sử"
                    : "📜 Xem lịch sử chủ sở hữu"}
                </button>
              </div>

              {selectedNFT === item.tokenId && (
                <NFTOwnershipHistory tokenId={item.tokenId} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MotorbikeList;
