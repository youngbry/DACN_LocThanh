import React from 'react';
import './App.css';
import AdminRegisterMotorbike from './components/AdminRegisterMotorbike';
import SearchMotorbike from './components/SearchMotorbike';
import TransferNFT from './components/TransferNFT';
import MotorbikeList from './components/MotorbikeList';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">Quản lý NFT Xe Máy</div>
        <div className="subtitle">Đăng ký, tra cứu và chuyển nhượng NFT cho xe máy — giao diện demo</div>
      </header>

      <main className="grid">
        <section className="card full">
          <AdminRegisterMotorbike />
        </section>

        <section className="card full">
          <MotorbikeList />
        </section>

        <section className="card">
          <SearchMotorbike />
        </section>

        <section className="card">
          <TransferNFT />
        </section>
      </main>
    </div>
  );
}

export default App;
