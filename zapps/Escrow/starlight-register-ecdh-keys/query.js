require('dotenv').config();
const { ethers, JsonRpcProvider } = require('ethers');
const abi = require('./escrow-shield.abi.json');
const erc20Abi = require('./ierc20.abi.json');

// Infura provider
const provider = new JsonRpcProvider(process.env.STARLIGHT_RPC_URL);
const senderAddress = "0x80D2BAa2b24c44A450e375B834D3a07845250476";
const receiverAddress = "0x4401A7086c08d80d16eA66E5742b0785bE114c81";
const escrowShieldContractAddress = process.env.STARLIGHT_ESCROWSHIELD_ADDRESS
const erc20ContractAddress = process.env.STARLIGHT_ERC20_ADDRESS;

async function main() {
  // Define the contract
  console.log("process.env.STARLIGHT_RPC_URLs: ", process.env.STARLIGHT_RPC_URL);
  const escrowShieldContract = new ethers.Contract(escrowShieldContractAddress, abi, provider);

  const senderPubKey = await escrowShieldContract.zkpPublicKeys(senderAddress);
  console.log("senderPubKey: ", senderPubKey);

  const receiverPubKey = await escrowShieldContract.zkpPublicKeys(receiverAddress);
  console.log("receiverPubKey: ", receiverPubKey);

  console.log("============================");
  const erc20Contract = new ethers.Contract(erc20ContractAddress, erc20Abi, provider);
  
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