module.exports.IDL = ({ IDL }) => {
  const Direction = IDL.Variant({
    'incoming' : IDL.Null,
    'outgoing' : IDL.Null,
  });
  const SignatureDesc = IDL.Record({
    'tx' : IDL.Text,
    'direction' : Direction,
    'token' : IDL.Text,
    'signature' : IDL.Vec(IDL.Nat8),
    'tokenId' : IDL.Nat,
    'owner' : IDL.Principal,
    'block' : IDL.Nat64,
  });
  const SignatureVault = IDL.Service({
    'getCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'get_pending_tx' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(SignatureDesc)],
        ['query'],
      ),
    'get_wallet' : IDL.Func(
        [IDL.Nat32],
        [IDL.Opt(IDL.Tuple(IDL.Principal, IDL.Text))],
        [],
      ),
    'get_wallets' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Nat32, IDL.Tuple(IDL.Principal, IDL.Text)))],
        [],
      ),
    'owner' : IDL.Func([], [IDL.Principal], ['query']),
    'set_owner' : IDL.Func([IDL.Principal], [IDL.Bool], []),
    'signature_count' : IDL.Func([], [IDL.Nat], ['query']),
    'store_signature' : IDL.Func(
        [
          IDL.Text,
          IDL.Principal,
          IDL.Text,
          IDL.Nat,
          IDL.Vec(IDL.Nat8),
          Direction,
          IDL.Nat64,
        ],
        [IDL.Bool],
        [],
      ),
    'store_wallet' : IDL.Func([IDL.Nat32, IDL.Text], [IDL.Bool], []),
    'tx_complete' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'tx_revert' : IDL.Func([IDL.Text], [IDL.Bool], []),
  });
  return SignatureVault;
};