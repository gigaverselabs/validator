const fs = require('fs');
const Web3 = require('web3');
const sigUtil = require('@metamask/eth-sig-util');
const { Ed25519KeyIdentity } = require('@dfinity/identity');
const { Actor, HttpAgent } = require('@dfinity/agent');


const ic_config = require('./ic_config');
const vault_config = require('./vault_config');
const ic_vault_config = require('./ic_vault_config');
const signature_vault_config = require('./signature_vault_config');
const { Principal } = require('@dfinity/principal');

global.fetch = require('node-fetch').default;

//WEB3 INIT
const web3 = new Web3(vault_config.ENDPOINT);
const vaultContract = new web3.eth.Contract(vault_config.ABI, vault_config.ADDRESS);

//IC INIT
var keyData = fs.readFileSync('key.json', 'utf8');
var key = Ed25519KeyIdentity.fromJSON(keyData);
var principal = key.getPrincipal();
console.log(principal.toString());

const http = new HttpAgent({ identity: key, host: signature_vault_config.ENDPOINT });
// http.fetchRootKey();

const ic_vault = Actor.createActor(ic_vault_config.IDL, {
    agent: http,
    canisterId: ic_vault_config.ADDRESS,
});

const signature_vault = Actor.createActor(signature_vault_config.IDL, {
    agent: http,
    canisterId: signature_vault_config.ADDRESS,
});

async function scanForDeposits() {
    let events = await vaultContract.getPastEvents('TokenDeposited', {
        fromBlock: 0
    });

    console.log("Found events: "+events.length);

    if (events.length > 0) {
        for (ev in events) {
            let item = events[ev];

            let token = item.returnValues._tokenAddress;
            let sidechainToken = item.returnValues._sidechainAddress;
            let token_id = parseInt(item.returnValues._tokenNumber);

            let owner = item.returnValues._sidechainOwner;
            console.log("Owner: "+owner);
            console.log("IC Token: "+sidechainToken);

            try {
                let owner_principal = Principal.fromText(owner);
                let sidechain_addr = Principal.fromText(sidechainToken);

                let signature = await createSignature(owner, sidechainToken, token_id);

                console.log("Tx: "+item.transactionHash);

                let store = await storeSignature(item.transactionHash, owner_principal, sidechain_addr, token_id, signature);

                await getSignature(item.transactionHash);
            } catch (e) {
                console.log(e);
            }

            // await withdrawNft(token, token_id, "");
        }
    }
}

//tx - tx hash, owner - IC Principal, sig - signature
async function storeSignature(tx, owner, token, token_id,  sig) {
    let result = await signature_vault.store_signature(tx, owner, token, token_id, web3.utils.hexToBytes(sig));
    console.log(result);
};

async function getSignature(tx) {
    let raw_sig = await signature_vault.get_signature(tx);
    // let sig = web3.utils.bytesToHex(raw_sig);
    console.log(raw_sig);

    return raw_sig;
}

async function createSignature(owner, token, token_id) {
    let message = "withdraw_nft," + owner + "," + token + "," + token_id;
    var hash = web3.utils.soliditySha3(message);

    const account = web3.eth.accounts.privateKeyToAccount('0x' + ic_config.icVaultPrivatKey);
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

// async function testIcVault() {
//     let count = await actor.deposit_count();
//     console.log(count);
// }

// testIcVault();

// setInterval(scanForDeposits, 1500);

// withdrawNft("rrkah-fqaaa-aaaaa-aaaaq-cai",10, "");

scanForDeposits();