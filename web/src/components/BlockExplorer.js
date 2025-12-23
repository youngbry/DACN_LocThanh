import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./BlockExplorer.css";

const BlockExplorer = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastBlockNumber, setLastBlockNumber] = useState(0);

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        // Connect to the blockchain
        // We can use window.ethereum if available, or a default provider for localhost
        let provider;
        if (window.ethereum) {
          provider = new ethers.BrowserProvider(window.ethereum);
        } else {
          // Fallback to localhost if no wallet
          provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        }

        const currentBlock = await provider.getBlockNumber();
        setLastBlockNumber(currentBlock);

        const blockPromises = [];
        // Fetch last 20 blocks
        const startBlock = Math.max(0, currentBlock - 19);
        for (let i = currentBlock; i >= startBlock; i--) {
          blockPromises.push(provider.getBlock(i));
        }

        const fetchedBlocks = await Promise.all(blockPromises);
        setBlocks(fetchedBlocks);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching blocks:", error);
        setLoading(false);
      }
    };

    fetchBlocks();

    // Auto refresh every 10 seconds
    const interval = setInterval(fetchBlocks, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="block-explorer-container">
      <div className="explorer-header">
        <h2>📦 Blockchain Explorer</h2>
        <p>
          Theo dõi các block mới nhất trên mạng lưới để xác minh tính minh bạch.
        </p>
      </div>

      <div className="explorer-stats">
        <div className="stat-card">
          <h3>Block Hiện Tại</h3>
          <div className="stat-value">#{lastBlockNumber}</div>
        </div>
        <div className="stat-card">
          <h3>Trạng Thái Mạng</h3>
          <div className="stat-value online">🟢 Online</div>
        </div>
        <div className="stat-card">
          <h3>Chain ID</h3>
          <div className="stat-value">31337</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu blockchain...</p>
        </div>
      ) : (
        <div className="blocks-table-wrapper">
          <table className="blocks-table">
            <thead>
              <tr>
                <th>Block</th>
                <th>Hash</th>
                <th>Thời gian</th>
                <th>Giao dịch</th>
                <th>Gas Used</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block.number}>
                  <td className="block-number">
                    <span className="block-icon">🧱</span> #{block.number}
                  </td>
                  <td className="block-hash" title={block.hash}>
                    {block.hash.substring(0, 10)}...
                    {block.hash.substring(block.hash.length - 8)}
                  </td>
                  <td className="block-time">
                    {new Date(Number(block.timestamp) * 1000).toLocaleString()}
                  </td>
                  <td>
                    <span
                      className={`tx-badge ${
                        block.transactions.length > 0 ? "has-tx" : "empty"
                      }`}
                    >
                      {block.transactions.length} txs
                    </span>
                  </td>
                  <td className="gas-used">
                    {block.gasUsed ? block.gasUsed.toString() : "0"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BlockExplorer;
