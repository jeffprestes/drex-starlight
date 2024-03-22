require('dotenv').config();
const { ethers, JsonRpcProvider } = require('ethers');
const abi = require('./escrow-shield.abi.json');
const erc20Abi = require('./ierc20.abi.json');

// Infura provider
const provider = new JsonRpcProvider(process.env.STARLIGHT_RPC_URL);
const senderAddress = "0x80D2BAa2b24c44A450e375B834D3a07845250476";
const receiverAddress = "0x1f94E185799ED7013e2F56E176dCf95C5082EF23";

async function main() {
  // Define the contract
  console.log("process.env.STARLIGHT_RPC_URLs: ", process.env.STARLIGHT_RPC_URL);
  let contract = new ethers.Contract("0xCB5cb66001572a668e62E561b21f7F88A34bcC2a", abi, provider);

  const senderPubKey = await contract.zkpPublicKeys(senderAddress);
  console.log("senderPubKey: ", senderPubKey);

  const receiverPubKey = await contract.zkpPublicKeys(receiverAddress);
  console.log("receiverPubKey: ", receiverPubKey);

  console.log("============================");
  contract = new ethers.Contract("0x39eCB99389433169fe175a4D2F9037D3F12c8699", erc20Abi, provider);
  
  let balance = await contract.balanceOf(senderAddress);
  console.log("Sender's balance: ", balance.toString());

  balance = await contract.balanceOf(receiverAddress);
  console.log("Receiver's balance: ", balance.toString());

}

try {
  main();
} catch (error) {
  console.error(error);
}