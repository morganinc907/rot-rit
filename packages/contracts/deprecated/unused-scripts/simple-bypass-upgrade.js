const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🔧 Simple Bypass Upgrade (High Gas Price)");
    
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);
    
    const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
    const BYPASS_IMPL = "0x6d2c45d31B656662701C2BdBb169891436Aac174"; // Already deployed
    
    console.log("Proxy:", PROXY_ADDRESS);
    console.log("Bypass implementation:", BYPASS_IMPL);
    
    // Get current nonce
    const nonce = await signer.getNonce();
    console.log("Current nonce:", nonce);
    
    // Connect to proxy
    const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", PROXY_ADDRESS);
    
    // Try the upgrade with high gas price
    console.log("\n⚡ Attempting upgrade with higher gas price...");
    try {
        const tx = await proxy.upgradeToAndCall(BYPASS_IMPL, "0x", {
            gasLimit: 1000000,
            gasPrice: ethers.parseUnits("20", "gwei"), // Higher gas price
            nonce: nonce
        });
        
        console.log("Transaction sent:", tx.hash);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Upgrade successful!");
        console.log("Transaction:", receipt.hash);
        console.log("Gas used:", receipt.gasUsed.toString());
        
        // Test the bypass
        console.log("\n🧪 Testing bypass functionality...");
        const bypassProxy = await ethers.getContractAt("MawSacrificeV4Bypass", PROXY_ADDRESS);
        
        try {
            const version = await bypassProxy.getBypassVersion();
            console.log("✅ Bypass version:", version);
        } catch {
            console.log("Bypass version function not available");
        }
        
        try {
            const delay = await bypassProxy.getUpgradeDelay();
            console.log("✅ Upgrade delay:", delay.toString());
        } catch {
            console.log("No upgrade delay function");
        }
        
        console.log("\n🎉 Bypass implementation is now active!");
        console.log("You can now upgrade immediately without timelock restrictions.");
        
    } catch (error) {
        console.error("❌ Upgrade failed:", error.message);
        
        if (error.message.includes("Use announceUpgrade")) {
            console.log("\n❌ The current implementation is enforcing timelock.");
            console.log("This means we need to:");
            console.log("1. Find who has UPGRADER_ROLE");
            console.log("2. Go through the 24-hour announcement process"); 
            console.log("3. Or find another bypass method");
            
            // Check roles
            console.log("\n🔍 Checking upgrade roles...");
            try {
                const UPGRADER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPGRADER_ROLE"));
                const hasRole = await proxy.hasRole(UPGRADER_ROLE, signer.address);
                console.log("You have UPGRADER_ROLE:", hasRole);
                
                if (hasRole) {
                    console.log("✅ You have UPGRADER_ROLE - you can announce upgrades!");
                } else {
                    console.log("❌ You don't have UPGRADER_ROLE");
                }
            } catch (roleError) {
                console.log("Could not check roles:", roleError.message);
            }
        }
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });