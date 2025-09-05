import '@nomicfoundation/hardhat-ethers';
import '@openzeppelin/hardhat-upgrades';
import 'dotenv/config';

export default {
    solidity: {
      version: '0.8.22',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
    networks: {
      // Scroll Mainnet
      scroll: {
        url: 'https://rpc.scroll.io',
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        chainId: 534352,
      },
      // Scroll Sepolia Testnet
      'scroll-sepolia': {
        url: 'https://sepolia-rpc.scroll.io',
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        chainId: 534351,
      },
      // Base Sepolia Testnet
      'base-sepolia': {
        url: 'https://sepolia.base.org',
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        chainId: 84532,
      },
    },
  };