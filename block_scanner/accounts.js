const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3();

const privateKey = fs.readFileSync('../eth_key');
const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
console.log("Account: " + account.address);

//IC INIT
const { Ed25519KeyIdentity } = require('@dfinity/identity');
var keyData = fs.readFileSync('../ic_key', 'utf8');
var key = Ed25519KeyIdentity.fromJSON(keyData);
var principal = key.getPrincipal();
console.log("Principal: " + principal.toString());