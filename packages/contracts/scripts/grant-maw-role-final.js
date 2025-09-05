const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🔧 Grant MAW_ROLE to New Proxy - FINAL");
    console.log("=====================================");
    
    const [signer] = await hre.ethers.getSigners();
    const networkAddresses = addresses[hre.network.name];
    const NEW_MAW = networkAddresses.MawSacrificeV4NoTimelock; // 0xB2e77ce03BC688C993Ee31F03000c56c211AD7db
    
    console.log(`Signer: ${signer.address}`);
    console.log(`New Maw: ${NEW_MAW}`);
    console.log(`Relics: ${networkAddresses.Relics}`);
    
    const relics = await hre.ethers.getContractAt("Relics", networkAddresses.Relics);
    const MAW_ROLE = hre.ethers.id("MAW_ROLE");
    
    console.log(`\n🔑 Granting MAW_ROLE to new proxy...`);
    try {
        const tx = await relics.grantRole(MAW_ROLE, NEW_MAW, {
            gasLimit: 200000,
            gasPrice: hre.ethers.parseUnits("5", "gwei") // Higher gas
        });
        
        console.log(`Transaction: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ Role granted in block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed}`);
        
        console.log(`\n🎉 MAW_ROLE successfully granted!`);
        console.log(`✅ New Maw can now burn tokens from Relics`);
        console.log(`✅ Complete sacrifice system should work now`);
        
    } catch (error) {
        console.error(`❌ Grant failed: ${error.message}`);
        
        // Try alternative: setMawSacrifice 
        console.log(`\n🔄 Trying setMawSacrifice approach...`);
        try {
            const setTx = await relics.setMawSacrifice(NEW_MAW, {
                gasLimit: 300000,
                gasPrice: hre.ethers.parseUnits("5", "gwei")
            });
            console.log(`setMawSacrifice tx: ${setTx.hash}`);
            await setTx.wait();
            console.log(`✅ setMawSacrifice completed!`);
        } catch (setError) {
            console.error(`❌ setMawSacrifice also failed: ${setError.message}`);
            throw new Error("Both role grant methods failed");
        }
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});