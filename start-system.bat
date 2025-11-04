@echo off
echo ===============================
echo    KHOI DONG HE THONG NFT
echo ===============================

echo.
echo [1/3] Dang khoi dong Hardhat Network...
start "Hardhat Network" cmd /k "cd /d %~dp0 && npx hardhat node"

echo.
echo [2/3] Doi 5 giay de network khoi dong...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Deploy contract va cap nhat web app...
npx hardhat run scripts/deploy-and-update-web.js --network localhost

echo.
echo [4/4] Khoi dong React app...
cd web
start "React App" cmd /k "npm start"

echo.
echo ===============================
echo     HE THONG DA KHOI DONG!
echo ===============================
echo.
echo Hardhat Network: http://localhost:8545
echo React App: http://localhost:3000
echo Admin: http://localhost:3000/admin
echo.
echo TAI KHOAN ADMIN:
echo Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
echo Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
echo.
pause