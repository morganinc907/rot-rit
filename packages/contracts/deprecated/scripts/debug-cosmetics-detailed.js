const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🎨 Debugging cosmetics contract in detail...\n");

    const COSMETICS_ADDRESS = "0x8184FdB709f6B810d94d4Ed2b6196866EF604e68";

    console.log("Cosmetics Contract:", COSMETICS_ADDRESS);
    console.log("Account:", deployer.address);

    const Cosmetics = await ethers.getContractFactory("CosmeticsV2");
    const cosmetics = Cosmetics.attach(COSMETICS_ADDRESS);
    
    try {
        // Check if contract exists
        const code = await ethers.provider.getCode(COSMETICS_ADDRESS);
        console.log("Contract has code:", code.length > 2);
        
        // Check current monthly set
        const currentSetId = await cosmetics.currentMonthlySetId();
        console.log("Current monthly set ID:", currentSetId.toString());
        
        // Check owner
        const owner = await cosmetics.owner();
        console.log("Contract owner:", owner);
        console.log("Is deployer owner:", owner === deployer.address);
        
        // Try to call cosmeticTypes for IDs 1-10
        console.log("\n📋 Checking cosmetic types:");
        for (let i = 1; i <= 10; i++) {
            try {
                const typeData = await cosmetics.cosmeticTypes(i);
                console.log(`Type ${i}:`, {
                    name: typeData[0],
                    active: typeData[8],
                    rarity: typeData[3].toString(),
                    maxSupply: typeData[6].toString(),
                    currentSupply: typeData[7].toString()
                });
            } catch (error) {
                console.log(`Type ${i}: Not found or error - ${error.message}`);
            }
        }
        
        // Check totalSupply if it exists
        try {
            const totalSupply = await cosmetics.totalSupply();
            console.log("\nTotal cosmetics supply:", totalSupply.toString());
        } catch (error) {
            console.log("No totalSupply function");
        }
        
        // Check if any cosmetic types have been created
        try {
            const nextTypeId = await cosmetics.nextTypeId();
            console.log("Next type ID:", nextTypeId.toString());
        } catch (error) {
            console.log("No nextTypeId function");
        }
        
    } catch (error) {
        console.error("❌ Error debugging cosmetics:", error.message);
    }
}

main().catch(console.error);