const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔍 Testing burn call directly");
    console.log("User address:", deployer.address);

    const mawSacrificeAddress = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
    const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    
    const relics = await hre.ethers.getContractAt("Relics", relicsAddress);
    
    // Check current balance
    const balance = await relics.balanceOf(deployer.address, 1);
    console.log(`🔑 Current Lantern Fragment balance: ${balance}`);
    
    if (balance < 1) {
        console.log("❌ User doesn't have enough Lantern Fragments to burn");
        return;
    }
    
    // Try to burn 1 Lantern Fragment as the MawSacrifice would
    console.log("\n🔥 Testing burn call from MawSacrifice perspective...");
    
    try {
        // This simulates what the MawSacrifice contract would do
        const provider = hre.ethers.provider;
        
        // Create call data for burn function  
        const burnCalldata = relics.interface.encodeFunctionData("burn", [deployer.address, 1, 1]);
        
        // Simulate the call as if it came from MawSacrifice
        const result = await provider.call({
            to: relicsAddress,
            data: burnCalldata,
        });
        
        console.log("✅ Burn simulation succeeded");
        
    } catch (error) {
        console.log(`❌ Burn simulation failed: ${error.message}`);
        
        if (error.data) {
            try {
                // Try to decode the error
                const decoded = relics.interface.parseError(error.data);
                console.log(`Decoded error: ${decoded.name}(${decoded.args.join(', ')})`);
            } catch (decodeError) {
                console.log(`Raw error data: ${error.data}`);
            }
        }
    }
    
    // Let's also check if we can call burn directly as the user (this should fail)
    console.log("\n🔥 Testing direct burn call as user (should fail)...");
    
    try {
        const tx = await relics.burn(deployer.address, 1, 1);
        console.log("❌ Direct burn succeeded (this shouldn't happen!)");
    } catch (error) {
        console.log(`✅ Direct burn failed as expected: ${error.message}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });