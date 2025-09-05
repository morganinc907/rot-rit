const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Testing sacrifice with account:", deployer.address);
    
    const MAW_SACRIFICE_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    
    // Simple ABI for sacrificeKeys function
    const mawAbi = [
        "function sacrificeKeys(uint256 amount) external"
    ];
    
    const maw = new ethers.Contract(MAW_SACRIFICE_ADDRESS, mawAbi, deployer);
    
    console.log("\n🧪 TESTING SACRIFICE FUNCTION:");
    console.log("=".repeat(50));
    
    try {
        console.log("Attempting to sacrifice 1 key...");
        
        // Try to call with 1 key
        const tx = await maw.sacrificeKeys(1, {
            gasLimit: 300000 // Set explicit gas limit
        });
        
        console.log("📤 Transaction sent:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log("✅ Transaction SUCCESS!");
            console.log("⛽ Gas used:", receipt.gasUsed.toString());
            console.log("🎯 Block number:", receipt.blockNumber);
            
            // Log any events
            if (receipt.logs.length > 0) {
                console.log("📜 Events emitted:", receipt.logs.length);
            }
        } else {
            console.log("❌ Transaction FAILED!");
        }
        
    } catch (error) {
        console.error("❌ ERROR:", error.message);
        
        // Try to get more details about the error
        if (error.data || error.reason) {
            console.log("💬 Error details:", error.reason || error.data);
        }
    }
    
    console.log("=".repeat(50));
}

main().catch(console.error);