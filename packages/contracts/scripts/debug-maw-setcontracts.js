const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
    console.log("🔧 Debugging Maw setContracts Issue");
    console.log("===================================");
    
    const [deployer] = await hre.ethers.getSigners();
    const networkName = hre.network.name;
    const networkAddresses = addresses[networkName];
    
    const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrificeV4NoTimelock);
    
    console.log(`\nDeployer: ${deployer.address}`);
    console.log(`MawSacrifice: ${networkAddresses.MawSacrificeV4NoTimelock}`);
    
    // Check ownership
    try {
        const owner = await mawSacrifice.owner();
        console.log(`\nMaw owner: ${owner}`);
        console.log(`Deployer is owner: ${owner.toLowerCase() === deployer.address.toLowerCase() ? '✅' : '❌'}`);
        
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
            console.log(`\n❌ ISSUE: Deployer is not the owner of MawSacrifice!`);
            console.log(`Only the owner can call setContracts.`);
            return;
        }
    } catch (e) {
        console.log(`❌ Error checking owner: ${e.message}`);
        return;
    }
    
    // Check if contract is paused
    try {
        const paused = await mawSacrifice.paused();
        console.log(`Maw paused: ${paused}`);
        
        if (paused) {
            console.log(`❌ Contract is paused - this might block setContracts`);
        }
    } catch (e) {
        console.log(`Error checking pause status: ${e.message}`);
    }
    
    // Try static call first to see the specific error
    try {
        console.log(`\n🧪 Testing static call to setContracts...`);
        await mawSacrifice.setContracts.staticCall(
            networkAddresses.Relics,
            networkAddresses.Cosmetics,
            "0x0000000000000000000000000000000000000000", // Demons
            "0x0000000000000000000000000000000000000000"  // Cultists
        );
        console.log(`✅ Static call succeeded - transaction should work`);
        
        // Now try the real transaction
        console.log(`🔄 Executing real setContracts transaction...`);
        const tx = await mawSacrifice.setContracts(
            networkAddresses.Relics,
            networkAddresses.Cosmetics,
            "0x0000000000000000000000000000000000000000", // Demons
            "0x0000000000000000000000000000000000000000"  // Cultists
        );
        console.log(`Transaction hash: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction succeeded in block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed}`);
        
    } catch (error) {
        console.log(`❌ setContracts failed: ${error.message}`);
        
        if (error.reason) {
            console.log(`Reason: ${error.reason}`);
        }
        
        if (error.data) {
            try {
                const decoded = mawSacrifice.interface.parseError(error.data);
                console.log(`Decoded error: ${decoded.name} - ${decoded.args}`);
            } catch (e) {
                console.log(`Raw error data: ${error.data}`);
            }
        }
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exitCode = 1;
});