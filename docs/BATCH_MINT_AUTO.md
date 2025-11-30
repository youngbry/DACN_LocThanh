# Hướng dẫn sử dụng Batch Mint tự động

## Tính năng mới

Đã thêm **chế độ tự động** cho batch mint, không cần xác nhận từng transaction trên ví.

## Cách sử dụng

### 1. Khởi động server batch-mint

Mở terminal mới và chạy:

```bash
cd server
npm install ethers
npm run batch-mint
```

Hoặc click đúp vào file: `start-batch-mint-server.bat`

Server sẽ chạy tại: `http://localhost:3002`

### 2. Sử dụng giao diện Admin

1. Truy cập `/admin/batch`
2. Upload file CSV chứa danh sách xe
3. Chọn chế độ:
   - **🤖 Tự động**: Server tự động ký transaction, không cần xác nhận ví
   - **👤 Thủ công**: Sử dụng MetaMask/Rabby, cần xác nhận từng giao dịch
4. Click "Mint tự động" hoặc "Mint thủ công"

### 3. Cấu hình (nếu cần)

Mặc định server sử dụng:

- RPC: `http://127.0.0.1:8545` (Hardhat local)
- Private Key: Account #0 của Hardhat (0xac09...)

Để thay đổi, tạo file `.env` trong thư mục `server/`:

```env
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## API Endpoint

### POST /api/batch-mint

Request:

```json
{
  "vehicles": [
    {
      "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "vin": "RLHPC4508P5123456",
      "engineNumber": "PC45E-5123456",
      "model": "Honda Winner X 150",
      "color": "Đen nhám",
      "year": "2023"
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "summary": {
    "total": 1,
    "success": 1,
    "skipped": 0,
    "errors": 0
  },
  "results": [
    {
      "index": 1,
      "status": "SUCCESS",
      "tokenId": 0,
      "txHash": "0x...",
      "blockNumber": 123,
      "vehicle": {...}
    }
  ]
}
```

## Lợi ích

✅ Không cần xác nhận từng giao dịch trên ví
✅ Tự động xử lý nonce
✅ Tốc độ nhanh hơn
✅ Phù hợp cho số lượng lớn NFT
✅ Log chi tiết trên server

## Lưu ý

⚠️ Server cần có quyền admin (private key của owner contract)
⚠️ Chỉ chạy server trên môi trường an toàn
⚠️ KHÔNG public private key lên GitHub
