const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Relics contract interface...");
  
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const [deployer] = await ethers.getSigners();
  
  try {
    // Try different contract interfaces
    console.log("🧪 Testing basic ERC1155 interface...");
    const basicContract = await ethers.getContractAt("IERC1155", relicsAddress);
    const balance = await basicContract.balanceOf(deployer.address, 0);
    console.log(`✅ ERC1155 works - Keys balance: ${balance}`);
    
    // Try as basic Ownable contract
    console.log("\n🧪 Testing Ownable interface...");
    const ownableContract = await ethers.getContractAt("Ownable", relicsAddress);
    const owner = await ownableContract.owner();
    console.log(`✅ Ownable works - Owner: ${owner}`);
    console.log(`👤 Current user: ${deployer.address}`);
    console.log(`🤝 User is owner: ${owner.toLowerCase() === deployer.address.toLowerCase()}`);
    
    // If user is owner, we can try to set the mawSacrifice address directly
    if (owner.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("\n🔧 User is owner! Trying to call setMawSacrifice...");
      
      // Try with our contract interface
      const relicsContract = await ethers.getContractAt("Relics", relicsAddress);
      const correctMawAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
      
      const tx = await relicsContract.setMawSacrifice(correctMawAddress);
      const receipt = await tx.wait();
      console.log(`✅ Set MawSacrifice address! Transaction: ${receipt.hash}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    
    // Try to check what functions are actually available
    console.log("\n🔍 The deployed Relics contract might have a different interface");
    console.log("Let's try some basic calls...");
    
    try {
      // Try to get code
      const code = await ethers.provider.getCode(relicsAddress);
      console.log(`📝 Contract has code: ${code.length > 2}`);
      console.log(`📏 Code length: ${code.length}`);
    } catch (e) {
      console.log("Could not get contract code");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});