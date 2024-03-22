require('dotenv').config();
const { ethers, JsonRpcProvider } = require('ethers');
const abi = require('./escrow-shield.abi.json');

// Infura provider
const provider = new JsonRpcProvider(process.env.RPC_URL);

async function main() {
  // Define the contract
  const contract = new ethers.Contract("0xCB5cb66001572a668e62E561b21f7F88A34bcC2a", abi, provider);

  const senderPubKey = await contract.zkpPublicKeys("0x80D2BAa2b24c44A450e375B834D3a07845250476");
  console.log("senderPubKey: ", senderPubKey);

  const receiverPubKey = await contract.zkpPublicKeys("0x1f94E185799ED7013e2F56E176dCf95C5082EF23");
  console.log("receiverPubKey: ", receiverPubKey);

}

try {
  main();
} catch (error) {
  console.error(error);
}