const Web3 = require('web3');
const sigUtil = require('@metamask/eth-sig-util');
const config = require('./frogs_config');
const flies_config = require('./flies_config');
const { SignTypedDataVersion } = require('@metamask/eth-sig-util');

const web3 = new Web3(config.INFURA_ADDRESS);
const polygon = new Web3(flies_config.ENDPOINT);

const frogContract = new web3.eth.Contract(config.ABI, config.ADDRESS);
const fliesContract = new polygon.eth.Contract(flies_config.ABI, flies_config.ADDRESS);


module.exports.encodeParameters = function(types, data) {
    return web3.eth.abi.encodeParameters(types, data);
}

module.exports.createSignature = async function(walletAddress, tokens, timestamp, privateKey) {
    var encoded = web3.eth.abi.encodeParameters(['address','uint256[]', 'uint256'], [walletAddress, tokens, timestamp]);
    var hash = web3.utils.soliditySha3(encoded);


    const account = polygon.eth.accounts.privateKeyToAccount('0x'+privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    var signature = await web3.eth.sign(hash, account.address);

    return signature;
}

module.exports.verifySignature = async function(message, signature) {
    var recovered = web3.eth.accounts.recover(message, signature);

    return recovered;
}

module.exports.verifyTypedSignature = async function(wallet, signature) {
    const NETWORK_ID = 137;
    const ADDRESS = flies_config.ADDRESS;

    const data = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Message: [
            { name: 'value', type: 'string' },
          ]
        },
        domain: {
          name: "Infinity Flies",
          version: '1',
          chainId: NETWORK_ID,
          verifyingContract: ADDRESS,
        },
        primaryType: "Message",
        message: {
          value: 'I own this wallet: ' + wallet
        }
      }

      return sigUtil.recoverTypedSignature({
        data: data,
        signature: signature,
        version: SignTypedDataVersion.V4
      });
}