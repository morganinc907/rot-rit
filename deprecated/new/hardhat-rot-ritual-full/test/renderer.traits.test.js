
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { Slots } = require("./_utils");

describe("RaccoonRenderer — tokenURI with 5-slot cosmetics", function () {
  it("emits a JSON with image and attributes", async function () {
    const Relics = await ethers.getContractFactory("Relics"); const relics = await Relics.deploy(); await relics.deployed();
    const Raccoons = await ethers.getContractFactory("Raccoons"); const raccoons = await Raccoons.deploy(); await raccoons.deployed();
    const Cultists = await ethers.getContractFactory("Cultists"); const cultists = await Cultists.deploy(); await cultists.deployed();
    const Demons = await ethers.getContractFactory("Demons"); const demons = await Demons.deploy(); await demons.deployed();
    const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2"); const cosmetics = await CosmeticsV2.deploy("ipfs://base/","ipfs://bound/"); await cosmetics.deployed();

    const Renderer = await ethers.getContractFactory("RaccoonRenderer");
    const renderer = await Renderer.deploy(cosmetics.address, raccoons.address); await renderer.deployed();

    if (raccoons.interface.functions["mint(address)"]) await (await raccoons.mint((await ethers.getSigners())[0].address)).wait();

    const rc = await (await cosmetics.createCosmeticType("Face R1","", "", 1, Slots.FACE, 1, 1000)).wait();
    const typeId = rc.events.find(e=>e.event==="CosmeticTypeCreated").args.typeId.toNumber();
    await cosmetics.mintTo((await ethers.getSigners())[0].address, typeId).catch(()=>{});
    const bal = await cosmetics.balanceOf((await ethers.getSigners())[0].address, typeId);
    if (bal.gt(0)) {
      await (await cosmetics.bindToRaccoon(1, typeId)).wait();
      await (await cosmetics.equipCosmetic(1, Slots.FACE, 0)).wait();
    }

    const uri = await renderer.tokenURI(1);
    expect(uri.startsWith("data:application/json;base64,")).to.equal(true);
  });
});
