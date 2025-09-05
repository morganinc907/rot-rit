async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Updating base URI in Raccoons contract...");
    console.log("Deployer:", deployer.address);
    
    const raccoonsAddr = "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f";
    const newBaseURI = "ipfs://bafybeihn54iawusfxzqzkxzdcidkgejom22uhwpquqrdl5frmnwhilqi4m/";
    
    try {
        const Raccoons = await ethers.getContractFactory("Raccoons");
        const raccoons = Raccoons.attach(raccoonsAddr);
        
        console.log("Current base URI:", await raccoons.baseTokenURI());
        console.log("Setting new base URI to:", newBaseURI);
        
        const tx = await raccoons.setBaseTokenURI(newBaseURI, {
            gasLimit: 500000
        });
        console.log("Transaction hash:", tx.hash);
        await tx.wait();
        console.log("✅ Base URI updated successfully!");
        
        // Verify the update
        const updatedURI = await raccoons.baseTokenURI();
        console.log("Verified new base URI:", updatedURI);
        
        // Test tokenURI for cult raccoon
        console.log("\nTesting tokenURI for raccoon #1 (cult state):");
        try {
            const tokenURI = await raccoons.tokenURI(1);
            console.log("TokenURI result:", tokenURI);
            console.log("Expected:", newBaseURI + "cult.json");
        } catch (error) {
            console.error("TokenURI error:", error.message);
        }
        
    } catch (error) {
        console.error("Error:", error);
    }
}

main().catch(console.error);