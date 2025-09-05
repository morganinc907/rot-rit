const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config();

async function verifyOne(name, address, args = []) {
  if (!address) return console.log(`[skip] ${name}`);
  try {
    console.log(`Verifying ${name} at ${address} ...`);
    await hre.run("verify:verify", { address, constructorArguments: args });
    console.log(`✓ Verified ${name}`);
  } catch (e) {
    console.log(`⚠️  Verify ${name} failed:`, e.message || e);
  }
}

async function main() {
  const out = JSON.parse(fs.readFileSync("deploy.output.json", "utf8"));
  const cfg = fs.existsSync("deploy.config.json") ? JSON.parse(fs.readFileSync("deploy.config.json", "utf8")) : {};

  await verifyOne("Relics", out.Relics);
  await verifyOne("Raccoons", out.Raccoons);
  await verifyOne("Cultists", out.Cultists);
  await verifyOne("Demons", out.Demons);

  const cosmeticsArgs = [process.env.BASE_TYPE_URI || cfg.baseTypeURI || "", process.env.BOUND_BASE_URI || cfg.boundBaseURI || ""];
  await verifyOne("CosmeticsV2", out.CosmeticsV2, cosmeticsArgs);

  const mawArgs = [out.Relics, out.CosmeticsV2, out.Demons, out.Cultists];
  await verifyOne("MawSacrificeV2", out.MawSacrificeV2, mawArgs);

  const rendererArgs = [out.CosmeticsV2, out.Raccoons];
  await verifyOne("RaccoonRenderer", out.RaccoonRenderer, rendererArgs);

  if (out.KeyShop) {
    const cfgRaw = fs.existsSync("deploy.config.json") ? JSON.parse(fs.readFileSync("deploy.config.json", "utf8")) : {};
    const price = (cfgRaw.keyShop && cfgRaw.keyShop.priceWei) || "0";
    const treasury = (cfgRaw.keyShop && cfgRaw.keyShop.treasury) || "";
    await verifyOne("KeyShop", out.KeyShop, [out.Relics, price, treasury]);
  }

  await verifyOne("RitualReadAggregator", out.RitualReadAggregator, [out.CosmeticsV2, out.Raccoons, out.Relics]);
}

main().catch((e) => { console.error(e); process.exit(1); });
