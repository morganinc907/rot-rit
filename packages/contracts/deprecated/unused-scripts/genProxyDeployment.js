// scripts/genProxyDeployment.js
// Usage:
// npx hardhat run scripts/genProxyDeployment.js --network baseSepolia --contract MawSacrificeV3Upgradeable --proxy 0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

const EIP1967_IMPL_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

async function main() {
  const contractName = process.env.CONTRACT || "MawSacrificeV3Upgradeable";
  const proxyAddress = process.env.PROXY || "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  if (!contractName || !proxyAddress) {
    throw new Error(
      "Missing env vars. Example:\n" +
        "CONTRACT=MawSacrificeV3Upgradeable PROXY=0xProxy... npx hardhat run scripts/genProxyDeployment.js --network baseSepolia"
    );
  }

  console.log(`🔍 Generating canonical deployment for ${contractName}...`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Proxy: ${proxyAddress}`);

  // 1) Load the ABI from the compiled artifact (the implementation ABI you WANT)
  const artifact = await hre.artifacts.readArtifact(contractName);
  const implAbi = artifact.abi;

  // 2) Read the implementation address from the proxy's EIP-1967 slot
  const provider = hre.ethers.provider;
  const raw = await provider.getStorage(proxyAddress, EIP1967_IMPL_SLOT);
  // Last 20 bytes of the slot = implementation address
  const implAddress = hre.ethers.getAddress("0x" + raw.slice(26));

  console.log(`Implementation: ${implAddress}`);

  // 3) Compose output JSON
  const out = {
    name: contractName,
    network: hre.network.name,
    address: proxyAddress,          // *** always the PROXY address ***
    implementation: implAddress,    // for visibility / audits
    abi: implAbi,
    updatedAt: new Date().toISOString(),
  };

  // 4) Write to deployments/<network>/<ArtifactName>.json
  const dir = path.join("deployments", hre.network.name);
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, `${contractName}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  
  console.log(`✅ Wrote canonical deployment: ${outPath}`);
  console.log(`   Address: ${out.address} (proxy)`);
  console.log(`   Implementation: ${out.implementation}`);
  console.log(`   ABI functions: ${out.abi.filter(f => f.type === 'function').length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});