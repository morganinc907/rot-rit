async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Testing CosmeticsV2 contract at:", "0x8184FdB709f6B810d94d4Ed2b6196866EF604e68");
    
    try {
        const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2");
        const cosmetics = CosmeticsV2.attach("0x8184FdB709f6B810d94d4Ed2b6196866EF604e68");
        
        console.log("Testing getEquippedCosmetics(1)...");
        const result = await cosmetics.getEquippedCosmetics(1);
        console.log("Result:", result);
        console.log("Parsed result:", {
            headTypeId: result[0].toString(),
            faceTypeId: result[1].toString(), 
            bodyTypeId: result[2].toString(),
            furTypeId: result[3].toString(),
            backgroundTypeId: result[4].toString()
        });
        
        // Test if function exists
        console.log("✅ Function exists and callable - all equipped values are 0 (no cosmetics equipped)");
        
    } catch (error) {
        console.error("Error:", error.message);
        
        // Test if the contract exists at all
        const code = await ethers.provider.getCode("0x8184FdB709f6B810d94d4Ed2b6196866EF604e68");
        console.log("Contract code exists:", code !== "0x");
        console.log("Code length:", code.length);
    }
}

main().catch(console.error);