const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Checking approval for account:", deployer.address);
    
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const MAW_SACRIFICE_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    
    const Relics = await ethers.getContractFactory("Relics");
    const relics = Relics.attach(RELICS_ADDRESS);
    
    console.log("\n🔍 CHECKING APPROVAL STATUS:");
    console.log("=".repeat(60));
    console.log("Relics Contract:", RELICS_ADDRESS);
    console.log("MawSacrifice Contract:", MAW_SACRIFICE_ADDRESS);
    console.log("User Address:", deployer.address);
    
    try {
        const isApproved = await relics.isApprovedForAll(deployer.address, MAW_SACRIFICE_ADDRESS);
        console.log("\n✅ Approval Status:", isApproved ? "APPROVED" : "❌ NOT APPROVED");
        
        if (!isApproved) {
            console.log("\n💡 SOLUTION: You need to approve the MawSacrifice contract!");
            console.log("Click the 'Approve Contract' button on the Maw page first.");
        } else {
            console.log("✅ Approval is correct - the issue might be elsewhere.");
        }
        
    } catch (error) {
        console.error("❌ Error checking approval:", error.message);
    }
    
    console.log("=".repeat(60));
}

main().catch(console.error);