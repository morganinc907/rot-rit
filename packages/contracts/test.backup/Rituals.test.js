const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RotRitual End-to-End", function () {
  let deployer, user;
  let relics, cosmetics, maw, raccoons, cultists, demons;

  const RELIC_KEY = 1;
  const RELIC_FRAGMENT = 2;
  const RELIC_MASK = 3;

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();

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

    const Cosmetics = await ethers.getContractFactory("CosmeticsV2");
    cosmetics = await Cosmetics.deploy("baseURI/", "boundURI/");
    await cosmetics.deployed();

    const Maw = await ethers.getContractFactory("MawSacrificeV2");
    maw = await Maw.deploy(relics.address, cosmetics.address, demons.address, cultists.address);
    await maw.deployed();

    // wire relics permissions
    await relics.setMawSacrifice(maw.address);

    // seed rarity pool with one cosmetic type
    const tx = await cosmetics.createCosmeticType("TestHat", "uri1", "uri2", 1, 0, 1, 100);
    const rc = await tx.wait();
    const evt = rc.events.find(e => e.event === "CosmeticTypeCreated");
    const typeId = evt.args.typeId.toNumber();
    await maw.setCosmeticPool(1, [typeId]);
    await maw.setRarityWeights(0, [100,0,0,0,0]);
  });

  it("should sacrifice keys to get relics", async function () {
    await relics.mint(deployer.address, RELIC_KEY, 5, "0x");
    await expect(maw.sacrificeKeys(3))
      .to.emit(maw, "KeysSacrificed")
      .withArgs(deployer.address, 3);
  });

  it("should sacrifice fragments+mask for cosmetic", async function () {
    await relics.mint(deployer.address, RELIC_FRAGMENT, 2, "0x");
    await relics.mint(deployer.address, RELIC_MASK, 1, "0x");
    await expect(maw.sacrificeForCosmetic(2,1))
      .to.emit(maw, "CosmeticSacrificed");
  });
});
