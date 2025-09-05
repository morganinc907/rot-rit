const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🧪 Rot & Ritual Integration Tests", function () {
  let deployer, user1, user2;
  let contracts = {};
  
  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();
    
    // Deploy the complete system
    const CompleteDeployer = await ethers.getContractFactory("CompleteDeployer");
    const completeDeployer = await CompleteDeployer.deploy(
      1000, // maxSupply
      "https://test.com/normal/",
      "https://test.com/cult/", 
      "https://test.com/dead/",
      "https://test.com/relics/",
      ethers.parseEther("0.001") // 0.001 ETH key price
    );
    
    // Get all contract instances
    const [
      raccoonsAddr, cultistsAddr, relicsAddr, demonsAddr, ritualsAddr,
      cosmeticsAddr, keyShopAddr, mawSacrificeAddr, cosmeticApplierAddr
    ] = await completeDeployer.getAllAddresses();
    
    contracts.raccoons = await ethers.getContractAt("Raccoons", raccoonsAddr);
    contracts.cultists = await ethers.getContractAt("Cultists", cultistsAddr);
    contracts.relics = await ethers.getContractAt("Relics", relicsAddr);
    contracts.demons = await ethers.getContractAt("Demons", demonsAddr);
    contracts.rituals = await ethers.getContractAt("Rituals", ritualsAddr);
    contracts.cosmetics = await ethers.getContractAt("Cosmetics", cosmeticsAddr);
    contracts.keyShop = await ethers.getContractAt("KeyShop", keyShopAddr);
    contracts.mawSacrifice = await ethers.getContractAt("MawSacrifice", mawSacrificeAddr);
    contracts.cosmeticApplier = await ethers.getContractAt("CosmeticApplier", cosmeticApplierAddr);
    
    // Setup test cosmetics
    await contracts.cosmetics.createCosmetic(
      1, "Test Hat", "https://test.com/hat.png", "https://test.com/hat-layer.png",
      1, 1, 1, 100
    );
    await contracts.cosmetics.createCosmetic(
      2, "Epic Crown", "https://test.com/crown.png", "https://test.com/crown-layer.png", 
      4, 1, 1, 10
    );
    await contracts.mawSacrifice.setMonthlyCosmetics(1, [1, 2]);
    
    // Mint test raccoons
    await contracts.raccoons.connect(deployer).setMintConfig(
      ethers.parseEther("0.01"), 10, 10, true, false, false
    );
    await contracts.raccoons.connect(user1).mintPublic(3, { 
      value: ethers.parseEther("0.03") 
    });
  });

  describe("🔗 Contract Integration", function() {
    it("Should verify all contracts are properly configured", async function() {
      // Check ritual connections
      expect(await contracts.raccoons.ritual()).to.equal(await contracts.rituals.getAddress());
      expect(await contracts.cultists.ritual()).to.equal(await contracts.rituals.getAddress());
      expect(await contracts.relics.ritual()).to.equal(await contracts.rituals.getAddress());
      
      // Check MawSacrifice connections
      expect(await contracts.relics.mawSacrifice()).to.equal(await contracts.mawSacrifice.getAddress());
      expect(await contracts.demons.mawSacrifice()).to.equal(await contracts.mawSacrifice.getAddress());
      expect(await contracts.cultists.mawSacrifice()).to.equal(await contracts.mawSacrifice.getAddress());
      
      // Check cosmetic connections
      expect(await contracts.cosmetics.mawSacrifice()).to.equal(await contracts.mawSacrifice.getAddress());
      expect(await contracts.cosmetics.cosmeticApplier()).to.equal(await contracts.cosmeticApplier.getAddress());
    });
  });

  describe("🛒 KeyShop Flow", function() {
    it("Should allow buying keys with ETH", async function() {
      const keyPrice = ethers.parseEther("0.001");
      const amount = 5;
      
      await contracts.keyShop.connect(user1).buyKeys(amount, {
        value: keyPrice * BigInt(amount)
      });
      
      expect(await contracts.relics.balanceOf(user1.address, 1)).to.equal(amount);
    });
    
    it("Should reject insufficient payment", async function() {
      await expect(
        contracts.keyShop.connect(user1).buyKeys(5, {
          value: ethers.parseEther("0.001") // Only pay for 1 key
        })
      ).to.be.revertedWith("InsufficientETH");
    });
  });

  describe("🌑 MawSacrifice Flow", function() {
    beforeEach(async function() {
      // Buy keys for testing
      await contracts.keyShop.connect(user1).buyKeys(10, {
        value: ethers.parseEther("0.01")
      });
    });
    
    it("Should sacrifice keys for relics", async function() {
      const initialBalance = await contracts.relics.balanceOf(user1.address, 1);
      
      await contracts.mawSacrifice.connect(user1).sacrificeKeys(5);
      
      const finalBalance = await contracts.relics.balanceOf(user1.address, 1);
      expect(finalBalance).to.equal(initialBalance - 5n);
      
      // Check if any relics were awarded (random, so just check no error)
    });
    
    it("Should perform cosmetic ritual with fragments", async function() {
      // First get some fragments by sacrificing keys
      await contracts.mawSacrifice.connect(user1).sacrificeKeys(10);
      
      // Check if we got any fragments
      const fragmentBalance = await contracts.relics.balanceOf(user1.address, 2);
      
      if (fragmentBalance > 0n) {
        const initialCosmeticBalance = await contracts.cosmetics.balanceOf(user1.address);
        
        await contracts.mawSacrifice.connect(user1).sacrificeForCosmetic(1, 0);
        
        // Check that fragments were consumed
        expect(await contracts.relics.balanceOf(user1.address, 2)).to.equal(fragmentBalance - 1n);
      }
    });
    
    it("Should require cultist for demon sacrifice", async function() {
      // This should fail because user doesn't have cultists
      await expect(
        contracts.mawSacrifice.connect(user1).sacrificeForDemon(1, 0, false, false, 1)
      ).to.be.revertedWith("ERC721: invalid token ID");
    });
  });

  describe("🎨 Cosmetic Application", function() {
    let cosmeticTokenId;
    
    beforeEach(async function() {
      // Admin mint a cosmetic for testing
      cosmeticTokenId = await contracts.cosmetics.mintTo.staticCall(user1.address, 1);
      await contracts.cosmetics.mintTo(user1.address, 1);
    });
    
    it("Should allow applying cosmetics to raccoons", async function() {
      expect(await contracts.cosmetics.ownerOf(cosmeticTokenId)).to.equal(user1.address);
      expect(await contracts.raccoons.ownerOf(1)).to.equal(user1.address);
      
      await contracts.cosmeticApplier.connect(user1).applyCosmetic(1, cosmeticTokenId);
      
      // Check cosmetic was burned and applied
      await expect(contracts.cosmetics.ownerOf(cosmeticTokenId)).to.be.reverted;
      
      const appliedCosmetic = await contracts.cosmeticApplier.getSlotCosmetic(1, 1);
      expect(appliedCosmetic.name).to.equal("Test Hat");
    });
    
    it("Should calculate cosmetic scores correctly", async function() {
      await contracts.cosmeticApplier.connect(user1).applyCosmetic(1, cosmeticTokenId);
      
      const score = await contracts.cosmeticApplier.getRaccoonCosmeticScore(1);
      expect(score).to.equal(1); // Common rarity = 1 point
    });
  });

  describe("⛽ Gas Usage Tests", function() {
    it("Should use batch burns for gas efficiency", async function() {
      // Buy keys and get some relics
      await contracts.keyShop.connect(user1).buyKeys(10, {
        value: ethers.parseEther("0.01")
      });
      
      // Sacrifice keys to get fragments and masks
      await contracts.mawSacrifice.connect(user1).sacrificeKeys(10);
      
      const fragmentBalance = await contracts.relics.balanceOf(user1.address, 2);
      const maskBalance = await contracts.relics.balanceOf(user1.address, 3);
      
      if (fragmentBalance > 0n && maskBalance > 0n) {
        // This should use batch burn internally
        const tx = await contracts.mawSacrifice.connect(user1).sacrificeForCosmetic(1, 1);
        const receipt = await tx.wait();
        
        console.log("      ⛽ Gas used for cosmetic ritual:", receipt.gasUsed.toString());
        expect(receipt.gasUsed).to.be.below(200000); // Should be efficient
      }
    });
  });
});

