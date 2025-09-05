async function main() {
    console.log("🦝 Checking Raccoons contract cosmetics address...");
    
    try {
        const Raccoons = await ethers.getContractFactory("Raccoons");
        const raccoons = Raccoons.attach("0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f");
        
        // Check what cosmetics address is set
        const cosmeticsAddr = await raccoons.cosmetics();
        console.log("Current cosmetics address in Raccoons:", cosmeticsAddr);
        
        const dynamicMetadataURI = await raccoons.dynamicMetadataURI();
        console.log("Dynamic metadata URI:", dynamicMetadataURI);
        
        // Test if there's code at the cosmetics address
        const code = await ethers.provider.getCode(cosmeticsAddr);
        console.log("Cosmetics contract code exists:", code !== "0x");
        
        // Check if the documented address has code
        const documentedAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        const documentedCode = await ethers.provider.getCode(documentedAddr);
        console.log("Documented cosmetics address has code:", documentedCode !== "0x");
        
    } catch (error) {
        console.error("Error:", error);
    }
}

main().catch(console.error);