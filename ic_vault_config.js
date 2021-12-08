// Dev
// module.exports.ADDRESS = "rwlgt-iiaaa-aaaaa-aaaaa-cai"

// testnet
module.exports.ADDRESS = "vwm6j-rqaaa-aaaah-qclba-cai"

// mainnet
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
    
    'withdraw_nft' : IDL.Func([IDL.Text, IDL.Nat, IDL.Vec(IDL.Nat8)], [Result], []),
    'transfer_notification' : IDL.Func([IDL.Principal, IDL.Principal, IDL.Nat, IDL.Nat], [Result], []),
  });
  return Vault;
};