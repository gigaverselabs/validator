import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

import React from "react";
import Web3 from "web3";
import { useState, useEffect } from 'react';

import token_config from '../token_config';
import vault_config from '../vault_config';

import sign_vault_config from '../signature_vault_config';
import ic_vault_config from '../ic_vault_config';
import ic_token_config from '../ic_token_config';

export default function Home() {

  // FOR WALLET
  const [signedIn, setSignedIn] = useState(false)
  const [walletAddress, setWalletAddress] = useState(null)
  const [chainId, setChainId] = useState(null);

  // FOR IC
  const [principalId, setPrincipalId] = useState(null);
  const [signVault, setSignVault] = useState(null);
  const [icVault, setIcVault] = useState(null);
  const [icToken, setIcToken] = useState(null);

  // FOR MINTING
  const [tokenContract, setTokenContract] = useState(null)
  const [vaultContract, setVaultContract] = useState(null)

  // INFO FROM SMART Contract
  const [ownedTokens, setOwnedTokens] = useState([]);
  const [icOwnedTokens, setIcOwnedTokens] = useState([]);
  const [pendingTx, setPendingTx] = useState([]);


  const NETWORK_ID = 3; //Ropsten

  useEffect(async () => {
    signIn()
  }, [])

  async function signIn() {
    if (typeof window.web3 !== 'undefined') {
      // Use existing gateway
      window.web3 = new Web3(window.ethereum);

    } else {
      alert("No Ethereum interface injected into browser. Read-only access");
    }

    window.ethereum.enable()
      .then(function (accounts) {
        let wallet = accounts[0]

        // checkEligible(wallet);

        window.web3.eth.getChainId()
          .then((chainId) => {
            if (chainId != NETWORK_ID) {
              alert("You are not on ropsten chain. Change network to ropsten in metamask or use button 'ROPSTEN'");
            } else {
              setChainId(chainId);
              setWalletAddress(wallet);
              setSignedIn(true);

              callContractData(wallet);
            }
          });
      })
      .catch(function (error) {
        // Handle error. Likely the user rejected the login
        console.error(error)
      })
  }

  async function switchNetwork() {
    const chainId = '0x03'; // Ropsten
    const rpc = 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
    const chainName = 'Ropsten';
    const block = 'https://ropsten.etherscan.io';

    // const chainId = '0x539'; //Ganache
    // const rpc = 'HTTP://127.0.0.1:7545';
    // const chainName = 'Ganache';
    // const block = '';
    try {
      let result = await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainId }],
      });

      signIn();
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          let result = await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainId,
              rpcUrls: [rpc],
              chainName: chainName,
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",// 2-6 characters long
                decimals: 18
              },
              blockExplorerUrls: [block]
            }],
          });

          signIn();
        } catch (addError) {
          // handle "add" error
        }
      }
    }
  }

  async function callContractData() {

    const tokenContract = new window.web3.eth.Contract(token_config.ABI, token_config.ADDRESS)
    setTokenContract(tokenContract)

    const vaultContract = new window.web3.eth.Contract(vault_config.ABI, vault_config.ADDRESS);
    setVaultContract(vaultContract);
  }

  async function getOwnedTokens() {
    if (tokenContract === null) return;
    if (walletAddress === null) return;

    const ownedTokens = await tokenContract.methods.balanceOf(walletAddress).call();
    console.log("Owned tokens: " + ownedTokens);

    let tokens = [];

    for (var i = 0; i < ownedTokens; i++) {
      const token = await tokenContract.methods.tokenOfOwnerByIndex(walletAddress, i).call();

      tokens.push(token);
    }
    setOwnedTokens(tokens);
  }

  useEffect(() => getOwnedTokens(), [tokenContract]);

  async function claimToken() {
    const gasAmount = await tokenContract.methods.mint().estimateGas({ from: walletAddress, value: 0 })

    console.log("estimated gas", gasAmount)

    tokenContract.methods
      .mint()
      .send({ from: walletAddress, value: 0, gas: String(gasAmount) })
      .on('transactionHash', function (hash) {
        console.log("transactionHash", hash)
        getOwnedTokens();
      })
      .on('confirmation', function (no) {
        if (no == 2) {
          getOwnedTokens();
        }
      })
  }

  async function plugConnect() {
    // Canister Ids
    // const nnsCanisterId = 'qoctq-giaaa-aaaaa-aaaea-cai'

    // Whitelist
    const whitelist = [
      sign_vault_config.ADDRESS,
      ic_vault_config.ADDRESS,
      ic_token_config.ADDRESS
    ];

    // Host
    const host = sign_vault_config.ENDPOINT;

    // const result = await window.ic.plug.isConnected();

    // if (!result) {

    // Make the request
    const result = await window.ic.plug.requestConnect({
      whitelist,
      host,
    });

    const connectionState = result ? "allowed" : "denied";
    console.log(`The Connection was ${connectionState}!`);
    // } else {
    //   console.log(`Plug already connected!`);
    // }
    // // Get the user principal id
    const principalId = await window.ic.plug.agent.getPrincipal();
    console.log(`Plug's user principal Id is ${principalId}`);
    window.ic.plug.agent.fetchRootKey();

    setPrincipalId(principalId);


    // Create an actor to interact with the NNS Canister
    // we pass the NNS Canister id and the interface factory
    const sign_vault = await window.ic.plug.createActor({
      canisterId: sign_vault_config.ADDRESS,
      interfaceFactory: sign_vault_config.IDL,
    });

    setSignVault(sign_vault);


    // Create an actor to interact with the NNS Canister
    // we pass the NNS Canister id and the interface factory
    const ic_vault = await window.ic.plug.createActor({
      canisterId: ic_vault_config.ADDRESS,
      interfaceFactory: ic_vault_config.IDL,
    });

    setIcVault(ic_vault);

    // Create an actor to interact with the NNS Canister
    // we pass the NNS Canister id and the interface factory
    const ic_token = await window.ic.plug.createActor({
      canisterId: ic_token_config.ADDRESS,
      interfaceFactory: ic_token_config.IDL,
    });

    setIcToken(ic_token);
  }

  async function getPendingTx() {
    if (signVault === null) return;
    const pending_tx = await signVault.get_pending_tx(principalId);
    console.log("Pending Signature count: " + pending_tx.length);
    setPendingTx(pending_tx);
  }

  //Check for pending transactions in ic_vault every 5 seconds 
  useEffect(() => {
    if (signVault === null) return;

    const timer2 = setInterval(() => {
      getPendingTx();
      getIcTokens();
    }, 5000);
    return () => clearTimeout(timer2);
  }, [signVault]);
  
  async function bridgeToken() {
    if (ownedTokens.length === 0) return;

    let approved = await tokenContract.methods.isApprovedForAll(walletAddress, vault_config.ADDRESS)
      .call();

    if (!approved) {
      //Allow vault contract to store NFT from EVM
      let gasAmount = await tokenContract.methods.setApprovalForAll(vault_config.ADDRESS, true).estimateGas({ from: walletAddress, value: 0 })
      let result = await tokenContract.methods.setApprovalForAll(vault_config.ADDRESS, true).send({
        from: walletAddress,
        gas: gasAmount
      });

      console.log(result);
    }
    //
    let tokenId = ownedTokens[0];

    let gasAmount = await vaultContract.methods.depositERC721For(
      principalId.toString(),
      token_config.ADDRESS,
      tokenId
    ).estimateGas({ from: walletAddress, value: 0 })

    let result = await vaultContract.methods.depositERC721For(
      principalId.toString(),
      token_config.ADDRESS,
      tokenId
    ).send({
      from: walletAddress,
      gas: gasAmount
    });

    console.log(result);

    getPendingTx();
  }

  async function withdrawTokens() {
    for (var i = 0; i < pendingTx.length; i++) {
      let tx = pendingTx[i];

      let token = tx.token;
      let token_id = tx.tokenId;
      let signature = tx.signature;

      let result = await icVault.withdraw_nft(token.toString(), token_id, signature);
      console.log(result);

      let result2 = await signVault.tx_complete(tx.tx);
      console.log(result2);
    }

    getIcTokens();
  }

  useEffect(() => {
    getIcTokens();
  }, [icToken]);

  async function getIcTokens() {
    if (icToken === null) return;

    let result = await icToken.user_tokens(principalId);

    console.log("IC Tokens: " + result.length);
    setIcOwnedTokens(result);
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Giga Bridge</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to Giga Bridge!
        </h1>

        {
          !signedIn ?
            <p className={styles.description}>
              Step 1: Connect Metamask <button onClick={signIn}>Connect</button>
            </p> :
            chainId === null ?
              <p className={styles.description}>
                Step 1: Switch to Ropsten Network
                <button onClick={switchNetwork}>ROPSTEN</button>
              </p> :
              <p className={styles.description}>
                Step 1: Complete!
                Wallet: {walletAddress}
              </p>

        }

        {
          ownedTokens == 0 ?
            <p className={styles.description}>
              Step 2: Claim Free Token on Ropsten <button onClick={claimToken}>Claim</button>
            </p>
            :
            <p className={styles.description}>
              Step 2: Complete! Your tokens: [{ownedTokens}]
            </p>
        }

        {
          principalId === null ?
            <p className={styles.description}>
              Step 3: Connect to plug wallet! <button onClick={plugConnect}>Connect!</button>
            </p>
            :
            <p className={styles.description}>
              Step 3: Complete! Princial: {principalId.toString()}
            </p>
        }

        {
          pendingTx.length === 0 ?

            (ownedTokens.length === 0 ?
            <p className={styles.description}>
            Step 4: No tokens to send
          </p>
            :
            <p className={styles.description}>
              Step 4: Send NFT to BRIDGE! <button onClick={bridgeToken}>Brige!</button>
            </p>)
            :
            <p className={styles.description}>
              Step 4: Complete! Pending withdrawals: {pendingTx.length}
            </p>
        }

        {pendingTx.length === 0 ?
          <p className={styles.description}>
            Step 5: Wait for Validator!
          </p>
          :
          <p className={styles.description}>
            Step 5: Withdraw your NFT on IC! <button onClick={withdrawTokens}>Withdraw</button>
          </p>
        }

        {
          icOwnedTokens.length === 0 ?
            <p className={styles.description}>
              Step 6: Claim your tokens on IC
            </p> :
            <p className={styles.description}>
              Step 6: Success! Your tokens: [{icOwnedTokens.join()}]
            </p>
        }
      </main>
    </div>
  )
}
