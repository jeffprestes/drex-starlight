require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({path:__dirname+'/.env'});
const { BESU_RPC_URL, LOCAL_RPC_URL, SEPOLIA_RPC_URL, BC_DEFAULT_PRIVATE_KEY, BANKA_PRIVATE_KEY, BANKB_PRIVATE_KEY, BANKC_PRIVATE_KEY, BANKD_PRIVATE_KEY } = process.env;


module.exports = {
  defaultNetwork: "besu",
  networks: {
    hardhat: {
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [BC_DEFAULT_PRIVATE_KEY, BANKA_PRIVATE_KEY, BANKB_PRIVATE_KEY, BANKC_PRIVATE_KEY, BANKD_PRIVATE_KEY],
      timeout: 20000000
    },
    localhost: {
      url: LOCAL_RPC_URL,
      accounts: [BC_DEFAULT_PRIVATE_KEY, BANKA_PRIVATE_KEY, BANKB_PRIVATE_KEY, BANKC_PRIVATE_KEY, BANKD_PRIVATE_KEY],
      timeout: 20000000
    },
    besu: {
      url: BESU_RPC_URL,
      accounts: [BC_DEFAULT_PRIVATE_KEY, BANKA_PRIVATE_KEY, BANKB_PRIVATE_KEY, BANKC_PRIVATE_KEY, BANKD_PRIVATE_KEY],
      chainId: 25581337,
      timeout: 20000000
    }
  },
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    cache: "./cache",
  },
  etherscan: {
    enabled: false,
  },
  sourcify: {
    enabled: true,
    customChains: [ {
      network: "besu",
      chainId: 25581337,
    }]
  },
  mocha: {
    timeout: 40000
  }
}