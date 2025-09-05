const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔍 Debugging sacrifice transaction logs...\n");

  const [deployer] = await ethers.getSigners();
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  const maw = await ethers.getContractAt("MawSacrifice", addresses.mawSacrifice);
  const relics = await ethers.getContractAt("Relics", addresses.relics);
  
  console.log("Your address:", deployer.address);
  console.log("MawSacrifice:", addresses.mawSacrifice);
  console.log("Relics:", addresses.relics);
  
  // Check current balances
  const keyBalance = await relics.balanceOf(deployer.address, 1);
  const ashBalance = await relics.balanceOf(deployer.address, 9);
  console.log("Key balance before:", keyBalance.toString());
  console.log("Ash balance before:", ashBalance.toString());
  
  console.log("\n🎲 Performing sacrifice...");
  try {
    const tx = await maw.sacrificeKeys(1, {
      gasPrice: ethers.parseUnits("4", "gwei"),
    });
    
    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed!");
    
    // Log all events
    console.log("\n📋 Transaction logs:");
    receipt.logs.forEach((log, i) => {
      console.log(`Log ${i}:`, {
        address: log.address,
        topics: log.topics,
        data: log.data
      });
      
      // Try to decode as TransferSingle
      try {
        const iface = new ethers.Interface([
          "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)"
        ]);
        const decoded = iface.parseLog(log);
        if (decoded) {
          console.log(`  Decoded TransferSingle:`, {
            operator: decoded.args.operator,
            from: decoded.args.from,
            to: decoded.args.to,
            id: decoded.args.id.toString(),
            value: decoded.args.value.toString()
          });
        }
      } catch (e) {
        // Not a TransferSingle event
      }
    });
    
    // Check balances after
    const keyBalanceAfter = await relics.balanceOf(deployer.address, 1);
    const ashBalanceAfter = await relics.balanceOf(deployer.address, 9);
    console.log("\nKey balance after:", keyBalanceAfter.toString());
    console.log("Ash balance after:", ashBalanceAfter.toString());
    console.log("Ash gained:", (ashBalanceAfter - ashBalance).toString());
    
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

main().catch(console.error);