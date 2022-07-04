const fs = require('fs');
const Web3 = require('web3');
const { Ed25519KeyIdentity } = require('@dfinity/identity');
const { Actor, HttpAgent } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const config = require('../config');
const evm_vault_abi = require('../defs/evm_vault')
const erc721_abi = require('../defs/erc721')
const ic_token_idl = require('../defs/giga721')

global.fetch = require('node-fetch').default;

//WEB3 INIT
const web3 = new Web3(config.EVM_ENDPOINT);
const tokenContract = new web3.eth.Contract(erc721_abi.ABI, config.EVM_TOKEN_ADDRESS);


//IC INIT
var keyData = fs.readFileSync('../ic_key', 'utf8');
var key = Ed25519KeyIdentity.fromJSON(keyData);
var principal = key.getPrincipal();
console.log("Using principal: " + principal.toString());

const http = new HttpAgent({ identity: key, host: config.IC_ENDPOINT });
const ic_token = Actor.createActor(ic_token_idl.IDL, {
    agent: http,
    canisterId: config.IC_TOKEN_CANISTER,
});


async function compare_chains() {
    let evm_tokens_balance = await tokenContract.methods.balanceOf(config.EVM_VAULT_ADDRESS).call();

    console.log("Evm: "+evm_tokens_balance);

    let evm_tokens = [];
    for (var i = 0; i < evm_tokens_balance; i++) {
      const token = await tokenContract.methods.tokenOfOwnerByIndex(config.EVM_VAULT_ADDRESS, i).call();

      evm_tokens.push(Number(token));
    }

    let ic_tokens = await ic_token.tokens();

    console.log("Ic: "+ic_tokens.length);

    console.log("Diff: "+(evm_tokens.length - ic_tokens.length));

    evm_tokens.forEach((x) => {
        if (ic_tokens.indexOf(x) == -1) {
            console.log(x);
        }
    })
}

compare_chains();

// //IC INIT
// var keyData = fs.readFileSync('../ic_key', 'utf8');
// var key = Ed25519KeyIdentity.fromJSON(keyData);
// var principal = key.getPrincipal();
// console.log("Using principal: " + principal.toString());

// const http = new HttpAgent({ identity: key, host: config.IC_ENDPOINT });
// // http.fetchRootKey();

// const signature_vault_idl = require('../defs/signature_vault');
// const ic_vault_idl = require('../defs/ic_vault');

// const ic_vault = Actor.createActor(ic_vault_idl.IDL, {
//     agent: http,
//     canisterId: config.IC_VAULT_CANISTER,
// });

// const signature_vault = Actor.createActor(signature_vault_idl.IDL, {
//     agent: http,
//     canisterId: config.IC_SIG_CANISTER,
// });

// const privateKey = fs.readFileSync('../eth_key');

// var lastBlock = 0;
// var processingBlocks = false;

// function loadLastBlock() {
//     try {
//         let raw = fs.readFileSync('lastblock_evm', 'utf8');
//         if (raw.length > 0) {
//             lastBlock = parseInt(raw);
//             console.log('Loaded last block: ' + lastBlock);
//         }
//     } catch (e) {

//     }
// }

// function saveLastBlock() {
//     fs.writeFileSync('lastblock_evm', lastBlock + "");
// }
// async function processBlock(block_id_from, block_id_to) {
//     let events = await vaultContract.getPastEvents('TokenDeposited', {
//         fromBlock: block_id_from-1,
//         toBlock: block_id_to
//     });

//     if (events.length > 0) {
//         console.log("Found events: " + events.length);

//         for (ev in events) {
//             let item = events[ev];

//             let token = item.returnValues._tokenAddress;
//             let sidechainToken = item.returnValues._sidechainAddress;
//             let token_id = parseInt(item.returnValues._tokenNumber);

//             let owner = item.returnValues._sidechainOwner;
//             console.log("Owner: " + owner);
//             console.log("Block: " + item.blockNumber);
//             console.log("IC Token: " + sidechainToken);
//             console.log("Token No: " + token_id);

//                 let owner_principal = Principal.fromText(owner);
//                 // let sidechain_addr = Principal.fromText(sidechainToken);

//                 let signature = await createSignature(owner, sidechainToken, token_id);

//                 console.log("Tx: " + item.transactionHash);
//                 let direction = { incoming: null };
//                 try {
                 
//                 let store = await storeSignature(item.transactionHash, owner_principal, sidechainToken, token_id, signature, direction, Number(item.blockNumber));
//                 } catch (e) {
//                     console.log("Error on signature storage: "+e.message);
//                 }

//                 // await getSignature(item.transactionHash);
//         }
//     } else {
//     }
// }

// async function scanForDeposits() {
//     if (processingBlocks) return;

//     processingBlocks = true;

//     try {
//         let block = await (web3.eth.getBlock("latest"));

//         if (lastBlock == 0) {
//             lastBlock = block.number - 10;
//         }

//         let events = await vaultContract.getPastEvents('TokenDeposited', {
//             fromBlock: lastBlock,
//             toBlock: block.number-5
//         });


//         if (events.length > 0) {
//             console.log("Found events: " + events.length);

//             for (ev in events) {
//                 let item = events[ev];

//                 let token = item.returnValues._tokenAddress;
//                 let sidechainToken = item.returnValues._sidechainAddress;
//                 let token_id = parseInt(item.returnValues._tokenNumber);

//                 let owner = item.returnValues._sidechainOwner;
//                 console.log("Owner: " + owner);
//                 console.log("Block: " + item.blockNumber);
//                 console.log("IC Token: " + sidechainToken);
//                 console.log("Token No: " + token_id);

//                     let owner_principal = Principal.fromText(owner);
//                     // let sidechain_addr = Principal.fromText(sidechainToken);

//                     let signature = await createSignature(owner, sidechainToken, token_id);

//                     console.log("Tx: " + item.transactionHash);
//                     let direction = { incoming: null };
//                     try {
                     
//                     let store = await storeSignature(item.transactionHash, owner_principal, sidechainToken, token_id, signature, direction, Number(item.blockNumber));
//                     } catch (e) {
//                         console.log("Error on signature storage: "+e.message);
//                     }

//                     // await getSignature(item.transactionHash);

//                 lastBlock = item.blockNumber + 1;
//                 saveLastBlock();
//             }
//         } else {
//             lastBlock = block.number - 4;
//             saveLastBlock();
//         }
//     } catch (e) {
//         console.error(e.message);
//     }
//     processingBlocks = false;
// }

// //tx - tx hash, owner - IC Principal, sig - signature
// async function storeSignature(tx, owner, token, token_id, sig, direction, block) {
//     let result = await signature_vault.store_signature(tx, owner, token, token_id, web3.utils.hexToBytes(sig), direction, block);
//     console.log(result);

//     return result;
// };

// async function getSignature(tx) {
//     let raw_sig = await signature_vault.get_signature(tx);
//     console.log(raw_sig);

//     return raw_sig;
// }

// async function createSignature(owner, token, token_id) {
//     let message = "withdraw_nft," + owner + "," + token + "," + token_id;
//     var hash = web3.utils.soliditySha3(message);

//     const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
//     web3.eth.accounts.wallet.add(account);
//     web3.eth.defaultAccount = account.address;
//     // console.log(account.address);
//     var signature = await web3.eth.sign(hash, account.address);

//     // console.log(signature);

//     return signature;
// }

// // loadLastBlock();
// // setInterval(scanForDeposits, 3000);

// // scanForDeposits();