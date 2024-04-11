// SPDX-License-Identifier: CC0

pragma solidity ^0.8.0;

import "./verify/IVerifier.sol";
import "./merkle-tree/MerkleTree.sol";

import "./Escrow-imports/IERC20.sol";

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract SwapShield is MerkleTree {


          enum FunctionNames { deposit, deposit_tokens, startSwap, completeSwap, quitSwap, withdraw, withdraw_token, joinCommitments }

          IVerifier private verifier;

          mapping(uint256 => uint256[]) public vks; // indexed to by an enum uint(FunctionNames)

          mapping(uint256 => uint256) public nullifiers;

          mapping(uint256 => uint256) public commitmentRoots;

          uint256 public latestRoot;

          mapping(address => uint256) public zkpPublicKeys;

          struct Inputs {
              uint[] newNullifiers;
                  
						uint commitmentRoot;
						uint[] newCommitments;
						uint[] customInputs;
          }


        constructor (
      		address verifierAddress,
      		uint256[][] memory vk
      	) {
      		verifier = IVerifier(verifierAddress);
      		for (uint i = 0; i < vk.length; i++) {
      			vks[i] = vk[i];
      		}

        }


        function registerZKPPublicKey(uint256 pk) external {
      		zkpPublicKeys[msg.sender] = pk;
      	}
        


        function verify(
      		uint256[] calldata proof,
      		uint256 functionId,
      		Inputs memory _inputs
      	) private {
        
          uint[] memory customInputs = _inputs.customInputs;

          uint[] memory newNullifiers = _inputs.newNullifiers;

          uint[] memory newCommitments = _inputs.newCommitments;

          for (uint i; i < newNullifiers.length; i++) {
      			uint n = newNullifiers[i];
      			require(nullifiers[n] == 0, "Nullifier already exists");
      			nullifiers[n] = n;
      		}


          require(commitmentRoots[_inputs.commitmentRoot] == _inputs.commitmentRoot, "Input commitmentRoot does not exist.");

            uint256[] memory inputs = new uint256[](customInputs.length + newNullifiers.length + (newNullifiers.length > 0 ? 3 : 0) + newCommitments.length);
          
          if (functionId == uint(FunctionNames.deposit)) {
            uint k = 0;
            
            inputs[k++] = customInputs[0];
            inputs[k++] = newCommitments[0];
            inputs[k++] = 1;
            
          }

          if (functionId == uint(FunctionNames.deposit_tokens)) {
            uint k = 0;
            
            inputs[k++] = customInputs[0];
            inputs[k++] = customInputs[1];
            inputs[k++] = newCommitments[0];
            inputs[k++] = 1;
            
          }

          if (functionId == uint(FunctionNames.startSwap)) {
            uint k = 0;
             
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[0];
            inputs[k++] = newNullifiers[2];
            inputs[k++] = newNullifiers[3];
            inputs[k++] = newCommitments[1];
            inputs[k++] = newNullifiers[4];
            inputs[k++] = newCommitments[2];
            inputs[k++] = newNullifiers[5];
            inputs[k++] = newCommitments[3];
            inputs[k++] = 1;
            
          }

          if (functionId == uint(FunctionNames.completeSwap)) {
            uint k = 0;
             
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[0];
            inputs[k++] = newCommitments[1];
            inputs[k++] = newCommitments[2];
            inputs[k++] = newNullifiers[2];
            inputs[k++] = newNullifiers[3];
             inputs[k++] = newCommitments[3];
            inputs[k++] = newCommitments[4];
            inputs[k++] = newNullifiers[4];
            inputs[k++] = newCommitments[5];
            inputs[k++] = newNullifiers[5];
            inputs[k++] = newCommitments[6];
            inputs[k++] = 1;
            
          }

          if (functionId == uint(FunctionNames.quitSwap)) {
            uint k = 0;
             
            inputs[k++] = newCommitments[0];
            inputs[k++] = newCommitments[1];
            inputs[k++] = newNullifiers[0];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[2];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = newCommitments[3];
            inputs[k++] = 1;
            
          }

          if (functionId == uint(FunctionNames.withdraw)) {
            uint k = 0;
             
            
            inputs[k++] = customInputs[0];
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[0];
            inputs[k++] = 1;
            
          }

          if (functionId == uint(FunctionNames.withdraw_token)) {
            uint k = 0;
             
            inputs[k++] = customInputs[0];
            inputs[k++] = customInputs[1];
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[0];
            inputs[k++] = 1;
            
          }


         if (functionId == uint(FunctionNames.joinCommitments)) {

           uint k = 0;
           inputs[k++] = newNullifiers[0];
           inputs[k++] = newNullifiers[1];
           inputs[k++] = _inputs.commitmentRoot;
           inputs[k++] = newCommitments[0];
           inputs[k++] = 1;
                
         }
          
          bool result = verifier.verify(proof, inputs, vks[functionId]);

          require(result, "The proof has not been verified by the contract");

          if (newCommitments.length > 0) {
      			latestRoot = insertLeaves(newCommitments);
      			commitmentRoots[latestRoot] = latestRoot;
      		}
        }

           function joinCommitments( uint256[] calldata newNullifiers,  uint256 commitmentRoot, uint256[] calldata newCommitments, uint256[] calldata proof) public {

            Inputs memory inputs;

            inputs.customInputs = new uint[](1);
        	  inputs.customInputs[0] = 1;


            inputs.newNullifiers = newNullifiers;

            inputs.commitmentRoot = commitmentRoot;

            inputs.newCommitments = newCommitments;

            verify(proof, uint(FunctionNames.joinCommitments), inputs);
        }






        IERC20 public erc20;


        IERC1155 public erc1155;

struct swapStruct {
        
        uint256 swapAmountSent;

        uint256 swapAmountRecieved;

        uint256 swapTokenSentId;

        uint256 swapTokenSentAmount;

        uint256 swapTokenRecievedId;

        uint256 swapTokenRecievedAmount;
      }






      function deposit (address erc20Address, uint256 amount, uint256[] calldata newCommitments, uint256[] calldata proof) public  {

        erc20 = IERC20(erc20Address);

          bool hasBalance = erc20.transferFrom(msg.sender, address(this), amount);
require(hasBalance == true);


          Inputs memory inputs;

          inputs.customInputs = new uint[](2);
        	inputs.customInputs[0] = amount;
inputs.customInputs[1] = 1;

          inputs.newCommitments = newCommitments;

           verify(proof, uint(FunctionNames.deposit), inputs);
      }


      function deposit_tokens (address erc1155Address, uint256 amount, uint256 tokenId, uint256[] calldata newCommitments, uint256[] calldata proof) public  {

        erc1155 = IERC1155(erc1155Address);
erc1155.safeTransferFrom(msg.sender, address(this), tokenId, amount, " ");


          Inputs memory inputs;

          inputs.customInputs = new uint[](3);
        	inputs.customInputs[0] = amount;
inputs.customInputs[1] = tokenId;
inputs.customInputs[2] = 1;

          inputs.newCommitments = newCommitments;

           verify(proof, uint(FunctionNames.deposit_tokens), inputs);
      }


      function startSwap (uint256[] calldata newNullifiers, uint256 commitmentRoot, uint256[] calldata newCommitments, uint256[] calldata proof) public  {

          Inputs memory inputs;

          inputs.customInputs = new uint[](1);
        	inputs.customInputs[0] = 1;


          inputs.newNullifiers = newNullifiers;
           

          inputs.commitmentRoot = commitmentRoot;

          inputs.newCommitments = newCommitments;

           verify(proof, uint(FunctionNames.startSwap), inputs);
      }


      function completeSwap (uint256[] calldata newNullifiers, uint256 commitmentRoot, uint256[] calldata newCommitments, uint256[] calldata proof) public  {

   

          Inputs memory inputs;

          inputs.customInputs = new uint[](1);
        	inputs.customInputs[0] = 1;

          
          inputs.newNullifiers = newNullifiers;
           

          inputs.commitmentRoot = commitmentRoot;

          inputs.newCommitments = newCommitments;

           verify(proof, uint(FunctionNames.completeSwap), inputs);
      }


      function quitSwap (uint256[] calldata newNullifiers, uint256 commitmentRoot, uint256[] calldata newCommitments, uint256[] calldata proof) public  {

          Inputs memory inputs;

          inputs.customInputs = new uint[](1);
        	inputs.customInputs[0] = 1;

          inputs.newNullifiers = newNullifiers;
           

          inputs.commitmentRoot = commitmentRoot;

          inputs.newCommitments = newCommitments;

           verify(proof, uint(FunctionNames.quitSwap), inputs);
      }


      function withdraw (address erc20Address, uint256 amount,uint256[] calldata newNullifiers, uint256 commitmentRoot, uint256[] calldata newCommitments, uint256[] calldata proof) public  {

        erc20 = IERC20(erc20Address);

          bool success = erc20.transfer(msg.sender, amount);
require(success, "ERC20 transfer failed");


          Inputs memory inputs;

          inputs.customInputs = new uint[](2);
        	inputs.customInputs[0] = amount;
inputs.customInputs[1] = 1;

          inputs.newNullifiers = newNullifiers;
           

          inputs.commitmentRoot = commitmentRoot;

          inputs.newCommitments = newCommitments;

           verify(proof, uint(FunctionNames.withdraw), inputs);
      }


      function withdraw_token (address erc1155Address, uint256 tokenId, uint256 amount,uint256[] calldata newNullifiers, uint256 commitmentRoot, uint256[] calldata newCommitments, uint256[] calldata proof) public  {

        erc1155 = IERC1155(erc1155Address);
erc1155.safeTransferFrom(address(this), msg.sender, tokenId, amount, "");


          Inputs memory inputs;

          inputs.customInputs = new uint[](3);
        	inputs.customInputs[0] = tokenId;
inputs.customInputs[1] = amount;
inputs.customInputs[2] = 1;

          inputs.newNullifiers = newNullifiers;
           

          inputs.commitmentRoot = commitmentRoot;

          inputs.newCommitments = newCommitments;

           verify(proof, uint(FunctionNames.withdraw_token), inputs);
      }
}