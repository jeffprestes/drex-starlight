#!/bin/sh
set -e

npx hardhat run scripts/deploy-complete.js --network $1