
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { Relic } = require("./_utils");

describe("MawSacrificeV2 — key/cosmetic/demon rituals", function () {
  it("burns keys and performs cosmetic ritual", async function () {
    const [owner] = await ethers.getSigners();
    const Relics = await ethers.getContractFactory("Relics"); const relics = await Relics.deploy(); await relics.deployed();
    const Cultists = await ethers.getContractFactory("Cultists"); const cultists = await Cultists.deploy(); await cultists.deployed();
    const Demons = await ethers.getContractFactory("Demons"); const demons = await Demons.deploy(); await demons.deployed();
    const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2"); const cosmetics = await CosmeticsV2.deploy("ipfs://base/","ipfs://bound/"); await cosmetics.deployed();
    const Maw = await ethers.getContractFactory("MawSacrificeV2"); const maw = await Maw.deploy(relics.address, cosmetics.address, demons.address, cultists.address); await maw.deployed();
    await (await relics.setMawSacrifice(maw.address)).wait();

    await (await relics.mint(owner.address, Relic.KEY, 5, "0x")).wait();
    await (await relics.mint(owner.address, Relic.FRAGMENT, 5, "0x")).wait();
    await (await relics.mint(owner.address, Relic.MASK, 2, "0x")).wait();

    const kb = await relics.balanceOf(owner.address, Relic.KEY);
    await (await maw.sacrificeKeys(3)).wait();
    const ka = await relics.balanceOf(owner.address, Relic.KEY);
    expect(kb.sub(ka)).to.equal(3);

    const t = await (await cosmetics.createCosmeticType("Face R2","", "", 2, 1, 1, 1000)).wait();
    const typeId = t.events.find(e=>e.event==="CosmeticTypeCreated").args.typeId.toNumber();
    await (await maw.setCosmeticPool(2, [typeId])).wait();

    await (await maw.sacrificeForCosmetic(2, 1)).wait();
    const cosBal = await cosmetics.balanceOf(owner.address, typeId);
    const ash = await relics.balanceOf(owner.address, Relic.ASH);
    expect(cosBal.gt(0) || ash.gt(0)).to.equal(true);
  });
});
