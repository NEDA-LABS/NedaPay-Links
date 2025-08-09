// Stablecoins data from stablecoins.earth
export const stablecoins = [
  {
    region: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    baseToken: 'cNGN',
    name: 'Nigerian Naira Coin',
    decimals: 6,
    addresses: {
      8453: '0x46C85152bFe9f96829aA94755D9f915F9B10EF5F', // Base Mainnet
      137:  '0x5282F802A0c7431b7Db51f255e84a63b4C3cCb3B', // Polygon Mainnet
      56:   '0xa8AE405F05899cF3140B026C33e776F8C64F7058', // BNB Smart Chain
    },
    issuer: 'Convexity',
    description: 'Stablecoin pegged 1:1 to the Nigerian Naira (NGN)',
    website: 'https://stablecoins.earth',
    chainIds: [8453, 137, 56],
  },
  // {
  //   region: 'Nigeria',
  //   flag: '🇳🇬',
  //   currency: 'NGN',
  //   baseToken: 'NGNC',
  //   name: 'Nigerian Naira Coin',
  //   decimals: 18,
  //   addresses: {
  //     8453: '0xe743f13623E000261B634F0E5676F294475eC24D', // Base Mainnet
  //   },
  //   issuer: 'Link',
  //   description: 'Stablecoin pegged 1:1 to the Nigerian Naira (NGN)',
  //   website: 'https://stablecoins.earth',
  //   chainIds: [8453],
  // },
  {
    region: 'South Africa',
    flag: '🇿🇦',
    currency: 'ZAR',
    baseToken: 'ZARP',
    name: 'South African Rand Coin',
    decimals: 18,
    addresses: {
      8453: '0xb755506531786C8aC63B756BaB1ac387bACB0C04', // Base Mainnet
      137:  '0xb755506531786C8aC63B756BaB1ac387bACB0C04', // Polygon Mainnet
    },
    issuer: 'inv.es',
    description: 'Stablecoin pegged 1:1 to the South African Rand (ZAR)',
    website: 'https://stablecoins.earth',
    chainIds: [8453, 137],
  },
  {
    region: 'Indonesia',
    flag: '🇮🇩',
    currency: 'IDR',
    baseToken: 'IDRX',
    name: 'Indonesian Rupiah Coin',
    decimals: 2,
    addresses: {
      8453: '0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22', // Base Mainnet
    },
    issuer: 'IDRX.co',
    description: 'Stablecoin pegged 1:1 to the Indonesian Rupiah (IDR)',
    website: 'https://stablecoins.earth',
    chainIds: [8453],
  },
  {
    region: 'Europe',
    flag: '🇪🇺',
    currency: 'EUR',
    baseToken: 'EURC',
    name: 'Euro Coin',
    decimals: 6,
    addresses: {
      8453: '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42', // Base Mainnet
    },
    issuer: 'Circle',
    description: 'Stablecoin pegged 1:1 to the Euro (EUR)',
    website: 'https://stablecoins.earth',
    chainIds: [8453],
  },
  {
    region: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    baseToken: 'CADC',
    name: 'Canadian Dollar Coin',
    decimals: 18,
    addresses: {
      8453: '0x043eB4B75d0805c43D7C834902E335621983Cf03', // Base Mainnet
    },
    issuer: 'PayTrie',
    description: 'Stablecoin pegged 1:1 to the Canadian Dollar (CAD)',
    website: 'https://stablecoins.earth',
    chainIds: [8453],
  },
  {
    region: 'Brazil',
    flag: '🇧🇷',
    currency: 'BRL',
    baseToken: 'BRL',
    name: 'Brazilian Real Coin',
    decimals: 18,
    addresses: {
      8453: '0xE9185Ee218cae427aF7B9764A011bb89FeA761B4', // Base Mainnet
    },
    issuer: 'Transfero',
    description: 'Stablecoin pegged 1:1 to the Brazilian Real (BRL)',
    website: 'https://stablecoins.earth',
    chainIds: [8453],
  },
  {
    region: 'Turkey',
    flag: '🇹🇷',
    currency: 'TRY',
    baseToken: 'TRYB',
    name: 'Turkish Lira Coin',
    decimals: 6,
    addresses: {
      8453: '0xFb8718a69aed7726AFb3f04D2Bd4bfDE1BdCb294', // Base Mainnet
    },
    issuer: 'BiLira',
    description: 'Stablecoin pegged 1:1 to the Turkish Lira (TRY)',
    website: 'https://stablecoins.earth',
    chainIds: [8453],
  },
  {
    region: 'New Zealand',
    flag: '🇳🇿',
    currency: 'NZD',
    baseToken: 'NZDD',
    name: 'New Zealand Dollar Coin',
    decimals: 6,
    addresses: {
      8453: '0x2dD087589ce9C5b2D1b42e20d2519B3c8cF022b7', // Base Mainnet
    },
    issuer: 'Easy Crypto',
    description: 'Stablecoin pegged 1:1 to the New Zealand Dollar (NZD)',
    website: 'https://stablecoins.earth',
    chainIds: [8453],
  },
  {
    region: 'Mexico',
    flag: '🇲🇽',
    currency: 'MXN',
    baseToken: 'MXNe',
    name: 'Mexican Peso Coin',
    decimals: 6,
    addresses: {
      8453: '0x269caE7Dc59803e5C596c95756faEeBb6030E0aF', // Base Mainnet
    },
    issuer: 'Etherfuse/Brale',
    description: 'Stablecoin pegged 1:1 to the Mexican Peso (MXN)',
    website: 'https://stablecoins.earth',
    chainIds: [8453],
  },
  {
    region: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    baseToken: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    addresses: {
      8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet
      42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum One
      137:   '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon Mainnet
      42220: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', // Celo Mainnet
      56:    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // BNB Smart Chain
      10:    '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // Optimism
      534352:'0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4', // Scroll Mainnet
    },
    issuer: 'Circle',
    description: 'USD-backed stablecoin by Circle',
    website: 'https://www.circle.com/usdc',
    chainIds: [8453, 42161, 137, 42220, 56, 10, 534352],
  },
  {
    region: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    baseToken: 'USDT',
    name: 'Tether USD',
    decimals: {
      8453: 6,  // Base Mainnet
      42161: 6, // Arbitrum One
      137:   6, // Polygon Mainnet
      42220: 6, // Celo Mainnet
      56:    18,// BNB Smart Chain
      10:    6, // Optimism
      534352:6, // Scroll Mainnet
    },
    addresses: {
      8453:   '0xF1e92B575dcAA24fFA1B3334499a8F3B6E2F9Eb2', // Base Mainnet
      42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum One
      137:   '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon Mainnet
      42220: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e', // Celo Mainnet
      56:    '0x55d398326f99059fF775485246999027B3197955', // BNB Smart Chain
      10:    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // Optimism
      534352:'0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df', // Scroll Mainnet
    },
    issuer: 'Tether',
    description: 'USD-backed stablecoin by Tether',
    website: 'https://tether.to',
    chainIds: [8453, 42161, 137, 42220, 56, 10, 534352],
  },
];
