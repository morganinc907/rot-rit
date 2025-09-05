const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🔧 Fixing cosmetics authorization...");
    
    const [signer] = await ethers.getSigners();
    console.log("Signer:", signer.address);
    
    const RNG_CONTRACT = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
    const COSMETICS_CONTRACT = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
    
    console.log("Target RNG contract:", RNG_CONTRACT);
    console.log("Cosmetics contract:", COSMETICS_CONTRACT);
    
    // Try different interfaces to find the right one
    console.log("\n🔍 Trying different cosmetics interfaces...");
    
    // Try CosmeticsV2 interface
    try {
        console.log("Trying CosmeticsV2...");
        const cosmetics = await ethers.getContractAt("CosmeticsV2", COSMETICS_CONTRACT);
        
        const owner = await cosmetics.owner();
        console.log("Owner:", owner);
        
        if (owner.toLowerCase() === signer.address.toLowerCase()) {
            console.log("✅ You own this contract!");
            
            // Try setMawSacrifice
            try {
                const tx = await cosmetics.setMawSacrifice(RNG_CONTRACT);
                await tx.wait();
                console.log("✅ setMawSacrifice worked!");
                return;
            } catch (e) {
                console.log("setMawSacrifice failed:", e.message);
            }
            
            // Try setContracts
            try {
                const tx = await cosmetics.setContracts(
                    RNG_CONTRACT,
                    "0x9Bd1651f1f8aB416A72f094fB60BbC1737B67DB6", // KeyShop from addresses
                    RNG_CONTRACT
                );
                await tx.wait();
                console.log("✅ setContracts worked!");
                return;
            } catch (e) {
                console.log("setContracts failed:", e.message);
            }
            
        } else {
            console.log("❌ You don't own this contract");
        }
        
    } catch (error) {
        console.log("CosmeticsV2 interface failed:", error.message);
    }
    
    // If we get here, let's check what functions are available
    console.log("\n🔍 Analyzing available functions...");
    try {
        const cosmetics = await ethers.getContractAt([
            "function owner() view returns (address)",
            "function transferOwnership(address newOwner)",
        ], COSMETICS_CONTRACT);
        
        const owner = await cosmetics.owner();
        console.log("Contract owner:", owner);
        
        if (owner.toLowerCase() === signer.address.toLowerCase()) {
            console.log("\n💡 You own the cosmetics contract!");
            console.log("Since cosmetics authorization is complex, let's:");
            console.log("1. Test the RNG contract with current setup");
            console.log("2. See if cosmetics work with the existing authorization");
            
            // Test a cosmetic sacrifice
            console.log("\n🧪 Testing RNG fix contract directly...");
            const rngContract = await ethers.getContractAt("MawSacrificeV4DevRNGFix", RNG_CONTRACT);
            
            try {
                const testResult = await rngContract.testRNG(42);
                console.log("✅ RNG test successful:", testResult.toString());
                
                console.log("\n🎯 The RNG fix contract is working!");
                console.log("Let's test a cosmetic sacrifice...");
                
            } catch (testError) {
                console.log("RNG test failed:", testError.message);
            }
            
        } else {
            console.log("❌ Not the owner - cosmetics authorization will need to be done by:", owner);
        }
        
    } catch (finalError) {
        console.log("Final check failed:", finalError.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });