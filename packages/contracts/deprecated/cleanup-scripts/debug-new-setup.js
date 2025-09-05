const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🔍 Debugging new cosmetics setup...");
  console.log("User:", signer.address);
  console.log("");

  try {
    // Check MawSacrifice configuration
    const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV4NoTimelock", addresses.baseSepolia.MawSacrifice);
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", addresses.baseSepolia.Cosmetics);
    
    console.log("📋 MawSacrifice Configuration:");
    console.log("- Address:", addresses.baseSepolia.MawSacrifice);
    console.log("- Cosmetics address in Maw:", await mawSacrifice.cosmetics());
    console.log("- Expected cosmetics:", addresses.baseSepolia.Cosmetics);
    console.log("");

    const mawCosmetics = await mawSacrifice.cosmetics();
    if (mawCosmetics.toLowerCase() !== addresses.baseSepolia.Cosmetics.toLowerCase()) {
      console.log("❌ MawSacrifice is pointing to wrong cosmetics contract!");
      console.log("   Need to update MawSacrifice to use new cosmetics");
      return;
    }

    console.log("📋 Cosmetics Configuration:");
    console.log("- Address:", addresses.baseSepolia.Cosmetics);
    console.log("- Owner:", await cosmetics.owner());
    console.log("- Authorized MawSacrifice:", await cosmetics.mawSacrifice());
    console.log("- Expected MawSacrifice:", addresses.baseSepolia.MawSacrifice);
    console.log("");

    console.log("📋 Current Cosmetic Types:");
    const currentTypes = await mawSacrifice.getCurrentCosmeticTypes();
    console.log("- Types array:", currentTypes.map(n => Number(n)));
    
    if (currentTypes.length === 0) {
      console.log("❌ No cosmetic types available!");
      return;
    }

    // Check type 1 info
    console.log("- Type 1 info:");
    const type1Info = await cosmetics.getCosmeticInfo(1);
    console.log("  Name:", type1Info[0]);
    console.log("  Rarity:", Number(type1Info[4]));
    
    console.log("");
    console.log("📋 User Relics Balance:");
    const relics = await hre.ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
    const fragmentBalance = await relics.balanceOf(signer.address, 3); // LANTERN_FRAGMENT
    const maskBalance = await relics.balanceOf(signer.address, 5); // WORM_EATEN_MASK
    console.log("- Lantern Fragments:", Number(fragmentBalance));
    console.log("- Worm-Eaten Masks:", Number(maskBalance));

    if (fragmentBalance === 0n) {
      console.log("❌ No fragments to sacrifice!");
      return;
    }

    console.log("");
    console.log("🧪 Testing sacrificeForCosmetic function...");
    try {
      // Test with 1 fragment, 0 masks
      const tx = await mawSacrifice.sacrificeForCosmetic(1, 0);
      console.log("Transaction hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ SUCCESS! Transaction confirmed");
      console.log("Gas used:", Number(receipt.gasUsed));
      
      // Check if we got a cosmetic
      console.log("");
      console.log("🔍 Checking results...");
      const newFragmentBalance = await relics.balanceOf(signer.address, 3);
      console.log("New fragment balance:", Number(newFragmentBalance));
      console.log("Fragments used:", Number(fragmentBalance - newFragmentBalance));
      
    } catch (error) {
      console.log("❌ sacrificeForCosmetic failed:", error.message);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});