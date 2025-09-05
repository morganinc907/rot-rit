const { expect } = require("chai");
const { ethers } = require("hardhat");
const { decodeAbiParameters } = require("viem");
const { Slots } = require("./_utils");

describe("RitualReadAggregator — consistency vs direct calls", function () {
  it("packed blob matches direct equipped + balances", async function () {
    const [owner] = await ethers.getSigners();
    const Relics = await ethers.getContractFactory("Relics"); const relics = await Relics.deploy(); await relics.deployed();
    const Raccoons = await ethers.getContractFactory("Raccoons"); const raccoons = await Raccoons.deploy(); await raccoons.deployed();
    const Cultists = await ethers.getContractFactory("Cultists"); const cultists = await Cultists.deploy(); await cultists.deployed();
    const Demons = await ethers.getContractFactory("Demons"); const demons = await Demons.deploy(); await demons.deployed();
    const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2"); const cosmetics = await CosmeticsV2.deploy("ipfs://base/","ipfs://bound/"); await cosmetics.deployed();

    const Agg = await ethers.getContractFactory("RitualReadAggregator");
    const agg = await Agg.deploy(cosmetics.address, raccoons.address, relics.address);
    await agg.deployed();

    if (raccoons.interface.functions["mint(address)"]) await (await raccoons.mint(owner.address)).wait();
    const tx = await (await cosmetics.createCosmeticType("Head R1","", "", 1, Slots.HEAD, 1, 1000)).wait();
    const typeId = tx.events.find(e=>e.event==="CosmeticTypeCreated").args.typeId.toNumber();
    await cosmetics.mintTo(owner.address, typeId).catch(()=>{});
    const bal = await cosmetics.balanceOf(owner.address, typeId);
    if (bal.gt(0)) {
      await (await cosmetics.bindToRaccoon(1, typeId)).wait();
      await (await cosmetics.equipCosmetic(1, Slots.HEAD, 0)).wait();
    }

    const relicIds = [1,2,3,4,5,8];
    await (await relics.mint(owner.address, 1, 2, "0x")).wait();
    await (await relics.mint(owner.address, 2, 1, "0x")).wait();

    // Direct calls
    const eqPacked = await cosmetics.getEquippedPacked(1);
    const [dirBounds, dirBases, dirIdx] = decodeAbiParameters(
      [{type:"uint256[5]"}, {type:"uint256[5]"}, {type:"uint256[5]"}],
      eqPacked
    );
    const balances = [];
    for (const id of relicIds) {
      balances.push(await relics.balanceOf(owner.address, id));
    }
    const ownerOf1 = await raccoons.ownerOf(1).catch(()=>ethers.ZeroAddress);

    // Aggregated
    const blob = await agg.batchEverythingPacked(owner.address, [1], relicIds);
    const [equipPacks, aggBalances, owners] = decodeAbiParameters(
      [{type:"bytes[]"}, {type:"uint256[]"}, {type:"address[]"}],
      blob
    );
    const [aggBounds, aggBases, aggIdx] = decodeAbiParameters(
      [{type:"uint256[5]"}, {type:"uint256[5]"}, {type:"uint256[5]"}],
      equipPacks[0]
    );

    for (let i=0;i<5;i++) {
      expect(aggBounds[i]).to.equal(dirBounds[i]);
      expect(aggBases[i]).to.equal(dirBases[i]);
      expect(aggIdx[i]).to.equal(dirIdx[i]);
    }
    for (let i=0;i<relicIds.length;i++) {
      expect(aggBalances[i]).to.equal(balances[i]);
    }
    expect(owners[0].toLowerCase()).to.equal((ownerOf1 || ethers.ZeroAddress).toLowerCase());
  });
});
