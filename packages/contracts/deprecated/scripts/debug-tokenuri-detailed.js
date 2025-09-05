async function main() {
    console.log("🔍 Detailed tokenURI debugging...");
    
    try {
        const Raccoons = await ethers.getContractFactory("Raccoons");
        const raccoons = Raccoons.attach("0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f");
        
        const tokenId = 1;
        console.log(`Testing token ID: ${tokenId}`);
        
        // Check if token exists
        const ownerOf = await raccoons.ownerOf(tokenId);
        console.log(`Token ${tokenId} owner:`, ownerOf);
        
        // Check token state
        const state = await raccoons.getState(tokenId);
        console.log(`Token ${tokenId} state:`, state);
        
        // Check contract settings
        const revealed = await raccoons.revealed();
        const baseURI = await raccoons.baseTokenURI();
        const cosmeticsAddr = await raccoons.cosmetics();
        const dynamicURI = await raccoons.dynamicMetadataURI();
        
        console.log("Contract settings:", {
            revealed,
            baseURI,
            cosmeticsAddr,
            dynamicURI: dynamicURI || "(empty)"
        });
        
        // Test hasEquippedCosmetics directly
        try {
            console.log("Testing hasEquippedCosmetics...");
            const hasEquipped = await raccoons.hasEquippedCosmetics(tokenId);
            console.log(`Has equipped cosmetics: ${hasEquipped}`);
        } catch (hasEquippedError) {
            console.error("hasEquippedCosmetics error:", hasEquippedError.message);
        }
        
        // Test the cosmetics contract directly
        if (cosmeticsAddr !== "0x0000000000000000000000000000000000000000") {
            try {
                console.log("Testing cosmetics contract call...");
                const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2");
                const cosmetics = CosmeticsV2.attach(cosmeticsAddr);
                const equipped = await cosmetics.getEquippedCosmetics(tokenId);
                console.log("Equipped cosmetics result:", equipped);
            } catch (cosmeticsError) {
                console.error("Cosmetics call error:", cosmeticsError.message);
            }
        }
        
        // Now try tokenURI
        console.log("Testing tokenURI...");
        try {
            const tokenURI = await raccoons.tokenURI(tokenId);
            console.log("✅ TokenURI result:", tokenURI);
        } catch (tokenUriError) {
            console.error("❌ TokenURI error:", tokenUriError.message);
            
            // If normal state, should return baseURI + tokenId + .json
            if (state === 0) { // Normal state
                const expectedURI = baseURI + tokenId + ".json";
                console.log("Expected URI for Normal state:", expectedURI);
            } else if (state === 1) { // Cult state
                const expectedURI = baseURI + "cult.json";
                console.log("Expected URI for Cult state:", expectedURI);
            }
        }
        
    } catch (error) {
        console.error("Main error:", error);
    }
}

main().catch(console.error);