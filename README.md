# NFT Motorbike Marketplace (Local Only)

Dự án quản lý và giao dịch NFT cho xe máy chạy hoàn toàn trên mạng phát triển Hardhat (localhost). Toàn bộ hỗ trợ testnet đã được gỡ bỏ để đơn giản hóa demo.

## Cấu trúc thư mục

- `contracts/`: Smart contracts (`MotorbikeNFT.sol`, `MotorbikeMarketplace.sol`)
- `scripts/`: Deploy + tiện ích (mint, kiểm tra, chuyển ownership)
- `web/`: Ứng dụng React giao tiếp smart contract (ethers v6)
- `server/`: API lưu trữ báo cáo sự cố (Express, JSON file)
- `artifacts/`, `cache/`: Sinh ra bởi Hardhat (có thể xóa rồi build lại)

## Thành phần chính

- NFT: Lưu thông tin xe (VIN, số máy, model, màu, năm), kiểm tra duy nhất, khóa/mở khóa.
- Marketplace: Niêm yết, mua, gỡ, cập nhật giá; chặn mua nếu token bị khóa.
- Report Server: Người dùng gửi báo cáo / yêu cầu mở khóa; admin duyệt.
- Frontend: Dashboard admin & user, chi tiết NFT, chuyển nhượng, bán/mua.

## Công nghệ

- Hardhat (localhost chainId 31337)
- Solidity ERC-721 (OpenZeppelin 5.x)
- React 18, React Router, ethers 6
- MetaMask / Rabby (chỉ cần mạng localhost `http://127.0.0.1:8545`)

## Khởi động nhanh

```bash
# 1. Cài dependencies ở root
npm install

# 2. Cài dependencies frontend
cd web
npm install
cd ..

# 3. Khởi động hệ thống (tự động node + deploy + web)
./start-system.bat
```

Hoặc thủ công:

```bash
# Terminal 1: Hardhat node
npx hardhat node

# Terminal 2: Deploy (tạo file ABI + địa chỉ & cập nhật frontend)
npx hardhat run scripts/deploy-and-update-web.js --network localhost

# Terminal 3: Frontend
cd web
npm start

# (Tuỳ chọn) Terminal 4: Server báo cáo
cd server
npm install
npm start
```

## Địa chỉ mặc định khi Hardhat khởi chạy

- Admin (Owner ban đầu): `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private key hiển thị trong file batch để nhập ví nếu cần quyền admin.

## Script hữu ích

```bash
npx hardhat run scripts/mint-current.js --network localhost    # Mint xe mẫu
npx hardhat run scripts/check-nfts.js --network localhost      # Liệt kê NFT
npx hardhat run scripts/transfer-nft.js --network localhost    # Mô phỏng chuyển quyền
npx hardhat run scripts/check-admin.js --network localhost     # Kiểm tra owner contract
```

## Backup & Restore dữ liệu (tránh mất sau khi tắt Hardhat)

Hardhat node mặc định lưu toàn bộ state trong RAM nên tắt là mất. Có hai cách:

1. Dùng mạng persistent (`start-persistent-network.bat`) → giữ state cho tới khi tự xóa thư mục.
2. Dùng script backup/restore để chụp lại trạng thái cuối cùng rồi phục hồi vào hợp đồng mới.

### Backup

Ghi lại toàn bộ token (metadata, owner, tình trạng khóa) và các listings đang hoạt động:

```bash
npx hardhat run scripts/backup-state.js --network localhost
```

Sinh file: `scripts/backup-state.json`.

### Restore

Deploy lại hợp đồng NFT & Marketplace mới, sau đó mint lại các token cho owner cuối cùng và tạo lại listings:

```bash
npx hardhat run scripts/restore-state.js --network localhost
```

Sau restore sẽ:

- Tạo hợp đồng mới (địa chỉ thay đổi) và cập nhật `web/src/blockchain/*.js`.
- Mint token theo trạng thái cuối (không replay lịch sử chuyển nhượng).
- Khôi phục tình trạng khóa (locked) nếu có.
- Tạo lại listings (approve rồi list).

### Giới hạn

- Không khôi phục lịch sử chuyển quyền chi tiết (chỉ owner cuối).
- Số block/timestamp ban đầu không giữ lại.
- Listings chỉ khôi phục dạng đang hoạt động tại thời điểm backup.

### Gợi ý quy trình làm việc

1. Trước khi tắt node: chạy backup.
2. Khởi động lại máy: node Hardhat mới → chạy restore → mở web app.
3. Kiểm tra nhanh bằng `check-nfts.js` hoặc vào trang Dashboard.

Nếu muốn state không mất mà không cần backup thủ công, dùng file `start-persistent-network.bat`.

## Dọn dẹp

- Có thể xoá `artifacts/` và `cache/` để build lại sạch.
- Không còn dùng `deploy-testnet.js` (đã xóa) và các cấu hình testnet trong `rabby.js`.

## Ghi chú

- Khởi động lại Hardhat node sẽ mất dữ liệu: cần redeploy và mint lại nếu muốn.
- Frontend lấy địa chỉ/ABI từ các file auto-generated trong `web/src/blockchain/`.
- Marketplace chỉ hiển thị NFT đang niêm yết và chưa bị khóa.

## Mục tiêu

- Demo đơn giản, dễ chạy trên máy cá nhân, không phụ thuộc testnet hay RPC bên thứ ba.

---

Đã tối giản cho môi trường localhost. Nếu cần hỗ trợ testnet sau này có thể khôi phục bằng cách viết lại script deploy-testnet và mở rộng `rabby.js`.
