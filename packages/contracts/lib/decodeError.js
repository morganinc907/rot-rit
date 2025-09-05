// lib/decodeError.js
// Central custom error decoder for human-readable reverts

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load all ABIs for error decoding
let abis = null;
function loadAbis() {
  if (!abis) {
    const abiPath = path.join(__dirname, "../packages/abis/index.json");
    if (fs.existsSync(abiPath)) {
      abis = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    } else {
      console.warn("⚠️ ABIs not found. Run 'npm run build:packages' first.");
      abis = {};
    }
  }
  return abis;
}

// Create interfaces for all contracts
function getInterfaces() {
  const abiData = loadAbis();
  const interfaces = {};
  
  for (const [contractName, abi] of Object.entries(abiData)) {
    try {
      interfaces[contractName] = new ethers.Interface(abi);
    } catch (error) {
      console.warn(`⚠️ Could not create interface for ${contractName}`);
    }
  }
  
  return interfaces;
}

// Decode error with human-readable output
function decodeError(error, contractName = null) {
  const interfaces = getInterfaces();
  
  // Extract error data
  const errorData = error.data || error.reason;
  const errorMessage = error.message || error.toString();
  
  if (!errorData || typeof errorData !== 'string') {
    return {
      type: 'generic',
      name: 'Unknown',
      message: errorMessage,
      decoded: null
    };
  }
  
  // Try to decode with specific contract first
  if (contractName && interfaces[contractName]) {
    try {
      const decoded = interfaces[contractName].parseError(errorData);
      return {
        type: 'custom',
        name: decoded.name,
        message: `${decoded.name}(${decoded.args.join(', ')})`,
        decoded: decoded,
        contract: contractName
      };
    } catch (e) {
      // Fall through to try all interfaces
    }
  }
  
  // Try all interfaces
  for (const [name, iface] of Object.entries(interfaces)) {
    try {
      const decoded = iface.parseError(errorData);
      return {
        type: 'custom',
        name: decoded.name,
        message: `${decoded.name}(${decoded.args.join(', ')})`,
        decoded: decoded,
        contract: name
      };
    } catch (e) {
      // Continue trying other interfaces
    }
  }
  
  // Try common errors
  const commonErrors = [
    'InvalidAmount()',
    'InsufficientBalance()',
    'TooFast()',
    'EnforcedPause()',
    'NotAuthorized()',
    'ReentrancyGuardReentrantCall()',
    'OwnableUnauthorizedAccount(address)',
  ];
  
  const commonInterface = new ethers.Interface(
    commonErrors.map(sig => `error ${sig}`)
  );
  
  try {
    const decoded = commonInterface.parseError(errorData);
    return {
      type: 'common',
      name: decoded.name,
      message: `${decoded.name}(${decoded.args.join(', ')})`,
      decoded: decoded
    };
  } catch (e) {
    // Not a recognized error
  }
  
  return {
    type: 'raw',
    name: 'UnknownError',
    message: errorMessage,
    data: errorData,
    decoded: null
  };
}

// Wrap async function calls with error decoding
async function safeCall(fn, contractName = null, description = 'Contract call') {
  try {
    return await fn();
  } catch (error) {
    const decoded = decodeError(error, contractName);
    
    console.error(`❌ ${description} failed:`);
    console.error(`   Error: ${decoded.message}`);
    if (decoded.contract) {
      console.error(`   Contract: ${decoded.contract}`);
    }
    if (decoded.type === 'raw') {
      console.error(`   Raw data: ${decoded.data}`);
    }
    
    // Re-throw with decoded info
    const enhancedError = new Error(`${description}: ${decoded.message}`);
    enhancedError.originalError = error;
    enhancedError.decodedError = decoded;
    throw enhancedError;
  }
}

module.exports = {
  decodeError,
  safeCall
};

// Usage examples:
// const { decodeError, safeCall } = require('./lib/decodeError');
//
// // Decode any error
// const decoded = decodeError(error, 'MawSacrificeV3Upgradeable');
// console.log(decoded.message); // "InvalidAmount()" instead of "0x123abc..."
//
// // Wrap calls for auto-decoding
// await safeCall(() => mawSacrifice.sacrificeKeys(0), 'MawSacrificeV3Upgradeable', 'Sacrifice keys');