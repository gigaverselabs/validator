const fs = require('fs');
const Web3 = require('web3');
const { Ed25519KeyIdentity } = require('@dfinity/identity');
const { Actor, HttpAgent } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const config = require('../config');
const evm_vault_abi = require('../defs/evm_vault')
const erc721_abi = require('../defs/erc721')
const ic_token_idl = require('../defs/giga721')
const { Multicall } = require('ethereum-multicall');
const { BigNumber } = require("bignumber.js");

global.fetch = require('node-fetch').default;

//WEB3 INIT
const web3 = new Web3(config.EVM_ENDPOINT);
const tokenContract = new web3.eth.Contract(erc721_abi.ABI, config.EVM_TOKEN_ADDRESS);
const multicall = new Multicall({ web3Instance: web3, tryAggregate: true });

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

    let contractCallContext = {
        reference: 'owners',
        contractAddress: config.EVM_TOKEN_ADDRESS,
        abi: erc721_abi.ABI,
        calls: []
    };

    for (var i = 0; i < evm_tokens_balance; i++) {
        let item = {
            reference: i, 
            methodName: 'tokenOfOwnerByIndex', 
            methodParameters: [config.EVM_VAULT_ADDRESS, i]
        }

        contractCallContext.calls.push(item);
    }

    let evm_data = await multicall.call([contractCallContext]);

    let owners = evm_data.results.owners;

    for (let i in owners.callsReturnContext) {
        let item = owners.callsReturnContext[i];

        let id = Number(BigNumber(item.returnValues[0].hex))
        evm_tokens.push(id);
    }

    let ic_tokens = await ic_token.tokens();
    let user_tokens = await ic_token.user_tokens(Principal.fromText('tjmfs-7x7vu-s2eyg-llply-srexz-zzgcn-afk33-tiaf7-i2gey-o6tcw-sae'));

    debugger;

    console.log("Ic: "+ic_tokens.length);

    console.log("Diff: "+(evm_tokens.length - ic_tokens.length));

    evm_tokens.forEach((x) => {
        if (ic_tokens.indexOf(x) == -1) {
            console.log(x);
        }
    })
}

compare_chains();