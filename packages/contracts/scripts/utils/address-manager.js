const fs = require('fs');
const path = require('path');

/**
 * Address Management Utilities
 * Auto-updates addresses.json with proper backups and validation
 */

const ADDRESSES_PATH = path.join(__dirname, "../../../addresses/addresses.json");

/**
 * Update a contract address in addresses.json
 * @param {string} networkName - Network name (e.g., 'baseSepolia')
 * @param {string} contractName - Contract name (e.g., 'Cosmetics')
 * @param {string} newAddress - New contract address
 * @param {object} options - Optional settings
 */
function updateAddress(networkName, contractName, newAddress, options = {}) {
  const { 
    backup = true,
    validate = true,
    silent = false 
  } = options;

  try {
    // Validate address format
    if (validate && !isValidAddress(newAddress)) {
      throw new Error(`Invalid address format: ${newAddress}`);
    }

    // Read current addresses
    const currentAddresses = JSON.parse(fs.readFileSync(ADDRESSES_PATH, 'utf8'));

    // Initialize network if it doesn't exist
    if (!currentAddresses[networkName]) {
      currentAddresses[networkName] = {};
    }

    // Backup old address if it exists
    if (backup && currentAddresses[networkName][contractName]) {
      const backupKey = `${contractName}_OLD`;
      currentAddresses[networkName][backupKey] = currentAddresses[networkName][contractName];
      
      if (!silent) {
        console.log(`📦 Backed up old ${contractName}: ${currentAddresses[networkName][contractName]} → ${backupKey}`);
      }
    }

    // Update with new address
    currentAddresses[networkName][contractName] = newAddress;

    // Write updated addresses with pretty formatting
    fs.writeFileSync(ADDRESSES_PATH, JSON.stringify(currentAddresses, null, 2));

    if (!silent) {
      console.log(`✅ Updated ${networkName}.${contractName}: ${newAddress}`);
    }

    return {
      success: true,
      oldAddress: currentAddresses[networkName][`${contractName}_OLD`],
      newAddress: newAddress
    };

  } catch (error) {
    if (!silent) {
      console.error(`❌ Failed to update address: ${error.message}`);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get current address for a contract
 * @param {string} networkName - Network name
 * @param {string} contractName - Contract name
 * @returns {string|null} - Contract address or null if not found
 */
function getAddress(networkName, contractName) {
  try {
    const addresses = JSON.parse(fs.readFileSync(ADDRESSES_PATH, 'utf8'));
    return addresses[networkName]?.[contractName] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get all addresses for a network
 * @param {string} networkName - Network name
 * @returns {object} - All contract addresses for the network
 */
function getNetworkAddresses(networkName) {
  try {
    const addresses = JSON.parse(fs.readFileSync(ADDRESSES_PATH, 'utf8'));
    return addresses[networkName] || {};
  } catch (error) {
    return {};
  }
}

/**
 * Validate Ethereum address format
 * @param {string} address - Address to validate
 * @returns {boolean} - True if valid
 */
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Print deployment summary
 * @param {string} networkName - Network name
 * @param {string} contractName - Contract name
 * @param {string} newAddress - New address
 * @param {string} oldAddress - Previous address (optional)
 */
function printDeploymentSummary(networkName, contractName, newAddress, oldAddress = null) {
  console.log("");
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("====================");
  console.log(`Network: ${networkName}`);
  console.log(`Contract: ${contractName}`);
  if (oldAddress) {
    console.log(`Previous: ${oldAddress}`);
  }
  console.log(`Current: ${newAddress}`);
  console.log(`Updated: ${new Date().toISOString()}`);
  console.log("");
}

module.exports = {
  updateAddress,
  getAddress,
  getNetworkAddresses,
  isValidAddress,
  printDeploymentSummary,
  ADDRESSES_PATH
};