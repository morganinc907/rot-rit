async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Setting cosmetics address in Raccoons contract...");
    console.log("Deployer:", deployer.address);
    
    const raccoonsAddr = "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f";
    const cosmeticsAddr = "0x8184FdB709f6B810d94d4Ed2b6196866EF604e68";
    
    try {
        const Raccoons = await ethers.getContractFactory("Raccoons");
        const raccoons = Raccoons.attach(raccoonsAddr);
        
        console.log("Setting cosmetics contract to:", cosmeticsAddr);
        const tx1 = await raccoons.setCosmeticsContract(cosmeticsAddr);
        await tx1.wait();
        console.log("✅ Cosmetics contract address set");
        
        // Also set a dynamic metadata URI for the generative system
        const dynamicURI = "http://localhost:3002"; // Your metadata service
        console.log("Setting dynamic metadata URI to:", dynamicURI);
        const tx2 = await raccoons.setDynamicMetadataURI(dynamicURI);
        await tx2.wait();
        console.log("✅ Dynamic metadata URI set");
        
        // Verify settings
        const currentCosmetics = await raccoons.cosmetics();
        const currentDynamicURI = await raccoons.dynamicMetadataURI();
        console.log("Current cosmetics address:", currentCosmetics);
        console.log("Current dynamic URI:", currentDynamicURI);
        
    } catch (error) {
        console.error("Error:", error);
    }
}

main().catch(console.error);