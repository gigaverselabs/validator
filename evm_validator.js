const fs = require('fs');
const Web3 = require('web3');
const sigUtil = require('@metamask/eth-sig-util');
const { Ed25519KeyIdentity } = require('@dfinity/identity');
const { Actor, HttpAgent, Principal } = require('@dfinity/agent');

const vault_config = require('./vault_config');
const ic_vault_config = require('./ic_vault_config');
const signature_vault_config = require('./signature_vault_config');

global.fetch = require('node-fetch').default;

//WEB3 INIT
const web3 = new Web3(vault_config.ENDPOINT);
const vaultContract = new web3.eth.Contract(vault_config.ABI, vault_config.ADDRESS);

//IC INIT
var keyData = fs.readFileSync('key.json', 'utf8');
var key = Ed25519KeyIdentity.fromJSON(keyData);
var principal = key.getPrincipal();

const http = new HttpAgent({ identity: key, host: ic_vault_config.ENDPOINT });
http.fetchRootKey();

const ic_vault = Actor.createActor(ic_vault_config.IDL, {
    agent: http,
    canisterId: ic_vault_config.ADDRESS,
});

const signature_vault = Actor.createActor(signature_vault_config.IDL, {
    agent: http,
    canisterId: signature_vault_config.ADDRESS,
});

async function scanForDeposits() {
    let events = await vaultContract.getPastEvents('TokenDeposited');

    if (events.length > 0) {
        for (ev in events) {
            let item = events[ev];

            let token = item.returnValues._tokenAddress;
            let sidechainToken = item.returnValues._sidechainAddress;
            let token_id = parseInt(item.returnValues._tokenNumber);

            let owner = item.returnValues._sidechainAddress;

            let signature = await createSignature(owner, sidechainToken, token_id);

            let store = await storeSignature(item.transactionHash, signature);

            await getSignature(item.transactionHash);

            // await withdrawNft(token, token_id, "");
        }
    }
}

async function storeSignature(tx, sig) {
    let result = await signature_vault.store_signature(tx, web3.utils.hexToBytes(sig));
    console.log(result);
};

async function getSignature(tx) {
    let raw_sig = await signature_vault.get_signature(tx);
    let sig = web3.utils.bytesToHex(raw_sig);
    console.log(sig);

    return sig;
}

async function createSignature(owner, token, token_id) {
    let message = "withdraw_nft," + owner + "," + token + "," + token_id;
    var hash = web3.utils.soliditySha3(message);

    const account = web3.eth.accounts.privateKeyToAccount('0x' + ic_vault_config.privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    console.log(account.address);
    var signature = await web3.eth.sign(hash, account.address);

    console.log(signature);

    return signature;
}

async function withdrawNft(token, token_id, signature) {
    let result = await ic_vault.withdraw_nft(token, token_id, signature);
    console.log(result);
}

// createSignature("tushn-jfas4-lrw4y-d3hun-lyc2x-hr2o2-2spfo-ak45s-jzksj-fzvln-yqe", "rwlgt-iiaaa-aaaaa-aaaaa-cai", 1);

// async function testIcVault() {
//     let count = await actor.deposit_count();
//     console.log(count);
// }

// testIcVault();

// setInterval(scanForDeposits, 1500);

// withdrawNft("rrkah-fqaaa-aaaaa-aaaaq-cai",10, "");

scanForDeposits();