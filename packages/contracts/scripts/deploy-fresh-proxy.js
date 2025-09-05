const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Fresh MawSacrificeV4NoTimelock Proxy");
    console.log("=================================================");
    
    const [signer] = await ethers.getSigners();
    console.log(`👤 Deploying from: ${signer.address}`);
    
    // Use the CORRECT addresses from the start
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const COSMETICS_ADDRESS = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb"; // NEW, correct one
    const DEMONS_ADDRESS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
    const CULTISTS_ADDRESS = "0x2D7cD25A014429282062298d2F712FA7983154B9";
    
    console.log(`\n📋 Initializing with CORRECT addresses:`);
    console.log(`- Relics: ${RELICS_ADDRESS}`);
    console.log(`- Cosmetics: ${COSMETICS_ADDRESS} (NEW)`);
    console.log(`- Demons: ${DEMONS_ADDRESS}`);
    console.log(`- Cultists: ${CULTISTS_ADDRESS}`);
    
    try {
        console.log(`\n🔨 Deploying MawSacrificeV4NoTimelock proxy...`);
        
        const Maw = await ethers.getContractFactory("MawSacrificeV4NoTimelock");
        const maw = await upgrades.deployProxy(
            Maw,
            [
                RELICS_ADDRESS,   // Relics
                COSMETICS_ADDRESS, // Cosmetics (NEW - correct one)
                DEMONS_ADDRESS,   // Demons
                CULTISTS_ADDRESS  // Cultists
            ],
            { 
                initializer: "initialize", 
                kind: "uups" 
            }
        );
        
        await maw.waitForDeployment();
        const newProxyAddress = await maw.getAddress();
        
        console.log(`✅ New Maw proxy deployed at: ${newProxyAddress}`);
        console.log(`📝 Transaction hash: ${maw.deploymentTransaction().hash}`);
        
        // Verify the wiring immediately
        console.log(`\n🔍 Verifying proxy wiring...`);
        const cosmetics = await maw.cosmetics();
        const relics = await maw.relics();
        const owner = await maw.owner();
        
        console.log(`- Owner: ${owner} ${owner.toLowerCase() === signer.address.toLowerCase() ? '✅' : '❌'}`);
        console.log(`- Cosmetics: ${cosmetics} ${cosmetics.toLowerCase() === COSMETICS_ADDRESS.toLowerCase() ? '✅' : '❌'}`);
        console.log(`- Relics: ${relics} ${relics.toLowerCase() === RELICS_ADDRESS.toLowerCase() ? '✅' : '❌'}`);
        
        // Set up cosmetic types
        console.log(`\n🎨 Setting up cosmetic types...`);
        try {
            const setTypesTx = await maw.setMonthlyCosmeticTypes([1, 2, 3, 4, 5]);
            await setTypesTx.wait();
            console.log(`✅ Cosmetic types set!`);
        } catch (typesError) {
            console.log(`⚠️ Set types failed: ${typesError.message}`);
        }
        
        console.log(`\n🎉 Fresh proxy deployment complete!`);
        console.log(`📄 NEW Maw address: ${newProxyAddress}`);
        console.log(`\n📝 Next steps:`);
        console.log(`1. Update Cosmetics to trust this new Maw`);
        console.log(`2. Update Relics to grant MAW_ROLE to this new Maw`);
        console.log(`3. Update addresses.json with this new address`);
        console.log(`4. Test sacrifice!`);
        
        return newProxyAddress;
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        throw error;
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});