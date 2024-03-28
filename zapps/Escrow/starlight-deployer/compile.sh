#!/bin/sh
set -e

cp -R ../contracts/* ./contracts/

npx hardhat compile