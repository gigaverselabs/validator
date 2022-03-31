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
    'tx_complete' : IDL.Func([IDL.Text], [IDL.Bool], []),
  });
  return SignatureVault;
};
