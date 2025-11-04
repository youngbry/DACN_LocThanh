import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI as NFT_ABI } from '../blockchain/MotorbikeNFT';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '../blockchain/MotorbikeMarketplace';
import './ListNFT.css';

const ListNFT = () => {
    const { tokenId } = useParams();
    const navigate = useNavigate();
    const [nft, setNft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [listing, setListing] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [price, setPrice] = useState('');
    const [isApproved, setIsApproved] = useState(false);

    useEffect(() => {
        loadNFTInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenId]);

    const loadNFTInfo = async () => {
        try {
            setLoading(true);
            
            if (typeof window.ethereum !== 'undefined') {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                const userAddr = accounts.length > 0 ? accounts[0] : '';
                setUserAddress(userAddr);
                
                const nftContract = new ethers.Contract(CONTRACT_ADDRESS, NFT_ABI, provider);
                
                // Lấy thông tin NFT
                const nftData = await nftContract.getMotorbike(tokenId);
                const owner = await nftContract.ownerOf(tokenId);
                
                setNft({
                    tokenId: tokenId,
                    vin: nftData.vin,
                    engineNumber: nftData.engineNumber,
                    model: nftData.model,
                    color: nftData.color,
                    year: nftData.year.toString(),
                    currentOwner: owner
                });
                
                // Kiểm tra quyền sở hữu
                const ownerCheck = owner.toLowerCase() === userAddr.toLowerCase();
                setIsOwner(ownerCheck);
                
                if (!ownerCheck) {
                    alert('Bạn không phải chủ sở hữu của NFT này!');
                    navigate('/user');
                    return;
                }

                // Kiểm tra approve
                const approvedAddress = await nftContract.getApproved(tokenId);
                const isApprovedForAll = await nftContract.isApprovedForAll(userAddr, MARKETPLACE_ADDRESS);
                setIsApproved(approvedAddress === MARKETPLACE_ADDRESS || isApprovedForAll);
            }
        } catch (error) {
            console.error('Lỗi load NFT info:', error);
            alert('Có lỗi xảy ra khi tải thông tin NFT');
            navigate('/user');
        } finally {
            setLoading(false);
        }
    };

    const approveMarketplace = async () => {
        try {
            setListing(true);
            
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const nftContract = new ethers.Contract(CONTRACT_ADDRESS, NFT_ABI, signer);
            
            console.log('Đang approve marketplace...');
            const tx = await nftContract.approve(MARKETPLACE_ADDRESS, tokenId);
            await tx.wait();
            
            setIsApproved(true);
            alert('✅ Đã cấp quyền cho marketplace!');
            
        } catch (error) {
            console.error('Lỗi approve:', error);
            alert('❌ Có lỗi khi cấp quyền cho marketplace');
        } finally {
            setListing(false);
        }
    };

    const listNFT = async () => {
        if (!price || parseFloat(price) <= 0) {
            alert('Vui lòng nhập giá hợp lệ!');
            return;
        }

        const confirmed = window.confirm(
            `⚠️ Xác nhận đăng bán NFT?\n\n` +
            `🏍️ Xe: ${nft.model}\n` +
            `🆔 VIN: ${nft.vin}\n` +
            `💰 Giá: ${price} ETH\n\n` +
            `NFT sẽ được hiển thị trên marketplace cho mọi người mua!`
        );
        
        if (!confirmed) return;

        try {
            setListing(true);
            
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
            
            console.log('Đang đăng bán NFT...');
            const priceWei = ethers.parseEther(price);
            const tx = await marketplaceContract.listNFT(tokenId, priceWei);
            await tx.wait();
            
            alert(
                `✅ Đăng bán NFT thành công!\n\n` +
                `🏍️ NFT #${tokenId} đã được đăng bán với giá ${price} ETH\n` +
                `📋 Transaction: ${tx.hash}`
            );
            
            navigate('/marketplace');
            
        } catch (error) {
            console.error('Lỗi đăng bán NFT:', error);
            
            let errorMessage = 'Có lỗi xảy ra khi đăng bán NFT';
            if (error.message.includes('user rejected')) {
                errorMessage = 'Bạn đã từ chối giao dịch';
            } else if (error.message.includes('insufficient funds')) {
                errorMessage = 'Không đủ gas fee để thực hiện giao dịch';
            } else if (error.message.includes('already listed')) {
                errorMessage = 'NFT này đã được đăng bán rồi';
            }
            
            alert('❌ ' + errorMessage);
        } finally {
            setListing(false);
        }
    };

    if (loading) {
        return (
            <div className="list-nft-loading">
                <div className="spinner"></div>
                <p>Đang tải thông tin NFT...</p>
            </div>
        );
    }

    if (!nft || !isOwner) {
        return (
            <div className="list-nft-error">
                <div className="error-icon">❌</div>
                <h2>Không thể đăng bán NFT</h2>
                <p>Bạn không phải chủ sở hữu của NFT này hoặc NFT không tồn tại</p>
                <Link to="/user" className="back-btn">
                    ← Quay về Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="list-nft">
            <div className="list-nft-header">
                <h1>🏪 Đăng bán NFT #{tokenId}</h1>
                <div className="info-badge">
                    💡 NFT sẽ hiển thị trên marketplace
                </div>
            </div>

            <div className="list-nft-content">
                <div className="nft-preview-section">
                    <h3>🏍️ Thông tin xe cần bán</h3>
                    <div className="nft-preview-card">
                        <div className="preview-header">
                            <span className="preview-id">#{tokenId}</span>
                            <span className="preview-year">{nft.year}</span>
                        </div>
                        
                        <h4 className="preview-model">{nft.model}</h4>
                        
                        <div className="preview-details">
                            <div className="preview-item">
                                <span className="preview-label">VIN:</span>
                                <span className="preview-value">{nft.vin}</span>
                            </div>
                            <div className="preview-item">
                                <span className="preview-label">Số máy:</span>
                                <span className="preview-value">{nft.engineNumber}</span>
                            </div>
                            <div className="preview-item">
                                <span className="preview-label">Màu sắc:</span>
                                <span className="preview-value">{nft.color}</span>
                            </div>
                        </div>
                        
                        <div className="current-owner">
                            <span className="owner-label">Chủ sở hữu:</span>
                            <span className="owner-address">
                                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="listing-form-section">
                    <h3>💰 Đặt giá bán</h3>
                    
                    {!isApproved ? (
                        <div className="approval-section">
                            <div className="approval-info">
                                <h4>🔐 Cần cấp quyền trước</h4>
                                <p>Bạn cần cấp quyền cho marketplace để có thể bán NFT</p>
                            </div>
                            <button 
                                onClick={approveMarketplace}
                                className="approve-btn"
                                disabled={listing}
                            >
                                {listing ? (
                                    <>
                                        <div className="btn-spinner"></div>
                                        Đang cấp quyền...
                                    </>
                                ) : (
                                    '🔓 Cấp quyền cho Marketplace'
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="pricing-form">
                            <div className="form-group">
                                <label htmlFor="price">
                                    Giá bán (ETH) *
                                </label>
                                <input
                                    type="number"
                                    id="price"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.1"
                                    step="0.001"
                                    min="0"
                                    disabled={listing}
                                />
                                <small className="form-hint">
                                    Nhập giá bán bằng ETH (ví dụ: 0.1)
                                </small>
                            </div>

                            <div className="info-box">
                                <div className="info-icon">📋</div>
                                <div className="info-content">
                                    <h4>Lưu ý khi đăng bán:</h4>
                                    <ul>
                                        <li>NFT sẽ hiển thị trên marketplace công khai</li>
                                        <li>Mọi người có thể mua với giá bạn đặt</li>
                                        <li>Bạn có thể hủy đăng bán bất cứ lúc nào</li>
                                        <li>Khi có người mua, ETH sẽ chuyển vào ví của bạn</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="form-actions">
                                <Link 
                                    to={`/user/nft/${tokenId}`} 
                                    className="action-btn cancel"
                                >
                                    ❌ Hủy
                                </Link>
                                <button 
                                    onClick={listNFT}
                                    className="action-btn list"
                                    disabled={listing || !price}
                                >
                                    {listing ? (
                                        <>
                                            <div className="btn-spinner"></div>
                                            Đang đăng bán...
                                        </>
                                    ) : (
                                        '🏪 Đăng bán NFT'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ListNFT;