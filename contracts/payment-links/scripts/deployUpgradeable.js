import pkg from 'hardhat';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { ethers, upgrades } = pkg;

async function main() {
  console.log('🚀 Deploying NedaPayProtocolUpgradeable to Scroll...\n');

  // Get the contract factory
  const NedaPayProtocolUpgradeable = await ethers.getContractFactory('NedaPayProtocolUpgradeableScroll');

  // Deploy the upgradeable contract
  console.log('📦 Deploying proxy and implementation...');
  const nedaPayProtocol = await upgrades.deployProxy(
    NedaPayProtocolUpgradeable,
    [], // No constructor args, using initialize()
    {
      initializer: 'initialize',
      kind: 'uups'
    }
  );

  await nedaPayProtocol.waitForDeployment();
  const proxyAddress = await nedaPayProtocol.getAddress();

  console.log('✅ NedaPayProtocolUpgradeable deployed!');
  console.log('📍 Proxy Address:', proxyAddress);

  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log('📍 Implementation Address:', implementationAddress);

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log('🌐 Network:', network.name, `(Chain ID: ${network.chainId})`);

  // Display fee tiers
  console.log('\n💰 Fee Tiers:');
  const feeTiersLength = await nedaPayProtocol.getFeeTiersLength();
  for (let i = 0; i < feeTiersLength; i++) {
    const tier = await nedaPayProtocol.feeTiers(i);
    const minUSD = ethers.formatEther(tier.minAmount);
    const maxUSD = tier.maxAmount === 0n ? '∞' : ethers.formatEther(tier.maxAmount);
    const feePercent = (Number(tier.feeRate) / 100).toFixed(2);
    console.log(`   Tier ${i + 1}: $${minUSD} - $${maxUSD} → ${feePercent}%`);
  }

  // Display supported tokens (first few)
  console.log('\n🪙 Supported Tokens:');
  const supportedTokens = [
    { symbol: 'USDC', address: '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4' },
    { symbol: 'USDT', address: '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df' },
  ];

  for (const token of supportedTokens) {
    const isSupported = await nedaPayProtocol.isTokenSupported(token.address);
    console.log(`   ${token.symbol}: ${isSupported ? '✅' : '❌'} ${token.address}`);
  }

  // Fee examples
  console.log('\n📊 Fee Examples:');
  const examples = [
    { amount: '50', expected: '1.0%' },
    { amount: '250', expected: '0.75%' },
    { amount: '1000', expected: '0.5%' },
    { amount: '3000', expected: '0.3%' },
    { amount: '10000', expected: '0.2%' }
  ];

  const usdcAddress = '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4';
  for (const example of examples) {
    const amount = ethers.parseUnits(example.amount, 6); // USDC has 6 decimals in scroll
    const fee = await nedaPayProtocol.calculateFee(usdcAddress, amount);
    const feeAmount = ethers.formatUnits(fee, 6);
    console.log(`   $${example.amount} → $${feeAmount} fee (${example.expected})`);
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    proxyAddress: proxyAddress,
    implementationAddress: implementationAddress,
    deployedAt: new Date().toISOString(),
    version: '1.0.0'
  };

  const deploymentPath = join(__dirname, '..', 'deployments.json');
  writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('\n💾 Deployment info saved to deployments.json');

  console.log('\n🎉 Deployment completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Verify the contract on scrollscan');
  console.log('2. Update frontend with proxy address');
  console.log('3. Test contract functions');
  console.log('4. Deploy to mainnet when ready');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });