const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying MawSacrificeV5 with Configurable Reward Pool...");
    
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
    const upgradeTx = await proxy.upgradeToAndCall(newImplAddress, "0x");
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
    
    // Test new reward pool functions
    console.log("\n🧪 Testing reward pool functions...");
    
    try {
        // Check if reward pool is configured
        const [tokenIds, probabilities, totalWeight] = await proxy.getRewardPool();
        console.log("📊 Current reward pool:");
        console.log("   Token IDs:", tokenIds.map(id => id.toString()));
        console.log("   Probabilities:", probabilities.map(p => p.toString()));
        console.log("   Total Weight:", totalWeight.toString());
        
        if (tokenIds.length === 0) {
            console.log("⚠️  Reward pool not configured - using fallback distribution");
        } else {
            console.log("✅ Reward pool configured properly");
        }
        
        // Test healthcheck
        const healthResult = await proxy.healthcheck();
        console.log("🏥 Health check:");
        console.log("   Relics:", healthResult[0]);
        console.log("   MAW Trusted:", healthResult[1]);
        console.log("   Reward Pool Configured:", healthResult[6]);
        
    } catch (error) {
        console.log("❌ Error testing functions:", error.message);
    }
    
    console.log("\n🎉 Deployment complete!");
    console.log("\n📋 Next steps:");
    console.log("1. Set reward pool with correct token IDs and probabilities");
    console.log("2. Test sacrifice operations");
    console.log("3. Verify frontend picks up new configuration");
    
    console.log("\n🛠️  Example reward pool setup:");
    console.log("cast send", PROXY, '"setRewardPool(uint256[],uint256[])"', '"[2,3,8,5,6,7,9]"', '"[750,150,50,30,15,4,1]"', "--private-key $PRIVATE_KEY --rpc-url https://sepolia.base.org");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });