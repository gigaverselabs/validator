const fs = require('fs');
const Web3 = require('web3');

const { sign, recover } = require('eth-lib/lib/account');

const config = require('../config');
const evm_vault_abi = require('../defs/evm_vault')


global.fetch = require('node-fetch').default;

//WEB3 INIT
const web3 = new Web3(config.EVM_ENDPOINT);
const vaultContract = new web3.eth.Contract(evm_vault_abi.ABI, config.EVM_VAULT_ADDRESS);

//IC INIT
var keyData = fs.readFileSync('../ic_key', 'utf8');
const { Ed25519KeyIdentity } = require('@dfinity/identity');
var key = Ed25519KeyIdentity.fromJSON(keyData);
var principal = key.getPrincipal();
console.log("Using principal: " + principal.toString());

const { Actor, HttpAgent } = require('@dfinity/agent');
const http = new HttpAgent({ identity: key, host: config.IC_ENDPOINT });

const signature_vault_idl = require('../defs/signature_vault');
const signature_vault = Actor.createActor(signature_vault_idl.IDL, {
    agent: http,
    canisterId: config.IC_SIG_CANISTER,
});

const ic_token_idl = require('../defs/giga721');
const ic_token = Actor.createActor(ic_token_idl.IDL, {
    agent: http,
    canisterId: config.IC_TOKEN_CANISTER,
});

const { Principal } = require('@dfinity/principal');

const privateKey = fs.readFileSync('../eth_key');


function generate_signature(block, token_adr, tokenId, new_owner) {
    const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
    console.log('Address: '+account.address);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    let hash =
        web3.utils.soliditySha3(
            { type: 'string', value: 'withdrawERC721' },
            { type: 'uint256', value: block }, //Withdrawal ID
            { type: 'address', value: new_owner }, //User for which token should be withdrawn
            { type: 'address', value: token_adr }, //Token contract address
            { type: 'uint256', value: tokenId }
        );
    console.log('Hash: '+hash);

    let signature = sign(hash, '0x' + privateKey);
    console.log("Signature: " + signature);

    return signature;
}

async function storeSignature(tx, owner, token, token_id, sig, direction, block) {
    let result = await signature_vault.store_signature(tx, owner, token, token_id, web3.utils.hexToBytes(sig), direction, block);
    console.log(result);
};


async function process_token_burn(block, new_owner) {
    let block_id = Number(block.index);
    let owner = block.from[0];
    let token = "0xdfcbcc1d5333c95f88ca869d56caa308c1c30b77";
    let token_id = block.token_id;

    let tx = web3.utils.sha3(block_id + token + owner.toString());

    let signature = generate_signature(block_id, token, token_id, new_owner);
    let direction = { outgoing: null };

    console.log("Tx: " + tx);

    let result = await storeSignature(tx, owner, token, token_id, signature, direction, block_id);
}

async function process_block(block_id, wallet) {
    // let wallet = await signature_vault.get_wallet(block_id);
    // if (wallet.length === 0) throw new Error("No wallet found");

    // let wallet = '0x5b8ee6e5BD49812bf25c12dC1995217304f2b21B';

    let block = await ic_token.get_history_by_index(block_id);

    if (wallet[0].toString() === block[0].caller.toString()) {
        console.log("Principals match!");

        if (block[0].op.burn !== undefined) {
            //We have detected burning!
            await process_token_burn(block[0], wallet[1]);
        } else {
            throw new Error('This is not a burn!');
        }


    } else {
        throw new Error("Principals does not match!");
    }
}

function saveBlocks() {
    fs.writeFileSync('./blocks', JSON.stringify(processedBlocks));
}

function loadBlocks() {
    try {
        processedBlocks = JSON.parse(fs.readFileSync('./blocks'));

        console.log('Loaded blocks: ' + processedBlocks.length);
    } catch (e) {

    }
}

var processedBlocks = [];

var processingBlocks = false;
async function scanForDeposits() {
    if (processingBlocks) return;
    processingBlocks = true;

    try {

        let wallets = await signature_vault.get_wallets();

        wallets.forEach((w) => {
            let block = w[0];
            let wallet = w[1];

            if (processedBlocks.indexOf(block) === -1) {
                try {
                    process_block(block, wallet);
                } catch (e) {
                    console.log("Error while processing block:" + e);
                }
                processedBlocks.push(block);
                saveBlocks();
            }
        });

    } catch (e) {
        console.error(e);
    }

    processingBlocks = false;
}

generate_signature(1, '0xdFcBCc1D5333c95F88CA869D56cAA308c1C30b77', 1234, '0x3Ab0BFa6428775d9E698697955CdEFe793B5Aa98');


// loadBlocks();
// setInterval(scanForDeposits, 3000);