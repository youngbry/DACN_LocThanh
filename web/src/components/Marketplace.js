import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI as NFT_ABI } from '../blockchain/MotorbikeNFT';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '../blockchain/MotorbikeMarketplace';
import './Marketplace.css';

const Marketplace = () => {
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userAddress, setUserAddress] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterModel, setFilterModel] = useState('');

    useEffect(() => {
        loadMarketplaceNFTs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadMarketplaceNFTs = async () => {
        try {
            setLoading(true);
            
            if (typeof window.ethereum !== 'undefined') {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                const userAddr = accounts.length > 0 ? accounts[0] : '';
                setUserAddress(userAddr);
                
                const nftContract = new ethers.Contract(CONTRACT_ADDRESS, NFT_ABI, provider);
                const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
                
                // Lấy danh sách NFT đang được bán
                const activeListings = await marketplaceContract.getActiveListings();
                const nftList = [];
                
                // Lấy thông tin chi tiết từng NFT đang bán
                for (let listing of activeListings) {
                    try {
                        const nftData = await nftContract.getMotorbike(listing.tokenId);
                        const owner = await nftContract.ownerOf(listing.tokenId);
                        
                        nftList.push({
                            tokenId: Number(listing.tokenId),
                            vin: nftData.vin,
                            engineNumber: nftData.engineNumber,
                            model: nftData.model,
                            color: nftData.color,
                            year: nftData.year.toString(),
                            owner: owner,
                            seller: listing.seller,
                            price: ethers.formatEther(listing.price),
                            listedAt: new Date(Number(listing.listedAt) * 1000),
                            isOwner: owner.toLowerCase() === userAddr.toLowerCase()
                        });
                    } catch (error) {
                        console.error(`Lỗi load NFT #${listing.tokenId}:`, error);
                    }
                }
                
                setNfts(nftList);
            }
        } catch (error) {
            console.error('Lỗi load marketplace:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredNFTs = nfts.filter(nft => {
        const matchSearch = nft.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          nft.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          nft.color.toLowerCase().includes(searchTerm.toLowerCase());
        const matchYear = filterYear === '' || nft.year === filterYear;
        const matchModel = filterModel === '' || nft.model.toLowerCase().includes(filterModel.toLowerCase());
        
        return matchSearch && matchYear && matchModel;
    });

    const uniqueYears = [...new Set(nfts.map(nft => nft.year))].sort((a, b) => b - a);
    const uniqueModels = [...new Set(nfts.map(nft => nft.model))];

    const buyNFT = async (nft) => {
        const confirmed = window.confirm(
            `Xác nhận mua NFT #${nft.tokenId}?\n\n` +
            `🏍️ Xe: ${nft.model}\n` +
            `💰 Giá: ${nft.price} ETH\n` +
            `👤 Người bán: ${nft.seller}\n\n` +
            `Bạn sẽ thanh toán ${nft.price} ETH để mua NFT này.`
        );
        
        if (!confirmed) return;
        
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
            
            // Mua NFT thông qua marketplace
            const priceWei = ethers.parseEther(nft.price);
            const tx = await marketplaceContract.buyNFT(nft.tokenId, { value: priceWei });
            await tx.wait();
            
            alert(`✅ Mua NFT thành công!\n\n🏍️ NFT #${nft.tokenId}\n💰 Đã thanh toán: ${nft.price} ETH\n📋 Transaction: ${tx.hash}`);
            loadMarketplaceNFTs(); // Reload danh sách
            
        } catch (error) {
            console.error('Lỗi mua NFT:', error);
            
            let errorMessage = 'Có lỗi xảy ra khi mua NFT';
            if (error.message.includes('user rejected')) {
                errorMessage = 'Bạn đã từ chối giao dịch';
            } else if (error.message.includes('insufficient funds')) {
                errorMessage = 'Không đủ ETH để mua NFT này';
            } else if (error.message.includes('Cannot buy your own NFT')) {
                errorMessage = 'Không thể mua NFT của chính mình';
            }
            
            alert('❌ ' + errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="marketplace-loading">
                <div className="spinner"></div>
                <p>Đang tải marketplace...</p>
            </div>
        );
    }

    return (
        <div className="marketplace">
            <div className="marketplace-header">
                <h1>🏪 Marketplace NFT Xe Máy</h1>
                <p className="marketplace-subtitle">
                    Khám phá và sở hữu các NFT xe máy độc đáo
                </p>
            </div>

            <div className="marketplace-filters">
                <div className="filter-group">
                    <input
                        type="text"
                        placeholder="🔍 Tìm kiếm theo tên xe, VIN, màu sắc..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                
                <div className="filter-group">
                    <select 
                        value={filterYear} 
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Tất cả năm</option>
                        {uniqueYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                
                <div className="filter-group">
                    <input
                        type="text"
                        placeholder="Lọc theo mẫu xe..."
                        value={filterModel}
                        onChange={(e) => setFilterModel(e.target.value)}
                        className="filter-input"
                    />
                </div>
            </div>

            <div className="marketplace-stats">
                <div className="stat-item">
                    <span className="stat-number">{nfts.length}</span>
                    <span className="stat-label">Tổng NFT</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">{filteredNFTs.length}</span>
                    <span className="stat-label">Hiển thị</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">{nfts.filter(n => n.isOwner).length}</span>
                    <span className="stat-label">Của tôi</span>
                </div>
            </div>

            {filteredNFTs.length === 0 ? (
                <div className="no-nfts">
                    <div className="no-nfts-icon">🔍</div>
                    <h3>Không tìm thấy NFT nào</h3>
                    <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
            ) : (
                <div className="nft-grid">
                    {filteredNFTs.map((nft) => (
                        <div key={nft.tokenId} className={`nft-card ${nft.isOwner ? 'owned' : ''}`}>
                            <div className="nft-header">
                                <span className="nft-id">#{nft.tokenId}</span>
                                <span className="nft-year">{nft.year}</span>
                                {nft.isOwner && <span className="owner-badge">👑 Của tôi</span>}
                            </div>
                            
                            <h3 className="nft-title">{nft.model}</h3>
                            
                            <div className="nft-details">
                                <div className="detail-item">
                                    <span className="detail-label">VIN:</span>
                                    <span className="detail-value">{nft.vin.slice(0, 8)}...</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Màu:</span>
                                    <span className="detail-value">{nft.color}</span>
                                </div>
                            </div>
                            
                            <div className="nft-price">
                                <span className="price-label">💰 Giá bán:</span>
                                <span className="price-value">{nft.price} ETH</span>
                            </div>
                            
                            <div className="nft-seller">
                                <span className="seller-label">Người bán:</span>
                                <span className="seller-address">
                                    {nft.seller.slice(0, 6)}...{nft.seller.slice(-4)}
                                </span>
                            </div>
                            
                            <div className="nft-actions">
                                <Link 
                                    to={`/user/nft/${nft.tokenId}`} 
                                    className="action-btn view"
                                >
                                    👁️ Xem chi tiết
                                </Link>
                                
                                {nft.isOwner ? (
                                    <button 
                                        className="action-btn owned"
                                        disabled
                                    >
                                        � NFT của tôi
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => buyNFT(nft)}
                                        className="action-btn buy"
                                    >
                                        🛒 Mua {nft.price} ETH
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Marketplace;