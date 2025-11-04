require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Local development
    hardhat: {
      saveDeployments: true,
      loggingEnabled: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      saveDeployments: true,
    },
    
    // Ethereum Sepolia Testnet
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: 11155111,
      gasPrice: "auto"
    },
    
    // Polygon Mumbai Testnet  
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
      gasPrice: 20000000000 // 20 gwei
    },
    
    // BSC Testnet
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 97,
      gasPrice: 20000000000
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_API_KEY
    }
  }
};
