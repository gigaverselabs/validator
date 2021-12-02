// GET YOUR INFURA API ENDPOINT FROM https://infura.io/
module.exports.ENDPOINT = "http://127.0.0.1:8000"
module.exports.ADDRESS = "rwlgt-iiaaa-aaaaa-aaaaa-cai"

//Used for signing messages for the vault
module.exports.privateKey = "f8b02e6eb8e99487b2a5baa406d854f57509cc5472c92069a9880c41d844067b";
module.exports.publicAddress = "0x800D04094a14B44D678181eA8B8399BFA030Fea1";

// Mumbai testnet
// module.exports.ENDPOINT = "https://matic-mumbai.chainstacklabs.com"
// module.exports.ADDRESS = "0x1b62e43819bb111C2F9aBb98a7a55aeE4E8C8C26"

//Polygon mainnet
// module.exports.ENDPOINT = "https://polygon-rpc.com";
// module.exports.ADDRESS = "0xdFcBCc1D5333c95F88CA869D56cAA308c1C30b77";

module.exports.IDL = ({ IDL }) => {
  const DepositEntry = IDL.Record({
    'owner' : IDL.Principal,
    'token' : IDL.Principal,
    'token_id' : IDL.Nat,
    'time' : IDL.Nat,
  });
  const WithdrawalEntry = IDL.Record({
    'to' : IDL.Principal,
    'token' : IDL.Principal,
    'token_id' : IDL.Nat,
    'time' : IDL.Nat,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const Vault = IDL.Service({
    'deposit_count' : IDL.Func([], [IDL.Nat], ['query']),
    'get_deposits' : IDL.Func([IDL.Nat], [IDL.Vec(DepositEntry)], ['query']),
    'withdrawal_count' : IDL.Func([], [IDL.Nat], ['query']),
    'get_withdrawals' : IDL.Func([IDL.Nat], [IDL.Vec(WithdrawalEntry)], ['query']),
    
    'withdraw_nft' : IDL.Func([IDL.Text, IDL.Nat, IDL.Text], [Result], []),
    'transfer_notification' : IDL.Func([IDL.Principal, IDL.Principal, IDL.Nat, IDL.Nat], [Result], []),
  });
  return Vault;
};