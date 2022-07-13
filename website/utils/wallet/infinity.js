import { auth } from "../auth";

export default function inifinityWallet() {
    let agent = undefined;

    async function getActor(canisterId, idl) {
      const actor = await window.ic.infinityWallet.createActor({
        canisterId,
        interfaceFactory: idl,
      });

      return actor
    }

    async function logIn(whitelist) {
      if (window.ic === undefined) {
        window.open('https://infinityWallet.ooo/', '_blank')?.focus();
        return
      }

      const publicKey = await window.ic.infinityWallet.requestConnect({whitelist});


      const principal = await window.ic.infinityWallet.getPrincipal();
      
      console.log(principal);

      auth.setAgent(agent);
      auth.setPrincipal(principal);
    }

    function logOut() {
      auth.setAgent(undefined);
      auth.setPrincipal(undefined);
    }

    async function requestTransfer(data){
      if (window.ic === undefined) return;

      return await window.ic.infinityWallet.requestTransfer(data);
    }
    
    async function getBalance() {
      const result = await window.ic.infinityWallet.requestBalance();

      return result;
    }

    return {
        name: 'infinity',
        logIn,
        logOut,
        getActor,
        requestTransfer,
        getBalance
      };
}