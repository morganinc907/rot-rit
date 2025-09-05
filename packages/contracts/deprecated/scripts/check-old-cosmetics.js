const { ethers } = require("hardhat");

async function main() {
    console.log("🎨 Checking cosmetics on different addresses...\n");

    const addresses = [
        "0x8184FdB709f6B810d94d4Ed2b6196866EF604e68", // Current
        "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A", // Old working one
    ];

    const Cosmetics = await ethers.getContractFactory("CosmeticsV2");

    for (const address of addresses) {
        console.log(`\n📋 Checking ${address}:`);
        try {
            const cosmetics = Cosmetics.attach(address);
            
            // Check if contract exists
            const code = await ethers.provider.getCode(address);
            if (code.length <= 2) {
                console.log("❌ No contract at this address");
                continue;
            }

            const currentSetId = await cosmetics.currentMonthlySetId();
            console.log("Monthly set ID:", currentSetId.toString());
            
            let hasCosmetics = false;
            for (let i = 1; i <= 5; i++) {
                try {
                    const typeData = await cosmetics.cosmeticTypes(i);
                    if (typeData[0] && typeData[0] !== '') {
                        console.log(`  Type ${i}: ${typeData[0]} (active: ${typeData[8]})`);
                        hasCosmetics = true;
                    }
                } catch (error) {
                    // Skip
                }
            }
            
            if (!hasCosmetics) {
                console.log("❌ No cosmetics found");
            } else {
                console.log("✅ Has cosmetics!");
            }
            
        } catch (error) {
            console.log("❌ Error:", error.message);
        }
    }
}

main().catch(console.error);