import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";
import "./App.css";

// Import components
import AdminDashboard from "./components/AdminDashboard";
import AdminNFTManagement from "./components/AdminNFTManagement";
import UserDashboard from "./components/UserDashboard";
import NFTDetail from "./components/NFTDetail";
import SellNFT from "./components/SellNFT";
import ListNFT from "./components/ListNFT";
import Marketplace from "./components/Marketplace";
import MyNFTs from "./components/MyNFTs";
import TransferNFT from "./components/TransferNFT";

// Header with navigation links for user pages
const Navigation = () => {
  const linkStyle = ({ isActive }) => ({
    padding: "0.5rem 0.75rem",
    color: isActive ? "#fff" : "#2563eb",
    background: isActive ? "#2563eb" : "transparent",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: 600,
  });

  return (
    <nav
      style={{
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0.5rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#2563eb",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: 20 }}>🏍️</span>
            <span>Motorbike NFT</span>
          </h1>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <NavLink to="/user" style={linkStyle} end>
            Trang chủ
          </NavLink>
          <NavLink to="/my-nfts" style={linkStyle}>
            NFT của tôi
          </NavLink>
          <NavLink to="/marketplace" style={linkStyle}>
            Chợ
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <main className="app-main">
          <Routes>
            {/* Redirect root to user dashboard */}
            <Route path="/" element={<Navigate to="/user" replace />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/nfts" element={<AdminNFTManagement />} />

            {/* User Routes */}
            <Route path="/user" element={<UserDashboard />} />
            <Route path="/user/nft/:tokenId" element={<NFTDetail />} />
            <Route path="/user/sell/:tokenId" element={<SellNFT />} />
            <Route path="/user/list/:tokenId" element={<ListNFT />} />
            <Route path="/my-nfts" element={<MyNFTs />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/transfer" element={<TransferNFT />} />

            {/* 404 - Not Found */}
            <Route
              path="*"
              element={
                <div className="not-found">
                  <h2>🚫 Trang không tồn tại</h2>
                  <p>Trang bạn tìm kiếm không được tìm thấy.</p>
                  <div className="not-found-links">
                    <a href="/admin">👨‍💼 Trang Admin</a>
                    <a href="/user">👤 Trang User</a>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
