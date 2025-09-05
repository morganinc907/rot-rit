const hre = require("hardhat");
const { ethers } = hre;
const addresses = require('../../addresses/addresses.json');

async function main() {
    console.log("🔍 Debugging RNG fix authorization...");
    
    const [signer] = await ethers.getSigners();
    const contractAddresses = addresses.baseSepolia;
    const RNG_FIX_ADDRESS = contractAddresses.MawSacrifice;
    
    console.log("User:", signer.address);
    console.log("RNG Fix Maw:", RNG_FIX_ADDRESS);
    console.log("Relics:", contractAddresses.Relics);
    console.log("Cosmetics:", contractAddresses.Cosmetics);
    
    // Check Relics authorization
    console.log("\n🔍 Checking Relics authorization...");
    const relics = await ethers.getContractAt("Relics", contractAddresses.Relics);
    
    const authorizedMaw = await relics.mawSacrifice();
    console.log("Authorized Maw in Relics:", authorizedMaw);
    console.log("Match:", authorizedMaw.toLowerCase() === RNG_FIX_ADDRESS.toLowerCase());
    
    // Check roles
    try {
        const MAW_ROLE = await relics.MAW_ROLE();
        const hasRole = await relics.hasRole(MAW_ROLE, RNG_FIX_ADDRESS);
        console.log("MAW_ROLE hash:", MAW_ROLE);
        console.log("RNG Fix has MAW_ROLE:", hasRole);
    } catch (error) {
        console.log("Role check failed:", error.message);
    }
    
    // Test burn directly
    console.log("\n🧪 Testing direct burn call from RNG fix...");
    // const mawRngFix = await ethers.getContractAt("MawSacrificeV4RNGFix", RNG_FIX_ADDRESS);
    
    try {
        // Check if we can call the relics burn function
        const tx = await relics.burn.staticCall(signer.address, 1, 1); // Rusted Key ID
        console.log("✅ Direct burn call would succeed");
    } catch (error) {
        console.log("❌ Direct burn call would fail:", error.message);
    }
    
    // Check user's fragment balance
    console.log("\n📊 Checking user balances...");
    const fragmentBalance = await relics.balanceOf(signer.address, 2); // Lantern Fragment
    console.log("Fragment balance:", fragmentBalance.toString());
    
    // Check if Maw contract can call burn
    console.log("\n🔒 Testing if Maw can burn user's tokens...");
    try {
        // This should work if authorization is correct
        const canBurn = await relics.burn.staticCall(signer.address, 2, 1, { from: RNG_FIX_ADDRESS });
        console.log("✅ Maw can burn user tokens");
    } catch (error) {
        console.log("❌ Maw cannot burn user tokens:", error.message);
    }
    
    // Check cosmetics authorization
    console.log("\n🎨 Checking cosmetics authorization...");
    try {
        const cosmetics = await ethers.getContractAt("Cosmetics", contractAddresses.Cosmetics);
        
        // Check if this has the setContracts function
        try {
            const owner = await cosmetics.owner();
            console.log("Cosmetics owner:", owner);
            console.log("You are owner:", owner.toLowerCase() === signer.address.toLowerCase());
            
            // Try to check current contracts
            try {
                const mawAddr = await cosmetics.mawSacrifice();
                console.log("Cosmetics authorized maw:", mawAddr);
                console.log("Match:", mawAddr.toLowerCase() === RNG_FIX_ADDRESS.toLowerCase());
            } catch (e) {
                console.log("No mawSacrifice getter");
            }
            
        } catch (e) {
            console.log("Could not get cosmetics owner:", e.message);
        }
        
    } catch (error) {
        console.log("Cosmetics check failed:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });