export const TOKEN_ADDRESSES = {
    USDC: {
      8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
      42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum
      137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon
      42220: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', // Celo
      56: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d' // BNB
    },
    USDT: {
      8453: '', // Base
      42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum
      137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon 
      42220: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e', // Celo
      56: '0x55d398326f99059fF775485246999027B3197955' // BNB
    }
  };
  
  export const TOKEN_ABI = [
    'function transfer(address to, uint256 amount) public returns (bool)',
    'function balanceOf(address account) public view returns (uint256)',
    'function decimals() public view returns (uint8)'
  ];
  
  export const TOKEN_DECIMALS = {
    USDC: 6,
    USDT: 6
  };
  
  export const GAS_FEES = {
    ABSTRACTED: {
      USDC: 0.023,
      USDT: 0.025
    },
    NORMAL: {
      BASE: 0.0005,
      ARBITRUM: 0.001,
      POLYGON: 0.1,
      CELO: 0.01,
      BNB: 0.01
    }
  };