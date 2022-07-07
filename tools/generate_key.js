const crypto = require('crypto');
const { Ed25519KeyIdentity } = require('@dfinity/identity');

const entropy = crypto.randomBytes(32);
const key = Ed25519KeyIdentity.generate(entropy);

console.log(JSON.stringify(key.toJSON()));