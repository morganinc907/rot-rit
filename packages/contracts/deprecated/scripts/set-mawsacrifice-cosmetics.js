const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Setting MawSacrifice address in CosmeticsV2...");
    
    const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
    const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
    const MAWSACRIFICE_ADDRESS = "0x1f8fa66b4e91c844db85b8fc95e1e78e4bf56b13";
    
    try {
        const CosmeticsV2 = await hre.ethers.getContractFactory("CosmeticsV2");
        const cosmetics = CosmeticsV2.attach(COSMETICS_ADDRESS);
        
        // Set both raccoons and mawSacrifice addresses
        const tx = await cosmetics.setContracts(RACCOONS_ADDRESS, MAWSACRIFICE_ADDRESS, {
            gasLimit: 100000,
            maxFeePerGas: hre.ethers.parseUnits("20", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("5", "gwei"),
        });
        
        console.log("Transaction sent:", tx.hash);
        await tx.wait();
        console.log("✅ CosmeticsV2 contract addresses set:");
        console.log("  Raccoons:", RACCOONS_ADDRESS);
        console.log("  MawSacrifice:", MAWSACRIFICE_ADDRESS);
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}

main().catch(console.error);