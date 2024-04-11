/* eslint-disable prettier/prettier, camelcase, prefer-const, no-unused-vars */
import config from "config";
import utils from "zkp-utils";
import GN from "general-number";
import fs from "fs";

import {
	getContractInstance,
	getContractAddress,
	registerKey,
} from "./common/contract.mjs";
import {
	storeCommitment,
	getCurrentWholeCommitment,
	getCommitmentsById,
	getAllCommitments,
	getInputCommitments,
	joinCommitments,
	markNullified,
	getnullifierMembershipWitness,
	getupdatedNullifierPaths,
	temporaryUpdateNullifier,
	updateNullifierTree,
} from "./common/commitment-storage.mjs";
import { generateProof } from "./common/zokrates.mjs";
import { getMembershipWitness, getRoot } from "./common/timber.mjs";
import Web3 from "./common/web3.mjs";
import {
	decompressStarlightKey,
	poseidonHash,
} from "./common/number-theory.mjs";

const { generalise } = GN;
const db = "/app/orchestration/common/db/preimage.json";
const web3 = Web3.connection();
const keyDb = "/app/orchestration/common/db/key.json";

export default async function deposit_tokens(
	_erc1155Address,
	_amount,
	_tokenId,
	_tokenOwners_tokenId_msg_newOwnerPublicKey = 0
) {
	// Initialisation of variables:

	const instance = await getContractInstance("SwapShield");

	const contractAddr = await getContractAddress("SwapShield");

	const msgValue = 0;
	const erc1155Address = generalise(_erc1155Address);
	const amount = generalise(_amount);
	const tokenId = generalise(_tokenId);
	let tokenOwners_tokenId_msg_newOwnerPublicKey = generalise(
		_tokenOwners_tokenId_msg_newOwnerPublicKey
	);

	// Read dbs for keys and previous commitment values:

	if (!fs.existsSync(keyDb))
		await registerKey(utils.randomHex(31), "SwapShield", false);
	const keys = JSON.parse(
		fs.readFileSync(keyDb, "utf-8", (err) => {
			console.log(err);
		})
	);
	const secretKey = generalise(keys.secretKey);
	const publicKey = generalise(keys.publicKey);

	// read preimage for incremented state
	tokenOwners_tokenId_msg_newOwnerPublicKey =
		_tokenOwners_tokenId_msg_newOwnerPublicKey === 0
			? publicKey
			: tokenOwners_tokenId_msg_newOwnerPublicKey;

	let tokenOwners_tokenId_msg_stateVarId = 13;

	const tokenOwners_tokenId_msg_stateVarId_key = tokenId;

	const tokenOwners_tokenId_msg_stateVarId_valueKey = generalise(
		config.web3.options.defaultAccount
	); // emulates msg.sender

	tokenOwners_tokenId_msg_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(tokenOwners_tokenId_msg_stateVarId).bigInt,
				tokenOwners_tokenId_msg_stateVarId_key.bigInt,
				tokenOwners_tokenId_msg_stateVarId_valueKey.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	const tokenOwners_tokenId_msg_newCommitmentValue = generalise(
		parseInt(amount.integer, 10)
	);

	// non-secret line would go here but has been filtered out

	// non-secret line would go here but has been filtered out

	// increment would go here but has been filtered out

	// Calculate commitment(s):

	const tokenOwners_tokenId_msg_newSalt = generalise(utils.randomHex(31));

	let tokenOwners_tokenId_msg_newCommitment = poseidonHash([
		BigInt(tokenOwners_tokenId_msg_stateVarId),
		BigInt(tokenOwners_tokenId_msg_newCommitmentValue.hex(32)),
		BigInt(tokenOwners_tokenId_msg_newOwnerPublicKey.hex(32)),
		BigInt(tokenOwners_tokenId_msg_newSalt.hex(32)),
	]);

	tokenOwners_tokenId_msg_newCommitment = generalise(
		tokenOwners_tokenId_msg_newCommitment.hex(32)
	); // truncate

	// Call Zokrates to generate the proof:

	const allInputs = [
		amount.integer,
		tokenId.integer,
		tokenOwners_tokenId_msg_stateVarId_valueKey.integer,
		tokenOwners_tokenId_msg_newOwnerPublicKey.integer,
		tokenOwners_tokenId_msg_newSalt.integer,
		tokenOwners_tokenId_msg_newCommitment.integer,
	].flat(Infinity);
	const res = await generateProof("deposit_tokens", allInputs);
	const proof = generalise(Object.values(res.proof).flat(Infinity))
		.map((coeff) => coeff.integer)
		.flat(Infinity);

	// Send transaction to the blockchain:

	const txData = await instance.methods
		.deposit_tokens(
			erc1155Address.integer,
			amount.integer,
			tokenId.integer,
			[tokenOwners_tokenId_msg_newCommitment.integer],
			proof
		)
		.encodeABI();

	let txParams = {
		from: config.web3.options.defaultAccount,
		to: contractAddr,
		gas: config.web3.options.defaultGas,
		gasPrice: config.web3.options.defaultGasPrice,
		data: txData,
		chainId: await web3.eth.net.getId(),
	};

	const key = config.web3.key;

	const signed = await web3.eth.accounts.signTransaction(txParams, key);

	const sendTxn = await web3.eth.sendSignedTransaction(signed.rawTransaction);

	let tx = await instance.getPastEvents("NewLeaves");

	tx = tx[0];

	if (!tx) {
		throw new Error(
			"Tx failed - the commitment was not accepted on-chain, or the contract is not deployed."
		);
	}

	let encEvent = "";

	try {
		encEvent = await instance.getPastEvents("EncryptedData");
	} catch (err) {
		console.log("No encrypted event");
	}

	// Write new commitment preimage to db:

	await storeCommitment({
		hash: tokenOwners_tokenId_msg_newCommitment,
		name: "tokenOwners",
		mappingKey: tokenOwners_tokenId_msg_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(tokenOwners_tokenId_msg_stateVarId),
			value: tokenOwners_tokenId_msg_newCommitmentValue,
			salt: tokenOwners_tokenId_msg_newSalt,
			publicKey: tokenOwners_tokenId_msg_newOwnerPublicKey,
		},
		secretKey:
			tokenOwners_tokenId_msg_newOwnerPublicKey.integer === publicKey.integer
				? secretKey
				: null,
		isNullified: false,
	});

	return { tx, encEvent };
}
