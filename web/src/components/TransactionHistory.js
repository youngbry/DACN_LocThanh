import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS as NFT_ADDRESS,
  ABI as NFT_ABI,
} from "../blockchain/MotorbikeNFT";
import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
} from "../blockchain/MotorbikeMarketplace";
import "./TransactionHistory.css";

const TransactionHistory = ({ userAddress, provider }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL"); // ALL, MINT, BUY, SELL, LIST, SEND, RECEIVE

  useEffect(() => {
    if (userAddress && provider) {
      fetchHistory();
    }
  }, [userAddress, provider]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const nftContract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, provider);
      const marketContract = new ethers.Contract(
        MARKETPLACE_ADDRESS,
        MARKETPLACE_ABI,
        provider
      );

      // 1. Get Mints (Transfer from 0x0 to User)
      const mintFilter = nftContract.filters.Transfer(
        ethers.ZeroAddress,
        userAddress
      );
      const mintEvents = await nftContract.queryFilter(mintFilter);
      const mints = mintEvents.map((e) => ({
        type: "MINT",
        tokenId: e.args[2].toString(),
        hash: e.transactionHash,
        blockNumber: e.blockNumber,
        details: "Minted new NFT",
        price: "-",
      }));

      // 2. Get Buys (NFTSold where buyer is User)
      const buyFilter = marketContract.filters.NFTSold(null, null, userAddress);
      const buyEvents = await marketContract.queryFilter(buyFilter);
      const buys = buyEvents.map((e) => ({
        type: "BUY",
        tokenId: e.args[0].toString(),
        hash: e.transactionHash,
        blockNumber: e.blockNumber,
        details: `Bought from ${e.args[1].slice(0, 6)}...${e.args[1].slice(
          -4
        )}`,
        price: Number(e.args[3]).toLocaleString() + " VND",
      }));

      // 3. Get Sells (NFTSold where seller is User)
      const sellFilter = marketContract.filters.NFTSold(
        null,
        userAddress,
        null
      );
      const sellEvents = await marketContract.queryFilter(sellFilter);
      const sells = sellEvents.map((e) => ({
        type: "SELL",
        tokenId: e.args[0].toString(),
        hash: e.transactionHash,
        blockNumber: e.blockNumber,
        details: `Sold to ${e.args[2].slice(0, 6)}...${e.args[2].slice(-4)}`,
        price: Number(e.args[3]).toLocaleString() + " VND",
      }));

      // 4. Get Listings (NFTListed where seller is User)
      const listFilter = marketContract.filters.NFTListed(null, userAddress);
      const listEvents = await marketContract.queryFilter(listFilter);
      const listings = listEvents.map((e) => ({
        type: "LIST",
        tokenId: e.args[0].toString(),
        hash: e.transactionHash,
        blockNumber: e.blockNumber,
        details: "Listed on Marketplace",
        price: Number(e.args[2]).toLocaleString() + " VND",
      }));

      // 5. Get Transfers (Send/Receive)
      // Sent by User
      const sentFilter = nftContract.filters.Transfer(userAddress, null);
      const sentEvents = await nftContract.queryFilter(sentFilter);

      // Received by User
      const receivedFilter = nftContract.filters.Transfer(null, userAddress);
      const receivedEvents = await nftContract.queryFilter(receivedFilter);

      // Create Sets of hashes for existing known types to avoid duplicates
      const buyHashes = new Set(buys.map((t) => t.hash));
      const sellHashes = new Set(sells.map((t) => t.hash));
      const mintHashes = new Set(mints.map((t) => t.hash));

      const transfers = [];

      // Process Sent
      for (const e of sentEvents) {
        if (sellHashes.has(e.transactionHash)) continue; // Already covered by SELL

        transfers.push({
          type: "SEND",
          tokenId: e.args[2].toString(),
          hash: e.transactionHash,
          blockNumber: e.blockNumber,
          details: `Sent to ${e.args[1].slice(0, 6)}...${e.args[1].slice(-4)}`,
          price: "-",
        });
      }

      // Process Received
      for (const e of receivedEvents) {
        if (buyHashes.has(e.transactionHash)) continue; // Already covered by BUY
        if (mintHashes.has(e.transactionHash)) continue; // Already covered by MINT
        if (e.args[0] === ethers.ZeroAddress) continue; // Double check

        transfers.push({
          type: "RECEIVE",
          tokenId: e.args[2].toString(),
          hash: e.transactionHash,
          blockNumber: e.blockNumber,
          details: `Received from ${e.args[0].slice(0, 6)}...${e.args[0].slice(
            -4
          )}`,
          price: "-",
        });
      }

      // Combine and Sort by Block Number (descending)
      const allTx = [
        ...mints,
        ...buys,
        ...sells,
        ...listings,
        ...transfers,
      ].sort((a, b) => b.blockNumber - a.blockNumber);

      setTransactions(allTx);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="history-loading">⏳ Đang tải lịch sử giao dịch...</div>
    );
  if (transactions.length === 0) return null;

  const filteredTransactions =
    filter === "ALL"
      ? transactions
      : transactions.filter((tx) => tx.type === filter);

  return (
    <div className="transaction-history">
      <div className="history-header">
        <h3>📜 Lịch sử giao dịch</h3>
        <div className="history-filters">
          <button
            className={`filter-btn ${filter === "ALL" ? "active" : ""}`}
            onClick={() => setFilter("ALL")}
          >
            Tất cả
          </button>
          <button
            className={`filter-btn ${filter === "MINT" ? "active" : ""}`}
            onClick={() => setFilter("MINT")}
          >
            Mint
          </button>
          <button
            className={`filter-btn ${filter === "BUY" ? "active" : ""}`}
            onClick={() => setFilter("BUY")}
          >
            Mua
          </button>
          <button
            className={`filter-btn ${filter === "SELL" ? "active" : ""}`}
            onClick={() => setFilter("SELL")}
          >
            Bán
          </button>
          <button
            className={`filter-btn ${filter === "LIST" ? "active" : ""}`}
            onClick={() => setFilter("LIST")}
          >
            Listing
          </button>
          <button
            className={`filter-btn ${filter === "SEND" ? "active" : ""}`}
            onClick={() => setFilter("SEND")}
          >
            Gửi
          </button>
          <button
            className={`filter-btn ${filter === "RECEIVE" ? "active" : ""}`}
            onClick={() => setFilter("RECEIVE")}
          >
            Nhận
          </button>
        </div>
      </div>

      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Loại</th>
              <th>Token ID</th>
              <th>Chi tiết</th>
              <th>Giá</th>
              <th>Block</th>
              <th>Hash</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx, index) => (
                <tr key={index}>
                  <td>
                    <span className={`tx-badge ${tx.type.toLowerCase()}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td>#{tx.tokenId}</td>
                  <td>{tx.details}</td>
                  <td>{tx.price}</td>
                  <td>{tx.blockNumber}</td>
                  <td>
                    <a
                      href={`https://etherscan.io/tx/${tx.hash}`} // Placeholder for localhost
                      target="_blank"
                      rel="noopener noreferrer"
                      title={tx.hash}
                      onClick={(e) => e.preventDefault()} // Prevent link on localhost
                    >
                      {tx.hash.slice(0, 6)}...
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Không tìm thấy giao dịch nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;
