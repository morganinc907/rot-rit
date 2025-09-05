const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔍 Checking user approvals");
    console.log("User address:", deployer.address);

    const mawSacrificeAddress = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
    const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    
    const relics = await hre.ethers.getContractAt("Relics", relicsAddress);
    
    try {
        const isApproved = await relics.isApprovedForAll(deployer.address, mawSacrificeAddress);
        console.log(`\n✅ User approved MawSacrifice for all tokens: ${isApproved}`);
        
        if (!isApproved) {
            console.log("❌ User needs to approve MawSacrifice to burn tokens!");
            console.log("🔧 Setting approval...");
            
            const tx = await relics.setApprovalForAll(mawSacrificeAddress, true);
            console.log(`📝 Transaction hash: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`✅ Approval confirmed in block: ${receipt.blockNumber}`);
        }
        
    } catch (error) {
        console.log(`❌ Error checking approval: ${error.message}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });