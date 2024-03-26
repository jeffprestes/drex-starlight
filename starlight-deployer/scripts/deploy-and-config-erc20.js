const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config({ path: __dirname + "/.env" });
const { BANKA_ADDRESS, ADMIN_ADDRESS } = process.env;

async function main() {

  let tx;
  let txReceipt;
  let erc20;

  const { admin, bankA } = await hre.ethers.getSigners();

  const erc20Data = {
    name: "Real Digital",
    symbol: "BRL",
    decimals: 2
  };

  console.log("Deploying ERC20 using this data: ", erc20Data, "...");
  const ERC20 = await hre.ethers.getContractFactory("contracts/ERC20.sol:ERC20");
  erc20 = await ERC20.deploy(
    erc20Data.name,
    erc20Data.symbol,
    erc20Data.decimals
  );
  await erc20.waitForDeployment();
  const erc20Address = await erc20.getAddress();
  console.log("ERC20 deployed to:", erc20Address);

  await mint(erc20, ADMIN_ADDRESS, 100000000);
  await mint(erc20, BANKA_ADDRESS, 100000000);

  console.log("Approving Real Digital tokens to Escrow contract ...");
  tx = await erc20.approve("0x796Fb4FC6311b10a171E4eAb560c3B9B041545B5", 100000000);
  txReceipt = await tx.wait();
  if (txReceipt.status !== 1) {
    throw new Error(`Approving to 0x796Fb4FC6311b10a171E4eAb560c3B9B041545B5 failed`);
  }
  console.log(`Approving to Escrow contract has been successful`);

  erc20 = await hre.ethers.getContractAt("contracts/ERC20.sol:ERC20", erc20Address, bankA); 
  console.log("ERC20 for bankA is at:", await erc20.getAddress());
  console.log("Approving from BankA Real Digital tokens to Escrow contract ...");
  tx = await erc20.approve("0x796Fb4FC6311b10a171E4eAb560c3B9B041545B5", 100000000);
  txReceipt = await tx.wait();
  if (txReceipt.status !== 1) {
    throw new Error(`Approving to 0x796Fb4FC6311b10a171E4eAb560c3B9B041545B5 failed`);
  }
  console.log(`Approving to Escrow contract has been successful`);
}

async function mint(erc20, to, amount) {
  console.log(`Minting Real Digital tokens to ${to} ...`);
  tx = await erc20.mint(to, amount);
  txReceipt = await tx.wait();
  if (txReceipt.status !== 1) {
    throw new Error(`Minting to ${to} failed`);
  }
  console.log(`Minting to ${to} has been successful`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
