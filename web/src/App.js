import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import Admin components
import AdminDashboard from './components/AdminDashboard';
import AdminNFTManagement from './components/AdminNFTManagement';

// Import User components
import UserDashboard from './components/UserDashboard';
import NFTDetail from './components/NFTDetail';
import SellNFT from './components/SellNFT';
import ListNFT from './components/ListNFT';
import Marketplace from './components/Marketplace';
import MyNFTs from './components/MyNFTs';

function App() {
  return (
    <Router>
      <div className="app-container">
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
            
            {/* 404 - Not Found */}
            <Route path="*" element={
              <div className="not-found">
                <h2>🚫 Trang không tồn tại</h2>
                <p>Trang bạn tìm kiếm không được tìm thấy.</p>
                <div className="not-found-links">
                  <a href="/admin">👨‍💼 Trang Admin</a>
                  <a href="/user">👤 Trang User</a>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
