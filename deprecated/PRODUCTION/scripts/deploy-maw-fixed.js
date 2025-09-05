const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying MawSacrificeV2Fixed with all working functions...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Use existing working contract addresses
    const EXISTING_ADDRESSES = {
        relics: "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b",
        cosmetics: "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A", 
        demons: "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF",
        cultists: "0x2D7cD25A014429282062298d2F712FA7983154B9"
    };

    console.log("📄 Using existing contracts:");
    console.log("- Relics:", EXISTING_ADDRESSES.relics);
    console.log("- Cosmetics:", EXISTING_ADDRESSES.cosmetics);
    console.log("- Demons:", EXISTING_ADDRESSES.demons);
    console.log("- Cultists:", EXISTING_ADDRESSES.cultists);

    console.log("\n📄 Deploying MawSacrificeV2Fixed...");
    const MawSacrificeV2Fixed = await ethers.getContractFactory("MawSacrificeV2Fixed");
    
    const mawSacrifice = await MawSacrificeV2Fixed.deploy(
        EXISTING_ADDRESSES.relics,
        EXISTING_ADDRESSES.cosmetics,
        EXISTING_ADDRESSES.demons,
        EXISTING_ADDRESSES.cultists,
        {
            gasLimit: 3000000
        }
    );
    
    await mawSacrifice.waitForDeployment();
    const mawAddress = await mawSacrifice.getAddress();
    console.log("✅ MawSacrificeV2Fixed deployed to:", mawAddress);

    console.log("\n🎉 Deployment complete!");
    console.log("📋 NEW WORKING CONTRACT ADDRESS:");
    console.log("MawSacrificeV2Fixed:", mawAddress);
    console.log("\n🔧 This contract has working:");
    console.log("✅ sacrificeKeys - burns keys, gives random relics with proper percentages");
    console.log("✅ sacrificeForCosmetic - burns fragments/masks, chance for cosmetics"); 
    console.log("✅ sacrificeForDemon - burns daggers/vials, chance for demons");
    console.log("✅ useBindingContract - guaranteed rare demon");
    console.log("✅ useSoulDeed - guaranteed mythic demon");
    
    return mawAddress;
}

main().catch(console.error);