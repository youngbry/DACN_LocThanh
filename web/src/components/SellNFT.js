import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI as CONTRACT_ABI } from '../blockchain/MotorbikeNFT';
import './SellNFT.css';

const SellNFT = () => {
    const { tokenId } = useParams();
    const navigate = useNavigate();
    const [nft, setNft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [transferring, setTransferring] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [formData, setFormData] = useState({
        buyerAddress: '',
        confirmAddress: ''
    });
    const [errors, setErrors] = useState({});

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
                
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
                
                // Lấy thông tin NFT
                const nftData = await contract.getMotorbike(tokenId);
                const owner = await contract.ownerOf(tokenId);
                
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
                    navigate('/my-nfts');
                }
            }
        } catch (error) {
            console.error('Lỗi load NFT info:', error);
            alert('Có lỗi xảy ra khi tải thông tin NFT');
            navigate('/my-nfts');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.buyerAddress.trim()) {
            newErrors.buyerAddress = 'Vui lòng nhập địa chỉ người mua';
        } else if (!ethers.isAddress(formData.buyerAddress)) {
            newErrors.buyerAddress = 'Địa chỉ ví không hợp lệ';
        } else if (formData.buyerAddress.toLowerCase() === userAddress.toLowerCase()) {
            newErrors.buyerAddress = 'Không thể chuyển cho chính mình';
        }
        
        if (formData.buyerAddress !== formData.confirmAddress) {
            newErrors.confirmAddress = 'Địa chỉ xác nhận không khớp';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        const confirmed = window.confirm(
            `⚠️ CẢNH BÁO: Bạn có chắc chắn muốn chuyển NFT này?\n\n` +
            `🏍️ Xe: ${nft.model}\n` +
            `🆔 VIN: ${nft.vin}\n` +
            `👤 Người nhận: ${formData.buyerAddress}\n\n` +
            `Hành động này KHÔNG THỂ HOÀN TÁC!`
        );
        
        if (!confirmed) {
            return;
        }

        try {
            setTransferring(true);
            
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            
            console.log('Đang chuyển NFT...');
            const tx = await contract.transferFrom(
                userAddress,
                formData.buyerAddress,
                tokenId
            );
            
            console.log(`Transaction hash: ${tx.hash}`);
            
            // Đợi transaction được confirm
            const receipt = await tx.wait();
            console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
            
            alert(
                `✅ Chuyển NFT thành công!\n\n` +
                `🏍️ NFT #${tokenId} đã được chuyển cho:\n` +
                `${formData.buyerAddress}\n\n` +
                `📋 Transaction: ${tx.hash}`
            );
            
            // Chuyển về trang My NFTs
            navigate('/my-nfts');
            
        } catch (error) {
            console.error('Lỗi transfer NFT:', error);
            
            let errorMessage = 'Có lỗi xảy ra khi chuyển NFT';
            if (error.message.includes('user rejected')) {
                errorMessage = 'Bạn đã từ chối giao dịch';
            } else if (error.message.includes('insufficient funds')) {
                errorMessage = 'Không đủ gas fee để thực hiện giao dịch';
            }
            
            alert('❌ ' + errorMessage);
        } finally {
            setTransferring(false);
        }
    };

    if (loading) {
        return (
            <div className="sell-nft-loading">
                <div className="spinner"></div>
                <p>Đang tải thông tin NFT...</p>
            </div>
        );
    }

    if (!nft || !isOwner) {
        return (
            <div className="sell-nft-error">
                <div className="error-icon">❌</div>
                <h2>Không thể bán NFT</h2>
                <p>Bạn không phải chủ sở hữu của NFT này hoặc NFT không tồn tại</p>
                <Link to="/my-nfts" className="back-btn">
                    ← Quay về NFT của tôi
                </Link>
            </div>
        );
    }

    return (
        <div className="sell-nft">
            <div className="sell-nft-header">
                <h1>💸 Bán NFT #{tokenId}</h1>
                <div className="warning-badge">
                    ⚠️ Thao tác không thể hoàn tác
                </div>
            </div>

            <div className="sell-nft-content">
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
                            <span className="owner-label">Chủ sở hữu hiện tại:</span>
                            <span className="owner-address">
                                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="transfer-form-section">
                    <h3>👤 Thông tin người mua</h3>
                    <form onSubmit={handleTransfer} className="transfer-form">
                        <div className="form-group">
                            <label htmlFor="buyerAddress">
                                Địa chỉ ví người mua *
                            </label>
                            <input
                                type="text"
                                id="buyerAddress"
                                name="buyerAddress"
                                value={formData.buyerAddress}
                                onChange={handleInputChange}
                                placeholder="0x..."
                                className={errors.buyerAddress ? 'error' : ''}
                                disabled={transferring}
                            />
                            {errors.buyerAddress && (
                                <span className="error-message">{errors.buyerAddress}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmAddress">
                                Xác nhận địa chỉ ví *
                            </label>
                            <input
                                type="text"
                                id="confirmAddress"
                                name="confirmAddress"
                                value={formData.confirmAddress}
                                onChange={handleInputChange}
                                placeholder="Nhập lại địa chỉ ví để xác nhận"
                                className={errors.confirmAddress ? 'error' : ''}
                                disabled={transferring}
                            />
                            {errors.confirmAddress && (
                                <span className="error-message">{errors.confirmAddress}</span>
                            )}
                        </div>

                        <div className="warning-box">
                            <div className="warning-icon">⚠️</div>
                            <div className="warning-content">
                                <h4>Lưu ý quan trọng:</h4>
                                <ul>
                                    <li>Kiểm tra kỹ địa chỉ ví người nhận</li>
                                    <li>Giao dịch không thể hoàn tác sau khi thực hiện</li>
                                    <li>Đảm bảo bạn tin tưởng người nhận</li>
                                    <li>Phí gas sẽ được trừ từ ví của bạn</li>
                                </ul>
                            </div>
                        </div>

                        <div className="form-actions">
                            <Link 
                                to={`/nft/${tokenId}`} 
                                className="action-btn cancel"
                                disabled={transferring}
                            >
                                ❌ Hủy
                            </Link>
                            <button 
                                type="submit" 
                                className="action-btn transfer"
                                disabled={transferring}
                            >
                                {transferring ? (
                                    <>
                                        <div className="btn-spinner"></div>
                                        Đang chuyển...
                                    </>
                                ) : (
                                    '💸 Chuyển NFT'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SellNFT;