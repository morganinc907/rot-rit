const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🚀 Immediate RNG Fix Upgrade (No Timelock)");
    
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);
    
    const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
    console.log("Proxy address:", PROXY_ADDRESS);
    
    // Deploy the Dev RNG fix implementation (has no timelock in _authorizeUpgrade)
    console.log("\n📦 Deploying MawSacrificeV4DevRNGFix implementation...");
    const MawV4DevRNGFix = await ethers.getContractFactory("MawSacrificeV4DevRNGFix");
    const newImplementation = await MawV4DevRNGFix.deploy();
    await newImplementation.waitForDeployment();
    const newImplAddress = await newImplementation.getAddress();
    console.log("✅ New implementation deployed at:", newImplAddress);
    
    // Connect to proxy as owner
    console.log("\n🔗 Connecting to proxy...");
    const proxy = await ethers.getContractAt("MawSacrificeV4Dev", PROXY_ADDRESS);
    
    // Verify ownership
    const owner = await proxy.owner();
    console.log("Proxy owner:", owner);
    console.log("Your address:", signer.address);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        throw new Error("You are not the owner of this proxy!");
    }
    
    console.log("✅ Ownership verified");
    
    // Perform the upgrade
    console.log("\n⚡ Executing immediate upgrade...");
    try {
        const tx = await proxy.upgradeToAndCall(newImplAddress, "0x");
        const receipt = await tx.wait();
        console.log("✅ Upgrade successful!");
        console.log("Transaction hash:", receipt.hash);
        
        // Verify the upgrade
        console.log("\n🔍 Verifying upgrade...");
        
        // Check if we can call the RNG test function (only available in DevRNGFix)
        try {
            const result = await proxy.testRNG(1);
            console.log("✅ RNG test function available - upgrade confirmed!");
            console.log("Test RNG result:", result.toString());
        } catch {
            console.log("RNG test function not available");
        }
        
        // Update addresses.json to point to the proxy (not the standalone implementation)
        const addresses = require('../../addresses/addresses.json');
        const oldMawAddress = addresses.baseSepolia.MawSacrifice;
        
        addresses.baseSepolia.MawSacrifice = PROXY_ADDRESS;
        addresses.baseSepolia.MawSacrificeV3Upgradeable = PROXY_ADDRESS; // Keep both for compatibility
        
        const fs = require('fs');
        const path = require('path');
        const addressesPath = path.resolve('../../addresses/addresses.json');
        fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
        
        console.log("📝 Updated addresses.json:");
        console.log("Old MawSacrifice:", oldMawAddress);
        console.log("New MawSacrifice:", PROXY_ADDRESS);
        
        console.log("\n🎉 RNG fix upgrade complete!");
        console.log("- RNG bug is now fixed with proper nonce incrementing");
        console.log("- Future upgrades can be done immediately (no timelock)");
        console.log("- Cosmetic sacrifices should now work with proper success rates");
        
        console.log("\n🔄 Next steps:");
        console.log("1. Regenerate frontend packages: npm run build:packages");
        console.log("2. Test cosmetic sacrifices in the frontend");
        console.log("3. Verify cosmetics are being minted instead of just glass shards");
        
    } catch (error) {
        console.error("❌ Upgrade failed:", error.message);
        
        // Try to decode the error
        if (error.message.includes("Use announceUpgrade")) {
            console.log("\n🔍 The current implementation still has timelock restrictions.");
            console.log("This means we need to upgrade to a version without timelock first.");
            
            // Try upgrading to the basic Dev contract first
            console.log("\n🔄 Trying to upgrade to basic Dev contract first...");
            const MawV4Dev = await ethers.getContractFactory("MawSacrificeV4Dev");
            const devImpl = await MawV4Dev.deploy();
            await devImpl.waitForDeployment();
            const devImplAddress = await devImpl.getAddress();
            console.log("Dev implementation:", devImplAddress);
            
            try {
                const tx2 = await proxy.upgradeToAndCall(devImplAddress, "0x");
                await tx2.wait();
                console.log("✅ Upgraded to Dev contract successfully!");
                
                // Now try the RNG fix
                const tx3 = await proxy.upgradeToAndCall(newImplAddress, "0x");
                await tx3.wait();
                console.log("✅ RNG fix upgrade successful!");
            } catch (err2) {
                console.error("❌ Dev upgrade also failed:", err2.message);
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