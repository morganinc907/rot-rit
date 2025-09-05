const hre = require("hardhat");
const fs = require("fs");

// Load deployment addresses
function loadDeployment() {
  if (!fs.existsSync("deployment-output.json")) {
    throw new Error("deployment-output.json not found. Run deploy-with-ipfs.js first.");
  }
  return JSON.parse(fs.readFileSync("deployment-output.json", "utf8"));
}

async function main() {
  const deployment = loadDeployment();
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Setting up VRF configuration on", hre.network.name);
  console.log("Deployer:", deployer.address);

  const maw = await hre.ethers.getContractAt("MawSacrificeV2", deployment.contracts.MawSacrificeV2);

  console.log("\n=== Current VRF Configuration ===");
  
  try {
    // Get current VRF config from contract
    const coordinator = await maw.vrfCoordinator();
    const keyHash = await maw.keyHash();
    const subscriptionId = await maw.subscriptionId();
    const callbackGasLimit = await maw.callbackGasLimit();
    const requestConfirmations = await maw.requestConfirmations();

    console.log("VRF Coordinator:", coordinator);
    console.log("Key Hash:", keyHash);
    console.log("Subscription ID:", subscriptionId.toString());
    console.log("Callback Gas Limit:", callbackGasLimit.toString());
    console.log("Request Confirmations:", requestConfirmations.toString());

    // Check if subscription ID is set
    if (subscriptionId.toString() === "0") {
      console.log("\n⚠️  Subscription ID is not set!");
      console.log("\n📌 Manual Steps Required:");
      console.log("1. Go to https://vrf.chain.link");
      console.log("2. Connect your wallet");
      console.log("3. Switch to Base Sepolia network");
      console.log("4. Create a new subscription");
      console.log("5. Fund it with testnet LINK tokens");
      console.log("6. Add this contract as a consumer:", deployment.contracts.MawSacrificeV2);
      console.log("7. Run this script with the subscription ID:");
      console.log(`   npx hardhat run scripts/setup-vrf.js --network baseSepolia -- <subscriptionId>`);
      
      // Check if subscription ID provided as argument
      const subscriptionIdArg = process.argv[process.argv.length - 1];
      if (subscriptionIdArg && !isNaN(subscriptionIdArg) && subscriptionIdArg !== __filename) {
        console.log(`\n=== Updating Subscription ID to ${subscriptionIdArg} ===`);
        
        try {
          await (await maw.setVRFConfig(
            coordinator,
            keyHash, 
            subscriptionIdArg,
            callbackGasLimit,
            requestConfirmations
          )).wait();
          
          console.log("✅ VRF configuration updated successfully!");
          console.log("New Subscription ID:", subscriptionIdArg);
          
          // Update deployment output
          deployment.vrf.subscriptionId = parseInt(subscriptionIdArg);
          fs.writeFileSync("deployment-output.json", JSON.stringify(deployment, null, 2));
          console.log("📁 Updated deployment-output.json");
          
        } catch (error) {
          console.log("❌ Failed to update VRF config:", error.message);
        }
      }
      
    } else {
      console.log("✅ VRF configuration looks complete!");
      
      // Test if we can make a request (dry run)
      console.log("\n=== Testing VRF Setup ===");
      console.log("To test VRF, you can try sacrificing a relic in your dApp");
      console.log("Make sure your subscription has enough LINK tokens");
    }

  } catch (error) {
    console.log("❌ Failed to read VRF configuration:", error.message);
  }

  console.log("\n=== VRF Setup Information ===");
  console.log("Network: Base Sepolia");
  console.log("VRF Coordinator: 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B");
  console.log("Key Hash (500 gwei): 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae");
  console.log("LINK Token: 0xE4aB69C077896252FAFBD49EFD26B5D171A32410");
  console.log("Testnet Faucet: https://faucets.chain.link");
  console.log("\nMawSacrificeV2 Address:", deployment.contracts.MawSacrificeV2);
  console.log("Add this address as a consumer in your VRF subscription!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});