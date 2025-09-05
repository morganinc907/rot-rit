const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Testing static call with account:", deployer.address);
    
    const MAW_SACRIFICE_ADDRESS = "0x6E62A606b5950c4B92F626b32AaFF2436E20A7bb";
    
    console.log("\n🔍 STATIC CALL TEST:");
    console.log("=".repeat(60));
    
    try {
        // Create a contract interface with the sacrificeKeys function
        const mawContract = new ethers.Contract(
            MAW_SACRIFICE_ADDRESS,
            [
                "function sacrificeKeys(uint256 amount) external"
            ],
            deployer
        );
        
        // Try static call first to see what happens
        console.log("Attempting static call to sacrificeKeys(1)...");
        
        try {
            await mawContract.sacrificeKeys.staticCall(1);
            console.log("✅ Static call succeeded - should be safe to execute");
        } catch (staticError) {
            console.error("❌ Static call failed:", staticError.message);
            
            // Try to get more details about the error
            if (staticError.data) {
                console.log("Error data:", staticError.data);
            }
            if (staticError.reason) {
                console.log("Error reason:", staticError.reason);
            }
            
            // Try to decode the error
            try {
                const errorInterface = new ethers.Interface([
                    "error MaxSupplyExceeded()",
                    "error SupplyNotSet()",
                    "error NotAuthorizedToBurn()",
                    "error NotAuthorized()"
                ]);
                
                if (staticError.data) {
                    const decoded = errorInterface.parseError(staticError.data);
                    console.log("Decoded error:", decoded.name);
                }
            } catch (decodeError) {
                console.log("Could not decode error");
            }
        }
        
        // Also test if we can call view functions
        console.log("\n📊 Testing view functions:");
        const relicsAddress = await mawContract.relics.staticCall();
        console.log("Relics address from contract:", relicsAddress);
        
    } catch (error) {
        console.error("❌ General error:", error.message);
    }
    
    console.log("=".repeat(60));
}

main().catch(console.error);