const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Updating Raccoons cosmetics reference...");
    
    const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
    const NEW_COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
    
    try {
        const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);
        
        // Use high gas price to avoid being stuck
        const tx = await raccoons.setCosmeticsContract(NEW_COSMETICS_ADDRESS, {
            gasLimit: 100000,
            maxFeePerGas: hre.ethers.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("10", "gwei"),
        });
        
        console.log("Transaction sent:", tx.hash);
        await tx.wait();
        console.log("✅ Raccoons cosmetics address updated to:", NEW_COSMETICS_ADDRESS);
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}

main().catch(console.error);