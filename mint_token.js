const Web3 = require('web3');
const vault_config = require('./vault_config');
const token_config = require('./token_config');
const config = require('./config');

const web3 = new Web3(vault_config.ENDPOINT);
const vaultContract = new web3.eth.Contract(vault_config.ABI, vault_config.ADDRESS);
const tokenContract = new web3.eth.Contract(token_config.ABI, token_config.ADDRESS);

const account = web3.eth.accounts.privateKeyToAccount('0x'+config.privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

async function getToken() {
    let result = await tokenContract.methods.mint(1).send({
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

async function sendToVault() {
    let result = await vaultContract.methods.depositERC721For(
        config.publicAddress, 
        token_config.ADDRESS,
        1
        ).send({
        from: config.publicAddress,
        gas: 230800,
        gasPrice: 1
    });

    console.log(result);
}

// getToken();
// approveVault();
// sendToVault();