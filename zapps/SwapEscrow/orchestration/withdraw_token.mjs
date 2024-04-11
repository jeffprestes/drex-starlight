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

export default async function withdraw(
	_erc1155Address,
	_tokenId,
	_amount,
	_tokenOwners_tokenId_msg_newOwnerPublicKey = 0,
	_tokenOwners_tokenId_msg_0_oldCommitment = 0,
	_tokenOwners_tokenId_msg_1_oldCommitment = 0
) {
	// Initialisation of variables:

	const instance = await getContractInstance("SwapShield");

	const contractAddr = await getContractAddress("SwapShield");

	const msgValue = 0;
	const erc1155Address = generalise(_erc1155Address);
	const tokenId = generalise(_tokenId);
	const amount = generalise(_amount);
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

	// read preimage for decremented state

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

	let tokenOwners_tokenId_msg_preimage = await getCommitmentsById(
		tokenOwners_tokenId_msg_stateVarId
	);

	const tokenOwners_tokenId_msg_newCommitmentValue = generalise(
		parseInt(amount.integer, 10)
	);
	// First check if required commitments exist or not

	let [
		tokenOwners_tokenId_msg_commitmentFlag,
		tokenOwners_tokenId_msg_0_oldCommitment,
		tokenOwners_tokenId_msg_1_oldCommitment,
	] = getInputCommitments(
		publicKey.hex(32),
		tokenOwners_tokenId_msg_newCommitmentValue.integer,
		tokenOwners_tokenId_msg_preimage
	);

	let tokenOwners_tokenId_msg_witness_0;

	let tokenOwners_tokenId_msg_witness_1;

	while (tokenOwners_tokenId_msg_commitmentFlag === false) {
		tokenOwners_tokenId_msg_witness_0 = await getMembershipWitness(
			"SwapShield",
			generalise(tokenOwners_tokenId_msg_0_oldCommitment._id).integer
		);

		tokenOwners_tokenId_msg_witness_1 = await getMembershipWitness(
			"SwapShield",
			generalise(tokenOwners_tokenId_msg_1_oldCommitment._id).integer
		);

		const tx = await joinCommitments(
			"SwapShield",
			"tokenOwners",
			secretKey,
			publicKey,
			[13, tokenOwners_tokenId_msg_stateVarId_key],
			[
				tokenOwners_tokenId_msg_0_oldCommitment,
				tokenOwners_tokenId_msg_1_oldCommitment,
			],
			[tokenOwners_tokenId_msg_witness_0, tokenOwners_tokenId_msg_witness_1],
			instance,
			contractAddr,
			web3
		);

		tokenOwners_tokenId_msg_preimage = await getCommitmentsById(
			tokenOwners_tokenId_msg_stateVarId
		);

		[
			tokenOwners_tokenId_msg_commitmentFlag,
			tokenOwners_tokenId_msg_0_oldCommitment,
			tokenOwners_tokenId_msg_1_oldCommitment,
		] = getInputCommitments(
			publicKey.hex(32),
			tokenOwners_tokenId_msg_newCommitmentValue.integer,
			tokenOwners_tokenId_msg_preimage
		);
	}
	const tokenOwners_tokenId_msg_0_prevSalt = generalise(
		tokenOwners_tokenId_msg_0_oldCommitment.preimage.salt
	);
	const tokenOwners_tokenId_msg_1_prevSalt = generalise(
		tokenOwners_tokenId_msg_1_oldCommitment.preimage.salt
	);
	const tokenOwners_tokenId_msg_0_prev = generalise(
		tokenOwners_tokenId_msg_0_oldCommitment.preimage.value
	);
	const tokenOwners_tokenId_msg_1_prev = generalise(
		tokenOwners_tokenId_msg_1_oldCommitment.preimage.value
	);

	// Extract set membership witness:

	// generate witness for partitioned state
	tokenOwners_tokenId_msg_witness_0 = await getMembershipWitness(
		"SwapShield",
		generalise(tokenOwners_tokenId_msg_0_oldCommitment._id).integer
	);
	tokenOwners_tokenId_msg_witness_1 = await getMembershipWitness(
		"SwapShield",
		generalise(tokenOwners_tokenId_msg_1_oldCommitment._id).integer
	);
	const tokenOwners_tokenId_msg_0_index = generalise(
		tokenOwners_tokenId_msg_witness_0.index
	);
	const tokenOwners_tokenId_msg_1_index = generalise(
		tokenOwners_tokenId_msg_witness_1.index
	);
	const tokenOwners_tokenId_msg_root = generalise(
		tokenOwners_tokenId_msg_witness_0.root
	);
	const tokenOwners_tokenId_msg_0_path = generalise(
		tokenOwners_tokenId_msg_witness_0.path
	).all;
	const tokenOwners_tokenId_msg_1_path = generalise(
		tokenOwners_tokenId_msg_witness_1.path
	).all;

	// non-secret line would go here but has been filtered out

	// non-secret line would go here but has been filtered out

	// increment would go here but has been filtered out

	// Calculate nullifier(s):

	let tokenOwners_tokenId_msg_0_nullifier = poseidonHash([
		BigInt(tokenOwners_tokenId_msg_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(tokenOwners_tokenId_msg_0_prevSalt.hex(32)),
	]);
	let tokenOwners_tokenId_msg_1_nullifier = poseidonHash([
		BigInt(tokenOwners_tokenId_msg_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(tokenOwners_tokenId_msg_1_prevSalt.hex(32)),
	]);
	tokenOwners_tokenId_msg_0_nullifier = generalise(
		tokenOwners_tokenId_msg_0_nullifier.hex(32)
	); // truncate
	tokenOwners_tokenId_msg_1_nullifier = generalise(
		tokenOwners_tokenId_msg_1_nullifier.hex(32)
	); // truncate
	
	// Calculate commitment(s):

	const tokenOwners_tokenId_msg_2_newSalt = generalise(utils.randomHex(31));

	let tokenOwners_tokenId_msg_change =
		parseInt(tokenOwners_tokenId_msg_0_prev.integer, 10) +
		parseInt(tokenOwners_tokenId_msg_1_prev.integer, 10) -
		parseInt(tokenOwners_tokenId_msg_newCommitmentValue.integer, 10);

	tokenOwners_tokenId_msg_change = generalise(tokenOwners_tokenId_msg_change);

	let tokenOwners_tokenId_msg_2_newCommitment = poseidonHash([
		BigInt(tokenOwners_tokenId_msg_stateVarId),
		BigInt(tokenOwners_tokenId_msg_change.hex(32)),
		BigInt(publicKey.hex(32)),
		BigInt(tokenOwners_tokenId_msg_2_newSalt.hex(32)),
	]);

	tokenOwners_tokenId_msg_2_newCommitment = generalise(
		tokenOwners_tokenId_msg_2_newCommitment.hex(32)
	); // truncate

	// Call Zokrates to generate the proof:

	const allInputs = [
		tokenId.integer,
		amount.integer,
		tokenOwners_tokenId_msg_stateVarId_valueKey.integer,
		secretKey.integer,
		secretKey.integer,
		tokenOwners_tokenId_msg_0_nullifier.integer,
		tokenOwners_tokenId_msg_1_nullifier.integer,
		tokenOwners_tokenId_msg_0_prev.integer,
		tokenOwners_tokenId_msg_0_prevSalt.integer,
		tokenOwners_tokenId_msg_1_prev.integer,
		tokenOwners_tokenId_msg_1_prevSalt.integer,
		tokenOwners_tokenId_msg_root.integer,
		tokenOwners_tokenId_msg_0_index.integer,
		tokenOwners_tokenId_msg_0_path.integer,
		tokenOwners_tokenId_msg_1_index.integer,
		tokenOwners_tokenId_msg_1_path.integer,
		tokenOwners_tokenId_msg_newOwnerPublicKey.integer,
		tokenOwners_tokenId_msg_2_newSalt.integer,
		tokenOwners_tokenId_msg_2_newCommitment.integer,
	].flat(Infinity);
	const res = await generateProof("withdraw_token", allInputs);
	const proof = generalise(Object.values(res.proof).flat(Infinity))
		.map((coeff) => coeff.integer)
		.flat(Infinity);

	// Send transaction to the blockchain:

	const txData = await instance.methods
		.withdraw_token(
			erc1155Address.integer,
			tokenId.integer,
			amount.integer,
			[
				tokenOwners_tokenId_msg_0_nullifier.integer,
				tokenOwners_tokenId_msg_1_nullifier.integer,
			],
			tokenOwners_tokenId_msg_root.integer,
			[tokenOwners_tokenId_msg_2_newCommitment.integer],
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

	await markNullified(
		generalise(tokenOwners_tokenId_msg_0_oldCommitment._id),
		secretKey.hex(32)
	);

	await markNullified(
		generalise(tokenOwners_tokenId_msg_1_oldCommitment._id),
		secretKey.hex(32)
	);

	await storeCommitment({
		hash: tokenOwners_tokenId_msg_2_newCommitment,
		name: "tokenOwners",
		mappingKey: tokenOwners_tokenId_msg_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(tokenOwners_tokenId_msg_stateVarId),
			value: tokenOwners_tokenId_msg_change,
			salt: tokenOwners_tokenId_msg_2_newSalt,
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
