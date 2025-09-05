const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MawSacrificeV2 Flow Tests", function() {
  let deployer, user1, user2;
  let relics, cosmetics, maw, raccoons, cultists, demons;
  let aggregator, renderer;
  const COOLDOWN_BLOCKS = 2;
  
  // Relic IDs
  const RELIC_KEY = 1;
  const RELIC_FRAGMENT = 2;
  const RELIC_MASK = 3;
  const RELIC_DAGGER = 4;
  const RELIC_VIAL = 5;
  const RELIC_ASH = 8;

  beforeEach(async function() {
    [deployer, user1, user2] = await ethers.getSigners();

    // Deploy core contracts
    const Relics = await ethers.getContractFactory("Relics");
    relics = await Relics.deploy();
    await relics.deployed();

    const Raccoons = await ethers.getContractFactory("Raccoons");
    raccoons = await Raccoons.deploy();
    await raccoons.deployed();

    const Cultists = await ethers.getContractFactory("Cultists");
    cultists = await Cultists.deploy();
    await cultists.deployed();

    const Demons = await ethers.getContractFactory("Demons");
    demons = await Demons.deploy();
    await demons.deployed();

    const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2");
    cosmetics = await CosmeticsV2.deploy("ipfs://base/", "ipfs://bound/");
    await cosmetics.deployed();

    const MawSacrificeV2 = await ethers.getContractFactory("MawSacrificeV2");
    maw = await MawSacrificeV2.deploy(relics.address, cosmetics.address, demons.address, cultists.address);
    await maw.deployed();

    // Setup permissions
    await relics.setMawSacrifice(maw.address);
    await cosmetics.setContracts(raccoons.address, maw.address);

    // Deploy optional contracts
    const RaccoonRenderer = await ethers.getContractFactory("RaccoonRenderer");
    renderer = await RaccoonRenderer.deploy(cosmetics.address, raccoons.address);
    await renderer.deployed();

    const RitualReadAggregator = await ethers.getContractFactory("RitualReadAggregator");
    aggregator = await RitualReadAggregator.deploy(cosmetics.address, raccoons.address, relics.address);
    await aggregator.deployed();

    // Setup cosmetic types
    for (let i = 1; i <= 5; i++) {
      await cosmetics.createCosmeticType(
        `Cosmetic ${i}`,
        `ipfs://image/${i}`,
        `ipfs://preview/${i}`,
        i, // rarity
        0, // slot HEAD
        1, // monthly set
        100 // max supply
      );
    }

    // Configure rarity weights
    await maw.setRarityWeights(0, [600, 250, 120, 30, 0]);
    await maw.setRarityWeights(1, [450, 300, 200, 50, 0]);
    await maw.setRarityWeights(2, [300, 320, 280, 80, 20]);
    await maw.setRarityWeights(3, [200, 320, 320, 140, 20]);

    // Set cooldown
    await maw.setCooldownBlocks(COOLDOWN_BLOCKS);
  });

  describe("Sacrifice for Cosmetics", function() {
    it("should sacrifice keys for fragments", async function() {
      await relics.mint(user1.address, RELIC_KEY, 10, "0x");
      
      await relics.connect(user1).setApprovalForAll(maw.address, true);
      await maw.connect(user1).sacrificeKeys(3);
      
      expect(await relics.balanceOf(user1.address, RELIC_KEY)).to.equal(7);
      expect(await relics.balanceOf(user1.address, RELIC_FRAGMENT)).to.equal(3);
    });

    it("should sacrifice for cosmetics with proper rarity", async function() {
      await relics.mint(user1.address, RELIC_FRAGMENT, 10, "0x");
      await relics.mint(user1.address, RELIC_MASK, 5, "0x");
      
      await relics.connect(user1).setApprovalForAll(maw.address, true);
      
      const tx = await maw.connect(user1).sacrificeForCosmetic(2, 1);
      const receipt = await tx.wait();
      
      // Parse events to check cosmetic minted
      const transferEvent = receipt.events.find(e => e.event === "TransferSingle");
      expect(transferEvent).to.not.be.undefined;
      
      // Check balances
      expect(await relics.balanceOf(user1.address, RELIC_FRAGMENT)).to.equal(8);
      expect(await relics.balanceOf(user1.address, RELIC_MASK)).to.equal(4);
    });

    it("should enforce cooldown between sacrifices", async function() {
      await relics.mint(user1.address, RELIC_FRAGMENT, 20, "0x");
      await relics.mint(user1.address, RELIC_MASK, 10, "0x");
      
      await relics.connect(user1).setApprovalForAll(maw.address, true);
      
      // First sacrifice
      await maw.connect(user1).sacrificeForCosmetic(2, 1);
      
      // Try immediate second sacrifice - should fail
      await expect(maw.connect(user1).sacrificeForCosmetic(2, 1))
        .to.be.revertedWith("Cooldown active");
      
      // Mine blocks to pass cooldown
      for (let i = 0; i < COOLDOWN_BLOCKS; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      
      // Should work now
      await maw.connect(user1).sacrificeForCosmetic(2, 1);
    });

    it("should handle batch sacrifices correctly", async function() {
      await relics.mint(user1.address, RELIC_FRAGMENT, 50, "0x");
      await relics.mint(user1.address, RELIC_MASK, 25, "0x");
      
      await relics.connect(user1).setApprovalForAll(maw.address, true);
      
      const batchCount = 5;
      await maw.connect(user1).sacrificeForCosmetic(2, batchCount);
      
      // Check resources consumed
      expect(await relics.balanceOf(user1.address, RELIC_FRAGMENT)).to.equal(40);
      expect(await relics.balanceOf(user1.address, RELIC_MASK)).to.equal(20);
    });
  });

  describe("Wardrobe System", function() {
    beforeEach(async function() {
      // Mint raccoon to user
      await raccoons.mint(user1.address);
      
      // Give user cosmetics
      await cosmetics.connect(deployer).mintTo(user1.address, 1);
      await cosmetics.connect(deployer).mintTo(user1.address, 2);
    });

    it("should bind cosmetics to raccoon", async function() {
      await cosmetics.connect(user1).bindToRaccoon(1, 1);
      
      const boundId = ethers.BigNumber.from("1000000001");
      expect(await cosmetics.isBound(boundId)).to.be.true;
      expect(await cosmetics.boundToRaccoon(boundId)).to.equal(1);
    });

    it("should equip and unequip cosmetics", async function() {
      await cosmetics.connect(user1).bindToRaccoon(1, 1);
      
      // Should be auto-equipped on bind
      const equipped = await cosmetics.getEquippedForSlot(1, 0);
      expect(equipped.baseTypeId).to.equal(1);
      
      // Unequip
      await cosmetics.connect(user1).unequipFromSlot(1, 0);
      const unequipped = await cosmetics.getEquippedForSlot(1, 0);
      expect(unequipped.baseTypeId).to.equal(0);
    });

    it("should handle multiple items per slot", async function() {
      // Create more cosmetics for same slot
      await cosmetics.createCosmeticType("Head2", "ipfs://h2", "ipfs://ph2", 1, 0, 1, 100);
      await cosmetics.mintTo(user1.address, 6);
      
      // Bind multiple items
      await cosmetics.connect(user1).bindToRaccoon(1, 1);
      await cosmetics.connect(user1).bindToRaccoon(1, 6);
      
      // Check wardrobe has both items
      const wardrobe = await cosmetics.getWardrobeForSlot(1, 0);
      expect(wardrobe.length).to.equal(2);
    });
  });

  describe("Demon Ritual", function() {
    it("should perform demon sacrifice", async function() {
      await cultists.mint(user1.address);
      await relics.mint(user1.address, RELIC_DAGGER, 2, "0x");
      await relics.mint(user1.address, RELIC_VIAL, 1, "0x");
      
      await cultists.connect(user1).setApprovalForAll(maw.address, true);
      await relics.connect(user1).setApprovalForAll(maw.address, true);
      
      const tx = await maw.connect(user1).sacrificeForDemon(
        1, // cultist id
        1, // demon type
        false, // no mask
        false, // no ash
        1 // vial count
      );
      
      await tx.wait();
      
      // Check demon minted
      expect(await demons.balanceOf(user1.address)).to.equal(1);
    });
  });

  describe("Rarity Distribution", function() {
    it("should respect rarity weights", async function() {
      // Give user lots of resources
      await relics.mint(user1.address, RELIC_FRAGMENT, 1000, "0x");
      await relics.mint(user1.address, RELIC_MASK, 500, "0x");
      await relics.mint(user1.address, RELIC_DAGGER, 200, "0x");
      
      await relics.connect(user1).setApprovalForAll(maw.address, true);
      
      const results = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      
      // Perform many sacrifices to test distribution
      for (let i = 0; i < 20; i++) {
        const tx = await maw.connect(user1).sacrificeForCosmetic(2, 1);
        const receipt = await tx.wait();
        
        // Mine blocks for cooldown
        for (let j = 0; j < COOLDOWN_BLOCKS; j++) {
          await ethers.provider.send("evm_mine", []);
        }
        
        // TODO: Parse event to determine rarity received
        // This would require analyzing the cosmetic type ID from events
      }
      
      // Results should roughly match configured weights
      // Note: This is statistical, so exact matches aren't expected
    });
  });

  describe("Edge Cases", function() {
    it("should handle insufficient resources", async function() {
      await relics.mint(user1.address, RELIC_FRAGMENT, 1, "0x");
      await relics.connect(user1).setApprovalForAll(maw.address, true);
      
      await expect(maw.connect(user1).sacrificeForCosmetic(2, 1))
        .to.be.reverted;
    });

    it("should handle non-existent raccoon binding", async function() {
      await cosmetics.mintTo(user1.address, 1);
      
      await expect(cosmetics.connect(user1).bindToRaccoon(999, 1))
        .to.be.revertedWith("Not raccoon owner");
    });

    it("should prevent double binding", async function() {
      await raccoons.mint(user1.address);
      await cosmetics.mintTo(user1.address, 1);
      
      await cosmetics.connect(user1).bindToRaccoon(1, 1);
      
      // Try to bind same item again
      await expect(cosmetics.connect(user1).bindToRaccoon(1, 1))
        .to.be.reverted;
    });
  });
});