describe("🚨 Edge Cases & Error Handling", function() {
  let contracts = {};
  let deployer, user1;
  
  before(async function() {
    [deployer, user1] = await ethers.getSigners();
    
    // Deploy minimal system for error testing
    const CompleteDeployer = await ethers.getContractFactory("CompleteDeployer");
    const completeDeployer = await CompleteDeployer.deploy(
      1000, "https://test.com/normal/", "https://test.com/cult/", 
      "https://test.com/dead/", "https://test.com/relics/", ethers.parseEther("0.001")
    );
    
    const addresses = await completeDeployer.getAllAddresses();
    contracts.mawSacrifice = await ethers.getContractAt("MawSacrifice", addresses[7]);
    contracts.relics = await ethers.getContractAt("Relics", addresses[2]);
  });
  
  it("Should reject sacrificing 0 keys", async function() {
    await expect(
      contracts.mawSacrifice.connect(user1).sacrificeKeys(0)
    ).to.be.revertedWith("InvalidAmount");
  });
  
  it("Should reject sacrificing more than 10 keys", async function() {
    await expect(
      contracts.mawSacrifice.connect(user1).sacrificeKeys(11)
    ).to.be.revertedWith("InvalidAmount");
  });
  
  it("Should reject cosmetic ritual with 0 fragments", async function() {
    await expect(
      contracts.mawSacrifice.connect(user1).sacrificeForCosmetic(0, 1)
    ).to.be.revertedWith("InvalidAmount");
  });
});