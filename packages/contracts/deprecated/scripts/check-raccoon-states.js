const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🦝 Checking raccoon states...\n");

    const RACCOONS_ADDRESS = "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f";

    console.log("Raccoons Contract:", RACCOONS_ADDRESS);
    console.log("Account:", deployer.address);

    const Raccoons = await ethers.getContractFactory("Raccoons");
    const raccoons = Raccoons.attach(RACCOONS_ADDRESS);
    
    try {
        const balance = await raccoons.balanceOf(deployer.address);
        console.log("Raccoon balance:", balance.toString());
        
        if (balance > 0) {
            console.log("\n📋 Checking states of your raccoons:");
            for (let i = 0; i < Number(balance); i++) {
                try {
                    const tokenId = await raccoons.tokenOfOwnerByIndex(deployer.address, i);
                    const state = await raccoons.getState(tokenId);
                    const stateNames = ["Normal", "Cult", "Dead"];
                    const stateName = stateNames[state] || `Unknown(${state})`;
                    
                    console.log(`Raccoon #${tokenId}: ${stateName}`);
                } catch (error) {
                    console.log(`Raccoon ${i}: Error getting state - ${error.message}`);
                }
            }
        }
        
    } catch (error) {
        console.error("❌ Error checking raccoon states:", error.message);
    }
}

main().catch(console.error);