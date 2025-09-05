const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Testing if Relics contract actually supports AccessControl...");
  
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  
  try {
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    
    // Test 1: Try supportsInterface (should work if it is ERC165 compliant)
    console.log("1. Testing supportsInterface...");
    try {
      const supports165 = await relics.supportsInterface("0x01ffc9a7"); // ERC165
      console.log("Supports ERC165:", supports165);
    } catch (e) {
      console.log("supportsInterface failed:", e.message);
    }
    
    // Test 2: Try owner() function (from Ownable)
    console.log("\n2. Testing owner() function...");
    try {
      const owner = await relics.owner();
      console.log("Contract owner:", owner);
    } catch (e) {
      console.log("owner() failed:", e.message);
    }
    
    // Test 3: Try paused() function (from Pausable)
    console.log("\n3. Testing paused() function...");
    try {
      const isPaused = await relics.paused();
      console.log("Contract paused:", isPaused);
    } catch (e) {
      console.log("paused() failed:", e.message);
    }
    
    // Test 4: Try MAW_ROLE constant
    console.log("\n4. Testing MAW_ROLE constant...");
    try {
      const mawRole = await relics.MAW_ROLE();
      console.log("MAW_ROLE constant:", mawRole);
    } catch (e) {
      console.log("MAW_ROLE constant failed:", e.message);
    }
    
    // Test 5: Try DEFAULT_ADMIN_ROLE 
    console.log("\n5. Testing DEFAULT_ADMIN_ROLE...");
    try {
      const adminRole = await relics.DEFAULT_ADMIN_ROLE();
      console.log("DEFAULT_ADMIN_ROLE:", adminRole);
    } catch (e) {
      console.log("DEFAULT_ADMIN_ROLE failed:", e.message);
    }
    
  } catch (error) {
    console.error("Script error:", error.message);
  }
}

main().catch(console.error);
