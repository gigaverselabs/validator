// Dev
// module.exports.ENDPOINT = "http://127.0.0.1:8000"
// module.exports.ADDRESS = "rkp4c-7iaaa-aaaaa-aaaca-cai"

// Testnet
module.exports.ENDPOINT = "https://mainnet.dfinity.network"
module.exports.ADDRESS = "vdlpe-qyaaa-aaaah-qclcq-cai"

// mainnet
// module.exports.ENDPOINT = "https://polygon-rpc.com";
// module.exports.ADDRESS = "0xdFcBCc1D5333c95F88CA869D56cAA308c1C30b77";

module.exports.IDL = ({ IDL }) => {
  const SignatureDesc = IDL.Record({
    'tx' : IDL.Text,
    'token' : IDL.Principal,
    'signature' : IDL.Vec(IDL.Nat8),
    'tokenId' : IDL.Nat,
    'owner' : IDL.Principal,
  });
  const SignatureVault = IDL.Service({
    'getCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'get_pending_tx' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(SignatureDesc)],
        ['query'],
      ),
    'get_signature' : IDL.Func([IDL.Text], [IDL.Opt(SignatureDesc)], ['query']),
    'get_signatures' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(IDL.Vec(SignatureDesc))],
        ['query'],
      ),
    'owner' : IDL.Func([], [IDL.Principal], ['query']),
    'set_owner' : IDL.Func([IDL.Principal], [IDL.Bool], []),
    'signature_count' : IDL.Func([], [IDL.Nat], ['query']),
    'store_signature' : IDL.Func(
        [IDL.Text, IDL.Principal, IDL.Principal, IDL.Nat, IDL.Vec(IDL.Nat8)],
        [IDL.Bool],
        [],
      ),
    'tx_complete' : IDL.Func([IDL.Text], [IDL.Bool], []),
  });
  return SignatureVault;
};