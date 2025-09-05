const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Minimal ABIs
const TIMELOCK_ABI = [
  "function executeBatch(address[] targets,uint256[] values,bytes[] datas,bytes32 predecessor,bytes32 salt)",
  "function getTimestamp(bytes32 id) view returns (uint256)",
  "function isOperation(bytes32 id) view returns (bool)",
  "function isOperationPending(bytes32 id) view returns (bool)",
  "function isOperationReady(bytes32 id) view returns (bool)",
  "function isOperationDone(bytes32 id) view returns (bool)"
];

async function main() {
    console.log("🚀 Dev Timelock Removal - Execute Phase");
    
    const [signer] = await ethers.getSigners();
    console.log("Using signer:", signer.address);
    
    // Parse arguments
    const configPath = process.env.CONFIG_PATH || "config/stack.dev.json";
    const saltEnv = process.env.SALT;
    
    // Load execution info
    const executionInfoPath = "execution-info.json";
    let executionInfo;
    
    if (fs.existsSync(executionInfoPath)) {
        executionInfo = JSON.parse(fs.readFileSync(executionInfoPath, 'utf8'));
        console.log("📄 Loaded execution info from file");
    } else {
        throw new Error("execution-info.json not found. Run dev_unlock.js first.");
    }
    
    const salt = saltEnv || executionInfo.salt;
    if (!salt) {
        throw new Error("SALT must be provided via env var or execution-info.json");
    }
    
    console.log("Salt:", salt);
    console.log("Operation Hash:", executionInfo.operationHash);
    
    // Load config
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Connect to timelock
    const timelock = await ethers.getContractAt(TIMELOCK_ABI, config.timelock);
    
    // Check operation status
    console.log("\\n🔍 Checking operation status...");
    const operationHash = executionInfo.operationHash;
    
    const isOperation = await timelock.isOperation(operationHash);
    const isPending = await timelock.isOperationPending(operationHash);
    const isReady = await timelock.isOperationReady(operationHash);
    const isDone = await timelock.isOperationDone(operationHash);
    
    console.log("Is operation:", isOperation);
    console.log("Is pending:", isPending);
    console.log("Is ready:", isReady);
    console.log("Is done:", isDone);
    
    if (isDone) {
        console.log("✅ Operation already executed!");
        return;
    }
    
    if (!isReady) {
        const timestamp = await timelock.getTimestamp(operationHash);
        const readyDate = new Date(Number(timestamp) * 1000);
        const secondsLeft = Number(timestamp) - Math.floor(Date.now() / 1000);
        
        console.log("⏰ Operation not ready yet");
        console.log("Ready at:", readyDate.toISOString());
        console.log("Seconds remaining:", Math.max(0, secondsLeft));
        
        if (secondsLeft > 0) {
            throw new Error("Operation not ready for execution yet");
        }
    }
    
    // Execute the operation
    console.log("\\n⚡ Executing operation...");
    console.log("Targets:", executionInfo.targets.length);
    console.log("Values:", executionInfo.values);
    
    try {
        const tx = await timelock.executeBatch(
            executionInfo.targets,
            executionInfo.values,
            executionInfo.datas,
            executionInfo.predecessor,
            salt
        );
        
        const receipt = await tx.wait();
        console.log("✅ Executed! Transaction:", receipt.hash);
        
        // Verify the changes
        console.log("\\n🔍 Verifying ownership changes...");
        
        for (let i = 0; i < config.proxies.length; i++) {
            const proxy = config.proxies[i];
            try {
                const ownableContract = await ethers.getContractAt([
                    "function owner() view returns (address)"
                ], proxy.address);
                
                const newOwner = await ownableContract.owner();
                console.log(`${proxy.name} owner:`, newOwner);
                
                if (newOwner.toLowerCase() === config.newOwner.toLowerCase()) {
                    console.log("✅ Ownership transferred successfully!");
                } else {
                    console.log("⚠️ Ownership may not have transferred correctly");
                }
            } catch (error) {
                console.log(`Could not verify ${proxy.name} ownership:`, error.message);
            }
        }
        
        console.log("\\n🎉 Timelock removal complete!");
        console.log("Future upgrades can now be executed immediately by the new owner.");
        
        // Clean up
        if (fs.existsSync(executionInfoPath)) {
            fs.unlinkSync(executionInfoPath);
            console.log("🗑️ Cleaned up execution-info.json");
        }
        
    } catch (error) {
        console.error("❌ Execution failed:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });