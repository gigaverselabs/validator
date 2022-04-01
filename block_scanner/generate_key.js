const { Ed25519KeyIdentity } = require('@dfinity/identity');
const crypto = require('crypto');
const fs = require('fs');
 

const entropy = crypto.randomBytes(32);
const key = Ed25519KeyIdentity.generate(entropy);

fs.writeFileSync('../ic_key', JSON.stringify(key.toJSON()));