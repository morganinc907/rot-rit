const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🚀 Announcing Dev RNG Fix upgrade...");
    
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);
    
    // Deploy the Dev RNG fix implementation
    console.log("\n📦 Deploying MawSacrificeV4DevRNGFix...");
    const MawV4DevRNGFix = await ethers.getContractFactory("MawSacrificeV4DevRNGFix");
    const newImplementation = await MawV4DevRNGFix.deploy();
    await newImplementation.waitForDeployment();
    const newImplAddress = await newImplementation.getAddress();
    console.log("✅ New implementation deployed at:", newImplAddress);
    
    // Connect to proxy
    const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
    console.log("\n🔗 Connecting to proxy at:", PROXY_ADDRESS);
    
    // Connect as the upgradeable contract
    const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", PROXY_ADDRESS);
    
    try {
        // Check current delay
        console.log("\n📊 Checking upgrade parameters...");
        try {
            const delay = await maw.upgradeDelay();
            console.log("Current upgrade delay:", delay.toString(), "seconds");
        } catch {
            console.log("No upgradeDelay function found");
        }
        
        // Check if there's a pending upgrade
        try {
            const pending = await maw.pendingUpgrade();
            if (pending.newImplementation && pending.newImplementation !== ethers.ZeroAddress) {
                console.log("\n⚠️ There's already a pending upgrade:");
                console.log("Implementation:", pending.newImplementation);
                console.log("Announcement time:", new Date(Number(pending.announcementTime) * 1000).toISOString());
                
                // Try to execute it first
                console.log("\n🎯 Attempting to execute pending upgrade...");
                try {
                    const execTx = await maw.executeUpgrade();
                    await execTx.wait();
                    console.log("✅ Executed pending upgrade!");
                } catch (execError) {
                    console.log("Could not execute pending upgrade:", execError.message);
                }
            }
        } catch {
            console.log("No pendingUpgrade function or no pending upgrade");
        }
        
        // Now announce the new upgrade
        console.log("\n📢 Announcing upgrade to:", newImplAddress);
        const tx = await maw.announceUpgrade(newImplAddress);
        const receipt = await tx.wait();
        console.log("✅ Upgrade announced!");
        console.log("Transaction hash:", receipt.hash);
        
        // Check the pending upgrade
        try {
            const pending = await maw.pendingUpgrade();
            console.log("\n📊 Pending upgrade details:");
            console.log("- Implementation:", pending.newImplementation);
            console.log("- Announcement time:", new Date(Number(pending.announcementTime) * 1000).toISOString());
            
            const delay = await maw.upgradeDelay();
            if (delay == 0) {
                console.log("\n🎯 Upgrade can be executed immediately!");
                console.log("\n🚀 Executing upgrade now...");
                const execTx = await maw.executeUpgrade();
                await execTx.wait();
                console.log("✅ Upgrade executed successfully!");
            } else {
                const executeTime = Number(pending.announcementTime) + Number(delay);
                console.log("- Can execute after:", new Date(executeTime * 1000).toISOString());
            }
        } catch (e) {
            console.log("Could not verify pending upgrade:", e.message);
        }
        
    } catch (error) {
        console.error("\n❌ Error:", error.message);
        
        // If announcement fails, check if we're the owner
        try {
            const owner = await maw.owner();
            console.log("\nContract owner:", owner);
            console.log("Your address:", signer.address);
            if (owner.toLowerCase() !== signer.address.toLowerCase()) {
                console.log("❌ You are not the owner!");
            }
        } catch {}
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });