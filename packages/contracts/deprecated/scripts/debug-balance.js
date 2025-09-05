const hre = require("hardhat");

async function main() {
  console.log("🔍 Debugging user balance vs tokens...");
  
  const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);
  
  try {
    // Check balance
    const balance = await raccoons.balanceOf(USER_ADDRESS);
    console.log(`User balance: ${balance}`);
    
    // Check total minted
    const totalMinted = await raccoons.totalMinted();
    console.log(`Total minted: ${totalMinted}`);
    
    // Try each index
    console.log("\nTrying tokenOfOwnerByIndex for each index:");
    for (let i = 0; i < Number(balance); i++) {
      try {
        const tokenId = await raccoons.tokenOfOwnerByIndex(USER_ADDRESS, i);
        console.log(`  Index ${i}: Token #${tokenId}`);
      } catch (error) {
        console.log(`  Index ${i}: ERROR - ${error.message}`);
      }
    }
    
    // Check which tokens the user actually owns by checking all minted tokens
    console.log("\nChecking actual ownership of all minted tokens:");
    let ownedTokens = [];
    for (let tokenId = 1; tokenId <= Number(totalMinted); tokenId++) {
      try {
        const owner = await raccoons.ownerOf(tokenId);
        if (owner.toLowerCase() === USER_ADDRESS.toLowerCase()) {
          ownedTokens.push(tokenId);
        }
      } catch (error) {
        console.log(`  Token ${tokenId}: ERROR - ${error.message}`);
      }
    }
    
    console.log(`Owned tokens: [${ownedTokens.join(', ')}]`);
    console.log(`Actual owned count: ${ownedTokens.length}`);
    console.log(`Balance from contract: ${balance}`);
    console.log(`Match: ${ownedTokens.length == balance ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });