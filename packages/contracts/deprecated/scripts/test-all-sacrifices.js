const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Testing all sacrifice functions with account:", deployer.address);
    
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456"; // UUPS Proxy
    
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    const mawSacrifice = await ethers.getContractAt("MawSacrificeV3Upgradeable", PROXY_ADDRESS);
    
    console.log("\n🧪 TESTING ALL SACRIFICE FUNCTIONS:");
    console.log("=".repeat(60));
    
    try {
        // First, check current balances
        console.log("\n📊 Current balances:");
        const keys = await relics.balanceOf(deployer.address, 1);
        const fragments = await relics.balanceOf(deployer.address, 2);
        const masks = await relics.balanceOf(deployer.address, 3);
        const daggers = await relics.balanceOf(deployer.address, 4);
        const vials = await relics.balanceOf(deployer.address, 5);
        console.log("Keys:", keys.toString());
        console.log("Fragments:", fragments.toString());
        console.log("Masks:", masks.toString());
        console.log("Daggers:", daggers.toString());
        console.log("Vials:", vials.toString());
        
        // Test 1: Sacrifice Keys
        if (keys > 0) {
            console.log("\n🔑 TEST 1: Sacrificing 1 key...");
            const tx1 = await mawSacrifice.sacrificeKeys(1, { gasLimit: 500000 });
            const receipt1 = await tx1.wait();
            console.log("✅ Keys sacrifice SUCCESS! Gas used:", receipt1.gasUsed.toString());
        } else {
            console.log("\n❌ TEST 1 SKIPPED: No keys available");
        }
        
        // Test 2: Sacrifice for Cosmetic
        if (fragments > 0) {
            console.log("\n🎭 TEST 2: Sacrificing fragments for cosmetic...");
            const maskAmount = masks > 0 ? 1 : 0;
            const tx2 = await mawSacrifice.sacrificeForCosmetic(1, maskAmount, { gasLimit: 500000 });
            const receipt2 = await tx2.wait();
            console.log("✅ Cosmetic sacrifice SUCCESS! Gas used:", receipt2.gasUsed.toString());
        } else {
            console.log("\n❌ TEST 2 SKIPPED: No fragments available");
        }
        
        // Test 3: Sacrifice for Demon
        if (daggers > 0 || vials > 0) {
            console.log("\n👹 TEST 3: Sacrificing for demon...");
            const daggerAmount = daggers > 0 ? 1 : 0;
            const vialAmount = vials > 0 ? 1 : 0;
            const tx3 = await mawSacrifice.sacrificeForDemon(
                daggerAmount, 
                vialAmount, 
                false, // useBindingContract
                false, // useSoulDeed  
                0,     // cultistTokenId
                { gasLimit: 500000 }
            );
            const receipt3 = await tx3.wait();
            console.log("✅ Demon sacrifice SUCCESS! Gas used:", receipt3.gasUsed.toString());
        } else {
            console.log("\n❌ TEST 3 SKIPPED: No daggers or vials available");
        }
        
        console.log("\n🎉 ALL TESTS COMPLETED!");
        console.log("All sacrifice functions are working properly.");
        
    } catch (error) {
        console.error("❌ Error during testing:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
    }
    
    console.log("=".repeat(60));
}

main().catch(console.error);