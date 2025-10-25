# DACN_NFTBlockChain

Dự án chuyển tài sản thực (xe máy) thành NFT để quản lý, chuyển nhượng minh bạch trên nền tảng blockchain.

## Cấu trúc dự án
- `contracts/`: Chứa smart contract (Solidity)
- `web/`: Ứng dụng web quản lý NFT (ReactJS)
- `scripts/`: Script deploy, kiểm thử hợp đồng
- `.github/`: Hướng dẫn và checklist cho Copilot

## Công nghệ sử dụng
- Blockchain: Ethereum (Hardhat)
- Smart contract: Solidity (ERC-721)
- Web app: ReactJS, MetaMask

## Các bước triển khai
1. Viết smart contract NFT cho xe máy
2. Xây dựng web app quản lý NFT
3. Tích hợp ví blockchain
4. Kiểm thử và hoàn thiện

## Hướng dẫn khởi động
- Cài đặt Node.js, npm
- Cài đặt Hardhat: `npm install --save-dev hardhat`
- Khởi tạo React app: `npx create-react-app web`
- Triển khai hợp đồng: Xem hướng dẫn trong `scripts/`
