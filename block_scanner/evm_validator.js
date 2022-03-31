const fs = require('fs');
const Web3 = require('web3');
const { Ed25519KeyIdentity } = require('@dfinity/identity');
const { Actor, HttpAgent } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const config = require('../config');

const evm_vault_abi = require('../defs/evm_vault')

// const ic_config = require('./ic_config');
// const vault_config = require('./vault_config');
// const ic_vault_config = require('./ic_vault_config');
// const signature_vault_config = require('./signature_vault_config');

global.fetch = require('node-fetch').default;

//WEB3 INIT
const web3 = new Web3(config.EVM_ENDPOINT);
const vaultContract = new web3.eth.Contract(evm_vault_abi.ABI, config.EVM_VAULT_ADDRESS);

//IC INIT
var keyData = fs.readFileSync('../key.json', 'utf8');
var key = Ed25519KeyIdentity.fromJSON(keyData);
var principal = key.getPrincipal();
console.log("Using principal: " + principal.toString());

const http = new HttpAgent({ identity: key, host: config.IC_ENDPOINT });
// http.fetchRootKey();

const signature_vault_idl = require('../defs/signature_vault');
const ic_vault_idl = require('../defs/ic_vault');

const ic_vault = Actor.createActor(ic_vault_idl.IDL, {
    agent: http,
    canisterId: config.IC_VAULT_CANISTER,
});

const signature_vault = Actor.createActor(signature_vault_idl.IDL, {
    agent: http,
    canisterId: config.IC_SIG_CANISTER,
});

var lastBlock = 0;
var processingBlocks = false;

function loadLastBlock() {
    try {
        let raw = fs.readFileSync('lastblock_evm', 'utf8');
        if (raw.length > 0) {
            lastBlock = parseInt(raw);
            console.log('Loaded last block: ' + lastBlock);
        }
    } catch (e) {

    }
}

function saveLastBlock() {
    console.log("Saving last block")
    fs.writeFileSync('lastblock', lastBlock + "");
}

async function scanForDeposits() {
    if (processingBlocks) return;

    processingBlocks = true;

    try {
        let block = await (web3.eth.getBlock("latest"));
        console.log(block.number);

        if (lastBlock == 0) {
            lastBlock = block.number - 10;
        }

        let events = await vaultContract.getPastEvents('TokenDeposited', {
            fromBlock: lastBlock,
            toBlock: block.number-5
        });

        console.log(events.length);

        if (events.length > 0) {
            console.log("Found events: " + events.length);

            for (ev in events) {
                let item = events[ev];

                let token = item.returnValues._tokenAddress;
                let sidechainToken = item.returnValues._sidechainAddress;
                let token_id = parseInt(item.returnValues._tokenNumber);

                let owner = item.returnValues._sidechainOwner;
                console.log("Owner: " + owner);
                console.log("IC Token: " + sidechainToken);
                console.log("Token No: " + token_id);

                try {
                    let owner_principal = Principal.fromText(owner);
                    let sidechain_addr = Principal.fromText(sidechainToken);

                    let signature = await createSignature(owner, sidechainToken, token_id);

                    console.log("Tx: " + item.transactionHash);

                    let store = await storeSignature(item.transactionHash, owner_principal, sidechain_addr, token_id, signature);

                    await getSignature(item.transactionHash);
                } catch (e) {
                    console.log(e.message);
                }

                lastBlock = item.blockNumber + 1;
                saveLastBlock();
            }
        } else {
            lastBlock = block.number - 4;
            saveLastBlock();
        }
    } catch (e) {
        console.error(e.message);
    }
    processingBlocks = false;
}

//tx - tx hash, owner - IC Principal, sig - signature
async function storeSignature(tx, owner, token, token_id, sig) {
    let result = await signature_vault.store_signature(tx, owner, token, token_id, web3.utils.hexToBytes(sig));
    console.log(result);
};

async function getSignature(tx) {
    let raw_sig = await signature_vault.get_signature(tx);
    console.log(raw_sig);

    return raw_sig;
}

async function createSignature(owner, token, token_id) {
    let message = "withdraw_nft," + owner + "," + token + "," + token_id;
    var hash = web3.utils.soliditySha3(message);

    const account = web3.eth.accounts.privateKeyToAccount('0x' + ic_config.icVaultPrivatKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    // console.log(account.address);
    var signature = await web3.eth.sign(hash, account.address);

    // console.log(signature);

    return signature;
}

loadLastBlock();
setInterval(scanForDeposits, 3000);

// scanForDeposits();