const { expect } = require("chai");
const { ethers } = require("hardhat");
const fc = require("fast-check");
const { Slots } = require("./_utils");
const { decodeAbiParameters } = require("viem");

describe("CosmeticsV2 — Wardrobe paging fuzz", function () {
  it("getWardrobePagePacked respects boundaries and produces consistent slices", async function () {
    const [owner] = await ethers.getSigners();

    const Relics = await ethers.getContractFactory("Relics"); const relics = await Relics.deploy(); await relics.deployed();
    const Raccoons = await ethers.getContractFactory("Raccoons"); const raccoons = await Raccoons.deploy(); await raccoons.deployed();
    const Cultists = await ethers.getContractFactory("Cultists"); const cultists = await Cultists.deploy(); await cultists.deployed();
    const Demons = await ethers.getContractFactory("Demons"); const demons = await Demons.deploy(); await demons.deployed();
    const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2"); const cosmetics = await CosmeticsV2.deploy("ipfs://base/","ipfs://bound/"); await cosmetics.deployed();

    // Allow test signer to act as mawSacrifice to use mintTo in setup
    await (await cosmetics.setContracts(raccoons.address, owner.address)).wait();

    // Ensure raccoon #1 exists
    if (raccoons.interface.functions["mint(address)"]) await (await raccoons.mint(owner.address)).wait();

    // Create and bind N body cosmetics
    const N = 20;
    const typeIds = [];
    for (let i = 0; i < N; i++) {
      const rc = await (await cosmetics.createCosmeticType(`Body ${i}`, "", "", 1, Slots.BODY, 1, 1000)).wait();
      const typeId = rc.events.find(e=>e.event==="CosmeticTypeCreated").args.typeId.toNumber();
      typeIds.push(typeId);
      await (await cosmetics.mintTo(owner.address, typeId)).wait();
      await (await cosmetics.bindToRaccoon(1, typeId)).wait();
    }

    // total from wardrobe page vs getWardrobeItems length must match
    const [packed0, eq0, total0] = await cosmetics.getWardrobePagePacked(1, Slots.BODY, 0, N+5);
    const items = await cosmetics.getWardrobeItems(1, Slots.BODY);
    expect(total0).to.equal(items.length);

    const total = Number(total0);

    await fc.assert(
      fc.asyncProperty(fc.nat(total + 10), fc.nat(total + 10), async (startRaw, countRaw) => {
        const start = Math.min(startRaw, total);
        const count = Math.min(countRaw, total + 10);

        const [packed, eqIdxPlus1, tot] = await cosmetics.getWardrobePagePacked(1, Slots.BODY, start, count);
        expect(Number(tot)).to.equal(total);

        const [boundIds, baseTypeIds, boundAts] = decodeAbiParameters(
          [{ type: "uint256[]" }, { type: "uint256[]" }, { type: "uint256[]" }],
          packed
        );

        // expected slice size
        const expected = Math.max(Math.min(total - start, count), 0);
        expect(boundIds.length).to.equal(expected);
        expect(baseTypeIds.length).to.equal(expected);
        expect(boundAts.length).to.equal(expected);

        // If we have items, check the first element of slice matches the wardrobe at [start]
        if (expected > 0) {
          const first = items[start];
          expect(baseTypeIds[0]).to.equal(first.baseTypeId);
        }
      }),
      { numRuns: 60 }
    );
  });
});
