const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config({ path: __dirname + "/.env" });
const { BANKA_ADDRESS, ADMIN_ADDRESS } = process.env;

async function main() {
  let tx;
  let txReceipt;
  let erc20;

  const { admin, bankA } = await hre.ethers.getSigners();

  erc20 = await hre.ethers.getContractAt("contracts/ERC20.sol:ERC20", "0xDf3b07e7c9a36452046319d9dC0Fca1Ea8521Fd0", admin); 
  console.log("ERC20 for admin is at:", await erc20.getAddress());

  await mint(erc20, ADMIN_ADDRESS, 100000000);
  await mint(erc20, BANKA_ADDRESS, 100000000);

  console.log("Approving from Admin Real Digital tokens to Escrow contract ...");
  tx = await erc20.approve("0x796Fb4FC6311b10a171E4eAb560c3B9B041545B5", 100000000);
  txReceipt = await tx.wait();
  if (txReceipt.status !== 1) {
    throw new Error(`Approving to 0x29c8cD99e341eC5E53AE06b8461aAD08df7a9942 failed`);
  }
  console.log(`Approving Admin to Escrow contract has been successful`);

  erc20 = await hre.ethers.getContractAt("contracts/ERC20.sol:ERC20", "0xDf3b07e7c9a36452046319d9dC0Fca1Ea8521Fd0", bankA); 
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
