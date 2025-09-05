const hre = require("hardhat");
const fs = require("fs");

async function hasFn(contract, sig) { return Boolean(contract.interface.functions[sig]); }

async function main() {
  const out = JSON.parse(fs.readFileSync("deploy.output.json", "utf8"));
  const [deployer] = await hre.ethers.getSigners();
  console.log("Smoke signer:", deployer.address);

  const relics = await hre.ethers.getContractAt("Relics", out.Relics);
  const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", out.CosmeticsV2);
  const maw = await hre.ethers.getContractAt("MawSacrificeV2", out.MawSacrificeV2);
  const raccoons = await hre.ethers.getContractAt("Raccoons", out.Raccoons);
  const cultists = await hre.ethers.getContractAt("Cultists", out.Cultists);
  const demons = await hre.ethers.getContractAt("Demons", out.Demons);

  const RELIC_KEY=1, RELIC_FRAGMENT=2, RELIC_MASK=3, RELIC_DAGGER=4, RELIC_VIAL=5, RELIC_ASH=8;

  await (await relics.mint(deployer.address, RELIC_KEY, 5, "0x")).wait();
  await (await relics.mint(deployer.address, RELIC_FRAGMENT, 5, "0x")).wait();
  await (await relics.mint(deployer.address, RELIC_MASK, 3, "0x")).wait();
  await (await relics.mint(deployer.address, RELIC_DAGGER, 2, "0x")).wait();
  await (await relics.mint(deployer.address, RELIC_VIAL, 1, "0x")).wait();

  await (await maw.sacrificeKeys(3)).wait();
  console.log("Sacrificed 3 keys");

  await (await maw.sacrificeForCosmetic(2,1)).wait();
  console.log("Cosmetic ritual done");

  // Mint/assume raccoon #1
  if (await hasFn(raccoons, "mint(address)")) await (await raccoons.mint(deployer.address)).wait();

  // Bind first cosmetic we own (typeId 1..30)
  for (let t=1;t<=30;t++){ const bal = await cosmetics.balanceOf(deployer.address, t); if (bal.gt(0)) { await (await cosmetics.bindToRaccoon(1, t)).wait(); break; } }

  // Demon ritual
  if (await hasFn(cultists, "mint(address)")) await (await cultists.mint(deployer.address)).wait();
  await (await maw.sacrificeForDemon(2,1,false,false,1)).wait();
  console.log("Demon ritual attempted");

  console.log("Smoke complete");
}
main().catch((e)=>{ console.error(e); process.exit(1); });
