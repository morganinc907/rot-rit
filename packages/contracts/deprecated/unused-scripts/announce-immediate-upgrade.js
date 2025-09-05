const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🚀 Announcing immediate upgrade...");
    
    const [signer] = await ethers.getSigners();
    console.log("Deploying with account:", signer.address);
    
    // Deploy the Dev RNG fix implementation first
    console.log("\n📦 Deploying Dev RNG fix implementation...");
    const MawV4RNGFix = await ethers.getContractFactory("MawSacrificeV4DevRNGFix");
    const newImplementation = await MawV4RNGFix.deploy();
    await newImplementation.waitForDeployment();
    const newImplAddress = await newImplementation.getAddress();
    console.log("✅ New implementation deployed at:", newImplAddress);
    
    // Get the proxy contract
    const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
    console.log("\n🔗 Connecting to proxy at:", PROXY_ADDRESS);
    
    // Connect to the proxy as MawSacrificeV4Dev since it has the upgrade functions
    const maw = await ethers.getContractAt("MawSacrificeV4Dev", PROXY_ADDRESS);
    
    // Set upgrade delay to 0 for immediate execution
    console.log("\n⏰ Setting upgrade delay to 0...");
    try {
        const tx1 = await maw.setUpgradeDelay(0);
        await tx1.wait();
        console.log("✅ Upgrade delay set to 0 (immediate execution)");
    } catch (error) {
        console.log("⚠️ Could not set upgrade delay (might not have permission or function)");
    }
    
    // Announce the upgrade
    console.log("\n📢 Announcing upgrade to:", newImplAddress);
    try {
        const tx = await maw.announceUpgrade(newImplAddress);
        const receipt = await tx.wait();
        console.log("✅ Upgrade announced!");
        console.log("Transaction hash:", receipt.hash);
        
        // Get the announcement details
        const pendingUpgrade = await maw.pendingUpgrade();
        const upgradeDelay = await maw.upgradeDelay();
        
        console.log("\n📊 Upgrade details:");
        console.log("- New implementation:", pendingUpgrade.implementation);
        console.log("- Announcement time:", new Date(Number(pendingUpgrade.announcementTime) * 1000).toISOString());
        console.log("- Upgrade delay:", upgradeDelay.toString(), "seconds");
        
        if (upgradeDelay == 0) {
            console.log("\n🎯 Upgrade can be executed immediately!");
            console.log("Run this command to execute:");
            console.log("PRIVATE_KEY=xxx npx hardhat run scripts/execute-upgrade.js --network baseSepolia");
        } else {
            const executeTime = Number(pendingUpgrade.announcementTime) + Number(upgradeDelay);
            console.log("- Can execute after:", new Date(executeTime * 1000).toISOString());
        }
        
    } catch (error) {
        console.error("❌ Failed to announce upgrade:", error.message);
        
        // Try alternative approach
        console.log("\n🔄 Trying alternative approach with direct upgrade...");
        try {
            const tx = await maw.upgradeToAndCall(newImplAddress, "0x");
            const receipt = await tx.wait();
            console.log("✅ Direct upgrade successful!");
            console.log("Transaction hash:", receipt.hash);
        } catch (err2) {
            console.error("❌ Direct upgrade also failed:", err2.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });