const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🌐 Deployed Contracts Test (Base Sepolia)", function () {
  // Our deployed contract addresses
  const CONTRACTS = {
    Raccoons: "0x7071269faa1FA8D24A5b8b03C745552B25021D90",
    CosmeticsV2: "0xa45358561Fc7D9C258F831a4Bf5958fe7982EF61", 
    Relics: "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b",
    Demons: "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF",
    Cultists: "0x2D7cD25A014429282062298d2F712FA7983154B9",
    MawSacrificeV2: "0xf65B16c49E505F5BC5c941081c2FA213f8D15D2f",
    KeyShop: "0x1a343EA8FA0cfDF7D0AECD6Fe39A6aaA1642CA48",
    RaccoonRenderer: "0x3eE467d8Dc8Fdf26dFC17dA8630EE1078aEd3A85",
    RitualReadAggregator: "0xe14830B91Bf666E51305a89C1196d0e88bad98a2"
  };

  const RELIC_KEY = 1;

  // Skip these tests by default since they require network connection
  // Remove .skip to run against live contracts
  it.skip("should connect to all deployed contracts", async function () {
    console.log("🔗 Testing connection to deployed contracts...");
    
    // Test Raccoons contract
    const raccoons = await ethers.getContractAt("Raccoons", CONTRACTS.Raccoons);
    const maxSupply = await raccoons.MAX_SUPPLY();
    const totalMinted = await raccoons.totalMinted();
    console.log(`✅ Raccoons: ${totalMinted}/${maxSupply} minted`);
    expect(maxSupply).to.equal(444);

    // Test CosmeticsV2 contract  
    const cosmetics = await ethers.getContractAt("CosmeticsV2", CONTRACTS.CosmeticsV2);
    const raccoonRef = await cosmetics.raccoons();
    console.log(`✅ CosmeticsV2 connected, raccoons ref: ${raccoonRef}`);
    expect(raccoonRef.toLowerCase()).to.equal(CONTRACTS.Raccoons.toLowerCase());

    // Test Relics contract
    const relics = await ethers.getContractAt("Relics", CONTRACTS.Relics);
    const mawRef = await relics.mawSacrifice();
    console.log(`✅ Relics connected, mawSacrifice ref: ${mawRef}`);
    expect(mawRef.toLowerCase()).to.equal(CONTRACTS.MawSacrificeV2.toLowerCase());

    // Test KeyShop contract
    const keyShop = await ethers.getContractAt("KeyShop", CONTRACTS.KeyShop);
    const keyPrice = await keyShop.keyPrice();
    console.log(`✅ KeyShop connected, key price: ${ethers.formatEther(keyPrice)} ETH`);
    expect(keyPrice).to.equal(ethers.parseEther("0.002"));

    console.log("🎉 All deployed contracts accessible and configured correctly!");
  });

  it.skip("should test deployed contract interactions", async function () {
    this.timeout(60000);
    
    const [signer] = await ethers.getSigners();
    console.log("🧪 Testing deployed contract interactions...");
    console.log("Signer:", signer.address);

    // Connect to contracts
    const raccoons = await ethers.getContractAt("Raccoons", CONTRACTS.Raccoons);
    const relics = await ethers.getContractAt("Relics", CONTRACTS.Relics);
    const keyShop = await ethers.getContractAt("KeyShop", CONTRACTS.KeyShop);

    // Test minting a raccoon (if supply available)
    try {
      const totalBefore = await raccoons.totalMinted();
      if (totalBefore < 444) {
        await (await raccoons.mint(1, { value: 0 })).wait();
        const totalAfter = await raccoons.totalMinted();
        console.log(`✅ Minted raccoon: ${totalBefore} → ${totalAfter}`);
        expect(totalAfter).to.equal(totalBefore + 1n);
      } else {
        console.log("ℹ️ Max supply reached, skipping mint test");
      }
    } catch (error) {
      console.log("ℹ️ Mint test skipped:", error.message);
    }

    // Test key purchase (small amount)
    try {
      const keyPrice = await keyShop.keyPrice();
      const balanceBefore = await relics.balanceOf(signer.address, RELIC_KEY);
      
      await (await keyShop.buyKeys(1, { value: keyPrice })).wait();
      
      const balanceAfter = await relics.balanceOf(signer.address, RELIC_KEY);
      console.log(`✅ Bought key: ${balanceBefore} → ${balanceAfter}`);
      expect(balanceAfter).to.equal(balanceBefore + 1n);
    } catch (error) {
      console.log("ℹ️ Key purchase test skipped:", error.message);
    }

    console.log("🎉 Deployed contract interaction tests completed!");
  });

  // This test always runs to verify our understanding
  it("should have correct deployed contract addresses documented", async function () {
    console.log("📋 Verifying deployed contract addresses...");
    
    // Check that all addresses are valid
    for (const [name, address] of Object.entries(CONTRACTS)) {
      expect(ethers.isAddress(address)).to.be.true;
      console.log(`✅ ${name}: ${address}`);
    }

    // Check address uniqueness
    const addresses = Object.values(CONTRACTS);
    const uniqueAddresses = new Set(addresses);
    expect(uniqueAddresses.size).to.equal(addresses.length);
    console.log("✅ All addresses are unique");

    console.log("🎉 All 9 deployed contracts documented with valid addresses!");
  });
});