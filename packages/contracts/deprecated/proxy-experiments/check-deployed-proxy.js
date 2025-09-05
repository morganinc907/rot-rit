const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking deployed proxy contract...\n");

  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";

  try {
    // Check if contract exists
    console.log("1️⃣ Checking contract existence...");
    const code = await hre.ethers.provider.getCode(PROXY_ADDRESS);
    console.log("Contract has code:", code !== "0x");
    console.log("Code length:", code.length);

    // Try to interact with it as our upgradeable contract
    console.log("2️⃣ Testing contract interactions...");
    const contract = await hre.ethers.getContractAt("MawSacrificeV3Upgradeable", PROXY_ADDRESS);
    
    try {
      const version = await contract.version();
      console.log("✅ Version:", version);
    } catch (error) {
      console.log("⚠️  Version call failed:", error.message.slice(0, 100));
    }

    try {
      const rustedKey = await contract.RUSTED_KEY();
      console.log("✅ RUSTED_KEY:", rustedKey.toString());
    } catch (error) {
      console.log("⚠️  RUSTED_KEY call failed:", error.message.slice(0, 100));
    }

    try {
      const owner = await contract.owner();
      console.log("✅ Owner:", owner);
    } catch (error) {
      console.log("⚠️  Owner call failed:", error.message.slice(0, 100));
    }

    try {
      const relics = await contract.relics();
      console.log("✅ Relics:", relics);
    } catch (error) {
      console.log("⚠️  Relics call failed:", error.message.slice(0, 100));
    }

    // Check if it looks like a proxy by checking for ERC1967 storage slots
    console.log("3️⃣ Checking ERC1967 proxy storage...");
    
    // Implementation slot: keccak256("eip1967.proxy.implementation") - 1
    const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const implStorage = await hre.ethers.provider.getStorage(PROXY_ADDRESS, IMPLEMENTATION_SLOT);
    const implementationAddress = "0x" + implStorage.slice(-40);
    console.log("Implementation from storage:", implementationAddress);
    
    if (implementationAddress !== "0x0000000000000000000000000000000000000000") {
      console.log("✅ This appears to be a valid proxy!");
      
      // Try to call the implementation directly
      console.log("4️⃣ Testing implementation directly...");
      try {
        const impl = await hre.ethers.getContractAt("MawSacrificeV3Upgradeable", implementationAddress);
        const implVersion = await impl.version();
        console.log("✅ Implementation version:", implVersion);
      } catch (error) {
        console.log("⚠️  Implementation call failed:", error.message.slice(0, 100));
      }
    } else {
      console.log("❌ No implementation found in proxy storage");
    }

  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });