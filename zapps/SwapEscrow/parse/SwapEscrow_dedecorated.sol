// SPDX-License-Identifier: CC0

pragma solidity ^0.8.0;

import "./Escrow-imports/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract Swap {

mapping(address => uint256) public balances;
mapping(uint256 => mapping(address => uint256)) public tokenOwners;
IERC20 public erc20;
IERC1155 public erc1155;

struct swapStruct{
uint256 swapAmountSent;
uint256 swapAmountRecieved;
uint256 swapTokenSentId;
uint256 swapTokenSentAmount;
uint256 swapTokenRecievedId;
uint256 swapTokenRecievedAmount;
}
uint256 pendingStatus;

mapping(address => swapStruct) swapProposals; 


function deposit(address erc20Address, uint256 amount) public {
erc20 = IERC20(erc20Address);
bool hasBalance = erc20.transferFrom(msg.sender, address(this), amount);
require(hasBalance == true);
balances[msg.sender] += amount;
}

function deposit_tokens(address erc1155Address, uint256 tokenId, uint256 tokenAmount) public {
erc1155 = IERC1155(erc1155Address);
erc1155.safeTransferFrom(msg.sender, address(this), tokenId, tokenAmount, " " );
tokenOwners[tokenId][msg.sender] += tokenAmount;
}


function startSwap( 
address sharedAddress, 
uint256 amountSent, 
uint256 amountRecieved, 
uint256 tokenIdSent, 
uint256 tokenSentAmount, 
uint256 tokenIdRecieved,
uint256 tokenRecievedAmount) public {

require(pendingStatus == 0);
swapProposals[sharedAddress].swapAmountSent += amountSent;
balances[msg.sender] -= amountSent; 
swapProposals[sharedAddress].swapAmountRecieved += amountRecieved;
tokenOwners[tokenIdSent][msg.sender] -= tokenSentAmount;
swapProposals[sharedAddress].swapTokenSentId = tokenIdSent;
swapProposals[sharedAddress].swapTokenSentAmount += tokenSentAmount; 
swapProposals[sharedAddress].swapTokenRecievedId = tokenIdRecieved;
swapProposals[sharedAddress].swapTokenRecievedAmount = tokenRecievedAmount;
pendingStatus = 1;

}

function completeSwap(
address counterParty, 
address sharedAddress, 
uint256 amountSent, 
uint256 amountRecieved, 
uint256 tokenIdSent, 
uint256 tokenSentAmount, 
uint256 tokenIdRecieved,
uint256 tokenRecievedAmount) public {

require(swapProposals[sharedAddress].swapAmountRecieved == amountSent);
require(swapProposals[sharedAddress].swapAmountSent == amountRecieved);
require(swapProposals[sharedAddress].swapTokenRecievedId == tokenIdSent && swapProposals[sharedAddress].swapTokenRecievedAmount == tokenSentAmount);
require(swapProposals[sharedAddress].swapTokenSentId == tokenIdRecieved && swapProposals[sharedAddress].swapTokenSentAmount == tokenRecievedAmount);
require(pendingStatus == 1);

swapProposals[sharedAddress].swapAmountSent -= amountRecieved;
balances[msg.sender] += amountRecieved; 

swapProposals[sharedAddress].swapAmountRecieved -= amountSent;
balances[msg.sender] -= amountSent; 
balances[counterParty] += amountSent; 


swapProposals[sharedAddress].swapTokenSentAmount -= tokenRecievedAmount; 
tokenOwners[tokenIdRecieved][msg.sender] += tokenRecievedAmount;

swapProposals[sharedAddress].swapTokenRecievedAmount -= tokenSentAmount;
tokenOwners[tokenIdSent][msg.sender] -= tokenSentAmount;
tokenOwners[tokenIdSent][counterParty] += tokenSentAmount;


pendingStatus = 0;

}

function quitSwap(
address sharedAddress, 
uint256 amountSent, 
uint256 tokenIdSent, 
uint256 tokenSentAmount) public {

require(swapProposals[sharedAddress].swapAmountSent == amountSent && swapProposals[sharedAddress].swapTokenSentId == tokenIdSent && swapProposals[sharedAddress].swapTokenSentAmount == tokenSentAmount);
require(pendingStatus == 1);
swapProposals[sharedAddress].swapAmountSent -= amountSent;
balances[msg.sender] += amountSent; 
tokenOwners[tokenIdSent][msg.sender] += tokenSentAmount;
swapProposals[sharedAddress].swapTokenSentId = 0;
swapProposals[sharedAddress].swapTokenSentAmount = 0;
swapProposals[sharedAddress].swapTokenRecievedId = 0;
swapProposals[sharedAddress].swapTokenRecievedAmount = 0;
swapProposals[sharedAddress].swapAmountRecieved = 0;
pendingStatus = 0;

}

function withdraw(address erc20Address, uint256 amount) public {
erc20 = IERC20(erc20Address);
bool success = erc20.transfer(msg.sender, amount);
require(success, "ERC20 transfer failed");
balances[msg.sender] -= amount;
}

function withdraw_token(address erc1155Address, uint256 tokenId, uint256 amount) public {
erc1155 = IERC1155(erc1155Address);
erc1155.safeTransferFrom(address(this), msg.sender, tokenId, amount, "");

tokenOwners[tokenId][msg.sender] -= amount;

}
}
