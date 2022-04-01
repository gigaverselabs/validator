import React from "react";
import Web3 from "web3";
import { useState, useEffect } from 'react';

import config from '../../config';

import evm_token from '../../defs/erc721';
import evm_vault from '../../defs/evm_vault';

import sign_vault_idl from '../../defs/signature_vault';
import ic_vault_idl from '../../defs/ic_vault';
import ic_token_idl from '../../defs/giga721';

import List from '@mui/material/List';
import Card from '@mui/material/Card';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { Button, Container, Grid, Typography, ListItemButton, ListItemAvatar, Avatar, TextField, InputAdornment, LinearProgress, Box, Paper, Stack } from '@mui/material'
import toast from 'react-hot-toast';


function contains(arr, i) {
  return arr.indexOf(i) !== -1;
}

function getShortPrincipal(p) {
  return p.substring(0, 5) + '...' + p.substring(60);
}

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
  const [pendingIds, setPendingIds] = useState([]);
  const [returningIds, setReturningIds] = useState([]);


  const [isWorking, setIsWorking] = useState(false);

  const web3 = new Web3(config.EVM_ENDPOINT);
  const tokenReadonlyContract = new web3.eth.Contract(evm_token.ABI, config.EVM_TOKEN_ADDRESS)

  const NETWORK_ID = 137; //Polygon Matic

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
              alert("You are not on polygon chain. Change network to polygon in metamask or use button 'POLYGON'");
            } else {
              setChainId(chainId);
              setWalletAddress(wallet);
              setSignedIn(true);

              getEvmContracts(wallet);
            }
          });
      })
      .catch(function (error) {
        // Handle error. Likely the user rejected the login
        console.error(error)
      })
  }

  async function switchNetwork() {
    // const chainId = '0x03'; // Ropsten
    // const rpc = 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
    // const chainName = 'Ropsten';
    // const block = 'https://ropsten.etherscan.io';

    const chainId = '0x89'; // Polygon
    const rpc = 'https://polygon-rpc.com';
    const chainName = 'Polygon';
    const block = 'https://polygonscan.com';

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

  async function getEvmContracts() {

    const tokenContract = new window.web3.eth.Contract(evm_token.ABI, config.EVM_TOKEN_ADDRESS)
    setTokenContract(tokenContract)

    const vaultContract = new window.web3.eth.Contract(evm_vault.ABI, config.EVM_VAULT_ADDRESS);
    setVaultContract(vaultContract);
  }

  async function getOwnedTokens() {
    if (tokenContract === null) return;
    if (walletAddress === null) return;

    try {
      const ownedTokens = await tokenReadonlyContract.methods.balanceOf(walletAddress).call();
      // console.log("Owned tokens: " + ownedTokens);

      let tokens = [];

      for (var i = 0; i < ownedTokens; i++) {
        const token = await tokenReadonlyContract.methods.tokenOfOwnerByIndex(walletAddress, i).call();

        tokens.push(token);
      }
      setOwnedTokens(tokens);
    } catch (e) { console.error(e); }
  }

  useEffect(() => getOwnedTokens(), [tokenContract]);

  async function plugConnect() {
    // Canister Ids

    // Whitelist
    const whitelist = [
      config.IC_SIG_CANISTER,
      config.IC_VAULT_CANISTER,
      config.IC_TOKEN_CANISTER
    ];

    // Host
    const host = config.IC_ENDPOINT;

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
      canisterId: config.IC_SIG_CANISTER,
      interfaceFactory: sign_vault_idl.IDL,
    });

    setSignVault(sign_vault);


    // Create an actor to interact with the NNS Canister
    // we pass the NNS Canister id and the interface factory
    const ic_vault = await window.ic.plug.createActor({
      canisterId: config.IC_VAULT_CANISTER,
      interfaceFactory: ic_vault_idl.IDL,
    });

    setIcVault(ic_vault);

    // Create an actor to interact with the NNS Canister
    // we pass the NNS Canister id and the interface factory
    const ic_token = await window.ic.plug.createActor({
      canisterId: config.IC_TOKEN_CANISTER,
      interfaceFactory: ic_token_idl.IDL,
    });

    setIcToken(ic_token);
  }

  async function getPendingTx() {
    if (signVault === null) return;
    const pending_tx = await signVault.get_pending_tx(principalId);
    // console.log("Pending Signature count: " + pending_tx.length);

    const pendingIds = pending_tx.filter((x) => x.direction.incoming !== undefined).map((x) => x.tokenId);
    const returningIds = pending_tx.filter((x) => x.direction.outgoing !== undefined).map((x) => x.tokenId);

    setPendingTx(pending_tx);

    setPendingIds(pendingIds);
    setReturningIds(returningIds);
    // await withdrawTokens(pending_tx);
  }

  async function withdrawTokens() {
    if (icVault === null) return;
    if (isWorking) return;

    setIsWorking(true);

    try {
      for (var i = 0; i < pendingTx.length; i++) {
        let tx = pendingTx[i];

        let token = tx.token;
        let token_id = tx.tokenId;
        let signature = tx.signature;

        console.log("Withdrawing token: " + token.toString());

        if (tx.direction.incoming !== undefined) {
          let claim_promise = icVault.withdraw_nft(token.toString(), token_id, signature);

          toast.promise(
            claim_promise,
            {
              loading: 'Claiming NFT on IC ...',
              success: <b>Claiming complete!</b>,
              error: <b>Claiming error!</b>,
            }
          );

          let result = await claim_promise;
          console.log(result);

          if (result.Ok !== undefined) {
            let result2 = await signVault.tx_complete(tx.tx);
            console.log(result2);
          }
        }

        if (tx.direction.outgoing !== undefined) {
          try {
            let result = await withdrawFromEth(Number(token_id), signature, Number(tx.block));
            console.log(result);
          } catch { }

          console.log("Completing tx");
          // if (result.Ok !== undefined) {
          let result2 = await signVault.tx_complete(tx.tx);
          console.log(result2);
          // }
        }
      }

      getIcTokens();
    } catch (e) {
      console.error(e);
    }

    setIsWorking(false);
  }

  useEffect(() => {
    withdrawTokens();
  }, [icVault, signVault, pendingTx])

  //Check for pending transactions in ic_vault every 5 seconds 
  useEffect(() => {
    if (signVault === null) return;

    const timer2 = setInterval(() => {
      getPendingTx();
      getIcTokens();
      getOwnedTokens();
    }, 5000);
    return () => clearTimeout(timer2);
  }, [signVault]);

  async function bridgeToken() {
    if (ownedTokens.length === 0) return;
    if (selectedIndex === null) return;

    //Check if VAULT is approved for token storage
    let approved = await tokenContract.methods.isApprovedForAll(walletAddress, config.EVM_VAULT_ADDRESS)
      .call();

    if (!approved) {
      //Allow vault contract to store NFT from EVM
      // let gasAmount = await tokenContract.methods.setApprovalForAll(config.EVM_VAULT_ADDRESS, true).estimateGas({ from: walletAddress })

      // let baseFee = block.baseFeePerGas * 100000000;

      // console.log(block.baseFeePerGas);

      let result = await tokenContract.methods.setApprovalForAll(config.EVM_VAULT_ADDRESS, true).send({
        from: walletAddress
      });

      console.log(result);
    }

    let tokenId = Number(selectedIndex)

    // let gasAmount = await vaultContract.methods.depositERC721For(
    //   principalId.toString(),
    //   config.EVM_TOKEN_ADDRESS,
    //   tokenId
    // ).estimateGas({ from: walletAddress, value: 0 })

    let token_address = config.EVM_TOKEN_ADDRESS
    let prin_str = principalId.toString();

    let result = await vaultContract.methods.depositERC721For(
      prin_str,
      token_address,
      tokenId
    ).send({
      from: walletAddress,
    });

    console.log(result);

    getPendingTx();
  }

  async function returnToken() {
    if (icToken === null) return;
    if (icOwnedTokens.length === 0) return;
    if (selectedIndex === null) return;

    console.log("Burning token: " + selectedIndex);

    try {
      let send_promise = icToken.burn(selectedIndex);

      toast.promise(
        send_promise,
        {
          loading: 'Withdrawing from IC ...',
          success: <b>Withdrawal complete!</b>,
          error: <b>Withdrawal error!</b>,
        }
      );

      let result = await send_promise;
      console.log("Burn result: ");
      console.log(result);

      let store_result = await signVault.store_wallet(result.Ok, walletAddress);
      console.log("Store result: ");
      console.log(store_result);

      // axios.get()

    } catch (e) {
      console.error(e);
    }
  }

  // async function ensureApproved() {
  //   //Check if VAULT is approved for token storage
  //   let approved = await tokenContract.methods.isApprovedForAll(walletAddress, config.EVM_TOKEN_ADDRESS)
  //     .call();

  //   if (!approved) {
  //     //Allow vault contract to store NFT from EVM
  //     let gasAmount = await tokenContract.methods.setApprovalForAll(config.EVM_VAULT_ADDRESS, true).estimateGas({ from: walletAddress })

  //     let baseFee = block.baseFeePerGas * 100000000;

  //     console.log(block.baseFeePerGas);

  //     let result = await tokenContract.methods.setApprovalForAll(config.EVM_VAULT_ADDRESS, true).send({
  //       from: walletAddress
  //     });

  //     console.log(result);
  //   }
  // }

  async function withdrawFromEth(tokenId, signature, block) {
    // await ensureApproved();

    let sig = Web3.utils.bytesToHex(signature);

    let gasAmount = await vaultContract.methods.withdrawERC721For(
      block,
      walletAddress,
      config.EVM_TOKEN_ADDRESS,
      tokenId,
      sig
    ).estimateGas({ from: walletAddress, value: 0 })

    console.log('Estimated gas: ' + gasAmount);

    let result = await vaultContract.methods.withdrawERC721For(
      block,
      walletAddress,
      config.EVM_TOKEN_ADDRESS,
      tokenId,
      sig
    ).send({
      from: walletAddress,
    });

    console.log(result);

    getOwnedTokens();
    getPendingTx();
  }

  useEffect(() => {
    getIcTokens();
  }, [icToken]);

  async function getIcTokens() {
    if (icToken === null) return;

    let result = await icToken.user_tokens(principalId);

    setIcOwnedTokens(result);
  }

  const [direction, setDirection] = useState(null);


  const [selectedIndex, setSelectedIndex] = React.useState(null);

  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);

    if (principalId === null) setDirection(null);
    else {
      if (contains(ownedTokens, index)) setDirection(true);
      if (contains(icOwnedTokens, index)) setDirection(false);
    }
  };

  const customList = (title, items) => (
    <Card>
      <List
        sx={{
          bgcolor: 'background.paper',
          overflow: 'auto',
        }}
        dense
        component="div"
        role="list"
      >
        {items.map((value) => {
          const labelId = `transfer-list-all-item-${value}-label`;

          return (
            <ListItem
              key={value}
              role="listitem"
              selected={selectedIndex === value}
              button
              onClick={(event) => handleListItemClick(event, value)}
            >
              <ListItemAvatar>
                <Avatar
                  alt={`Avatar n°${value}`}
                  src={`https://cache.icpunks.com/flies/${value}`}
                />
              </ListItemAvatar>
              <ListItemText id={labelId} primary={`Fly #${value}`} />
            </ListItem>
          );
        })}
        <ListItem />
      </List>
    </Card>
  );

  return (<>
    <Box sx={{ textAlign: 'center' }}>
      <Container maxWidth="xl">
        <Typography variant="h2" margin={10}>
          Polygon-Internet Computer bridge
        </Typography>
        <Typography variant="h6">
          Bridge your Infinity Flies from Polygon to the Internet Computer and back. Connect your Metamask and your Plug wallet.
        </Typography>
      </Container>
      <Container maxWidth="xl">
        <Grid container spacing={2} justifyContent="center" alignItems="flex-start" marginTop={20}>
          <Grid item xs={5}>
            <Typography variant="h4" textAlign={'center'} margin={'10px'}>
              Polygon
            </Typography>

            {signedIn ? <Button variant="contained" size="large" onClick={signIn}>{walletAddress}</Button> :
              <Button variant="contained" size="large" onClick={signIn}>METAMASK</Button>}

            {customList('Choices', ownedTokens)}
          </Grid>
          <Grid item xs={2}>
            <Grid container direction="column" alignItems="center" marginTop={20}>
              <Button
                sx={{ my: 0.5 }}
                variant="outlined"
                size="small"
                disabled={direction !== true}
                aria-label="move selected right"
                onClick={bridgeToken}
              >
                POLYGON -&gt; IC
              </Button>
              <Button
                sx={{ my: 0.5 }}
                variant="outlined"
                size="small"
                disabled={direction !== false}
                aria-label="move selected left"
                onClick={returnToken}
              >
                Polygon &lt;- IC
              </Button>

            </Grid>
          </Grid>
          <Grid item xs={5}>
            <Typography variant="h4" textAlign={'center'} margin={'10px'}>
              Internet Computer
            </Typography>
            {principalId !== null ? <Button variant="contained" size="large" onClick={plugConnect}>{getShortPrincipal(principalId.toString())}</Button> :
              <Button variant="contained" size="large" onClick={plugConnect}>PLUG</Button>}
            {customList('Chosen', icOwnedTokens)}
          </Grid>


          <Grid item xs={5}>
            <Typography variant="h4" textAlign={'center'} margin={'10px'}>
              Polygon -&gt; IC
            </Typography>
            {customList('Chosen', pendingIds)}
          </Grid>

          <Grid item xs={5}>
            <Typography variant="h4" textAlign={'center'} margin={'10px'}>
              IC -&gt; Polygon
            </Typography>
            {customList('Chosen', returningIds)}
          </Grid>

        </Grid>
      </Container>
    </Box>
  </>
  );
}
