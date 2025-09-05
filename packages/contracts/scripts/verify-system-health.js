const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Systematic proxy and role verification...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  const [signer] = await ethers.getSigners();
  
  console.log("Proxy address (what we should use):", PROXY_ADDRESS);
  console.log("Relics address:", RELICS_ADDRESS);
  console.log("User address:", signer.address);
  
  try {
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    
    // 1. Check if proxy has MAW_ROLE
    console.log("\n1. Checking MAW_ROLE on proxy...");
    try {
      const MAW_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
      console.log("MAW_ROLE hash:", MAW_ROLE);
      
      const hasRole = await relics.hasRole(MAW_ROLE, PROXY_ADDRESS);
      console.log("Proxy has MAW_ROLE:", hasRole);
      
      if (!hasRole) {
        console.log("❌ PROBLEM: Proxy does NOT have MAW_ROLE");
        console.log("Attempting to grant it...");
        const tx = await relics.grantRole(MAW_ROLE, PROXY_ADDRESS);
        await tx.wait();
        console.log("✅ Granted MAW_ROLE to proxy:", tx.hash);
      } else {
        console.log("✅ Proxy already has MAW_ROLE");
      }
    } catch (e) {
      console.log("Role check failed:", e.message);
    }
    
    // 2. Check user approval
    console.log("\n2. Checking user approval...");
    const isApproved = await relics.isApprovedForAll(signer.address, PROXY_ADDRESS);
    console.log("User approved proxy:", isApproved);
    
    if (!isApproved) {
      console.log("❌ PROBLEM: User has NOT approved the proxy");
      console.log("Granting approval...");
      const tx = await relics.setApprovalForAll(PROXY_ADDRESS, true);
      await tx.wait();
      console.log("✅ Approved proxy for user:", tx.hash);
    } else {
      console.log("✅ User already approved proxy");
    }
    
    // 3. Check what address is stored in Relics.mawSacrifice
    console.log("\n3. Checking stored mawSacrifice address...");
    const storedMaw = await relics.mawSacrifice();
    console.log("Stored mawSacrifice:", storedMaw);
    console.log("Matches proxy:", storedMaw.toLowerCase() === PROXY_ADDRESS.toLowerCase());
    
    if (storedMaw.toLowerCase() !== PROXY_ADDRESS.toLowerCase()) {
      console.log("❌ PROBLEM: Wrong address stored in mawSacrifice");
      console.log("Fixing with setMawSacrifice...");
      const tx = await relics.setMawSacrifice(PROXY_ADDRESS);
      await tx.wait();
      console.log("✅ Set correct mawSacrifice:", tx.hash);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
