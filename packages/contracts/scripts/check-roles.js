const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking MAW_ROLE on proxy vs implementation...");
  
  const networkAddresses = addresses.baseSepolia;
  const relics = await ethers.getContractAt("Relics", networkAddresses.Relics);
  
  // Get MAW_ROLE hash
  const MAW_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
  console.log("MAW_ROLE hash:", MAW_ROLE);
  
  // Check proxy address (what we want)
  const proxyAddress = networkAddresses.MawSacrifice;
  const hasRoleProxy = await relics.hasRole(MAW_ROLE, proxyAddress);
  console.log("Proxy address:", proxyAddress);
  console.log("Proxy has MAW_ROLE:", hasRoleProxy);
  
  // Try to find what address actually has the role by checking recent events
  console.log("\nChecking recent role grants...");
  const filter = relics.filters.RoleGranted(MAW_ROLE);
  const events = await relics.queryFilter(filter, -1000); // last 1000 blocks
  
  for (const event of events) {
    console.log(`Role granted to: ${event.args.account} at block ${event.blockNumber}`);
  }
  
  // If proxy doesnt have role, grant it
  if (!hasRoleProxy) {
    console.log("\n🔧 Granting MAW_ROLE to proxy...");
    const [signer] = await ethers.getSigners();
    const owner = await relics.owner();
    
    if (owner.toLowerCase() === signer.address.toLowerCase()) {
      const tx = await relics.grantRole(MAW_ROLE, proxyAddress);
      await tx.wait();
      console.log("✅ Granted MAW_ROLE to proxy!");
      
      // Verify
      const hasRoleNow = await relics.hasRole(MAW_ROLE, proxyAddress);
      console.log("Verification - proxy now has MAW_ROLE:", hasRoleNow);
    } else {
      console.log("❌ Not owner, cannot grant role");
    }
  }
}

main().catch(console.error);
