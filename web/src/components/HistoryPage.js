import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import TransactionHistory from "./TransactionHistory";
import "./UserDashboard.css"; // Reuse dashboard styles for consistency

const HistoryPage = () => {
  const [userAddress, setUserAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    try {
      setLoading(true);
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);

        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          setIsConnected(true);
          setProvider(provider);
        }
      }
    } catch (err) {
      console.error("Lỗi kết nối ví:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="user-dashboard">
        <div className="no-nft">
          <h2>📜 Lịch sử giao dịch</h2>
          <p>Vui lòng kết nối ví để xem lịch sử.</p>
          <button className="user-nft-btn primary" onClick={connectWallet}>
            Kết nối ví
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <div className="user-header">
        <div>
          <h1>📜 Lịch sử giao dịch</h1>
          <p>Theo dõi các hoạt động Mint, Mua, Bán và Listing của bạn.</p>
        </div>
        <div className="user-wallet">
          <div className="user-wallet-label">Ví đã kết nối</div>
          <div className="user-wallet-address">
            {userAddress.slice(0, 8)}...{userAddress.slice(-5)}
          </div>
          <div className="user-wallet-status">
            <span></span> Online
          </div>
        </div>
      </div>

      {provider && (
        <TransactionHistory userAddress={userAddress} provider={provider} />
      )}
    </div>
  );
};

export default HistoryPage;
