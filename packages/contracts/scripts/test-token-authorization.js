const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Testing burn authorization for different token IDs...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  const [signer] = await ethers.getSigners();
  
  console.log("Testing from proxy perspective:", PROXY_ADDRESS);
  console.log("User:", signer.address);
  
  try {
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    
    // Test burn authorization for each token type
    const tokenTypes = [
      { id: 1, name: "RUSTED_KEY" },
      { id: 2, name: "LANTERN_FRAGMENT" },
      { id: 3, name: "WORM_EATEN_MASK" },
      { id: 4, name: "BONE_DAGGER" },
      { id: 5, name: "ASH_VIAL" },
      { id: 6, name: "GLASS_SHARD" }
    ];
    
    console.log("\n🔥 Testing burn authorization for each token type:");
    for (const token of tokenTypes) {
      const balance = await relics.balanceOf(signer.address, token.id);
      console.log(`\n${token.name} (ID ${token.id}):`);
      console.log(`- Balance: ${balance}`);
      
      if (balance > 0) {
        // Test if proxy can burn this token type
        try {
          // Encode the burn call
          const burnCalldata = relics.interface.encodeFunctionData("burn", [
            signer.address, 
            token.id, 
            1
          ]);
          
          // Simulate from proxy address
          await ethers.provider.call({
            from: PROXY_ADDRESS,
            to: RELICS_ADDRESS,
            data: burnCalldata
          });
          console.log("✅ Proxy CAN burn this token");
        } catch (e) {
          console.log("❌ Proxy CANNOT burn this token");
        }
      }
    }
    
    console.log("\n💎 Testing mint authorization for reward tokens:");
    // Test mint authorization for reward tokens
    const rewardTokens = [2, 3, 4, 5, 6]; // Fragment, Mask, Dagger, Vial, Shard
    
    for (const tokenId of rewardTokens) {
      const tokenName = tokenTypes.find(t => t.id === tokenId)?.name || `Token ${tokenId}`;
      try {
        const mintCalldata = relics.interface.encodeFunctionData("mint", [
          signer.address,
          tokenId,
          1,
          "0x"
        ]);
        
        await ethers.provider.call({
          from: PROXY_ADDRESS,
          to: RELICS_ADDRESS,
          data: mintCalldata
        });
        console.log(`✅ Can mint ${tokenName}`);
      } catch (e) {
        console.log(`❌ Cannot mint ${tokenName}`);
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
