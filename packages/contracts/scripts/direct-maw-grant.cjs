const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🚀 Direct MAW role grant attempt...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const [signer] = await ethers.getSigners();
  
  console.log("Signer:", signer.address);
  console.log("MAW Proxy:", PROXY_ADDRESS);
  console.log("Relics:", addresses.baseSepolia.Relics);
  
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  const mawRole = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
  
  // Just try to grant the role directly - maybe the checks are broken but the grant works
  console.log("\n🎯 Attempting direct role grant...");
  try {
    const tx = await relics.grantRole(mawRole, PROXY_ADDRESS, {
      gasLimit: 200000
    });
    console.log("Grant transaction:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction status:", receipt.status);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    if (receipt.status === 1) {
      console.log("🎉 ROLE GRANTED! Testing sacrificeKeys now...");
      
      // Test sacrificeKeys immediately
      const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
      const userAddress = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
      
      // Check user balance
      const balance = await relics.balanceOf(userAddress, 0);
      console.log(`User rusted caps: ${balance}`);
      
      if (balance >= 1) {
        console.log("\n🚀 Testing sacrificeKeys...");
        const sacrificeTx = await maw.sacrificeKeys(1, {
          gasLimit: 1500000
        });
        
        console.log("Sacrifice transaction:", sacrificeTx.hash);
        const sacrificeReceipt = await sacrificeTx.wait();
        
        if (sacrificeReceipt.status === 1) {
          console.log("🎉🎉🎉 SACRIFICEKEYS WORKS! Problem solved!");
          console.log("Gas used:", sacrificeReceipt.gasUsed.toString());
          
          // Show what was minted
          for (const log of sacrificeReceipt.logs) {
            try {
              const parsed = relics.interface.parseLog(log);
              if (parsed && parsed.name === 'TransferSingle' && parsed.args.from === ethers.ZeroAddress) {
                console.log(`🏆 Minted: ${parsed.args.value} of token ID ${parsed.args.id}`);
              }
            } catch (e) {
              // Not a relics mint event
            }
          }
        } else {
          console.log("❌ SacrificeKeys still failed");
        }
      } else {
        console.log("⚠️ User needs rusted caps to test");
      }
      
    } else {
      console.log("❌ Grant failed");
    }
    
  } catch (error) {
    console.log("❌ Grant failed:", error.message);
    
    // If it's just a view/check error but we might still have permissions, 
    // let's try alternative approaches
    if (error.message.includes("execution reverted")) {
      console.log("\n🔧 Trying alternative: direct owner approach...");
      
      // Try calling from a known admin address if we can find one
      // Let's check the addresses.json for any admin addresses
      console.log("Checking addresses.json for admin info...");
      console.log("Available addresses:", Object.keys(addresses.baseSepolia));
    }
  }
}

main().catch(console.error);