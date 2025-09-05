const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const address = await signer.getAddress();
  const balance = await hre.ethers.provider.getBalance(address);
  
  console.log('Address:', address);
  console.log('Balance:', hre.ethers.formatEther(balance), 'ETH');
  console.log('Balance (wei):', balance.toString());
  
  if (balance === 0n) {
    console.log('\n❌ No ETH! You need to fund this account:');
    console.log('1. Go to https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
    console.log('2. Enter address:', address);
    console.log('3. Request Base Sepolia ETH');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });