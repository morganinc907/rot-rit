const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Checking supply limits on Relics contract");
    
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    
    const Relics = await ethers.getContractFactory("Relics");
    const relics = Relics.attach(RELICS_ADDRESS);
    
    console.log("\n🔍 CHECKING SUPPLY LIMITS:");
    console.log("=".repeat(60));
    
    const relicIds = [
        { id: 1, name: "Rusted Keys" },
        { id: 2, name: "Lantern Fragment" },
        { id: 3, name: "Worm-eaten Mask" },
        { id: 4, name: "Bone Dagger" },
        { id: 5, name: "Ash Vial" },
        { id: 8, name: "Ashes" }
    ];
    
    try {
        for (const relic of relicIds) {
            const maxSupply = await relics.maxSupply(relic.id);
            const totalSupply = await relics.totalSupply(relic.id);
            
            console.log(`${relic.name} (ID ${relic.id}):`);
            console.log(`  Max Supply: ${maxSupply.toString()} (${maxSupply.toString() === "0" ? "UNLIMITED" : "LIMITED"})`);
            console.log(`  Current Supply: ${totalSupply.toString()}`);
            
            if (maxSupply > 0 && totalSupply >= maxSupply) {
                console.log(`  ❌ SUPPLY EXCEEDED! Cannot mint more.`);
            } else {
                console.log(`  ✅ Can mint more`);
            }
            console.log();
        }
        
    } catch (error) {
        console.error("❌ Error checking supply limits:", error.message);
    }
    
    console.log("=".repeat(60));
}

main().catch(console.error);