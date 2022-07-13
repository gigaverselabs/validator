import { createContext, useContext, useState } from "react";
import plugWallet from "./wallet/plug";
import infinityWallet from "./wallet/infinity";

import canisters from './canisters'
import config from '../../config';


// Provider hook that creates auth object and handles state
export function useProvideAuth() {
  const [wallet, setWallet] = useState(undefined);

  const [principal, setPrincipal] = useState(undefined);
  const [agent, setAgent] = useState(undefined);
	const [showModal, setShowModal] = useState(false)

  const usePlug = async function () {
    const wlt = plugWallet();

    const whitelist = [
      config.IC_SIG_CANISTER,
      config.IC_VAULT_CANISTER,
      config.IC_TOKEN_CANISTER
    ];

    await wlt.logIn(whitelist)
    setWallet(wlt)
  }

  const useInfinity = async function () {
    const wlt = infinityWallet();

    const whitelist = [
      config.IC_SIG_CANISTER,
      config.IC_VAULT_CANISTER,
      config.IC_TOKEN_CANISTER
    ];
    
    await wlt.logIn(whitelist)
    setWallet(wlt)
  }
  
	const login = function login() {
		setShowModal(true);
	}

  const logout = function logout() {
		wallet.logOut();
	}

  function get() {
    return {
      showModal: showModal,
      setShowModal,

      setPrincipal,
      principal: principal,
      
      setAgent,
      agent: agent,
      
      wallet,

      login,
      logout,

      usePlug,
      useInfinity,
    };
  }

  return get();
}

const authContext = createContext(null);
export let auth;

export function ProvideAuth({ children }) {
  auth = useProvideAuth();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

export const useAuth = () => {
  return useContext(authContext);
};
