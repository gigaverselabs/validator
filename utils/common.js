import { Actor, HttpAgent } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import fetch from 'node-fetch';
import fs from 'fs';

global.fetch = fetch;

var keyData = fs.readFileSync('../key.json', 'utf8');
var key = Ed25519KeyIdentity.fromJSON(keyData);
console.log("Loaded principal: " + key.getPrincipal().toString())

// function getCanisterId(useProd, name) {
//     let canisterId = null;

//     if (useProd) {
//         var data = JSON.parse(fs.readFileSync("../canister_ids.json"))
//         canisterId = data[name]["ic"];

//     } else {
//         var data = JSON.parse(fs.readFileSync("../.dfx/local/canister_ids.json"))
//         canisterId = data[name]["local"];
//     }

//     console.log("Token Canister Id: " + canisterId);
//     return canisterId;
// }

//Returns actor for token canister
export function getActor(useProd, canisterId, idlFactory) {

    let httpAgent = null;
    // let canisterId = getCanisterId(useProd);

    if (useProd) {
        var host = "https://boundary.ic0.app/"; //ic

        httpAgent = new HttpAgent({ identity: key, host });
    } else {
        const host = "http://127.0.0.1:8000"; //local

        httpAgent = new HttpAgent({ identity: key, host });
        httpAgent.fetchRootKey();
    }

    const actor = Actor.createActor(idlFactory, {
        agent: httpAgent,
        canisterId: canisterId,
    });

    return actor;
}