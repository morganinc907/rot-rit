const hre = require("hardhat");

async function main() {
    console.log("🎯 Deploying MawSacrificeV5 with Fully Configurable Cosmetic Sacrifice...");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)));
    
    // Deploy new implementation
    const MawSacrificeV5 = await hre.ethers.getContractFactory("MawSacrificeV5");
    const newImplementation = await MawSacrificeV5.deploy();
    await newImplementation.waitForDeployment();
    
    const newImplAddress = await newImplementation.getAddress();
    console.log("✅ New MawSacrificeV5 implementation deployed:", newImplAddress);
    
    // Get proxy address
    const PROXY = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
    console.log("🔄 Upgrading proxy:", PROXY);
    
    console.log("\n🎉 Deployment complete!");
    console.log("\n📋 Next steps:");
    console.log("1. Upgrade proxy using cast");
    console.log("2. Configure cosmetic sacrifice requirements");
    console.log("3. Test fully configurable system");
    
    console.log("\n🛠️  Commands:");
    console.log("# Upgrade proxy");
    console.log(`cast send ${PROXY} "upgradeToAndCall(address,bytes)" ${newImplAddress} 0x --private-key $PRIVATE_KEY --rpc-url https://sepolia.base.org`);
    
    console.log("\n# Configure sacrifice requirements (fragments + optional masks)");
    console.log(`cast send ${PROXY} "setCosmeticSacrificeConfig(uint256,uint256,uint256,uint256,bool,uint256)" 2 1 3 3 true 3 --private-key $PRIVATE_KEY --rpc-url https://sepolia.base.org`);
    console.log("# primaryTokenId=2 (fragments), primaryMin=1, primaryMax=3, bonusTokenId=3 (masks), bonusEnabled=true, bonusMax=3");
    
    console.log("\n# Check configuration");
    console.log(`cast call ${PROXY} "getCosmeticSacrificeConfig()(uint256,uint256,uint256,uint256,bool,uint256)" --rpc-url https://sepolia.base.org`);
    
    console.log("\n# Test sacrifice");
    console.log(`cast call ${PROXY} "sacrificeForCosmetic(uint256,uint256)" 1 0 --from $USER --rpc-url https://sepolia.base.org`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });