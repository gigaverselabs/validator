const Web3 = require('web3');
const vault_config = require('./vault_config');
const token_config = require('./token_config');
const config = require('./config');
const ic_token_config = require('./ic_token_config');

const web3 = new Web3(vault_config.ENDPOINT);
const vaultContract = new web3.eth.Contract(vault_config.ABI, vault_config.ADDRESS);
const tokenContract = new web3.eth.Contract(token_config.ABI, token_config.ADDRESS);

const account = web3.eth.accounts.privateKeyToAccount('0x'+config.privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

async function getToken(tokenId) {
    let result = await tokenContract.methods.mint(tokenId).send({
        from: config.publicAddress,
        gas: 230800,
        gasPrice: 1
    });
}

async function approveVault() {
    let result = await tokenContract.methods.setApprovalForAll(vault_config.ADDRESS, true).send({
        from: config.publicAddress,
        gas: 230800,
        gasPrice: 1
    });

    console.log(result);
}

async function sendToVault(tokenId) {
    let result = await vaultContract.methods.depositERC721For(
        "tushn-jfas4-lrw4y-d3hun-lyc2x-hr2o2-2spfo-ak45s-jzksj-fzvln-yqe", 
        token_config.ADDRESS,
        tokenId
        ).send({
        from: config.publicAddress,
        gas: 430800,
        gasPrice: 1
    });

    console.log(result);
}

async function addMappedToken() {
    let result = await vaultContract.methods.mapToken(token_config.ADDRESS, ic_token_config.ADDRESS)
    .send({
        from: config.publicAddress,
        gas: 430800,
        gasPrice: 1
    });

    console.log(result);
}

async function getMappedToken() {
    let result = await vaultContract.methods.getMappedToken(token_config.ADDRESS).call();

    console.log(result);
}

async function execute() {
    let tokenId = 1;
    // await getToken(tokenId);
    // await approveVault();
    await addMappedToken();
    await getMappedToken();
    // await sendToVault(tokenId);
}

execute();
