const hre = require("hardhat");
const fs = require("fs");
const saveMetadata = require("./metadata").saveMetadata;
require("dotenv").config({ path: __dirname + "/.env" });

async function main() {
  /*
  contractDeployedAddress,
  contractName,
  networkId,
  blockNumber
  */
  saveMetadata(
    "0x39eCB99389433169fe175a4D2F9037D3F12c8699",
    "ERC20",
    "1",
    1
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});