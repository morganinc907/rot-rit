const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Testing other MawSacrifice contracts...");
    
    const mawAddresses = [
        "0x1f8fa66b4e91c844db85b8fc95e1e78e4bf56b13", // From set-mawsacrifice script
        "0xf65B16c49E505F5BC5c941081c2FA213f8D15D2f"  // From update-cosmetics script
    ];
    
    const mawAbi = [
        "function sacrificeKeys(uint256 amount) external"
    ];
    
    console.log("Current account:", deployer.address);
    
    for (let i = 0; i < mawAddresses.length; i++) {
        const address = mawAddresses[i];
        console.log(`\n🧪 Testing MawSacrifice #${i + 1}: ${address}`);
        console.log("=".repeat(60));
        
        try {
            const maw = new ethers.Contract(address, mawAbi, deployer);
            
            // First check if contract exists
            const code = await deployer.provider.getCode(address);
            if (code === "0x") {
                console.log("❌ No contract deployed at this address");
                continue;
            }
            
            console.log("✅ Contract exists");
            console.log("Attempting to sacrifice 1 key...");
            
            const tx = await maw.sacrificeKeys(1, {
                gasLimit: 300000
            });
            
            console.log("📤 Transaction sent:", tx.hash);
            const receipt = await tx.wait();
            
            if (receipt.status === 1) {
                console.log("✅ Transaction SUCCESS!");
                console.log("⛽ Gas used:", receipt.gasUsed.toString());
                
                if (receipt.gasUsed > 50000n) {
                    console.log("🎉 HIGH GAS USAGE - This might actually work!");
                } else {
                    console.log("⚠️ Low gas - probably placeholder function");
                }
            } else {
                console.log("❌ Transaction failed");
            }
            
        } catch (error) {
            console.log("❌ Error:", error.message);
        }
    }
}

main().catch(console.error);