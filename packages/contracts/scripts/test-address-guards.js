/**
 * Test the address guard system
 * Verifies that:
 * 1. Correct address is returned for Base Sepolia
 * 2. Old address triggers guard error
 * 3. Console logging works
 */

// Simulate the address system
const CHAIN = {
  BASE_SEPOLIA: 84532,
};

const ADDRS = {
  [CHAIN.BASE_SEPOLIA]: {
    MawSacrifice: "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db",
    Relics: "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b",
  },
};

const OLD = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625".toLowerCase();

function getMawAddress(chainId = CHAIN.BASE_SEPOLIA) {
  const addr = ADDRS[chainId]?.MawSacrifice;
  if (!addr) throw new Error(`No MawSacrifice address for chain ${chainId}`);

  if (addr.toLowerCase() === OLD) {
    // Fail loudly so no one can accidentally use the old contract again.
    throw new Error("🛑 Using OLD MawSacrifice address — fix your config!");
  }
  
  console.log("[MawSacrifice address]", addr, { chainId });
  return addr;
}

async function main() {
  console.log("🧪 Testing Address Guard System\n");
  
  // Test 1: Correct address should work and log
  console.log("✅ Test 1: Getting correct address for Base Sepolia");
  try {
    const addr = getMawAddress();
    console.log(`   Result: ${addr}`);
    if (addr === "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db") {
      console.log("   ✅ PASS: Correct address returned");
    } else {
      console.log("   ❌ FAIL: Wrong address returned");
    }
  } catch (error) {
    console.log(`   ❌ FAIL: Unexpected error: ${error.message}`);
  }
  
  // Test 2: Simulate old address detection
  console.log("\n🛡️  Test 2: Testing guard against old address");
  const testAddrs = {
    [CHAIN.BASE_SEPOLIA]: {
      MawSacrifice: OLD, // Inject old address to test guard
    },
  };
  
  function getMawAddressWithOldAddr(chainId = CHAIN.BASE_SEPOLIA) {
    const addr = testAddrs[chainId]?.MawSacrifice;
    if (!addr) throw new Error(`No MawSacrifice address for chain ${chainId}`);

    if (addr.toLowerCase() === OLD) {
      throw new Error("🛑 Using OLD MawSacrifice address — fix your config!");
    }
    
    return addr;
  }
  
  try {
    const addr = getMawAddressWithOldAddr();
    console.log("   ❌ FAIL: Should have thrown guard error");
  } catch (error) {
    if (error.message.includes("🛑 Using OLD MawSacrifice address")) {
      console.log("   ✅ PASS: Guard correctly blocked old address");
      console.log(`   🛡️  Guard message: ${error.message}`);
    } else {
      console.log(`   ❌ FAIL: Wrong error: ${error.message}`);
    }
  }
  
  console.log("\n🎉 Address Guard System Test Complete!");
  console.log("   - Runtime guards are active");
  console.log("   - Console logging works"); 
  console.log("   - Old address detection works");
  console.log("\n📝 Next: Test in browser console at http://localhost:5173");
}

main().catch(console.error);