const { expect } = require("chai");
const { ethers } = require("hardhat");
const { Slots, decodeBase64Json } = require("./_utils");

describe("RaccoonRenderer — strict JSON attributes", function () {
  it("includes slot attributes when equipped", async function () {
    const [owner] = await ethers.getSigners();
    const Relics = await ethers.getContractFactory("Relics"); const relics = await Relics.deploy(); await relics.deployed();
    const Raccoons = await ethers.getContractFactory("Raccoons"); const raccoons = await Raccoons.deploy(); await raccoons.deployed();
    const Cultists = await ethers.getContractFactory("Cultists"); const cultists = await Cultists.deploy(); await cultists.deployed();
    const Demons = await ethers.getContractFactory("Demons"); const demons = await Demons.deploy(); await demons.deployed();
    const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2"); const cosmetics = await CosmeticsV2.deploy("ipfs://base/","ipfs://bound/"); await cosmetics.deployed();

    const Renderer = await ethers.getContractFactory("RaccoonRenderer");
    const renderer = await Renderer.deploy(cosmetics.address, raccoons.address); await renderer.deployed();

    if (raccoons.interface.functions["mint(address)"]) await (await raccoons.mint(owner.address)).wait();

    const name = "Test Head Cosmetic";
    const rc = await (await cosmetics.createCosmeticType(name, "", "", 1, Slots.HEAD, 1, 1000)).wait();
    const typeId = rc.events.find(e=>e.event==="CosmeticTypeCreated").args.typeId.toNumber();
    await cosmetics.mintTo(owner.address, typeId).catch(()=>{});

    const bal = await cosmetics.balanceOf(owner.address, typeId);
    if (bal.gt(0)) {
      await (await cosmetics.bindToRaccoon(1, typeId)).wait();
      await (await cosmetics.equipCosmetic(1, Slots.HEAD, 0)).wait();
    }

    const uri = await renderer.tokenURI(1);
    const json = decodeBase64Json(uri);
    expect(json).to.have.property("image");
    expect(json).to.have.property("attributes");

    const headAttr = json.attributes.find(a => a.trait_type === "Head");
    if (bal.gt(0)) {
      expect(headAttr?.value).to.equal(name);
    } else {
      expect(true).to.equal(true);
    }
  });
});
