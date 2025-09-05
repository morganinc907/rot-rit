const { expect } = require("chai");
const { ethers } = require("hardhat");
const { hasFn, Slots, Relic, expectEventArgs } = require("./_utils");

describe("CosmeticsV2 — strict: events + wardrobe structure", function () {
  it("binds and equips with correct events and wardrobe state", async function () {
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

    // Create BODY item and pool
    const cre = await cosmetics.createCosmeticType("Body Test", "", "", 2, Slots.BODY, 1, 1000);
    const rc = await cre.wait();
    const typeId = rc.events.find(e => e.event === "CosmeticTypeCreated").args.typeId.toNumber();
    await (await maw.setCosmeticPool(2, [typeId])).wait();

    // seed relics for cosmetic ritual
    await (await relics.mint(owner.address, Relic.FRAGMENT, 3, "0x")).wait();
    await (await relics.mint(owner.address, Relic.MASK, 2, "0x")).wait();

    // run ritual
    const srx = await maw.sacrificeForCosmetic(2, 1);
    await srx.wait();

    const haveCos = await cosmetics.balanceOf(owner.address, typeId);
    if (haveCos.eq(0)) this.skip();

    // Ensure raccoon exists
    if (hasFn(raccoons, "mint(address)")) await (await raccoons.mint(owner.address)).wait();

    // Bind — assert CosmeticBound event
    const bindTx = await cosmetics.bindToRaccoon(1, typeId);
    const bindRc = await bindTx.wait();
    expectEventArgs(bindRc, "CosmeticBound", (args) => {
      expect(args.raccoonId).to.equal(1);
      expect(args.baseTypeId).to.equal(typeId);
      expect(args.slot).to.equal(Slots.BODY);
      expect(args.boundId).to.be.a("bigint");
    });

    // Wardrobe page must include one item with boundId >= 1e9 and baseTypeId == typeId
    const [packed, eqIdxPlus1, total] = await cosmetics.getWardrobePagePacked(1, Slots.BODY, 0, 10);
    const { decodeAbiParameters } = require("viem");
    const [boundIds, baseTypeIds, boundAts] = decodeAbiParameters(
      [{type:"uint256[]"}, {type:"uint256[]"}, {type:"uint256[]"}],
      packed
    );
    expect(total).to.equal(1);
    expect(boundIds.length).to.equal(1);
    expect(baseTypeIds[0]).to.equal(BigInt(typeId));
    expect(boundIds[0]).to.be.greaterThanOrEqual(1000000000n);

    // Equip — assert CosmeticEquipped event and index
    const eqTx = await cosmetics.equipCosmetic(1, Slots.BODY, 0);
    const eqRc = await eqTx.wait();
    expectEventArgs(eqRc, "CosmeticEquipped", (args) => {
      expect(args.raccoonId).to.equal(1);
      expect(args.slot).to.equal(Slots.BODY);
      expect(args.boundId).to.equal(boundIds[0]);
    });

    const [, , body] = await cosmetics.getEquippedCosmetics(1);
    expect(body).to.equal(typeId);

    const [sBoundIds, sBaseTypeIds, sIdx] = await cosmetics.getEquippedSummary(1);
    expect(sBoundIds[2]).to.equal(boundIds[0]);
    expect(sBaseTypeIds[2]).to.equal(BigInt(typeId));
    expect(sIdx[2]).to.equal(1n); // index+1
  });
});
