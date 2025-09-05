const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking proxy ownership structure...");
    
    const [signer] = await ethers.getSigners();
    console.log("Signer:", signer.address);
    
    const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
    console.log("Proxy address:", PROXY_ADDRESS);
    
    // Check if it's a UUPS proxy by looking for owner() function
    console.log("\n1️⃣ Checking UUPS proxy ownership...");
    try {
        const proxy = await ethers.getContractAt([
            "function owner() view returns (address)"
        ], PROXY_ADDRESS);
        
        const owner = await proxy.owner();
        console.log("UUPS proxy owner:", owner);
        console.log("Is signer the owner?", owner.toLowerCase() === signer.address.toLowerCase());
        
        if (owner.toLowerCase() === signer.address.toLowerCase()) {
            console.log("✅ Direct ownership - no timelock needed!");
            console.log("You can upgrade immediately using upgradeToAndCall");
            return;
        } else {
            console.log("⚠️ Owner is different - may be timelock controlled");
        }
    } catch (error) {
        console.log("Could not get owner:", error.message);
    }
    
    // Check if the owner has timelock characteristics
    console.log("\n2️⃣ Checking if owner is a timelock...");
    try {
        const proxy = await ethers.getContractAt([
            "function owner() view returns (address)"
        ], PROXY_ADDRESS);
        
        const ownerAddress = await proxy.owner();
        
        // Try to call timelock functions on the owner
        const possibleTimelock = await ethers.getContractAt([
            "function getMinDelay() view returns (uint256)",
            "function hasRole(bytes32 role, address account) view returns (bool)"
        ], ownerAddress);
        
        try {
            const minDelay = await possibleTimelock.getMinDelay();
            console.log("✅ Owner is a timelock!");
            console.log("Min delay:", minDelay.toString(), "seconds");
            
            // Check if we have PROPOSER_ROLE
            const PROPOSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER_ROLE"));
            const hasProposerRole = await possibleTimelock.hasRole(PROPOSER_ROLE, signer.address);
            console.log("Has PROPOSER_ROLE:", hasProposerRole);
            
            if (hasProposerRole) {
                console.log("✅ You can queue timelock operations!");
            } else {
                console.log("❌ You don't have PROPOSER_ROLE");
            }
            
            return { isTimelock: true, address: ownerAddress, minDelay };
            
        } catch (timelockError) {
            console.log("Owner is not a timelock:", timelockError.message);
        }
        
    } catch (error) {
        console.log("Could not check timelock:", error.message);
    }
    
    // Check implementation and see if it has timelock in the code
    console.log("\n3️⃣ Checking proxy implementation...");
    try {
        const proxy = await ethers.getContractAt([
            "function implementation() view returns (address)",
            "function getImplementation() view returns (address)"
        ], PROXY_ADDRESS);
        
        let implAddress;
        try {
            implAddress = await proxy.implementation();
        } catch {
            try {
                implAddress = await proxy.getImplementation();
            } catch {
                // Try reading EIP-1967 implementation slot directly
                const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
                const implSlot = await ethers.provider.getStorage(PROXY_ADDRESS, IMPLEMENTATION_SLOT);
                implAddress = ethers.getAddress("0x" + implSlot.slice(-40));
            }
        }
        
        console.log("Implementation address:", implAddress);
        
        // Try to determine what type of implementation it is
        const impl = await ethers.getContractAt([
            "function _authorizeUpgrade(address newImplementation) view returns ()",
            "function UPGRADE_DELAY() view returns (uint256)"
        ], implAddress);
        
        try {
            const delay = await impl.UPGRADE_DELAY();
            console.log("Implementation has UPGRADE_DELAY:", delay.toString());
        } catch {
            console.log("No UPGRADE_DELAY constant found");
        }
        
    } catch (error) {
        console.log("Could not check implementation:", error.message);
    }
    
    console.log("\n📋 Summary:");
    console.log("- Check if proxy owner is your address (direct control)");
    console.log("- Check if proxy owner is a timelock (need to queue operations)");  
    console.log("- Check if implementation has built-in timelock logic");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });