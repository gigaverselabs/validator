const Web3 = require('web3');


//WEB3 INIT
const web3 = new Web3();

const account = web3.eth.accounts.privateKeyToAccount('0x' + '6a5858d9556260f6083800cd00e3edb9af0e57d2fb769a968b7cc6240c1af429');
console.log("ETH Wallet: "+account.address);
