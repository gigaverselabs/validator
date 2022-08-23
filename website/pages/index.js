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
import { useAuth } from '../utils/auth';


function contains(arr, i) {
  return arr.indexOf(i) !== -1;
}

function getShortPrincipal(p) {
  return p.substring(0, 5) + '...' + p.substring(60);
}

export default function Home() {
  const auth = useAuth()

  // FOR WALLET
  const [signedIn, setSignedIn] = useState(false)
  const [walletAddress, setWalletAddress] = useState(null)
  const [chainId, setChainId] = useState(null);

  // FOR IC
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

  const NETWORK_ID = 1; //ETH Mainnet

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
              alert("You are not on ETH chain. Change network to polygon in metamask or use button 'POLYGON'");
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
    const chainId = '0x01'; // Mainnet
    const rpc = 'https://mainnet.infura.io/v3/';
    const chainName = 'Ethereum';
    const block = 'https://etherscan.io';

    // const chainId = '0x03'; // Ropsten
    // const rpc = 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
    // const chainName = 'Ropsten';
    // const block = 'https://ropsten.etherscan.io';

    // const chainId = '0x89'; // Polygon
    // const rpc = 'https://polygon-rpc.com';
    // const chainName = 'Polygon';
    // const block = 'https://polygonscan.com';

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
    auth.login();
  }

  useEffect(() => {
    if (auth.principal !== null && auth.principal !== undefined && auth.wallet !== undefined) {
      async function loadCanisters() {
        // Create an actor to interact with the NNS Canister
        // we pass the NNS Canister id and the interface factory
        const sign_vault = await auth.wallet.getActor(config.IC_SIG_CANISTER, sign_vault_idl.IDL)
        setSignVault(sign_vault);


        // Create an actor to interact with the NNS Canister
        // we pass the NNS Canister id and the interface factory
        const ic_vault = await auth.wallet.getActor(config.IC_VAULT_CANISTER, ic_vault_idl.IDL)
        setIcVault(ic_vault);

        // Create an actor to interact with the NNS Canister
        // we pass the NNS Canister id and the interface factory
        const ic_token = await auth.wallet.getActor(config.IC_TOKEN_CANISTER, ic_token_idl.IDL)
        setIcToken(ic_token);

      }
      loadCanisters();
    }

  }, [auth.principal, auth.wallet]);

  async function getPendingTx() {
    if (signVault === null) return;
    if (auth.principal === undefined) return;

    const pending_tx = await signVault.get_pending_tx(auth.principal);
    // console.log("Pending Signature count: " + pending_tx.length);

    const pendingIds = pending_tx.filter((x) => x.direction.incoming !== undefined).map((x) => x.tokenId);
    const returningIds = pending_tx.filter((x) => x.direction.outgoing !== undefined).map((x) => x.tokenId);

    setPendingTx(pending_tx);

    setPendingIds(pendingIds);
    setReturningIds(returningIds);
    // await withdrawTokens(pending_tx);
  }

  function withdrawTokens() {
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
          // let claim_promise = icVault.withdraw_nft(token.toString(), token_id, tx.tx, signature);

          let claim_promise = new Promise((resolve, reject) => {
            icVault.withdraw_nft(token.toString(), token_id, tx.tx, signature)
              .then((data) => {
                console.log(data);

                if (data.Err !== undefined) {
                  // throw { message: data.Err };

                  if (data.Err === 'Transaction already processed') {
                    resolve(data);
                  }
                  else {
                    reject(data);
                  }
                  // console.log(result2);
                  // let result = await claim_promise;
                }

                if (data.Ok !== undefined) {
                  resolve(data);
                }
              })
          });

          claim_promise.then((data) => {
            console.log("Completing tx");
            signVault.tx_complete(tx.tx).then((x) => {
              console.log(x);
            });
          })

          toast.promise(
            claim_promise,
            {
              loading: 'Claiming NFT on IC ...',
              success: <b>Claiming complete!</b>,
              error: (x) => <b>Claiming error! {x.Err}</b>,
            }
          );


        }

        if (tx.direction.outgoing !== undefined) {
          try {

            withdrawFromEth(Number(token_id), signature, tx.tx).then((data) => {
              console.log(data);

            });
          } catch { }

          console.log("Completing tx");
          signVault.tx_complete(tx.tx).then((x) => {
            console.log(x);
          });
          // // if (result.Ok !== undefined) {
          // let result2 = await signVault.tx_complete(tx.tx);
          // console.log(result2);
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
    let token_address = config.EVM_TOKEN_ADDRESS
    let prin_str = auth.principal.toString();

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

  let withdrawing = false;

  async function withdrawFromEth(tokenId, signature, block) {
    if (withdrawing) return;
    withdrawing = true;
    // await ensureApproved();

    try {

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
    } catch (e) {
      console.error(e);
    }

    withdrawing = false;
  }

  useEffect(() => {
    getIcTokens();
  }, [icToken, auth.principal, auth.wallet]);

  async function getIcTokens() {
    if (icToken === null) return;
    if (auth.principal === undefined) return;
    if (auth.wallet === undefined) return;        

    let result = await icToken.user_tokens(auth.principal);

    setIcOwnedTokens(result);
  }

  const [direction, setDirection] = useState(null);
  const [selectedIndex, setSelectedIndex] = React.useState(null);

  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);

    if (auth.principal === null || auth.principal === undefined) setDirection(null);
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
                  src={`https://cache.icpunks.com/infinityfrogs/Token/${value}`}
                />
              </ListItemAvatar>
              <ListItemText id={labelId} primary={`Infinity Frog #${value}`} />
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
          Ethereum-Internet Computer bridge
        </Typography>
        <Typography variant="h6">
          Bridge your Infinity Frogs from Ethereum to the Internet Computer and back. Connect your Metamask and your Internet Computer (Plug or Infinity Wallet) wallet.
        </Typography>
      </Container>
      <Container maxWidth="xl">
        <Grid container spacing={2} justifyContent="center" alignItems="flex-start" marginTop={20}>
          <Grid item xs={5}>
            <Typography variant="h4" textAlign={'center'} margin={'10px'}>
              Ethereum
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
                ETH -&gt; IC
              </Button>
              <Button
                sx={{ my: 0.5 }}
                variant="outlined"
                size="small"
                disabled={direction !== false}
                aria-label="move selected left"
                onClick={returnToken}
              >
                ETH &lt;- IC
              </Button>

            </Grid>
          </Grid>
          <Grid item xs={5}>
            <Typography variant="h4" textAlign={'center'} margin={'10px'}>
              Internet Computer
            </Typography>
            {auth.principal !== undefined ? <Button variant="contained" size="large" onClick={plugConnect}>{getShortPrincipal(auth.principal.toString())}</Button> :
              <Button variant="contained" size="large" onClick={plugConnect}>IC</Button>}
            {customList('Chosen', icOwnedTokens)}
          </Grid>


          <Grid item xs={5}>
            <Typography variant="h4" textAlign={'center'} margin={'10px'}>
              Ethereum -&gt; IC
            </Typography>
            {customList('Chosen', pendingIds)}
          </Grid>

          <Grid item xs={5}>
            <Typography variant="h4" textAlign={'center'} margin={'10px'}>
              IC -&gt; Ethereum
            </Typography>
            {customList('Chosen', returningIds)}
          </Grid>

        </Grid>
      </Container>
    </Box>
  </>
  );
}
