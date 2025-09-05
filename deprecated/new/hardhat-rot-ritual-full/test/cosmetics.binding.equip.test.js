
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { hasFn, Slots } = require("./_utils");

describe("CosmeticsV2 — bind & equip (5 slots)", function () {
  it("creates cosmetic type, mints via Maw, binds to raccoon, equips", async function () {
    const [owner] = await ethers.getSigners();

    const Relics = await ethers.getContractFactory("Relics");
    const relics = await Relics.deploy(); await relics.deployed();

    const Raccoons = await ethers.getContractFactory("Raccoons");
    const raccoons = await Raccoons.deploy(); await raccoons.deployed();

    const Cultists = await ethers.getContractFactory("Cultists");
    const cultists = await Cultists.deploy(); await cultists.deployed();

    const Demons = await ethers.getContractFactory("Demons");
    const demons = await Demons.deploy(); await demons.deployed();

    const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2");
    const cosmetics = await CosmeticsV2.deploy("ipfs://base/", "ipfs://bound/"); await cosmetics.deployed();

    const Maw = await ethers.getContractFactory("MawSacrificeV2");
    const maw = await Maw.deploy(relics.address, cosmetics.address, demons.address, cultists.address); await maw.deployed();

    await (await relics.setMawSacrifice(maw.address)).wait();

    const tx = await cosmetics.createCosmeticType("Body R2", "ipfs://img/body-r2.png", "ipfs://layer/body-r2.png", 2, Slots.BODY, 1, 1000);
    const rc = await tx.wait();
    const evt = rc.events.find(e => e.event === "CosmeticTypeCreated");
    const typeId = evt.args.typeId.toNumber();
    await (await maw.setCosmeticPool(2, [typeId])).wait();

    await (await relics.mint(owner.address, 2, 3, "0x")).wait();
    await (await relics.mint(owner.address, 3, 2, "0x")).wait();

    await (await maw.sacrificeForCosmetic(2, 1)).wait();
    const bal = await cosmetics.balanceOf(owner.address, typeId);
    const ash = await relics.balanceOf(owner.address, 8);
    expect(bal.gt(0) || ash.gt(0)).to.equal(true);

    if (bal.eq(0)) this.skip();

    if (hasFn(raccoons, "mint(address)")) await (await raccoons.mint(owner.address)).wait();
    await (await cosmetics.bindToRaccoon(1, typeId)).wait();
    await (await cosmetics.equipCosmetic(1, Slots.BODY, 0)).wait();

    const [, , body] = await cosmetics.getEquippedCosmetics(1);
    expect(body).to.equal(typeId);
  });
});
