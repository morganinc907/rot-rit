const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔍 Checking contract state");
    console.log("User address:", deployer.address);

    const mawSacrificeAddress = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
    const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", mawSacrificeAddress);
    
    try {
        const isPaused = await mawSacrifice.paused();
        console.log(`\n⏸️ MawSacrifice paused: ${isPaused}`);
    } catch (error) {
        console.log(`❌ Error checking pause state: ${error.message}`);
    }
    
    try {
        const cooldownPeriod = await mawSacrifice.COOLDOWN_PERIOD();
        console.log(`⏰ Cooldown period: ${cooldownPeriod} seconds`);
    } catch (error) {
        console.log(`❌ Error checking cooldown period: ${error.message}`);
    }
    
    try {
        const lastSacrifice = await mawSacrifice.lastSacrificeTime(deployer.address);
        const now = Math.floor(Date.now() / 1000);
        console.log(`🕐 Last sacrifice time: ${lastSacrifice}`);
        console.log(`🕐 Current time: ${now}`);
        console.log(`⏳ Time since last: ${now - lastSacrifice} seconds`);
    } catch (error) {
        console.log(`❌ Error checking last sacrifice time: ${error.message}`);
    }
    
    try {
        const cosmeticTypes = await mawSacrifice.getCurrentCosmeticTypes();
        console.log(`🎭 Available cosmetic types: [${cosmeticTypes.join(', ')}]`);
    } catch (error) {
        console.log(`❌ Error checking cosmetic types: ${error.message}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });