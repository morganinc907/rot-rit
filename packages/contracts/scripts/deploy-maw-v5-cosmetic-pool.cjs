const hre = require("hardhat");

async function main() {
    console.log("🎨 Deploying MawSacrificeV5 with Configurable Cosmetic Pool...");
    
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
    
    // Upgrade proxy to new implementation
    const proxy = await hre.ethers.getContractAt("MawSacrificeV5", PROXY);
    const upgradeTx = await proxy.upgradeTo(newImplAddress);
    await upgradeTx.wait();
    
    console.log("✅ Proxy upgraded successfully!");
    
    // Verify the upgrade worked
    const currentImpl = await hre.ethers.provider.getStorage(
        PROXY,
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc" // EIP-1967 implementation slot
    );
    const actualImpl = "0x" + currentImpl.slice(26); // Remove padding
    
    console.log("🔍 Current implementation:", actualImpl);
    console.log("🎯 Expected implementation:", newImplAddress.toLowerCase());
    console.log("✅ Implementation match:", actualImpl.toLowerCase() === newImplAddress.toLowerCase());
    
    // Test new cosmetic pool functions
    console.log("\n🧪 Testing cosmetic pool functions...");
    
    try {
        // Check if cosmetic pool is configured
        const [ids, weights, total] = await proxy.getCosmeticPool();
        console.log("🎨 Current cosmetic pool:");
        console.log("   Token IDs:", ids.map(id => id.toString()));
        console.log("   Weights:", weights.map(w => w.toString()));
        console.log("   Total Weight:", total.toString());
        
        if (ids.length === 0) {
            console.log("⚠️  Cosmetic pool not configured - function will revert until configured");
        } else {
            console.log("✅ Cosmetic pool configured properly");
        }
        
        // Test healthcheck for reward pool status
        const healthResult = await proxy.healthcheck();
        console.log("🏥 Health check:");
        console.log("   Relics:", healthResult[0]);
        console.log("   MAW Trusted:", healthResult[1]);
        console.log("   Reward Pool Configured:", healthResult[6]);
        
        // Test that sacrificeForCosmetic function exists
        console.log("🎨 Testing sacrificeForCosmetic function selector...");
        const selector = hre.ethers.id("sacrificeForCosmetic(uint256,uint256)").slice(0, 10);
        console.log("   Function selector:", selector);
        
    } catch (error) {
        console.log("❌ Error testing functions:", error.message);
    }
    
    console.log("\n🎉 Deployment complete!");
    console.log("\n📋 Next steps:");
    console.log("1. Configure cosmetic pool with token IDs and weights");
    console.log("2. Test cosmetic sacrifice operations");
    console.log("3. Verify frontend picks up new functionality");
    
    console.log("\n🛠️  Example cosmetic pool setup:");
    console.log("# Set cosmetic pool with example cosmetic token IDs and weights");
    console.log("cast send", PROXY, '"setCosmeticPool(uint256[],uint256[])"', '"[10,11,12,13,14]"', '"[50,30,15,4,1]"', "--private-key $PRIVATE_KEY --rpc-url https://sepolia.base.org");
    
    console.log("\n🧪 Test cosmetic sacrifice:");
    console.log("cast send", PROXY, '"sacrificeForCosmetic(uint256,uint256)"', '1 0', "--private-key $PRIVATE_KEY --rpc-url https://sepolia.base.org");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });