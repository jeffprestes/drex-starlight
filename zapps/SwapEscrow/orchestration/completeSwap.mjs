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

export default async function completeSwap(
	_counterParty,
	_sharedAddress,
	_amountSent,
	_amountRecieved,
	_tokenIdSent,
	_tokenSentAmount,
	_tokenIdRecieved,
	_tokenRecievedAmount,
	_balances_msgSender_newOwnerPublicKey = 0,
	_balances_counterParty_newOwnerPublicKey = 0,
	_tokenOwners_tokenIdRecieved_msg_newOwnerPublicKey = 0,
	_tokenOwners_tokenIdSent_msg_newOwnerPublicKey = 0,
	_tokenOwners_tokenIdSent_counterParty_newOwnerPublicKey = 0,
	_pendingStatus_newOwnerPublicKey = 0,
	_swapProposals_sharedAddress_newOwnerPublicKey = 0,
	_balances_msgSender_0_oldCommitment = 0,
	_balances_msgSender_1_oldCommitment = 0,
	_tokenOwners_tokenIdSent_msg_0_oldCommitment = 0,
	_tokenOwners_tokenIdSent_msg_1_oldCommitment = 0,
	_swapProposals_sharedAddress_0_oldCommitment = 0,
	_swapProposals_sharedAddress_1_oldCommitment = 0
) {
	// Initialisation of variables:

	const instance = await getContractInstance("SwapShield");

	const contractAddr = await getContractAddress("SwapShield");

	const msgValue = 0;
	const counterParty = generalise(_counterParty);
	const sharedAddress = generalise(_sharedAddress);
	const amountSent = generalise(_amountSent);
	const amountRecieved = generalise(_amountRecieved);
	const tokenIdSent = generalise(_tokenIdSent);
	const tokenSentAmount = generalise(_tokenSentAmount);
	const tokenIdRecieved = generalise(_tokenIdRecieved);
	const tokenRecievedAmount = generalise(_tokenRecievedAmount);
	let balances_msgSender_newOwnerPublicKey = generalise(
		_balances_msgSender_newOwnerPublicKey
	);
	let balances_counterParty_newOwnerPublicKey = generalise(
		_balances_counterParty_newOwnerPublicKey
	);
	let tokenOwners_tokenIdRecieved_msg_newOwnerPublicKey = generalise(
		_tokenOwners_tokenIdRecieved_msg_newOwnerPublicKey
	);
	let tokenOwners_tokenIdSent_msg_newOwnerPublicKey = generalise(
		_tokenOwners_tokenIdSent_msg_newOwnerPublicKey
	);

	let tokenOwners_tokenIdSent_counterParty_newOwnerPublicKey = generalise(
		_tokenOwners_tokenIdSent_counterParty_newOwnerPublicKey
	);
	let pendingStatus_newOwnerPublicKey = generalise(
		_pendingStatus_newOwnerPublicKey
	);
	let swapProposals_sharedAddress_newOwnerPublicKey = generalise(
		_swapProposals_sharedAddress_newOwnerPublicKey
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

	const sharedSecretKey = generalise(keys.sharedSecretKey);
	const sharedPublicKey = generalise(keys.sharedPublicKey);

	// Initialise commitment preimage of whole state:

	const pendingStatus_stateVarId = generalise(34).hex(32);

	let pendingStatus_commitmentExists = true;
	let pendingStatus_witnessRequired = true;

	const pendingStatus_commitment = await getCurrentWholeCommitment(
		pendingStatus_stateVarId
	);

	let pendingStatus_preimage = {
		value: 0,
		salt: 0,
		commitment: 0,
	};
	if (!pendingStatus_commitment) {
		pendingStatus_commitmentExists = false;
		pendingStatus_witnessRequired = false;
	} else {
		pendingStatus_preimage = pendingStatus_commitment.preimage;
	}

	// Initialise commitment preimage of whole state:

	let swapProposals_sharedAddress_stateVarId = 39;

	const swapProposals_sharedAddress_stateVarId_key = sharedAddress;

	const swapProposals_sharedAddress_stateVarId_valueKey = sharedAddress;

	swapProposals_sharedAddress_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(swapProposals_sharedAddress_stateVarId).bigInt,
				swapProposals_sharedAddress_stateVarId_key.bigInt,
				swapProposals_sharedAddress_stateVarId_valueKey.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	let swapProposals_sharedAddress_commitmentExists = true;
	let swapProposals_sharedAddress_witnessRequired = true;

	const swapProposals_sharedAddress_commitment = await getCurrentWholeCommitment(
		swapProposals_sharedAddress_stateVarId
	);

	let swapProposals_sharedAddress_preimage = {
		value: {
			swapAmountRecieved: 0,
			swapAmountSent: 0,
			swapTokenRecievedId: 0,
			swapTokenRecievedAmount: 0,
			swapTokenSentId: 0,
			swapTokenSentAmount: 0,
		},
		salt: 0,
		commitment: 0,
	};
	if (!swapProposals_sharedAddress_commitment) {
		swapProposals_sharedAddress_commitmentExists = false;
		swapProposals_sharedAddress_witnessRequired = false;
	} else {
		swapProposals_sharedAddress_preimage =
			swapProposals_sharedAddress_commitment.preimage;
	}

	// read preimage for decremented state

	balances_msgSender_newOwnerPublicKey =
		_balances_msgSender_newOwnerPublicKey === 0
			? publicKey
			: balances_msgSender_newOwnerPublicKey;

	let balances_msgSender_stateVarId = 7;

	const balances_msgSender_stateVarId_key = generalise(
		config.web3.options.defaultAccount
	); // emulates msg.sender


	balances_msgSender_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(balances_msgSender_stateVarId).bigInt,
				balances_msgSender_stateVarId_key.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	let balances_msgSender_preimage = await getCommitmentsById(
		balances_msgSender_stateVarId
	);

	const balances_msgSender_newCommitmentValue = generalise(
		 parseInt(amountSent.integer, 10)
	);
	// First check if required commitments exist or not

	let [
		balances_msgSender_commitmentFlag,
		balances_msgSender_0_oldCommitment,
		balances_msgSender_1_oldCommitment,
	] = getInputCommitments(
		publicKey.hex(32),
		balances_msgSender_newCommitmentValue.integer,
		balances_msgSender_preimage
	);

	let balances_msgSender_witness_0;

	let balances_msgSender_witness_1;

	while (balances_msgSender_commitmentFlag === false) {
		balances_msgSender_witness_0 = await getMembershipWitness(
			"SwapShield",
			generalise(balances_msgSender_0_oldCommitment._id).integer
		);

		balances_msgSender_witness_1 = await getMembershipWitness(
			"SwapShield",
			generalise(balances_msgSender_1_oldCommitment._id).integer
		);

		const tx = await joinCommitments(
			"SwapShield",
			"balances",
			secretKey,
			publicKey,
			[7, balances_msgSender_stateVarId_key],
			[balances_msgSender_0_oldCommitment, balances_msgSender_1_oldCommitment],
			[balances_msgSender_witness_0, balances_msgSender_witness_1],
			instance,
			contractAddr,
			web3
		);

		balances_msgSender_preimage = await getCommitmentsById(
			balances_msgSender_stateVarId
		);

		[
			balances_msgSender_commitmentFlag,
			balances_msgSender_0_oldCommitment,
			balances_msgSender_1_oldCommitment,
		] = getInputCommitments(
			publicKey.hex(32),
			balances_msgSender_newCommitmentValue.integer,
			balances_msgSender_preimage
		);
	}
	const balances_msgSender_0_prevSalt = generalise(
		balances_msgSender_0_oldCommitment.preimage.salt
	);
	const balances_msgSender_1_prevSalt = generalise(
		balances_msgSender_1_oldCommitment.preimage.salt
	);
	const balances_msgSender_0_prev = generalise(
		balances_msgSender_0_oldCommitment.preimage.value
	);
	const balances_msgSender_1_prev = generalise(
		balances_msgSender_1_oldCommitment.preimage.value
	);

	// read preimage for incremented state

	if (_balances_counterParty_newOwnerPublicKey === 0) {
		
		balances_counterParty_newOwnerPublicKey = await this.instance.methods.zkpPublicKeys(counterParty.hex(20)).call();
		balances_counterParty_newOwnerPublicKey = generalise(balances_counterParty_newOwnerPublicKey);
		if (balances_counterParty_newOwnerPublicKey.length === 0) {
			throw new Error("WARNING: Public key for given  eth address not found.");
		}
		}		
	let balances_counterParty_stateVarId = 7;

	const balances_counterParty_stateVarId_key = counterParty;


	balances_counterParty_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(balances_counterParty_stateVarId).bigInt,
				balances_counterParty_stateVarId_key.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	const balances_counterParty_newCommitmentValue = generalise(
		parseInt(amountSent.integer, 10)
	);

	// read preimage for incremented state
	tokenOwners_tokenIdRecieved_msg_newOwnerPublicKey =
		_tokenOwners_tokenIdRecieved_msg_newOwnerPublicKey === 0
			? publicKey
			: tokenOwners_tokenIdRecieved_msg_newOwnerPublicKey;

	let tokenOwners_tokenIdRecieved_msg_stateVarId = 13;

	const tokenOwners_tokenIdRecieved_msg_stateVarId_key = tokenIdRecieved;

	const tokenOwners_tokenIdRecieved_msg_stateVarId_valueKey = generalise(
		config.web3.options.defaultAccount
	); // emulates msg.sender

	tokenOwners_tokenIdRecieved_msg_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(tokenOwners_tokenIdRecieved_msg_stateVarId).bigInt,
				tokenOwners_tokenIdRecieved_msg_stateVarId_key.bigInt,
				tokenOwners_tokenIdRecieved_msg_stateVarId_valueKey.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	const tokenOwners_tokenIdRecieved_msg_newCommitmentValue = generalise(
		parseInt(tokenRecievedAmount.integer, 10)
	);

	// read preimage for incremented state
	tokenOwners_tokenIdSent_counterParty_newOwnerPublicKey =
		_tokenOwners_tokenIdSent_counterParty_newOwnerPublicKey === 0
			? publicKey
			: tokenOwners_tokenIdSent_counterParty_newOwnerPublicKey;
	if(_tokenOwners_tokenIdSent_counterParty_newOwnerPublicKey) {
		tokenOwners_tokenIdSent_counterParty_newOwnerPublicKey = await this.instance.methods.zkpPublicKeys(counterParty.hex(20)).call();
		tokenOwners_tokenIdSent_counterParty_newOwnerPublicKey = generalise(tokenOwners_tokenIdSent_counterParty_newOwnerPublicKey);
		if(tokenOwners_tokenIdSent_counterParty_newOwnerPublicKey.length === 0) {
			throw new Error("WARNING: Public key for given  eth address not found.");
		}
	}		

	let tokenOwners_tokenIdSent_counterParty_stateVarId = 13;

	const tokenOwners_tokenIdSent_counterParty_stateVarId_key = tokenIdRecieved;

	const tokenOwners_tokenIdSent_counterParty_stateVarId_valueKey = counterParty;

	tokenOwners_tokenIdSent_counterParty_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(tokenOwners_tokenIdSent_counterParty_stateVarId).bigInt,
				tokenOwners_tokenIdSent_counterParty_stateVarId_key.bigInt,
				tokenOwners_tokenIdSent_counterParty_stateVarId_valueKey.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	const tokenOwners_tokenIdSent_counterParty_newCommitmentValue = generalise(
		parseInt(tokenSentAmount.integer, 10)
	);

	// read preimage for decremented state

	tokenOwners_tokenIdSent_msg_newOwnerPublicKey =
		_tokenOwners_tokenIdSent_msg_newOwnerPublicKey === 0
			? publicKey
			: tokenOwners_tokenIdSent_msg_newOwnerPublicKey;

	let tokenOwners_tokenIdSent_msg_stateVarId = 13;

	const tokenOwners_tokenIdSent_msg_stateVarId_key = tokenIdSent;

	const tokenOwners_tokenIdSent_msg_stateVarId_valueKey = generalise(
		config.web3.options.defaultAccount
	); // emulates msg.sender

	tokenOwners_tokenIdSent_msg_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(tokenOwners_tokenIdSent_msg_stateVarId).bigInt,
				tokenOwners_tokenIdSent_msg_stateVarId_key.bigInt,
				tokenOwners_tokenIdSent_msg_stateVarId_valueKey.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	let tokenOwners_tokenIdSent_msg_preimage = await getCommitmentsById(
		tokenOwners_tokenIdSent_msg_stateVarId
	);

	const tokenOwners_tokenIdSent_msg_newCommitmentValue = generalise(
		parseInt(tokenSentAmount.integer, 10)
	);
	// First check if required commitments exist or not

	let [
		tokenOwners_tokenIdSent_msg_commitmentFlag,
		tokenOwners_tokenIdSent_msg_0_oldCommitment,
		tokenOwners_tokenIdSent_msg_1_oldCommitment,
	] = getInputCommitments(
		publicKey.hex(32),
		tokenOwners_tokenIdSent_msg_newCommitmentValue.integer,
		tokenOwners_tokenIdSent_msg_preimage
	);

	let tokenOwners_tokenIdSent_msg_witness_0;

	let tokenOwners_tokenIdSent_msg_witness_1;

	while (tokenOwners_tokenIdSent_msg_commitmentFlag === false) {
		tokenOwners_tokenIdSent_msg_witness_0 = await getMembershipWitness(
			"SwapShield",
			generalise(tokenOwners_tokenIdSent_msg_0_oldCommitment._id).integer
		);

		tokenOwners_tokenIdSent_msg_witness_1 = await getMembershipWitness(
			"SwapShield",
			generalise(tokenOwners_tokenIdSent_msg_1_oldCommitment._id).integer
		);

		const tx = await joinCommitments(
			"SwapShield",
			"tokenOwners",
			secretKey,
			publicKey,
			[13, tokenOwners_tokenIdSent_msg_stateVarId_key],
			[
				tokenOwners_tokenIdSent_msg_0_oldCommitment,
				tokenOwners_tokenIdSent_msg_1_oldCommitment,
			],
			[
				tokenOwners_tokenIdSent_msg_witness_0,
				tokenOwners_tokenIdSent_msg_witness_1,
			],
			instance,
			contractAddr,
			web3
		);

		tokenOwners_tokenIdSent_msg_preimage = await getCommitmentsById(
			tokenOwners_tokenIdSent_msg_stateVarId
		);

		[
			tokenOwners_tokenIdSent_msg_commitmentFlag,
			tokenOwners_tokenIdSent_msg_0_oldCommitment,
			tokenOwners_tokenIdSent_msg_1_oldCommitment,
		] = getInputCommitments(
			publicKey.hex(32),
			tokenOwners_tokenIdSent_msg_newCommitmentValue.integer,
			tokenOwners_tokenIdSent_msg_preimage
		);
	}
	const tokenOwners_tokenIdSent_msg_0_prevSalt = generalise(
		tokenOwners_tokenIdSent_msg_0_oldCommitment.preimage.salt
	);
	const tokenOwners_tokenIdSent_msg_1_prevSalt = generalise(
		tokenOwners_tokenIdSent_msg_1_oldCommitment.preimage.salt
	);
	const tokenOwners_tokenIdSent_msg_0_prev = generalise(
		tokenOwners_tokenIdSent_msg_0_oldCommitment.preimage.value
	);
	const tokenOwners_tokenIdSent_msg_1_prev = generalise(
		tokenOwners_tokenIdSent_msg_1_oldCommitment.preimage.value
	);

	// read preimage for whole state
	pendingStatus_newOwnerPublicKey =
		_pendingStatus_newOwnerPublicKey === 0
			? sharedPublicKey
			: pendingStatus_newOwnerPublicKey;

	const pendingStatus_currentCommitment = pendingStatus_commitmentExists
		? generalise(pendingStatus_commitment._id)
		: generalise(0);
	const pendingStatus_prev = generalise(pendingStatus_preimage.value);
	const pendingStatus_prevSalt = generalise(pendingStatus_preimage.salt);

	// read preimage for whole state
	swapProposals_sharedAddress_newOwnerPublicKey =
		_swapProposals_sharedAddress_newOwnerPublicKey === 0
			? sharedPublicKey
			: swapProposals_sharedAddress_newOwnerPublicKey;

	const swapProposals_sharedAddress_currentCommitment = swapProposals_sharedAddress_commitmentExists
		? generalise(swapProposals_sharedAddress_commitment._id)
		: generalise(0);
	const swapProposals_sharedAddress_prev = generalise(
		swapProposals_sharedAddress_preimage.value
	);
	const swapProposals_sharedAddress_prevSalt = generalise(
		swapProposals_sharedAddress_preimage.salt
	);

	// Extract set membership witness:

	// generate witness for partitioned state
	balances_msgSender_witness_0 = await getMembershipWitness(
		"SwapShield",
		generalise(balances_msgSender_0_oldCommitment._id).integer
	);
	balances_msgSender_witness_1 = await getMembershipWitness(
		"SwapShield",
		generalise(balances_msgSender_1_oldCommitment._id).integer
	);
	const balances_msgSender_0_index = generalise(
		balances_msgSender_witness_0.index
	);
	const balances_msgSender_1_index = generalise(
		balances_msgSender_witness_1.index
	);
	const balances_msgSender_root = generalise(balances_msgSender_witness_0.root);
	const balances_msgSender_0_path = generalise(
		balances_msgSender_witness_0.path
	).all;
	const balances_msgSender_1_path = generalise(
		balances_msgSender_witness_1.path
	).all;

	// generate witness for partitioned state
	tokenOwners_tokenIdSent_msg_witness_0 = await getMembershipWitness(
		"SwapShield",
		generalise(tokenOwners_tokenIdSent_msg_0_oldCommitment._id).integer
	);
	tokenOwners_tokenIdSent_msg_witness_1 = await getMembershipWitness(
		"SwapShield",
		generalise(tokenOwners_tokenIdSent_msg_1_oldCommitment._id).integer
	);
	const tokenOwners_tokenIdSent_msg_0_index = generalise(
		tokenOwners_tokenIdSent_msg_witness_0.index
	);
	const tokenOwners_tokenIdSent_msg_1_index = generalise(
		tokenOwners_tokenIdSent_msg_witness_1.index
	);
	const tokenOwners_tokenIdSent_msg_root = generalise(
		tokenOwners_tokenIdSent_msg_witness_0.root
	);
	const tokenOwners_tokenIdSent_msg_0_path = generalise(
		tokenOwners_tokenIdSent_msg_witness_0.path
	).all;
	const tokenOwners_tokenIdSent_msg_1_path = generalise(
		tokenOwners_tokenIdSent_msg_witness_1.path
	).all;

	// generate witness for whole state
	const pendingStatus_emptyPath = new Array(32).fill(0);
	const pendingStatus_witness = pendingStatus_witnessRequired
		? await getMembershipWitness(
				"SwapShield",
				pendingStatus_currentCommitment.integer
		  )
		: {
				index: 0,
				path: pendingStatus_emptyPath,
				root: (await getRoot("SwapShield")) || 0,
		  };
	const pendingStatus_index = generalise(pendingStatus_witness.index);
	const pendingStatus_root = generalise(pendingStatus_witness.root);
	const pendingStatus_path = generalise(pendingStatus_witness.path).all;

	// generate witness for whole state
	const swapProposals_sharedAddress_emptyPath = new Array(32).fill(0);
	const swapProposals_sharedAddress_witness = swapProposals_sharedAddress_witnessRequired
		? await getMembershipWitness(
				"SwapShield",
				swapProposals_sharedAddress_currentCommitment.integer
		  )
		: {
				index: 0,
				path: swapProposals_sharedAddress_emptyPath,
				root: (await getRoot("SwapShield")) || 0,
		  };
	const swapProposals_sharedAddress_index = generalise(
		swapProposals_sharedAddress_witness.index
	);
	const swapProposals_sharedAddress_root = generalise(
		swapProposals_sharedAddress_witness.root
	);
	const swapProposals_sharedAddress_path = generalise(
		swapProposals_sharedAddress_witness.path
	).all;

	let pendingStatus = generalise(pendingStatus_preimage.value);

	let swapProposals_sharedAddress = generalise(
		swapProposals_sharedAddress_preimage.value
	);

	swapProposals_sharedAddress.swapAmountSent =
		parseInt(swapProposals_sharedAddress.swapAmountSent.integer, 10) -
		parseInt(amountRecieved.integer, 10);

	swapProposals_sharedAddress = generalise(swapProposals_sharedAddress);

	// increment would go here but has been filtered out

	swapProposals_sharedAddress.swapAmountRecieved =
		parseInt(swapProposals_sharedAddress.swapAmountRecieved.integer, 10) -
		parseInt(amountSent.integer, 10);

	swapProposals_sharedAddress = generalise(swapProposals_sharedAddress);

	// increment would go here but has been filtered out

	// increment would go here but has been filtered out

	swapProposals_sharedAddress.swapTokenSentAmount =
		parseInt(swapProposals_sharedAddress.swapTokenSentAmount.integer, 10) -
		parseInt(tokenRecievedAmount.integer, 10);

	swapProposals_sharedAddress = generalise(swapProposals_sharedAddress);

	// increment would go here but has been filtered out

	swapProposals_sharedAddress.swapTokenRecievedAmount =
		parseInt(swapProposals_sharedAddress.swapTokenRecievedAmount.integer, 10) -
		parseInt(tokenSentAmount.integer, 10);

	swapProposals_sharedAddress = generalise(swapProposals_sharedAddress);

	// increment would go here but has been filtered out

	// increment would go here but has been filtered out

	pendingStatus = 0;

	pendingStatus = generalise(pendingStatus);

	// Calculate nullifier(s):

	let balances_msgSender_0_nullifier = poseidonHash([
		BigInt(balances_msgSender_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(balances_msgSender_0_prevSalt.hex(32)),
	]);
	let balances_msgSender_1_nullifier = poseidonHash([
		BigInt(balances_msgSender_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(balances_msgSender_1_prevSalt.hex(32)),
	]);
	balances_msgSender_0_nullifier = generalise(
		balances_msgSender_0_nullifier.hex(32)
	); // truncate
	balances_msgSender_1_nullifier = generalise(
		balances_msgSender_1_nullifier.hex(32)
	); // truncate
	

	let tokenOwners_tokenIdSent_msg_0_nullifier = poseidonHash([
		BigInt(tokenOwners_tokenIdSent_msg_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(tokenOwners_tokenIdSent_msg_0_prevSalt.hex(32)),
	]);
	let tokenOwners_tokenIdSent_msg_1_nullifier = poseidonHash([
		BigInt(tokenOwners_tokenIdSent_msg_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(tokenOwners_tokenIdSent_msg_1_prevSalt.hex(32)),
	]);
	tokenOwners_tokenIdSent_msg_0_nullifier = generalise(
		tokenOwners_tokenIdSent_msg_0_nullifier.hex(32)
	); // truncate
	tokenOwners_tokenIdSent_msg_1_nullifier = generalise(
		tokenOwners_tokenIdSent_msg_1_nullifier.hex(32)
	); // truncate
	

	let pendingStatus_nullifier = pendingStatus_commitmentExists
		? poseidonHash([
				BigInt(pendingStatus_stateVarId),
				BigInt(sharedSecretKey.hex(32)),
				BigInt(pendingStatus_prevSalt.hex(32)),
		  ])
		: poseidonHash([
				BigInt(pendingStatus_stateVarId),
				BigInt(generalise(0).hex(32)),
				BigInt(pendingStatus_prevSalt.hex(32)),
		  ]);

	pendingStatus_nullifier = generalise(pendingStatus_nullifier.hex(32)); // truncate


	let swapProposals_sharedAddress_nullifier = swapProposals_sharedAddress_commitmentExists
		? poseidonHash([
				BigInt(swapProposals_sharedAddress_stateVarId),
				BigInt(sharedSecretKey.hex(32)),
				BigInt(swapProposals_sharedAddress_prevSalt.hex(32)),
		  ])
		: poseidonHash([
				BigInt(swapProposals_sharedAddress_stateVarId),
				BigInt(generalise(0).hex(32)),
				BigInt(swapProposals_sharedAddress_prevSalt.hex(32)),
		  ]);

	swapProposals_sharedAddress_nullifier = generalise(
		swapProposals_sharedAddress_nullifier.hex(32)
	); // truncate

	
	// Calculate commitment(s):

	const balances_msgSender_2_newSalt = generalise(utils.randomHex(31));

	let balances_msgSender_change =
		parseInt(balances_msgSender_0_prev.integer, 10) +
		parseInt(balances_msgSender_1_prev.integer, 10) + parseInt(amountRecieved.integer, 10) -
		parseInt(balances_msgSender_newCommitmentValue.integer, 10);

	balances_msgSender_change = generalise(balances_msgSender_change);

	let balances_msgSender_2_newCommitment = poseidonHash([
		BigInt(balances_msgSender_stateVarId),
		BigInt(balances_msgSender_change.hex(32)),
		BigInt(publicKey.hex(32)),
		BigInt(balances_msgSender_2_newSalt.hex(32)),
	]);

	balances_msgSender_2_newCommitment = generalise(
		balances_msgSender_2_newCommitment.hex(32)
	); // truncate

	const balances_counterParty_newSalt = generalise(utils.randomHex(31));

	let balances_counterParty_newCommitment = poseidonHash([
		BigInt(balances_counterParty_stateVarId),
		BigInt(balances_counterParty_newCommitmentValue.hex(32)),
		BigInt(balances_counterParty_newOwnerPublicKey.hex(32)),
		BigInt(balances_counterParty_newSalt.hex(32)),
	]);

	balances_counterParty_newCommitment = generalise(
		balances_counterParty_newCommitment.hex(32)
	); // truncate

	const tokenOwners_tokenIdSent_counterParty_newSalt = generalise(
		utils.randomHex(31)
	);

	let tokenOwners_tokenIdSent_counterParty_newCommitment = poseidonHash([
		BigInt(tokenOwners_tokenIdSent_counterParty_stateVarId),
		BigInt(tokenOwners_tokenIdSent_counterParty_newCommitmentValue.hex(32)),
		BigInt(tokenOwners_tokenIdSent_counterParty_newOwnerPublicKey.hex(32)),
		BigInt(tokenOwners_tokenIdSent_counterParty_newSalt.hex(32)),
	]);

	tokenOwners_tokenIdSent_counterParty_newCommitment = generalise(
		tokenOwners_tokenIdSent_counterParty_newCommitment.hex(32)
	); // truncate

	const tokenOwners_tokenIdRecieved_msg_newSalt = generalise(
		utils.randomHex(31)
	);

	let tokenOwners_tokenIdRecieved_msg_newCommitment = poseidonHash([
		BigInt(tokenOwners_tokenIdRecieved_msg_stateVarId),
		BigInt(tokenOwners_tokenIdRecieved_msg_newCommitmentValue.hex(32)),
		BigInt(tokenOwners_tokenIdRecieved_msg_newOwnerPublicKey.hex(32)),
		BigInt(tokenOwners_tokenIdRecieved_msg_newSalt.hex(32)),
	]);

	tokenOwners_tokenIdRecieved_msg_newCommitment = generalise(
		tokenOwners_tokenIdRecieved_msg_newCommitment.hex(32)
	); // truncate

	const tokenOwners_tokenIdSent_msg_2_newSalt = generalise(utils.randomHex(31));

	let tokenOwners_tokenIdSent_msg_change =
		parseInt(tokenOwners_tokenIdSent_msg_0_prev.integer, 10) +
		parseInt(tokenOwners_tokenIdSent_msg_1_prev.integer, 10) -
		parseInt(tokenOwners_tokenIdSent_msg_newCommitmentValue.integer, 10);

	tokenOwners_tokenIdSent_msg_change = generalise(
		tokenOwners_tokenIdSent_msg_change
	);

	let tokenOwners_tokenIdSent_msg_2_newCommitment = poseidonHash([
		BigInt(tokenOwners_tokenIdSent_msg_stateVarId),
		BigInt(tokenOwners_tokenIdSent_msg_change.hex(32)),
		BigInt(publicKey.hex(32)),
		BigInt(tokenOwners_tokenIdSent_msg_2_newSalt.hex(32)),
	]);

	tokenOwners_tokenIdSent_msg_2_newCommitment = generalise(
		tokenOwners_tokenIdSent_msg_2_newCommitment.hex(32)
	); // truncate

	const pendingStatus_newSalt = generalise(utils.randomHex(31));

	let pendingStatus_newCommitment = poseidonHash([
		BigInt(pendingStatus_stateVarId),
		BigInt(pendingStatus.hex(32)),
		BigInt(pendingStatus_newOwnerPublicKey.hex(32)),
		BigInt(pendingStatus_newSalt.hex(32)),
	]);

	pendingStatus_newCommitment = generalise(pendingStatus_newCommitment.hex(32)); // truncate

	swapProposals_sharedAddress.swapAmountSent = swapProposals_sharedAddress.swapAmountSent
		? swapProposals_sharedAddress.swapAmountSent
		: swapProposals_sharedAddress_prev.swapAmountSent;
	swapProposals_sharedAddress.swapAmountRecieved = swapProposals_sharedAddress.swapAmountRecieved
		? swapProposals_sharedAddress.swapAmountRecieved
		: swapProposals_sharedAddress_prev.swapAmountRecieved;
	swapProposals_sharedAddress.swapTokenSentId = swapProposals_sharedAddress.swapTokenSentId
		? swapProposals_sharedAddress.swapTokenSentId
		: swapProposals_sharedAddress_prev.swapTokenSentId;
	swapProposals_sharedAddress.swapTokenSentAmount = swapProposals_sharedAddress.swapTokenSentAmount
		? swapProposals_sharedAddress.swapTokenSentAmount
		: swapProposals_sharedAddress_prev.swapTokenSentAmount;
	swapProposals_sharedAddress.swapTokenRecievedId = swapProposals_sharedAddress.swapTokenRecievedId
		? swapProposals_sharedAddress.swapTokenRecievedId
		: swapProposals_sharedAddress_prev.swapTokenRecievedId;
	swapProposals_sharedAddress.swapTokenRecievedAmount = swapProposals_sharedAddress.swapTokenRecievedAmount
		? swapProposals_sharedAddress.swapTokenRecievedAmount
		: swapProposals_sharedAddress_prev.swapTokenRecievedAmount;

	const swapProposals_sharedAddress_newSalt = generalise(utils.randomHex(31));

	let swapProposals_sharedAddress_newCommitment = poseidonHash([
		BigInt(swapProposals_sharedAddress_stateVarId),
		BigInt(swapProposals_sharedAddress.swapAmountSent.hex(32)),
		BigInt(swapProposals_sharedAddress.swapAmountRecieved.hex(32)),
		BigInt(swapProposals_sharedAddress.swapTokenSentId.hex(32)),
		BigInt(swapProposals_sharedAddress.swapTokenSentAmount.hex(32)),
		BigInt(swapProposals_sharedAddress.swapTokenRecievedId.hex(32)),
		BigInt(swapProposals_sharedAddress.swapTokenRecievedAmount.hex(32)),
		BigInt(swapProposals_sharedAddress_newOwnerPublicKey.hex(32)),
		BigInt(swapProposals_sharedAddress_newSalt.hex(32)),
	]);

	swapProposals_sharedAddress_newCommitment = generalise(
		swapProposals_sharedAddress_newCommitment.hex(32)
	); // truncate

	// Call Zokrates to generate the proof:

	const allInputs = [
		counterParty.integer,
		sharedAddress.integer,
		amountSent.integer,
		amountRecieved.integer,
		tokenIdSent.integer,
		tokenSentAmount.integer,
		tokenIdRecieved.integer,
		tokenRecievedAmount.integer,
		balances_msgSender_stateVarId_key.integer,
		secretKey.integer,
		secretKey.integer,
		balances_msgSender_0_nullifier.integer,
		balances_msgSender_1_nullifier.integer,
		balances_msgSender_0_prev.integer,
		balances_msgSender_0_prevSalt.integer,
		balances_msgSender_1_prev.integer,
		balances_msgSender_1_prevSalt.integer,
		balances_msgSender_root.integer,
		balances_msgSender_0_index.integer,
		balances_msgSender_0_path.integer,
		balances_msgSender_1_index.integer,
		balances_msgSender_1_path.integer,
		balances_msgSender_newOwnerPublicKey.integer,
		balances_msgSender_2_newSalt.integer,
		balances_msgSender_2_newCommitment.integer,

		balances_counterParty_newOwnerPublicKey.integer,
		balances_counterParty_newSalt.integer,
		balances_counterParty_newCommitment.integer,

		tokenOwners_tokenIdRecieved_msg_newOwnerPublicKey.integer,
		tokenOwners_tokenIdRecieved_msg_newSalt.integer,
		tokenOwners_tokenIdRecieved_msg_newCommitment.integer,

		secretKey.integer,
		secretKey.integer,

		tokenOwners_tokenIdSent_msg_0_nullifier.integer,
		tokenOwners_tokenIdSent_msg_1_nullifier.integer,
		tokenOwners_tokenIdSent_msg_0_prev.integer,
		tokenOwners_tokenIdSent_msg_0_prevSalt.integer,
		tokenOwners_tokenIdSent_msg_1_prev.integer,
		tokenOwners_tokenIdSent_msg_1_prevSalt.integer,

		tokenOwners_tokenIdSent_msg_0_index.integer,
		tokenOwners_tokenIdSent_msg_0_path.integer,
		tokenOwners_tokenIdSent_msg_1_index.integer,
		tokenOwners_tokenIdSent_msg_1_path.integer,
		tokenOwners_tokenIdSent_msg_newOwnerPublicKey.integer,
		tokenOwners_tokenIdSent_msg_2_newSalt.integer,
		tokenOwners_tokenIdSent_msg_2_newCommitment.integer,

		tokenOwners_tokenIdSent_counterParty_newOwnerPublicKey.integer,
		tokenOwners_tokenIdSent_counterParty_newSalt.integer,
		tokenOwners_tokenIdSent_counterParty_newCommitment.integer,

		pendingStatus_commitmentExists ? sharedSecretKey.integer : generalise(0).integer,

		pendingStatus_nullifier.integer,
		pendingStatus_prev.integer,
		pendingStatus_prevSalt.integer,
		pendingStatus_commitmentExists ? 0 : 1,

		pendingStatus_index.integer,
		pendingStatus_path.integer,
		pendingStatus_newOwnerPublicKey.integer,
		pendingStatus_newSalt.integer,
		pendingStatus_newCommitment.integer,
		swapProposals_sharedAddress_commitmentExists
			? sharedSecretKey.integer
			: generalise(0).integer,

		swapProposals_sharedAddress_nullifier.integer,
		swapProposals_sharedAddress_prev.swapAmountSent.integer,
		swapProposals_sharedAddress_prev.swapAmountRecieved.integer,
		swapProposals_sharedAddress_prev.swapTokenSentId.integer,
		swapProposals_sharedAddress_prev.swapTokenSentAmount.integer,
		swapProposals_sharedAddress_prev.swapTokenRecievedId.integer,
		swapProposals_sharedAddress_prev.swapTokenRecievedAmount.integer,
		swapProposals_sharedAddress_prevSalt.integer,
		swapProposals_sharedAddress_commitmentExists ? 0 : 1,

		swapProposals_sharedAddress_index.integer,
		swapProposals_sharedAddress_path.integer,
		swapProposals_sharedAddress_newOwnerPublicKey.integer,
		swapProposals_sharedAddress_newSalt.integer,
		swapProposals_sharedAddress_newCommitment.integer,
	].flat(Infinity);
	const res = await generateProof("completeSwap", allInputs);
	const proof = generalise(Object.values(res.proof).flat(Infinity))
		.map((coeff) => coeff.integer)
		.flat(Infinity);

	// Send transaction to the blockchain:

	const txData = await instance.methods
		.completeSwap(
			[
				balances_msgSender_0_nullifier.integer,
				balances_msgSender_1_nullifier.integer,
				tokenOwners_tokenIdSent_msg_0_nullifier.integer,
				tokenOwners_tokenIdSent_msg_1_nullifier.integer,
				pendingStatus_nullifier.integer,
				swapProposals_sharedAddress_nullifier.integer,
			],
			balances_msgSender_root.integer,
			[
				balances_msgSender_2_newCommitment.integer,
				balances_counterParty_newCommitment.integer,
				tokenOwners_tokenIdRecieved_msg_newCommitment.integer,
				tokenOwners_tokenIdSent_msg_2_newCommitment.integer,
				tokenOwners_tokenIdSent_counterParty_newCommitment.integer,
				pendingStatus_newCommitment.integer,
				swapProposals_sharedAddress_newCommitment.integer,
			],
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
		generalise(balances_msgSender_0_oldCommitment._id),
		secretKey.hex(32)
	);

	await markNullified(
		generalise(balances_msgSender_1_oldCommitment._id),
		secretKey.hex(32)
	);

	await storeCommitment({
		hash: balances_msgSender_2_newCommitment,
		name: "balances",
		mappingKey: balances_msgSender_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(balances_msgSender_stateVarId),
			value: balances_msgSender_change,
			salt: balances_msgSender_2_newSalt,
			publicKey: balances_msgSender_newOwnerPublicKey,
		},
		secretKey:
			balances_msgSender_newOwnerPublicKey.integer === publicKey.integer
				? secretKey
				: null,
		isNullified: false,
	});

	await storeCommitment({
		hash: balances_counterParty_newCommitment,
		name: "balances",
		mappingKey: balances_counterParty_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(balances_counterParty_stateVarId),
			value: balances_counterParty_newCommitmentValue,
			salt: balances_counterParty_newSalt,
			publicKey: balances_counterParty_newOwnerPublicKey,
		},
		secretKey:
			balances_counterParty_newOwnerPublicKey.integer === publicKey.integer
				? secretKey
				: null,
		isNullified: false,
	});

	await storeCommitment({
		hash: tokenOwners_tokenIdRecieved_msg_newCommitment,
		name: "tokenOwners",
		mappingKey: tokenOwners_tokenIdRecieved_msg_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(tokenOwners_tokenIdRecieved_msg_stateVarId),
			value: tokenOwners_tokenIdRecieved_msg_newCommitmentValue,
			salt: tokenOwners_tokenIdRecieved_msg_newSalt,
			publicKey: tokenOwners_tokenIdRecieved_msg_newOwnerPublicKey,
		},
		secretKey:
			tokenOwners_tokenIdRecieved_msg_newOwnerPublicKey.integer ===
			publicKey.integer
				? secretKey
				: null,
		isNullified: false,
	});

	await markNullified(
		generalise(tokenOwners_tokenIdSent_msg_0_oldCommitment._id),
		secretKey.hex(32)
	);

	await markNullified(
		generalise(tokenOwners_tokenIdSent_msg_1_oldCommitment._id),
		secretKey.hex(32)
	);

	await storeCommitment({
		hash: tokenOwners_tokenIdSent_msg_2_newCommitment,
		name: "tokenOwners",
		mappingKey: tokenOwners_tokenIdSent_msg_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(tokenOwners_tokenIdSent_msg_stateVarId),
			value: tokenOwners_tokenIdSent_msg_change,
			salt: tokenOwners_tokenIdSent_msg_2_newSalt,
			publicKey: tokenOwners_tokenIdSent_msg_newOwnerPublicKey,
		},
		secretKey:
			tokenOwners_tokenIdSent_msg_newOwnerPublicKey.integer ===
			publicKey.integer
				? secretKey
				: null,
		isNullified: false,
	});

	if (pendingStatus_commitmentExists)
		await markNullified(pendingStatus_currentCommitment, secretKey.hex(32));

	await storeCommitment({
		hash: pendingStatus_newCommitment,
		name: "pendingStatus",
		mappingKey: null,
		preimage: {
			stateVarId: generalise(pendingStatus_stateVarId),
			value: pendingStatus,
			salt: pendingStatus_newSalt,
			publicKey: pendingStatus_newOwnerPublicKey,
		},
		secretKey:
			pendingStatus_newOwnerPublicKey.integer === sharedPublicKey.integer
				? sharedSecretKey
				: null,
		isNullified: false,
	});

	if (swapProposals_sharedAddress_commitmentExists)
		await markNullified(
			swapProposals_sharedAddress_currentCommitment,
			secretKey.hex(32)
		);


	await storeCommitment({
		hash: swapProposals_sharedAddress_newCommitment,
		name: "swapProposals",
		mappingKey: swapProposals_sharedAddress_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(swapProposals_sharedAddress_stateVarId),
			value: {
				swapAmountSent: swapProposals_sharedAddress.swapAmountSent,
				swapAmountRecieved: swapProposals_sharedAddress.swapAmountRecieved,
				swapTokenSentId: swapProposals_sharedAddress.swapTokenSentId,
				swapTokenSentAmount: swapProposals_sharedAddress.swapTokenSentAmount,
				swapTokenRecievedId: swapProposals_sharedAddress.swapTokenRecievedId,
				swapTokenRecievedAmount:
					swapProposals_sharedAddress.swapTokenRecievedAmount,
			},
			salt: swapProposals_sharedAddress_newSalt,
			publicKey: swapProposals_sharedAddress_newOwnerPublicKey,
		},
		secretKey:
			swapProposals_sharedAddress_newOwnerPublicKey.integer ===
			sharedPublicKey.integer
				? sharedSecretKey
				: null,
		isNullified: false,
	});

	return { tx, encEvent };
}
