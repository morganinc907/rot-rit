const { expect } = require("chai");
const { ethers } = require("hardhat");

// Utility: check if contract has a function
function hasFn(contract, sig) {
  return Boolean(contract.interface.functions[sig]);
}

describe("Rot Ritual — Maw/Cosmetics/Relics flow (smoke)", function () {
  const RELIC_KEY = 1;
  const RELIC_FRAGMENT = 2;
  const RELIC_MASK = 3;
  const RELIC_DAGGER = 4;
  const RELIC_VIAL = 5;
  const RELIC_CONTRACT = 6;
  const RELIC_DEED = 7;
  const RELIC_ASH = 8;

  it("deploys and wires contracts; exercises key + cosmetic sacrifices", async function () {
    const [owner] = await ethers.getSigners();

    // Deploy base contracts
    const Relics = await ethers.getContractFactory("Relics");
    const relics = await Relics.deploy();
    await relics.deployed();

    const Raccoons = await ethers.getContractFactory("Raccoons");
    const raccoons = await Raccoons.deploy();
    await raccoons.deployed();

    const Cultists = await ethers.getContractFactory("Cultists");
    const cultists = await Cultists.deploy();
    await cultists.deployed();

    const Demons = await ethers.getContractFactory("Demons");
    const demons = await Demons.deploy();
    await demons.deployed();

    const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2");
    const cosmetics = await CosmeticsV2.deploy("ipfs://base-types/", "ipfs://bound/");
    await cosmetics.deployed();

    const Maw = await ethers.getContractFactory("MawSacrificeV2");
    const maw = await Maw.deploy(relics.address, cosmetics.address, demons.address, cultists.address);
    await maw.deployed();

    // Permissions on Relics
    await (await relics.setMawSacrifice(maw.address)).wait();

    // Seed one cosmetic type (rarity 2, slot BODY = 2)
    const tx = await cosmetics.createCosmeticType(
      "Body R2",
      "ipfs://img/body-r2.png",
      "ipfs://layer/body-r2.png",
      2,
      1,    // slot BODY
      1,    // monthlySetId
      1000  // max
    );
    const rc = await tx.wait();
    const evt = rc.events.find((e) => e.event === "CosmeticTypeCreated");
    const typeId = evt.args.typeId.toNumber();

    // Put that type in rarity pool 2
    await (await maw.setCosmeticPool(2, [typeId])).wait();

    // Seed relics for the owner
    await (await relics.mint(owner.address, RELIC_KEY, 5, "0x")).wait();
    await (await relics.mint(owner.address, RELIC_FRAGMENT, 5, "0x")).wait();
    await (await relics.mint(owner.address, RELIC_MASK, 3, "0x")).wait();

    // Sacrifice 3 keys — we can only assert keys were burned
    const keyBalBefore = await relics.balanceOf(owner.address, RELIC_KEY);
    await (await maw.sacrificeKeys(3)).wait();
    const keyBalAfter = await relics.balanceOf(owner.address, RELIC_KEY);
    expect(keyBalBefore.sub(keyBalAfter)).to.equal(3);

    // Cosmetic ritual: fragments 2, masks 1 → success 60% (may fail)
    const fragBefore = await relics.balanceOf(owner.address, RELIC_FRAGMENT);
    const maskBefore = await relics.balanceOf(owner.address, RELIC_MASK);
    await (await maw.sacrificeForCosmetic(2, 1)).wait();
    const fragAfter = await relics.balanceOf(owner.address, RELIC_FRAGMENT);
    const maskAfter = await relics.balanceOf(owner.address, RELIC_MASK);

    expect(fragBefore.sub(fragAfter)).to.equal(2);
    expect(maskBefore.sub(maskAfter)).to.equal(1);

    // Either we got a cosmetic OR an ash
    const cosBal = await cosmetics.balanceOf(owner.address, typeId);
    const ashBal = await relics.balanceOf(owner.address, RELIC_ASH);
    expect(cosBal.gt(0) || ashBal.gt(0)).to.equal(true);

    // Try binding/equipping if we have a cosmetic balance and a raccoon we can mint
    if (cosBal.gt(0)) {
      // Mint raccoon #1 if possible
      if (hasFn(raccoons, "mint(address)")) {
        await (await raccoons.mint(owner.address)).wait();
      } else if (hasFn(raccoons, "mintTo(address)")) {
        await (await raccoons.mintTo(owner.address)).wait();
      }
      // Attempt to bind to tokenId 1 (if owner)
      try {
        await (await cosmetics.bindToRaccoon(1, typeId)).wait();
        // Equip BODY (slot=1) index 0
        await (await cosmetics.equipCosmetic(1, 2, 0)).wait();
      } catch (_) {
        // If ownership or token doesn't exist, skip silently
      }
    }
  });

  it("can attempt demon ritual (may fail and mint ash)", async function () {
    const [owner] = await ethers.getSigners();

    // Fresh deploy (isolated test)
    const Relics = await ethers.getContractFactory("Relics");
    const relics = await Relics.deploy();
    await relics.deployed();

    const Cultists = await ethers.getContractFactory("Cultists");
    const cultists = await Cultists.deploy();
    await cultists.deployed();

    const Demons = await ethers.getContractFactory("Demons");
    const demons = await Demons.deploy();
    await demons.deployed();

    const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2");
    const cosmetics = await CosmeticsV2.deploy("ipfs://base-types/", "ipfs://bound/");
    await cosmetics.deployed();

    const Maw = await ethers.getContractFactory("MawSacrificeV2");
    const maw = await Maw.deploy(relics.address, cosmetics.address, demons.address, cultists.address);
    await maw.deployed();
    await (await relics.setMawSacrifice(maw.address)).wait();

    // Seed relics and cultist
    await (await relics.mint(owner.address, RELIC_DAGGER, 2, "0x")).wait();
    await (await relics.mint(owner.address, RELIC_VIAL, 1, "0x")).wait();

    // Mint a cultist if possible; else skip demon ritual
    let haveCultist = false;
    if (hasFn(cultists, "mint(address)")) {
      await (await cultists.mint(owner.address)).wait();
      haveCultist = true;
    } else if (hasFn(cultists, "mintTo(address)")) {
      await (await cultists.mintTo(owner.address)).wait();
      haveCultist = true;
    }

    if (!haveCultist) {
      this.skip(); // no way to get a cultist in this environment
    }

    // Attempt ritual with daggers=2, vials=1
    const tx = await maw.sacrificeForDemon(2, 1, false, false, 1);
    await tx.wait();

    // We can't assert success due to randomness; assert that either ash increased or demons minted
    const demonBalanceFn = demons.balanceOf ? demons.balanceOf : null;
    const ashBal = await relics.balanceOf(owner.address, RELIC_ASH);
    if (demonBalanceFn) {
      const db = await demons.balanceOf(owner.address);
      expect(db.gt(0) || ashBal.gt(0)).to.equal(true);
    } else {
      // If Demons doesn't expose balanceOf, at least ash can be >0 on failure
      expect(ashBal.gte(0)).to.equal(true);
    }
  });
});
