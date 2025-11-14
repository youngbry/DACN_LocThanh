# 📊 Mô hình ERD - NFT Motorbike Marketplace

## 🗃️ Entities và Relationships

### 1. **User (Người dùng)**

- **Attributes:**
  - address (PK) - Địa chỉ ví blockchain
  - balance - Số dư ETH
  - role - Vai trò (Admin/User)

### 2. **Motorbike (Xe máy)**

- **Attributes:**
  - tokenId (PK) - ID duy nhất của NFT
  - vin - Số khung xe (UNIQUE)
  - engineNumber - Số máy (UNIQUE)
  - model - Dòng xe
  - color - Màu sắc
  - year - Năm sản xuất
  - createdAt - Thời gian tạo NFT

### 3. **NFTOwnership (Quyền sở hữu NFT)**

- **Attributes:**
  - tokenId (PK, FK)
  - ownerAddress (FK)
  - mintedAt - Thời gian mint
  - totalSupply - Tổng NFT trong hệ thống

### 4. **MarketplaceListing (Danh sách bán)**

- **Attributes:**
  - listingId (PK)
  - tokenId (FK)
  - sellerAddress (FK)
  - price - Giá bán (ETH)
  - isActive - Trạng thái active
  - listedAt - Thời gian đăng bán
  - soldAt - Thời gian bán (nullable)

### 5. **Transaction (Giao dịch)**

- **Attributes:**
  - transactionHash (PK)
  - tokenId (FK)
  - fromAddress (FK)
  - toAddress (FK)
  - blockNumber - Số block
  - transactionType - Loại giao dịch (Mint/Transfer/Sale)
  - value - Giá trị giao dịch
  - timestamp - Thời gian thực hiện

### 6. **TransferHistory (Lịch sử chuyển quyền)**

- **Attributes:**
  - historyId (PK)
  - tokenId (FK)
  - fromAddress (FK)
  - toAddress (FK)
  - transactionHash (FK)
  - blockNumber - Số block
  - timestamp - Thời gian chuyển

## 🔗 Relationships

### 1. User ↔ NFTOwnership (1:N)

- Một User có thể sở hữu nhiều NFT
- Một NFT chỉ có một chủ sở hữu tại một thời điểm

### 2. Motorbike ↔ NFTOwnership (1:1)

- Mỗi xe máy tương ứng với một NFT duy nhất
- Mỗi NFT đại diện cho một xe máy duy nhất

### 3. NFTOwnership ↔ MarketplaceListing (1:N)

- Một NFT có thể được đăng bán nhiều lần (các thời điểm khác nhau)
- Chỉ có một listing active tại một thời điểm

### 4. User ↔ MarketplaceListing (1:N)

- Một User có thể đăng bán nhiều NFT
- Một listing thuộc về một seller duy nhất

### 5. User ↔ Transaction (N:N)

- Một User có thể tham gia nhiều giao dịch (as sender/receiver)
- Một giao dịch liên quan đến 2 User (from/to)

### 6. NFTOwnership ↔ TransferHistory (1:N)

- Một NFT có nhiều lần chuyển quyền sở hữu
- Mỗi lần chuyển quyền tạo một record history

## 📈 ERD Diagram (Text format)

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│      User       │◄────────│  NFTOwnership   │────────►│   Motorbike     │
├─────────────────┤   1:N   ├─────────────────┤   1:1   ├─────────────────┤
│ address (PK)    │         │ tokenId (PK,FK) │         │ tokenId (PK)    │
│ balance         │         │ ownerAddress(FK)│         │ vin (UNIQUE)    │
│ role            │         │ mintedAt        │         │ engineNumber    │
└─────────────────┘         │ totalSupply     │         │ model           │
                            └─────────────────┘         │ color           │
                                     │                  │ year            │
                                     │ 1:N              │ createdAt       │
                                     ▼                  └─────────────────┘
┌─────────────────┐         ┌─────────────────┐
│MarketplaceListing│         │ TransferHistory │
├─────────────────┤         ├─────────────────┤
│ listingId (PK)  │         │ historyId (PK)  │
│ tokenId (FK)    │         │ tokenId (FK)    │
│ sellerAddr (FK) │         │ fromAddress(FK) │
│ price           │         │ toAddress (FK)  │
│ isActive        │         │ transactionHash │
│ listedAt        │         │ blockNumber     │
│ soldAt          │         │ timestamp       │
└─────────────────┘         └─────────────────┘
         │                           ▲
         │ N:N                       │ 1:N
         ▼                           │
┌─────────────────┐                 │
│   Transaction   │─────────────────┘
├─────────────────┤
│transactionHash(PK)│
│ tokenId (FK)    │
│ fromAddress(FK) │
│ toAddress (FK)  │
│ blockNumber     │
│ transactionType │
│ value           │
│ timestamp       │
└─────────────────┘
```

## 🎯 Business Rules

### 1. Ownership Rules

- Mỗi NFT chỉ có một chủ sở hữu tại một thời điểm
- Chỉ chủ sở hữu mới có thể đăng bán NFT
- Admin có thể mint NFT mới

### 2. Marketplace Rules

- NFT phải được approve cho marketplace trước khi list
- Chỉ hiển thị NFT có isActive = true
- Sau khi bán, isActive = false và soldAt được cập nhật

### 3. Transfer Rules

- Mọi thay đổi ownership đều được ghi vào TransferHistory
- Transfer events được lắng nghe từ blockchain
- Mint cũng là một dạng transfer (from: 0x0 → to: owner)

## 📋 Data Flow

### 1. Mint NFT Flow

```
Admin → MotorbikeNFT.mint() → Motorbike created → NFTOwnership created → TransferHistory created
```

### 2. List NFT Flow

```
User → approve() → MarketplaceListing created → isActive = true
```

### 3. Buy NFT Flow

```
Buyer → buyNFT() → ETH transfer → NFT transfer → Listing deactivated → TransferHistory updated
```

---

_Mô hình ERD này thể hiện đầy đủ cấu trúc dữ liệu và quan hệ trong hệ thống NFT Marketplace_
