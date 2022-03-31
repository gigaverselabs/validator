const fs = require('fs');
const Web3 = require('web3');

const { sign, recover } = require('eth-lib/lib/account');

const config = require('../config');
const evm_vault_abi = require('../defs/evm_vault')


global.fetch = require('node-fetch').default;

//WEB3 INIT
const web3 = new Web3(config.EVM_ENDPOINT);
const vaultContract = new web3.eth.Contract(evm_vault_abi.ABI, config.EVM_VAULT_ADDRESS);

// const getActor = require('../utils/common');



//IC INIT
var keyData = fs.readFileSync('../key.json', 'utf8');
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

const { Principal } = require('@dfinity/principal');


// const http = new HttpAgent({ identity: key, host: signature_vault_config.ENDPOINT });
// http.fetchRootKey();

// const ic_vault = Actor.createActor(ic_vault_config.IDL, {
//     agent: http,
//     canisterId: ic_vault_config.ADDRESS,
// });

// const signature_vault = Actor.createActor(signature_vault_config.IDL, {
//     agent: http,
//     canisterId: signature_vault_config.ADDRESS,
// });





function generate_signature(block, tokenId) {
    const account = web3.eth.accounts.privateKeyToAccount('0x' + config.EVM_KEY);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    let hash =

        web3.utils.soliditySha3(
            { type: 'string', value: 'withdrawERC721' },
            { type: 'uint256', value: block }, //Withdrawal ID
            { type: 'address', value: '0x5b8ee6e5BD49812bf25c12dC1995217304f2b21B' }, //User for which token should be withdrawn
            { type: 'address', value: '0xdfcbcc1d5333c95f88ca869d56caa308c1c30b77' }, //Token contract address
            { type: 'uint256', value: tokenId }
        );
    // web3.eth.abi.encodeParameters(
    //     ['string','uint256','address','address','uint256'], 
    //     [
    //         'withdrawERC721', 
    //         block, //Withdrawal ID
    //         '0x5b8ee6e5BD49812bf25c12dC1995217304f2b21B', //User for which token should be withdrawn
    //         '0xdfcbcc1d5333c95f88ca869d56caa308c1c30b77', //Token contract address
    //         tokenId] //Token Id
    //     );

    // abi.encodePacked(
    //     "withdrawERC721",
    //     _withdrawalId,
    //     _user,
    //     _token,
    //     _tokenId
    // )

    // var hash = web3.utils.soliditySha3(message);
    console.log(hash);

    // var sig_job = web3.eth.sign(hash, account.address);
    // var signature = await sig_job;

    let signature = sign(hash, '0x' + config.EVM_KEY);
    console.log("Signature: " + signature);

    // var recovered = recover(hash, signature);

    // console.log(recovered);
    // console.log(account.address);

    // let call = vaultContract.methods.verifySignatures(hash, signature);

    // let result = await call.call();

    // console.log(result);

    return signature;
}

async function storeSignature(tx, owner, token, token_id, sig, direction, block) {
    let result = await signature_vault.store_signature(tx, owner, token, token_id, web3.utils.hexToBytes(sig), direction, block);
    console.log(result);
};


async function process_token_burn(token_id) {

    let block_id = 2;


    let owner = Principal.from("ucoje-n5scm-5ag2l-xpy42-o56he-nu5jr-iq3vm-25e7q-tuq5y-i7vpi-qae");
    let token = "0xdfcbcc1d5333c95f88ca869d56caa308c1c30b77";

    let tx = web3.utils.sha3(block_id+token+owner.toString());

    let signature = generate_signature(block_id, token_id);
    let direction = { outgoing: null };

    console.log("Tx: "+tx);

    let result = await storeSignature(tx, owner, token, token_id, signature, direction, block_id);
}


// generate_signature(1, 908);
process_token_burn(909);

// var lastBlock = 0;
var processingBlocks = false;

function loadLastBlock() {
    try {
        let raw = fs.readFileSync('lastblock_ic', 'utf8');
        if (raw.length > 0) {
            lastBlock = parseInt(raw);
            console.log('Loaded last block: ' + lastBlock);
        }
    } catch (e) {

    }
}

async function scanForChanges() {
    if (processingBlocks) return;
    processingBlocks = true;

    let actor = getActor(true, config.IC_TOKEN_CANISTER,)

    processingBlocks = false;
}

// setInterval(scanForChanges, 3000);