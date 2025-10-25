import React from 'react';
import './App.css';
import AdminRegisterMotorbike from './components/AdminRegisterMotorbike';
import SearchMotorbike from './components/SearchMotorbike';
import TransferNFT from './components/TransferNFT';

function App() {
  return (
    <div className="App" style={{maxWidth:600, margin:'0 auto', padding:'20px'}}>
      <h1>Quản lý NFT Xe Máy</h1>
      <AdminRegisterMotorbike />
      <hr />
      <SearchMotorbike />
      <hr />
      <TransferNFT />
    </div>
  );
}

export default App;
