import { Principal } from "@dfinity/principal";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, useAuth } from "./auth";
// import { Listing_2, TokenDesc } from "./canister/icpunks_type";
// import { getCanisterIds } from "./canister/principals";

import icpunks_idl from "./idl/icpunks.did";
import ledger_idl from "./idl/ledger.did";

import canisters from './canisters'
import { getAccountIdentifier, getSubAccountArray } from "./utils";
import toast from "react-hot-toast";
// import axios from "axios";

const { Actor, HttpAgent } = require('@dfinity/agent');
const ic_agent = new HttpAgent({ host: "https://boundary.ic0.app/" });

export function useProvideState() {
    const authContext = useAuth();

    let readActorCache = {}
    function getReadActor() {
        let cid = canisters.collection;
        if (cid in readActorCache)
            return readActorCache[cid]

        const actor = Actor.createActor(icpunks_idl, {
            agent: ic_agent,
            canisterId: cid,
        });

        readActorCache[cid] = actor;

        return actor;
    }

    let tokenCache = {};
    const getTokenDetails = async (tid) => {
        if (tid in tokenCache) return tokenCache[tid];

        const ic_vault = getReadActor();

        let data = await ic_vault.data_of(Number(tid));
        tokenCache[tid] = data;
        return data;
    }

    const fetchUserTokens = async (principal) => {
        const imgBase = 'https://' + canisters.collection + '.raw.ic0.app/Token/'

        let actor = getReadActor();
        let tokens = await actor.user_tokens(principal);
        let items = [];
        for (let t in tokens) {
            let item = {
                id: tokens[t],
                name: "C4Meadow #" + tokens[t],
                rarity: null,
                image: imgBase + tokens[t],
            }
            items.push(item);
        }

        return items;
    }


    return {
        getTokenDetails,
        fetchUserTokens,
    };
}

const stateContext = createContext(null);

export function ProvideState({ children }) {
    const state = useProvideState();
    return <stateContext.Provider value={state}>{children}</stateContext.Provider>;
}

export const useLocalState = () => {
    return useContext(stateContext);
};
