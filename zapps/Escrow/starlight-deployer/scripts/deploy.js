const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config({ path: __dirname + "/.env" });
const { AUTHORITY_ADDRESS, ADMIN_ADDRESS } = process.env;


async function main() {

  console.log("Reading verification keys...");
  const vkInput = [];
  let vk = [];
  const functionNames = ["deposit", "transfer", "withdraw", "joinCommitments"];
  functionNames.forEach((name) => {
    const vkJson = JSON.parse(fs.readFileSync(`../orchestration/common/db/${name}_vk.key`, "utf-8"));
    if (vkJson.scheme) {
      vk = Object.values(vkJson).slice(2).flat(Infinity);
    } else {
      vk = Object.values(vkJson).flat(Infinity);
    }
    vkInput.push(vk);
  });
  console.log("Verification keys read.");

  console.log("Deploying Verifier...");
  // const Verifier = await hre.ethers.getContractFactory("Verifier", { libraries: { Pairing: pairingAddress } });
  const Verifier = await hre.ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("Verifier deployed to:", verifierAddress);

  // const verifierAddress = "0x678a53ce7ad501D0becc55967e06D80A1aBD27d3";

  const erc20Data = {
    name: "Real Digital",
    symbol: "BRL",
    decimals: 2
  };

  console.log("Deploying ERC20 using this data: ", erc20Data, "...");
  const ERC20 = await hre.ethers.getContractFactory("contracts/ERC20.sol:ERC20");
  const erc20 = await ERC20.deploy(
    erc20Data.name,
    erc20Data.symbol,
    erc20Data.decimals
  );
  await erc20.waitForDeployment();
  const erc20Address = await erc20.getAddress();
  console.log("ERC20 deployed to:", erc20Address);
  // const erc20Address = "0x39eCB99389433169fe175a4D2F9037D3F12c8699";


  console.log("Deploying EscrowShield ...");
  const EscrowShield = await hre.ethers.getContractFactory("EscrowShield");
  const escrowShield = await EscrowShield.deploy(erc20Address, verifierAddress, vkInput);
  await escrowShield.waitForDeployment();
  const escrowShieldAddress = await escrowShield.getAddress();
  console.log("EscrowShield deployed to:", escrowShieldAddress);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
