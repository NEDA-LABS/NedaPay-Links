import pkg from 'hardhat';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// 0x7f18A3719Ad0CD59C48A8dBC0C57Dd7eCa07A0Dd
const { ethers, upgrades } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // Read existing deployment info
  const deploymentPath = join(__dirname, "..",'deployments.json');
  
  if (!existsSync(deploymentPath)) {
    throw new Error('❌ No deployment info found. Deploy the contract first.');
  }
  
  const deploymentInfo = JSON.parse(readFileSync(deploymentPath, 'utf8'));
  const proxyAddress = deploymentInfo.proxyAddress;
  
  console.log('🔄 Upgrading NedaPay Protocol...');
  console.log('📍 Proxy Address:', proxyAddress);
  
  // Get the new contract factory
  const NedaPayProtocolV2 = await ethers.getContractFactory('NedaPayProtocolUpgradeableScroll');
  
  console.log('📦 Deploying new implementation...');
  
  // Upgrade the contract
  const upgraded = await upgrades.upgradeProxy(proxyAddress, NedaPayProtocolV2);
  
  console.log('✅ Contract upgraded successfully!');
  
  // Get new implementation address
  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log('📍 New Implementation Address:', newImplementationAddress);
  
  // Verify the upgrade
  console.log('');
  console.log('🔍 Verifying upgrade...');
  
  const contract = await ethers.getContractAt('NedaPayProtocolUpgradeableScroll', proxyAddress);
  
  // Check version (if implemented)
  try {
    const version = await contract.version();
    console.log('📋 Contract Version:', version);
  } catch (error) {
    console.log('📋 Version method not available');
  }
  
  // Verify fee recipient is still correct
  const feeRecipient = await contract.FEE_RECIPIENT();
  console.log('💰 Fee Recipient:', feeRecipient);
  
  // Check if fee tiers are still working
  const tiersLength = await contract.getFeeTiersLength();
  console.log('📊 Fee Tiers Count:', tiersLength.toString());
  
  // Test a fee calculation
  const testAmount = ethers.parseUnits('1000', 6); // $1000
  const fee = await contract.calculateFee(
    '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4', // USDC
    testAmount
  );
  const feeUSD = ethers.formatUnits(fee, 6);
  console.log('🧮 Test Fee Calculation: $1000 → $' + feeUSD + ' fee');
  
  // Update deployment info
  deploymentInfo.implementationAddress = newImplementationAddress;
  deploymentInfo.upgradedAt = new Date().toISOString();
  deploymentInfo.previousImplementations = deploymentInfo.previousImplementations || [];
  deploymentInfo.previousImplementations.push({
    address: deploymentInfo.implementationAddress,
    upgradedAt: deploymentInfo.upgradedAt
  });
  
  // Save updated deployment info
  writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log('');
  console.log('💾 Deployment info updated');
  console.log('🎉 Upgrade completed successfully!');
  
  return {
    proxy: proxyAddress,
    newImplementation: newImplementationAddress
  };
}

// Handle both direct execution and module export
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Upgrade failed:', error);
      process.exit(1);
    });


export default main;