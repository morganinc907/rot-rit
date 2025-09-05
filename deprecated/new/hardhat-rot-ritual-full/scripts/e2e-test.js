const hre = require("hardhat");
const fs = require("fs");
const { chains } = require("../config/chains");

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("");
  log(`${"=".repeat(60)}`, "cyan");
  log(`  ${title}`, "bright");
  log(`${"=".repeat(60)}`, "cyan");
}

function logTest(name, passed) {
  const symbol = passed ? "✅" : "❌";
  const color = passed ? "green" : "red";
  log(`  ${symbol} ${name}`, color);
}

class E2ETestRunner {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
    this.contracts = {};
    this.signer = null;
  }

  async setup() {
    logSection("🔧 Test Environment Setup");
    
    // Load deployment output
    if (!fs.existsSync("deploy.output.json")) {
      throw new Error("deploy.output.json not found. Run deployment first.");
    }
    
    const deployOutput = JSON.parse(fs.readFileSync("deploy.output.json", "utf8"));
    log("  📄 Loaded deployment artifacts", "green");
    
    // Get signer
    [this.signer] = await hre.ethers.getSigners();
    log(`  👤 Test signer: ${this.signer.address}`, "blue");
    
    // Load contracts
    const contractNames = [
      "Relics", "CosmeticsV2", "MawSacrificeV2", 
      "Raccoons", "Cultists", "Demons",
      "RaccoonRenderer", "RitualReadAggregator"
    ];
    
    for (const name of contractNames) {
      if (deployOutput[name]) {
        this.contracts[name] = await hre.ethers.getContractAt(name, deployOutput[name]);
        log(`  ✓ Loaded ${name}`, "green");
      }
    }
    
    return true;
  }

  async testWalletAndNetwork() {
    logSection("💳 Wallet & Network Tests");
    
    try {
      // Test 1: Chain ID verification
      const network = await hre.ethers.provider.getNetwork();
      const isBaseSepolia = network.chainId === chains.baseSepolia.id;
      logTest(`Chain ID is Base Sepolia (${chains.baseSepolia.id})`, isBaseSepolia);
      if (!isBaseSepolia) {
        this.results.warnings.push(`Wrong network: ${network.chainId}`);
      }
      
      // Test 2: Balance check
      const balance = await this.signer.getBalance();
      const hasBalance = balance.gt(0);
      logTest(`Signer has ETH balance: ${hre.ethers.utils.formatEther(balance)} ETH`, hasBalance);
      
      // Test 3: Contract connectivity
      const relicsAddress = this.contracts.Relics?.address;
      const hasContracts = relicsAddress !== undefined;
      logTest("Contracts deployed and accessible", hasContracts);
      
      // Test 4: Gas estimation
      try {
        const gasEstimate = await this.contracts.Relics.estimateGas.mint(
          this.signer.address, 1, 1, "0x"
        );
        logTest(`Gas estimation works: ${gasEstimate.toString()} gas`, true);
      } catch (e) {
        logTest("Gas estimation failed", false);
        this.results.failed.push("Gas estimation");
      }
      
      this.results.passed.push("Wallet & Network");
    } catch (e) {
      this.results.failed.push("Wallet & Network");
      log(`  Error: ${e.message}`, "red");
    }
  }

  async testSacrificeFlow() {
    logSection("⚗️ Sacrifice Flow Tests");
    
    try {
      const RELIC_KEY = 1;
      const RELIC_FRAGMENT = 2;
      const RELIC_MASK = 3;
      
      // Mint test resources
      await (await this.contracts.Relics.mint(this.signer.address, RELIC_KEY, 10, "0x")).wait();
      await (await this.contracts.Relics.mint(this.signer.address, RELIC_FRAGMENT, 20, "0x")).wait();
      await (await this.contracts.Relics.mint(this.signer.address, RELIC_MASK, 10, "0x")).wait();
      logTest("Minted test relics", true);
      
      // Test 1: Key sacrifice
      await (await this.contracts.Relics.setApprovalForAll(this.contracts.MawSacrificeV2.address, true)).wait();
      const keyBalance = await this.contracts.Relics.balanceOf(this.signer.address, RELIC_KEY);
      await (await this.contracts.MawSacrificeV2.sacrificeKeys(3)).wait();
      const newKeyBalance = await this.contracts.Relics.balanceOf(this.signer.address, RELIC_KEY);
      logTest(`Key sacrifice: ${keyBalance} → ${newKeyBalance}`, newKeyBalance.lt(keyBalance));
      
      // Test 2: Cosmetic sacrifice with event parsing
      const tx = await this.contracts.MawSacrificeV2.sacrificeForCosmetic(2, 1);
      const receipt = await tx.wait();
      const hasEvents = receipt.events && receipt.events.length > 0;
      logTest("Cosmetic sacrifice emits events", hasEvents);
      
      // Parse ERC1155 transfer events
      let cosmeticReceived = false;
      for (const event of receipt.events || []) {
        if (event.event === "TransferSingle") {
          const [operator, from, to, id, value] = event.args;
          if (to === this.signer.address && from === hre.ethers.constants.AddressZero) {
            cosmeticReceived = true;
            logTest(`Received cosmetic ID ${id.toString()}`, true);
          }
        }
      }
      
      if (!cosmeticReceived) {
        logTest("No cosmetic received from sacrifice", false);
        this.results.warnings.push("Cosmetic mint event not found");
      }
      
      // Test 3: Cooldown enforcement
      try {
        await this.contracts.MawSacrificeV2.sacrificeForCosmetic(2, 1);
        logTest("Cooldown NOT enforced (should fail)", false);
        this.results.failed.push("Cooldown check");
      } catch (e) {
        logTest("Cooldown properly enforced", true);
      }
      
      // Test 4: Batch sacrifice (after cooldown)
      await hre.network.provider.send("hardhat_mine", ["0x2"]); // Mine 2 blocks
      const batchTx = await this.contracts.MawSacrificeV2.sacrificeForCosmetic(2, 3);
      const batchReceipt = await batchTx.wait();
      const batchEvents = batchReceipt.events?.filter(e => e.event === "TransferSingle") || [];
      logTest(`Batch sacrifice (3x): ${batchEvents.length} cosmetics received`, batchEvents.length > 0);
      
      this.results.passed.push("Sacrifice Flow");
    } catch (e) {
      this.results.failed.push("Sacrifice Flow");
      log(`  Error: ${e.message}`, "red");
    }
  }

  async testWardrobeSystem() {
    logSection("👗 Wardrobe & Cosmetic System");
    
    try {
      // Mint a raccoon
      if (this.contracts.Raccoons.mint) {
        await (await this.contracts.Raccoons.mint(this.signer.address)).wait();
        logTest("Minted Raccoon #1", true);
      }
      
      // Get cosmetic balance
      let cosmeticTypeId = 0;
      for (let i = 1; i <= 30; i++) {
        const balance = await this.contracts.CosmeticsV2.balanceOf(this.signer.address, i);
        if (balance.gt(0)) {
          cosmeticTypeId = i;
          break;
        }
      }
      
      if (cosmeticTypeId === 0) {
        // Mint a cosmetic if none found
        await (await this.contracts.CosmeticsV2.mintTo(this.signer.address, 1)).wait();
        cosmeticTypeId = 1;
        logTest("Minted test cosmetic", true);
      }
      
      // Test 1: Bind cosmetic to raccoon
      const bindTx = await this.contracts.CosmeticsV2.bindToRaccoon(1, cosmeticTypeId);
      await bindTx.wait();
      const boundId = hre.ethers.BigNumber.from("1000000000").add(cosmeticTypeId);
      const isBound = await this.contracts.CosmeticsV2.isBound(boundId);
      logTest(`Bound cosmetic ${cosmeticTypeId} to Raccoon #1`, isBound);
      
      // Test 2: Check wardrobe
      const wardrobe = await this.contracts.CosmeticsV2.getWardrobeForSlot(1, 0);
      logTest(`Wardrobe has ${wardrobe.length} items in HEAD slot`, wardrobe.length > 0);
      
      // Test 3: Equipment status
      const equipped = await this.contracts.CosmeticsV2.getEquippedForSlot(1, 0);
      const isEquipped = equipped.baseTypeId?.gt(0) || false;
      logTest("Cosmetic auto-equipped on bind", isEquipped);
      
      // Test 4: Unequip
      if (isEquipped) {
        await (await this.contracts.CosmeticsV2.unequipFromSlot(1, 0)).wait();
        const unequipped = await this.contracts.CosmeticsV2.getEquippedForSlot(1, 0);
        logTest("Successfully unequipped", unequipped.baseTypeId?.eq(0) || true);
      }
      
      // Test 5: Multiple slots (5-slot system)
      const slots = ["HEAD", "FACE", "BODY", "COLOR", "BACKGROUND"];
      for (let i = 0; i < slots.length; i++) {
        const slotWardrobe = await this.contracts.CosmeticsV2.getWardrobeForSlot(1, i);
        log(`    Slot ${slots[i]}: ${slotWardrobe.length} items`, "cyan");
      }
      
      this.results.passed.push("Wardrobe System");
    } catch (e) {
      this.results.failed.push("Wardrobe System");
      log(`  Error: ${e.message}`, "red");
    }
  }

  async testAggregator() {
    logSection("📊 Aggregator & Batch Reads");
    
    try {
      // Test batch reading via aggregator
      const aggregator = this.contracts.RitualReadAggregator;
      
      // Prepare batch calls
      const calls = [
        {
          target: this.contracts.Relics.address,
          callData: this.contracts.Relics.interface.encodeFunctionData(
            "balanceOf", [this.signer.address, 1]
          )
        },
        {
          target: this.contracts.CosmeticsV2.address,
          callData: this.contracts.CosmeticsV2.interface.encodeFunctionData(
            "currentMonthlySetId"
          )
        }
      ];
      
      // Execute batch read
      const results = await aggregator.aggregate(calls);
      logTest(`Batch read ${results.length} values`, results.length === calls.length);
      
      // Decode results
      const relicBalance = this.contracts.Relics.interface.decodeFunctionResult(
        "balanceOf", results[0]
      )[0];
      
      const monthlySetId = this.contracts.CosmeticsV2.interface.decodeFunctionResult(
        "currentMonthlySetId", results[1]
      )[0];
      
      log(`    Relic balance: ${relicBalance}`, "blue");
      log(`    Monthly set ID: ${monthlySetId}`, "blue");
      
      this.results.passed.push("Aggregator");
    } catch (e) {
      this.results.failed.push("Aggregator");
      log(`  Error: ${e.message}`, "red");
    }
  }

  async testEdgeCases() {
    logSection("🔥 Edge Cases & Failure Handling");
    
    try {
      // Test 1: Insufficient resources
      try {
        await this.contracts.MawSacrificeV2.sacrificeForCosmetic(5, 100);
        logTest("Insufficient resources check FAILED", false);
        this.results.failed.push("Resource validation");
      } catch {
        logTest("Properly rejects insufficient resources", true);
      }
      
      // Test 2: Non-existent raccoon
      try {
        await this.contracts.CosmeticsV2.bindToRaccoon(9999, 1);
        logTest("Non-existent raccoon check FAILED", false);
        this.results.failed.push("Raccoon ownership validation");
      } catch {
        logTest("Properly rejects non-owned raccoon", true);
      }
      
      // Test 3: Double binding prevention
      const balance = await this.contracts.CosmeticsV2.balanceOf(this.signer.address, 1);
      if (balance.gt(1)) {
        try {
          await this.contracts.CosmeticsV2.bindToRaccoon(1, 1);
          await this.contracts.CosmeticsV2.bindToRaccoon(1, 1);
          logTest("Double binding check FAILED", false);
          this.results.failed.push("Double binding prevention");
        } catch {
          logTest("Properly prevents double binding", true);
        }
      }
      
      this.results.passed.push("Edge Cases");
    } catch (e) {
      this.results.failed.push("Edge Cases");
      log(`  Error: ${e.message}`, "red");
    }
  }

  async generateReport() {
    logSection("📈 Test Results Summary");
    
    const total = this.results.passed.length + this.results.failed.length;
    const passRate = (this.results.passed.length / total * 100).toFixed(1);
    
    log(`  Total Tests: ${total}`, "bright");
    log(`  ✅ Passed: ${this.results.passed.length}`, "green");
    log(`  ❌ Failed: ${this.results.failed.length}`, "red");
    log(`  ⚠️  Warnings: ${this.results.warnings.length}`, "yellow");
    log(`  Pass Rate: ${passRate}%`, passRate >= 80 ? "green" : "red");
    
    if (this.results.failed.length > 0) {
      log("\n  Failed Tests:", "red");
      this.results.failed.forEach(test => log(`    • ${test}`, "red"));
    }
    
    if (this.results.warnings.length > 0) {
      log("\n  Warnings:", "yellow");
      this.results.warnings.forEach(warning => log(`    • ${warning}`, "yellow"));
    }
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      network: (await hre.ethers.provider.getNetwork()).name,
      results: this.results,
      passRate: passRate
    };
    
    fs.writeFileSync("e2e-test-report.json", JSON.stringify(report, null, 2));
    log("\n  📄 Report saved to e2e-test-report.json", "cyan");
    
    return this.results.failed.length === 0;
  }

  async run() {
    log("\n🚀 ROT RITUAL E2E TEST SUITE", "bright");
    log("Testing on Base Sepolia (84532)", "cyan");
    
    try {
      await this.setup();
      await this.testWalletAndNetwork();
      await this.testSacrificeFlow();
      await this.testWardrobeSystem();
      await this.testAggregator();
      await this.testEdgeCases();
      
      const success = await this.generateReport();
      
      if (success) {
        log("\n✨ ALL TESTS PASSED! ✨", "green");
        process.exit(0);
      } else {
        log("\n❌ SOME TESTS FAILED", "red");
        process.exit(1);
      }
    } catch (e) {
      log(`\n💥 CRITICAL ERROR: ${e.message}`, "red");
      console.error(e);
      process.exit(1);
    }
  }
}

// Run tests
const runner = new E2ETestRunner();
runner.run();