const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Debug contract call with account:", deployer.address);
    
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const MAW_SACRIFICE_ADDRESS = "0x6E62A606b5950c4B92F626b32AaFF2436E20A7bb";
    
    console.log("\n🔍 DEBUG CONTRACT CALL:");
    console.log("=".repeat(60));
    
    try {
        // Check if contract exists and what it is
        const code = await ethers.provider.getCode(MAW_SACRIFICE_ADDRESS);
        console.log("Contract has code:", code.length > 2);
        
        // Try to call a view function first
        const Relics = await ethers.getContractFactory("Relics");
        const relics = Relics.attach(RELICS_ADDRESS);
        
        // Check relics contract
        console.log("\n📊 Relics contract info:");
        const balance = await relics.balanceOf(deployer.address, 1);
        console.log("User keys balance:", balance.toString());
        
        const mawAddress = await relics.mawSacrifice();
        console.log("MawSacrifice on Relics:", mawAddress);
        
        const isApproved = await relics.isApprovedForAll(deployer.address, MAW_SACRIFICE_ADDRESS);
        console.log("Is approved:", isApproved);
        
        // Try to check if the MawSacrifice contract has the right addresses
        console.log("\n🔍 MawSacrifice contract info:");
        
        // Create a generic contract interface to call basic functions
        const mawContract = new ethers.Contract(
            MAW_SACRIFICE_ADDRESS,
            [
                "function relics() view returns (address)",
                "function cosmetics() view returns (address)",
                "function owner() view returns (address)"
            ],
            deployer
        );
        
        const relicsInMaw = await mawContract.relics();
        console.log("Relics address in Maw:", relicsInMaw);
        console.log("Matches expected:", relicsInMaw === RELICS_ADDRESS);
        
        const cosmeticsInMaw = await mawContract.cosmetics();
        console.log("Cosmetics address in Maw:", cosmeticsInMaw);
        
        const ownerInMaw = await mawContract.owner();
        console.log("Owner of Maw:", ownerInMaw);
        
    } catch (error) {
        console.error("❌ Debug error:", error.message);
    }
    
    console.log("=".repeat(60));
}

main().catch(console.error);