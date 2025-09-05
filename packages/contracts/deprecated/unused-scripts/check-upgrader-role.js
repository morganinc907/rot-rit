const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🔍 Checking UPGRADER_ROLE permissions...");
    
    const [signer] = await ethers.getSigners();
    console.log("Signer:", signer.address);
    
    const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
    console.log("Proxy:", PROXY_ADDRESS);
    
    // Connect to the proxy
    const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", PROXY_ADDRESS);
    
    // Check basic info
    const owner = await proxy.owner();
    console.log("Contract owner:", owner);
    console.log("Is owner:", owner.toLowerCase() === signer.address.toLowerCase());
    
    // Check roles
    try {
        const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        
        console.log("\\nRole hashes:");
        console.log("UPGRADER_ROLE:", UPGRADER_ROLE);
        console.log("DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);
        
        const hasUpgraderRole = await proxy.hasRole(UPGRADER_ROLE, signer.address);
        const hasAdminRole = await proxy.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
        
        console.log("\\nYour roles:");
        console.log("Has UPGRADER_ROLE:", hasUpgraderRole);
        console.log("Has DEFAULT_ADMIN_ROLE:", hasAdminRole);
        
        if (hasUpgraderRole) {
            console.log("✅ You can announce upgrades!");
        } else if (hasAdminRole) {
            console.log("🔧 You have admin role - can grant yourself UPGRADER_ROLE");
            
            // Grant UPGRADER_ROLE to ourselves
            console.log("\\n🎯 Granting UPGRADER_ROLE to self...");
            const tx = await proxy.grantRole(UPGRADER_ROLE, signer.address);
            await tx.wait();
            console.log("✅ UPGRADER_ROLE granted!");
            
            // Verify
            const nowHasRole = await proxy.hasRole(UPGRADER_ROLE, signer.address);
            console.log("Verification - now has UPGRADER_ROLE:", nowHasRole);
            
        } else {
            console.log("❌ You don't have UPGRADER_ROLE or DEFAULT_ADMIN_ROLE");
            
            // Check who has these roles
            console.log("\\n🔍 Looking for role holders...");
            
            // This is harder to do without events, but we can try some common addresses
            const rolesToCheck = [
                { name: "Your address", addr: signer.address },
                { name: "Contract owner", addr: owner },
                { name: "Zero address", addr: ethers.ZeroAddress }
            ];
            
            for (const check of rolesToCheck) {
                const hasUpgrader = await proxy.hasRole(UPGRADER_ROLE, check.addr);
                const hasAdmin = await proxy.hasRole(DEFAULT_ADMIN_ROLE, check.addr);
                
                if (hasUpgrader || hasAdmin) {
                    console.log(`${check.name} (${check.addr}):`);
                    console.log(`  UPGRADER_ROLE: ${hasUpgrader}`);
                    console.log(`  DEFAULT_ADMIN_ROLE: ${hasAdmin}`);
                }
            }
        }
        
    } catch (error) {
        console.error("Failed to check roles:", error.message);
    }
    
    // Check upgrade delay
    try {
        const delay = await proxy.UPGRADE_DELAY();
        console.log("\\nUpgrade delay:", delay.toString(), "seconds");
        console.log("That's", Math.floor(Number(delay) / 3600), "hours");
    } catch {
        console.log("Could not get UPGRADE_DELAY");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });