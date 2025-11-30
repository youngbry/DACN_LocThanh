@echo off
echo ========================================
echo   BATCH MINT API SERVER
echo ========================================
echo.
echo Starting Batch Mint API server...
echo Server will run on http://localhost:3002
echo.

cd server
call npm install ethers
node batch-mint-api.js

pause
