# Check EscrowShield Member Registered Public Key

This small script in index.js checks if an account public key is registered in the EscrowShield 
contract. This is necessary for transfers. The sender needs to know the receipient's public key 
to encrypt the commitment. Starlight uses ECDH to it. The keys are based o Baby JubJub Elliptic Curve -
https://docs.iden3.io/publications/pdfs/Baby-Jubjub.pdf

## Usage

Adjust .env file and index.js with RPC Url data, EscrowShield contract, sender, receipient addresses. Then: 

```shell
npm install
node index.js
```
