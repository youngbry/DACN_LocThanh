import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ABI, CONTRACT_ADDRESS } from '../blockchain/MotorbikeNFT';

function NFTOwnershipHistory({ tokenId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadOwnershipHistory = async () => {
    if (!tokenId) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Kết nối với blockchain
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      
      // Lấy tất cả Transfer events cho tokenId này
      const transferFilter = contract.filters.Transfer(null, null, tokenId);
      const events = await contract.queryFilter(transferFilter);
      
      console.log(`Found ${events.length} transfer events for token #${tokenId}`);
      
      // Xử lý từng event để tạo lịch sử
      const ownershipHistory = await Promise.all(
        events.map(async (event, index) => {
          const block = await provider.getBlock(event.blockNumber);
          const transaction = await provider.getTransaction(event.transactionHash);
          
          return {
            step: index + 1,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            from: event.args.from,
            to: event.args.to,
            timestamp: new Date(block.timestamp * 1000),
            gasUsed: transaction ? transaction.gasLimit.toString() : 'N/A',
            eventType: event.args.from === '0x0000000000000000000000000000000000000000' ? 'Mint' : 'Transfer'
          };
        })
      );
      
      // Sắp xếp theo thời gian (cũ nhất trước)
      ownershipHistory.sort((a, b) => a.blockNumber - b.blockNumber);
      
      setHistory(ownershipHistory);
      
    } catch (err) {
      console.error('Error loading ownership history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnershipHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId]);

  const formatAddress = (address) => {
    if (address === '0x0000000000000000000000000000000000000000') {
      return 'Chưa có chủ (Mint)';
    }
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  const getOwnerLabel = (address, eventType) => {
    if (address === '0x0000000000000000000000000000000000000000') {
      return 'Mint từ hệ thống';
    }
    
    // Có thể thêm mapping tên thật nếu có
    const knownAddresses = {
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266': 'Admin/Cửa hàng xe',
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': 'Người dùng A',
      '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': 'Người dùng B'
    };
    
    return knownAddresses[address.toLowerCase()] || formatAddress(address);
  };

  if (loading) {
    return <div style={{padding: '20px', textAlign: 'center'}}>🔍 Đang tải lịch sử chủ sở hữu...</div>;
  }

  if (error) {
    return <div style={{padding: '20px', color: 'red'}}>❌ Lỗi: {error}</div>;
  }

  if (history.length === 0) {
    return <div style={{padding: '20px', color: '#666'}}>Không tìm thấy lịch sử cho NFT này</div>;
  }

  return (
    <div style={{padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '20px'}}>
      <h3>📜 Lịch sử chủ sở hữu NFT #{tokenId}</h3>
      <p style={{color: '#666', fontSize: '14px'}}>
        Tất cả các giao dịch chuyển nhượng được ghi lại vĩnh viễn trên blockchain
      </p>
      
      <div style={{marginTop: '15px'}}>
        {history.map((record, index) => (
          <div key={index} style={{
            padding: '15px',
            border: '1px solid #eee',
            borderRadius: '6px',
            marginBottom: '10px',
            backgroundColor: record.eventType === 'Mint' ? '#f0f8ff' : '#f9f9f9'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div style={{flex: 1}}>
                <div style={{fontWeight: 'bold', color: record.eventType === 'Mint' ? '#0066cc' : '#333'}}>
                  {record.eventType === 'Mint' ? '🎯 Tạo NFT' : '🔄 Chuyển nhượng'} (Bước {record.step})
                </div>
                
                <div style={{marginTop: '8px'}}>
                  {record.eventType === 'Mint' ? (
                    <div>
                      <strong>Được tạo cho:</strong> {getOwnerLabel(record.to, record.eventType)}
                      <br />
                      <span style={{color: '#666', fontSize: '12px'}}>
                        Địa chỉ: {record.to}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <strong>Từ:</strong> {getOwnerLabel(record.from, record.eventType)}
                      <br />
                      <strong>Đến:</strong> {getOwnerLabel(record.to, record.eventType)}
                      <br />
                      <span style={{color: '#666', fontSize: '12px'}}>
                        {record.from} → {record.to}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{textAlign: 'right', fontSize: '12px', color: '#666'}}>
                <div><strong>Block:</strong> #{record.blockNumber}</div>
                <div><strong>Thời gian:</strong> {record.timestamp.toLocaleString('vi-VN')}</div>
                <div>
                  <a 
                    href={`https://localhost:8545/tx/${record.transactionHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{color: '#0066cc', textDecoration: 'none'}}
                  >
                    Xem transaction 🔗
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '12px', color: '#666'}}>
        💡 <strong>Lưu ý:</strong> Tất cả thông tin này được lưu trữ minh bạch trên blockchain và không thể thay đổi. 
        Mỗi lần chuyển nhượng đều được ghi lại với timestamp và địa chỉ ví chính xác.
      </div>
    </div>
  );
}

export default NFTOwnershipHistory;