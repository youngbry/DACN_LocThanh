# 🏍️ NFT Motorbike Marketplace - Tóm tắt dự án

## 📖 Tổng quan dự án

Dự án xây dựng hệ thống NFT Marketplace cho xe máy, sử dụng blockchain để quản lý quyền sở hữu và giao dịch.

## 🏗️ Kiến trúc hệ thống

### Backend (Blockchain)

- **Framework**: Hardhat (Ethereum development)
- **Smart Contracts**:
  - `MotorbikeNFT.sol`: ERC721 token cho NFT xe máy
  - `MotorbikeMarketplace.sol`: Contract marketplace cho mua bán NFT
- **Network**: Hardhat localhost (chainId: 31337)

### Frontend

- **Framework**: React.js
- **Wallet Integration**: MetaMask, Rabby
- **Blockchain Library**: Ethers.js v6

## 🚀 Cách chạy dự án

### 1. Cài đặt dependencies

```bash
# Root project (Hardhat)
npm install

# Frontend
cd web
npm install
cd ..
```

### 2. Khởi động hệ thống

```bash
# Terminal 1: Khởi động blockchain
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy-and-update-web.js --network localhost

# Terminal 3: Khởi động frontend
cd web
npm start
```

### 3. Cấu hình ví

- **Network**: Hardhat Localhost
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 31337
- **Admin Account**: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

## 🎯 Chức năng chính

### Admin Dashboard (`/admin`)

- Tạo NFT xe máy mới (mint)
- Quản lý toàn bộ NFT trong hệ thống
- Kiểm tra tổng số NFT đã tạo

### User Dashboard (`/user`)

- Xem NFT cá nhân
- Chuyển quyền sở hữu NFT
- Đăng bán NFT lên marketplace

### Marketplace (`/marketplace`)

- Xem danh sách NFT đang bán
- Mua NFT từ người khác
- Chỉ hiển thị NFT đã được chủ sở hữu đăng bán

### NFT Management

- Xem chi tiết NFT (VIN, số máy, model, màu sắc, năm SX)
- Lịch sử chuyển quyền sở hữu
- Approve và list NFT lên marketplace

## 🔧 Smart Contracts

### MotorbikeNFT.sol

```solidity
// Chức năng chính:
- mint(address to, string vin, string engine, string model, string color, uint256 year)
- getMotorbike(uint256 tokenId)
- totalSupply()
- Kế thừa ERC721 + Ownable
```

### MotorbikeMarketplace.sol

```solidity
// Chức năng chính:
- listNFT(uint256 tokenId, uint256 price)
- buyNFT(uint256 tokenId) payable
- unlistNFT(uint256 tokenId)
- getActiveListings()
- updatePrice(uint256 tokenId, uint256 newPrice)
```

## 📁 Cấu trúc thư mục

```
DACN_locThanh/
├── contracts/              # Smart contracts
│   ├── MotorbikeNFT.sol
│   └── MotorbikeMarketplace.sol
├── scripts/                # Deploy và utility scripts
│   ├── deploy-and-update-web.js
│   ├── check-admin.js
│   └── ...
├── web/                    # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── blockchain/     # Contract ABIs (auto-generated)
│   │   └── utils/          # Wallet utilities
│   └── public/
├── hardhat.config.js       # Hardhat configuration
└── package.json           # Dependencies
```

## 🎨 Giao diện chính

### Navigation Menu

- 🏠 Dashboard
- 🏍️ NFT của tôi
- 🔍 Tất cả NFT
- ➕ Đăng ký xe
- 🔎 Tìm kiếm
- 🏪 Marketplace

### Quy trình bán NFT

1. **Approve**: Cho phép marketplace quản lý NFT
2. **List**: Đăng bán với giá ETH
3. **Marketplace**: NFT hiển thị cho mọi người mua

## 🧪 Dữ liệu test

### Mẫu NFT để tạo:

```
VIN: RLHPC4508P5123456
Số máy: PC45E-5123456
Model: Honda Winner X 150
Màu sắc: Đen nhám
Năm: 2023
```

## ⚙️ Scripts hữu ích

```bash
# Kiểm tra admin
npx hardhat run scripts/check-admin.js --network localhost

# Kiểm tra NFTs trong hệ thống
npx hardhat run scripts/check-nfts.js --network localhost

# Kiểm tra balance tài khoản
npx hardhat run scripts/check-balance.js --network localhost
```

## 🔗 URLs quan trọng

- **Frontend**: http://localhost:3000 (hoặc 3001)
- **Admin Panel**: http://localhost:3000/admin
- **Marketplace**: http://localhost:3000/marketplace
- **My NFTs**: http://localhost:3000/my-nfts

## 📝 Lưu ý quan trọng

1. **Dữ liệu ephemeral**: Hardhat node restart sẽ mất dữ liệu
2. **Re-deploy cần thiết**: Chạy lại deploy script sau mỗi restart
3. **Contract addresses**: Tự động cập nhật vào frontend
4. **Test environment**: Chỉ dùng cho development

## 🎯 Mục tiêu hoàn thành

- [x] ✅ Smart contracts NFT và Marketplace
- [x] ✅ Frontend React với đầy đủ chức năng
- [x] ✅ Integration với wallet (MetaMask/Rabby)
- [x] ✅ Deploy scripts và automation
- [x] ✅ Marketplace chỉ hiển thị NFT được list
- [x] ✅ Admin dashboard và user dashboard
- [x] ✅ NFT detail và ownership history

## 👥 Team

Dự án được phát triển với sự hỗ trợ của GitHub Copilot để tạo ra một hệ thống NFT Marketplace hoàn chỉnh cho xe máy.

---

_Tài liệu này tóm tắt toàn bộ quá trình phát triển và hướng dẫn sử dụng dự án NFT Motorbike Marketplace._
