const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🔍 Checking roles...");
    
    const [signer] = await ethers.getSigners();
    console.log("Your address:", signer.address);
    
    const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
    const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", PROXY_ADDRESS);
    
    // Get role hashes
    const UPGRADER_ROLE = await maw.UPGRADER_ROLE();
    const PAUSER_ROLE = await maw.PAUSER_ROLE();
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    
    console.log("\n📊 Role hashes:");
    console.log("UPGRADER_ROLE:", UPGRADER_ROLE);
    console.log("PAUSER_ROLE:", PAUSER_ROLE);
    console.log("DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);
    
    // Check if signer has roles
    console.log("\n✅ Your roles:");
    const hasUpgrader = await maw.hasRole(UPGRADER_ROLE, signer.address);
    const hasPauser = await maw.hasRole(PAUSER_ROLE, signer.address);
    const hasAdmin = await maw.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
    
    console.log("Has UPGRADER_ROLE:", hasUpgrader);
    console.log("Has PAUSER_ROLE:", hasPauser);
    console.log("Has DEFAULT_ADMIN_ROLE:", hasAdmin);
    
    // Check owner
    const owner = await maw.owner();
    console.log("\n👑 Contract owner:", owner);
    console.log("Are you the owner?", owner.toLowerCase() === signer.address.toLowerCase());
    
    // If not upgrader, try to grant role
    if (!hasUpgrader && hasAdmin) {
        console.log("\n🔧 You have admin role, granting UPGRADER_ROLE...");
        try {
            const tx = await maw.grantRole(UPGRADER_ROLE, signer.address);
            await tx.wait();
            console.log("✅ UPGRADER_ROLE granted!");
        } catch (error) {
            console.log("❌ Failed to grant UPGRADER_ROLE:", error.message);
        }
    } else if (!hasUpgrader && !hasAdmin) {
        console.log("\n❌ You don't have UPGRADER_ROLE or DEFAULT_ADMIN_ROLE");
        console.log("You need one of these roles to perform upgrades");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });