const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🔧 Initializing roles for contract owner...");
    
    const [signer] = await ethers.getSigners();
    console.log("Signer:", signer.address);
    
    const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
    const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", PROXY_ADDRESS);
    
    // Verify ownership
    const owner = await proxy.owner();
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        throw new Error("You are not the owner!");
    }
    console.log("✅ Ownership verified");
    
    // Check if there's an initialize function for roles
    console.log("\\n🔍 Checking for role initialization functions...");
    
    try {
        // Try to call _grantRole directly (this might work for owner)
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        
        console.log("Trying to grant DEFAULT_ADMIN_ROLE to owner...");
        const tx1 = await proxy.grantRole(DEFAULT_ADMIN_ROLE, signer.address);
        await tx1.wait();
        console.log("✅ DEFAULT_ADMIN_ROLE granted!");
        
        // Now grant UPGRADER_ROLE
        const UPGRADER_ROLE = await proxy.UPGRADER_ROLE();
        console.log("Trying to grant UPGRADER_ROLE...");
        const tx2 = await proxy.grantRole(UPGRADER_ROLE, signer.address);
        await tx2.wait();
        console.log("✅ UPGRADER_ROLE granted!");
        
        // Verify
        const hasAdmin = await proxy.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
        const hasUpgrader = await proxy.hasRole(UPGRADER_ROLE, signer.address);
        
        console.log("\\n📊 Final role verification:");
        console.log("Has DEFAULT_ADMIN_ROLE:", hasAdmin);
        console.log("Has UPGRADER_ROLE:", hasUpgrader);
        
        if (hasUpgrader) {
            console.log("\\n🎉 Success! You can now announce upgrades!");
            console.log("Next step: Run announce-timelock-removal.js");
        }
        
    } catch (error) {
        console.error("❌ Role initialization failed:", error.message);
        
        // Try alternative methods
        console.log("\\n🔄 Trying alternative approaches...");
        
        // Check if there's a setupRoles function
        try {
            console.log("Trying setupRoles function...");
            const setupTx = await proxy.setupRoles();
            await setupTx.wait();
            console.log("✅ setupRoles worked!");
        } catch (setupError) {
            console.log("setupRoles failed:", setupError.message);
        }
        
        // Check if there's an initializeRoles function
        try {
            console.log("Trying initializeRoles function...");
            const initTx = await proxy.initializeRoles(signer.address);
            await initTx.wait();
            console.log("✅ initializeRoles worked!");
        } catch (initError) {
            console.log("initializeRoles failed:", initError.message);
        }
        
        // As a last resort, check if we can call internal functions as owner
        try {
            console.log("Trying direct internal call...");
            // Some contracts allow owner to bypass role checks
            const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
            const internalTx = await proxy._grantRole(DEFAULT_ADMIN_ROLE, signer.address);
            await internalTx.wait();
            console.log("✅ Internal call worked!");
        } catch (internalError) {
            console.log("Internal call failed:", internalError.message);
        }
        
        console.log("\\n💡 If all else fails, the roles might need to be set during deployment/initialization.");
        console.log("The contract may need to be redeployed with proper role setup.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });