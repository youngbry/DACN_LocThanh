import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI as CONTRACT_ABI } from '../blockchain/MotorbikeNFT';
import './UserDashboard.css';

const UserDashboard = () => {
    const [userAddress, setUserAddress] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [myNFTs, setMyNFTs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        myNFTCount: 0,
        totalSystemNFTs: 0
    });

    useEffect(() => {
        connectAndLoadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const connectAndLoadData = async () => {
        try {
            setLoading(true);
            
            if (typeof window.ethereum !== 'undefined') {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                
                if (accounts.length > 0) {
                    const userAddr = accounts[0];
                    setUserAddress(userAddr);
                    setIsConnected(true);
                    
                    await loadUserNFTs(provider, userAddr);
                }
            }
        } catch (error) {
            console.error('Lỗi kết nối:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserNFTs = async (provider, userAddr) => {
        try {
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
            
            // Get total supply
            const totalSupply = await contract.totalSupply();
            
            // Find NFTs owned by user
            const userNFTs = [];
            
            for (let i = 0; i < totalSupply; i++) {
                try {
                    const owner = await contract.ownerOf(i);
                    if (owner.toLowerCase() === userAddr.toLowerCase()) {
                        const nftData = await contract.getMotorbike(i);
                        
                        // Get transfer history
                        const transferEvents = await contract.queryFilter(
                            contract.filters.Transfer(null, null, i)
                        );
                        
                        // Sort by block number
                        const sortedTransfers = transferEvents.sort(
                            (a, b) => a.blockNumber - b.blockNumber
                        );
                        
                        // Get block timestamps for transfer history
                        const transferHistory = [];
                        for (const transfer of sortedTransfers) {
                            const block = await provider.getBlock(transfer.blockNumber);
                            transferHistory.push({
                                from: transfer.args.from,
                                to: transfer.args.to,
                                blockNumber: transfer.blockNumber,
                                timestamp: new Date(block.timestamp * 1000),
                                transactionHash: transfer.transactionHash
                            });
                        }
                        
                        userNFTs.push({
                            tokenId: i,
                            vin: nftData.vin,
                            engineNumber: nftData.engineNumber,
                            model: nftData.model,
                            color: nftData.color,
                            year: nftData.year.toString(),
                            owner: owner,
                            transferHistory: transferHistory,
                            transferCount: transferHistory.length
                        });
                    }
                } catch (error) {
                    console.log(`Token ${i} không tồn tại hoặc lỗi:`, error.message);
                }
            }
            
            setMyNFTs(userNFTs);
            setStats({
                myNFTCount: userNFTs.length,
                totalSystemNFTs: Number(totalSupply)
            });
            
        } catch (error) {
            console.error('Lỗi load NFTs:', error);
        }
    };

    const connectWallet = async () => {
        try {
            if (typeof window.ethereum !== 'undefined') {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                await connectAndLoadData();
            } else {
                alert('Vui lòng cài đặt Rabby hoặc MetaMask!');
            }
        } catch (error) {
            console.error('Lỗi kết nối ví:', error);
        }
    };

    if (!isConnected) {
        return (
            <div className="user-dashboard">
                <div className="user-connect">
                    <div className="connect-card">
                        <h1>👤 User Dashboard</h1>
                        <p>Kết nối ví để xem NFT xe máy của bạn</p>
                        <button className="connect-btn" onClick={connectWallet}>
                            Kết nối ví của tôi
                        </button>
                        <div className="admin-link">
                            <Link to="/admin">
                                👨‍💼 Đi đến trang Admin
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="user-dashboard">
            <div className="user-header">
                <h1>👤 Dashboard người dùng</h1>
                <div className="user-info">
                    <span className="user-label">Ví của tôi:</span>
                    <span className="user-address">
                        {userAddress.slice(0, 8)}...{userAddress.slice(-6)}
                    </span>
                    <div className="connection-status">✅ Đã kết nối</div>
                </div>
            </div>

            <div className="user-stats">
                <div className="stat-card">
                    <div className="stat-icon">🏍️</div>
                    <div className="stat-content">
                        <h3>NFT của tôi</h3>
                        <div className="stat-number">{stats.myNFTCount}</div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">🌐</div>
                    <div className="stat-content">
                        <h3>Tổng NFT hệ thống</h3>
                        <div className="stat-number">{stats.totalSystemNFTs}</div>
                    </div>
                </div>
            </div>

            <div className="user-content">
                {loading ? (
                    <div className="loading-section">
                        <div className="spinner"></div>
                        <p>Đang tải NFT của bạn...</p>
                    </div>
                ) : myNFTs.length === 0 ? (
                    <div className="no-nfts">
                        <div className="no-nfts-icon">🏍️</div>
                        <h3>Bạn chưa sở hữu NFT nào</h3>
                        <p>Liên hệ admin để được cấp phát NFT xe máy hoặc mua từ người khác</p>
                        <div className="no-nfts-actions">
                            <Link to="/admin" className="admin-link-btn">
                                👨‍💼 Trang Admin
                            </Link>
                            <Link to="/marketplace" className="marketplace-link-btn">
                                🏪 Marketplace
                            </Link>
                            <button onClick={connectAndLoadData} className="refresh-btn">
                                🔄 Làm mới
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="my-nfts-section">
                        <div className="section-header">
                            <h2>🏍️ NFT xe máy của tôi</h2>
                            <div className="header-actions">
                                <Link to="/marketplace" className="marketplace-btn">
                                    🏪 Marketplace
                                </Link>
                                <button onClick={connectAndLoadData} className="refresh-btn">
                                    🔄 Làm mới
                                </button>
                            </div>
                        </div>
                        
                        <div className="nfts-grid">
                            {myNFTs.map((nft) => (
                                <div key={nft.tokenId} className="user-nft-card">
                                    <div className="nft-card-header">
                                        <span className="nft-id">#{nft.tokenId}</span>
                                        <span className="nft-year">{nft.year}</span>
                                        <span className="transfer-badge">
                                            {nft.transferCount} lần chuyển
                                        </span>
                                    </div>
                                    
                                    <div className="nft-card-body">
                                        <h3 className="nft-model">{nft.model}</h3>
                                        
                                        <div className="nft-details">
                                            <div className="detail-row">
                                                <span className="detail-label">🆔 VIN:</span>
                                                <span className="detail-value">{nft.vin}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">⚙️ Số máy:</span>
                                                <span className="detail-value">{nft.engineNumber}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">🎨 Màu:</span>
                                                <span className="detail-value">{nft.color}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="nft-card-actions">
                                        <Link 
                                            to={`/user/nft/${nft.tokenId}`}
                                            className="action-btn detail"
                                        >
                                            👁️ Xem chi tiết & lịch sử
                                        </Link>
                                        <Link 
                                            to={`/user/sell/${nft.tokenId}`}
                                            className="action-btn sell"
                                        >
                                            💸 Bán NFT này
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="user-footer">
                <div className="footer-actions">
                    <Link to="/admin" className="admin-btn">
                        👨‍💼 Chuyển sang Admin
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;