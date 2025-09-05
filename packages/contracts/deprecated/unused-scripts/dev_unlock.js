const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Minimal ABIs
const TIMELOCK_ABI = [
  "function getMinDelay() view returns (uint256)",
  "function schedule(address target,uint256 value,bytes data,bytes32 predecessor,bytes32 salt,uint256 delay)",
  "function scheduleBatch(address[] targets,uint256[] values,bytes[] datas,bytes32 predecessor,bytes32 salt,uint256 delay)",
  "function hashOperation(address target,uint256 value,bytes data,bytes32 predecessor,bytes32 salt) view returns (bytes32)",
  "function hashOperationBatch(address[] targets,uint256[] values,bytes[] datas,bytes32 predecessor,bytes32 salt) view returns (bytes32)",
  "function getTimestamp(bytes32 id) view returns (uint256)",
  "function updateDelay(uint256 newDelay)"
];

const OWNABLE_ABI = [
  "function owner() view returns (address)",
  "function transferOwnership(address newOwner)"
];

const ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

async function main() {
    console.log("🔓 Dev Timelock Removal - Queue/Announce Phase");
    
    const [signer] = await ethers.getSigners();
    console.log("Using signer:", signer.address);
    
    // Parse arguments
    const configPath = process.env.CONFIG_PATH || "config/stack.dev.json";
    const setDelayZero = process.env.SET_DELAY_ZERO === "true";
    const newOwnerEnv = process.env.NEW_OWNER;
    
    console.log("Config path:", configPath);
    console.log("Set delay to zero:", setDelayZero);
    
    // Load config
    const configFullPath = path.resolve(configPath);
    if (!fs.existsSync(configFullPath)) {
        throw new Error(`Config file not found: ${configFullPath}`);
    }
    
    const config = JSON.parse(fs.readFileSync(configFullPath, 'utf8'));
    const newOwner = newOwnerEnv || config.newOwner;
    
    if (!newOwner) {
        throw new Error("NEW_OWNER must be provided via env var or config");
    }
    
    console.log("Timelock:", config.timelock);
    console.log("New owner:", newOwner);
    console.log("Proxies to transfer:", config.proxies.length);
    
    // Connect to timelock
    const timelock = await ethers.getContractAt(TIMELOCK_ABI, config.timelock);
    const minDelay = await timelock.getMinDelay();
    console.log("Current timelock delay:", minDelay.toString(), "seconds");
    
    // Prepare operations
    const targets = [];
    const values = [];
    const datas = [];
    
    // Process each proxy
    for (const proxy of config.proxies) {
        console.log(`\\n📋 Processing ${proxy.name} at ${proxy.address}`);
        
        const pattern = proxy.pattern || "UUPS";
        
        if (pattern === "UUPS") {
            // For UUPS proxy, call transferOwnership on the proxied contract
            console.log("Pattern: UUPS - calling transferOwnership through proxy");
            
            const ownableInterface = new ethers.Interface(OWNABLE_ABI);
            const transferData = ownableInterface.encodeFunctionData("transferOwnership", [newOwner]);
            
            targets.push(proxy.address);
            values.push(0);
            datas.push(transferData);
            
            // Verify current owner
            try {
                const ownableContract = await ethers.getContractAt(OWNABLE_ABI, proxy.address);
                const currentOwner = await ownableContract.owner();
                console.log("Current owner:", currentOwner);
                console.log("Will transfer to:", newOwner);
            } catch (error) {
                console.log("Could not verify current owner:", error.message);
            }
        } else {
            throw new Error(`Pattern ${pattern} not implemented yet`);
        }
    }
    
    // Optionally add updateDelay(0) operation
    if (setDelayZero) {
        console.log("\\n⏰ Adding updateDelay(0) operation");
        const timelockInterface = new ethers.Interface(TIMELOCK_ABI);
        const updateDelayData = timelockInterface.encodeFunctionData("updateDelay", [0]);
        
        targets.push(config.timelock);
        values.push(0);
        datas.push(updateDelayData);
    }
    
    // Generate salt and predecessor
    const salt = ethers.keccak256(ethers.toUtf8Bytes(`dev-unlock-${Date.now()}`));
    const predecessor = ethers.ZeroHash;
    
    console.log("\\n🎯 Operation Details:");
    console.log("Salt:", salt);
    console.log("Predecessor:", predecessor);
    console.log("Targets:", targets.length);
    console.log("Delay:", minDelay.toString());
    
    // Calculate operation hash
    const operationHash = await timelock.hashOperationBatch(targets, values, datas, predecessor, salt);
    console.log("Operation Hash:", operationHash);
    
    // Schedule the batch
    console.log("\\n📤 Scheduling batch operation...");
    try {
        const tx = await timelock.scheduleBatch(targets, values, datas, predecessor, salt, minDelay);
        const receipt = await tx.wait();
        console.log("✅ Scheduled! Transaction:", receipt.hash);
        
        // Get execution timestamp
        const executionTimestamp = await timelock.getTimestamp(operationHash);
        const executionDate = new Date(Number(executionTimestamp) * 1000);
        
        console.log("\\n⏰ Execution Details:");
        console.log("Ready at timestamp:", executionTimestamp.toString());
        console.log("Ready at date:", executionDate.toISOString());
        console.log("Ready in:", Math.max(0, Number(executionTimestamp) - Math.floor(Date.now() / 1000)), "seconds");
        
        console.log("\\n🚀 To execute when ready, run:");
        console.log(`SALT=${salt} npx hardhat run scripts/execute_unlock.js --network baseSepolia`);
        
        // Save execution info
        const executionInfo = {
            salt,
            operationHash,
            executionTimestamp: executionTimestamp.toString(),
            targets,
            values: values.map(v => v.toString()),
            datas,
            predecessor
        };
        
        fs.writeFileSync("execution-info.json", JSON.stringify(executionInfo, null, 2));
        console.log("💾 Execution info saved to execution-info.json");
        
    } catch (error) {
        console.error("❌ Failed to schedule:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });