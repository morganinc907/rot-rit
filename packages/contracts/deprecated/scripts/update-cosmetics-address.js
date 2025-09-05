const hre = require("hardhat");

const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
const NEW_COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Updating contract references...");
    console.log("Deployer:", deployer.address);
    
    try {
        // Set raccoons reference in new CosmeticsV2
        console.log("Setting Raccoons reference in new CosmeticsV2...");
        const CosmeticsV2 = await hre.ethers.getContractFactory("CosmeticsV2");
        const cosmetics = CosmeticsV2.attach(NEW_COSMETICS_ADDRESS);
        
        const tx1 = await cosmetics.setContracts(RACCOONS_ADDRESS, "0x0000000000000000000000000000000000000000", {
            maxFeePerGas: hre.ethers.parseUnits("10", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("2", "gwei"),
        });
        await tx1.wait();
        console.log("✅ CosmeticsV2: setContracts ->", RACCOONS_ADDRESS);

        // Set new cosmetics contract in Raccoons
        console.log("Setting new Cosmetics reference in Raccoons...");
        const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);
        const tx2 = await raccoons.setCosmeticsContract(NEW_COSMETICS_ADDRESS, {
            maxFeePerGas: hre.ethers.parseUnits("20", "gwei"),
            maxPriorityFeePerGas: hre.ethers.parseUnits("5", "gwei"),
        });
        await tx2.wait();
        console.log("✅ Raccoons: setCosmeticsContract ->", NEW_COSMETICS_ADDRESS);
        
        console.log("\n🎉 Contract references updated!");
        console.log("New CosmeticsV2 Address:", NEW_COSMETICS_ADDRESS);
        console.log("Raccoons Address:", RACCOONS_ADDRESS);
        
    } catch (error) {
        console.error("Error updating references:", error.message);
    }
}

main().catch(console.error);