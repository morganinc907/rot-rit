require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

const { RPC_URL, PRIVATE_KEY } = process.env;

module.exports = {
  gasReporter: {
    enabled: (process.env.REPORT_GAS || "false").toLowerCase() === "true",
    currency: "USD",
    excludeContracts: [],
  },
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    hardhat: {},
    localhost: { url: "http://127.0.0.1:8545" },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 84532
    },
    custom: RPC_URL ? { url: RPC_URL, accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [] } : undefined,
  },
  etherscan: { apiKey: process.env.ETHERSCAN_API_KEY || "" }
};
