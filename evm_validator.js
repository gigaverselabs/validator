const fs = require('fs');
const Web3 = require('web3');
const sigUtil = require('@metamask/eth-sig-util');
const { Ed25519KeyIdentity } = require('@dfinity/identity');
const { Actor, HttpAgent, Principal } = require('@dfinity/agent');

const vault_config = require('./vault_config');
const ic_vault_config = require('./ic_vault_config');

global.fetch = require('node-fetch').default;

//WEB3 INIT
const web3 = new Web3(vault_config.ENDPOINT);
const vaultContract = new web3.eth.Contract(vault_config.ABI, vault_config.ADDRESS);

//IC INIT
var keyData = fs.readFileSync('key.json', 'utf8');
var key = Ed25519KeyIdentity.fromJSON(keyData);

const http = new HttpAgent({ identity: key, host: ic_vault_config.ENDPOINT });
http.fetchRootKey();

const actor = Actor.createActor(ic_vault_config.IDL, {
    agent: http,
    canisterId: ic_vault_config.ADDRESS,
  });

async function scanForDeposits() {
    let events = await vaultContract.getPastEvents('TokenDeposited');

    if (events.length > 0) {
        for (ev in events) {
            let item = events[ev];

            let token = item.returnValues._tokenAddress;
            let token_id = item.returnValues._tokenNumber;

            let result = await actor.withdraw_nft(token, parseInt(token_id), "");
        }
    }
}

async function testIcVault() {
    let count = await actor.deposit_count();
    console.log(count);
}

// testIcVault();

setInterval(scanForDeposits, 1500);