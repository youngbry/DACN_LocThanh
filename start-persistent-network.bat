@echo off
echo 🚀 Starting Hardhat Network with persistent storage...
echo.
echo 📂 Data will be saved to: ./hardhat-data/
echo ⚠️  To reset blockchain, delete the hardhat-data folder
echo.

:: Create data directory if not exists
if not exist "hardhat-data" mkdir hardhat-data

:: Start Hardhat node with persistent storage in background
start "Hardhat Network" cmd /k "npx hardhat node --hostname 127.0.0.1 --port 8545"

echo.
echo ⏳ Waiting for network to start...
timeout /t 3 /nobreak >nul

echo.
echo 📋 Deploying contract...
npx hardhat run scripts/deploy-and-update-web.js --network localhost

echo.
echo 💾 Creating initial backup snapshot...
npx hardhat run scripts/backup-state.js --network localhost >nul 2>&1
if exist scripts\backup-state.json echo ✅ Snapshot saved: scripts\backup-state.json

echo.
echo 🔄 Starting auto-backup process (every 5 minutes)...
start "Auto Backup" cmd /k "node scripts\auto-backup.js 300"

echo.
echo ✅ System ready! (Initial backup + auto-backup running.)
echo 🌐 Hardhat Network: http://localhost:8545
echo 📱 Web App: http://localhost:3000
echo 👨‍💼 Admin Panel: http://localhost:3000/admin
echo.
echo 🔑 ADMIN ACCOUNT:
echo Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
echo Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
echo.
pause