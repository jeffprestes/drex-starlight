require('dotenv').config();
const { ethers, JsonRpcProvider } = require('ethers');
const abi = require('./escrow-shield.abi.json');
const erc20Abi = require('./ierc20.abi.json');

// Infura provider
const provider = new JsonRpcProvider(process.env.STARLIGHT_RPC_URL);
const senderAddress = "";
const receiverAddress = "";

async function main() {
  // Define the contract
  console.log("process.env.STARLIGHT_RPC_URLs: ", process.env.STARLIGHT_RPC_URL);
  const escrowShieldContract = new ethers.Contract("", abi, provider);

  const senderPubKey = await escrowShieldContract.zkpPublicKeys(senderAddress);
  console.log("senderPubKey: ", senderPubKey);

  const receiverPubKey = await escrowShieldContract.zkpPublicKeys(receiverAddress);
  console.log("receiverPubKey: ", receiverPubKey);

  console.log("============================");
  const erc20Contract = new ethers.Contract("", erc20Abi, provider);
  
  let balance = await erc20Contract.balanceOf(senderAddress);
  console.log("Sender's ERC20 balance: ", balance.toString());

  balance = await erc20Contract.balanceOf(receiverAddress);
  console.log("Receiver's ERC20 balance: ", balance.toString());

}

try {
  main();
} catch (error) {
  console.error(error);
}