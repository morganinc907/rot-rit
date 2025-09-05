const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🔧 Granting roles to owner...");
    
    const [signer] = await ethers.getSigners();
    console.log("Your address:", signer.address);
    
    const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
    const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", PROXY_ADDRESS);
    
    // Get role hashes
    const UPGRADER_ROLE = await maw.UPGRADER_ROLE();
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    
    // Check owner
    const owner = await maw.owner();
    console.log("Contract owner:", owner);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log("❌ You are not the owner!");
        return;
    }
    
    // As owner, grant ourselves admin role first
    console.log("\n🎯 Granting DEFAULT_ADMIN_ROLE to owner...");
    try {
        // Try direct role grant as owner
        const tx1 = await maw.grantRole(DEFAULT_ADMIN_ROLE, signer.address);
        await tx1.wait();
        console.log("✅ DEFAULT_ADMIN_ROLE granted!");
    } catch (error) {
        console.log("Could not grant admin role:", error.message);
        
        // Try alternative: initialize roles if not initialized
        console.log("\n🔄 Trying to setup initial roles...");
        try {
            // Some contracts have a setupRoles or similar function
            const tx = await maw.setupRoles();
            await tx.wait();
            console.log("✅ Roles setup!");
        } catch {
            console.log("No setupRoles function available");
        }
    }
    
    // Now grant UPGRADER_ROLE
    console.log("\n🎯 Granting UPGRADER_ROLE to owner...");
    try {
        const tx2 = await maw.grantRole(UPGRADER_ROLE, signer.address);
        await tx2.wait();
        console.log("✅ UPGRADER_ROLE granted!");
    } catch (error) {
        console.log("❌ Failed to grant UPGRADER_ROLE:", error.message);
    }
    
    // Verify roles
    console.log("\n📊 Verifying roles...");
    const hasUpgrader = await maw.hasRole(UPGRADER_ROLE, signer.address);
    const hasAdmin = await maw.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
    
    console.log("Has UPGRADER_ROLE:", hasUpgrader);
    console.log("Has DEFAULT_ADMIN_ROLE:", hasAdmin);
    
    if (hasUpgrader) {
        console.log("\n✅ You can now announce and execute upgrades!");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });