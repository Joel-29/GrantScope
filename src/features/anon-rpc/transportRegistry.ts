// Verified against the official wallet guide/adopters list. No arbitrary worker code URLs.
export const TOR_SPECIFIER = '0x700dA3193D35fA54Cd3fBf29B66f2a2A0385659e';
export const TOR_GATEWAYS = [
  '152.236.3.22:12298:uEiCH0VdbhryzJcMtCfB0vLA4sOvHdQ4hq5w7CopcwU59bQ',
];
export const BOOTSTRAP_RPC = 'https://ethereum-rpc.publicnode.com';
export const WORKERS = {
  nym: {
    label: 'Nym',
    specifier: '0x3aCD9742C68F6d993066Ae25533e09b9e1f60eD0',
    bootstrapChainId: 1,
  },
  'tor-js': { label: 'Tor', specifier: TOR_SPECIFIER, bootstrapChainId: 1 },
  nox: {
    label: 'Nox',
    specifier: '0x35133267A8F7EC35046a83DCA0f4Ca8A6e1b7A9A',
    bootstrapChainId: 11155111,
  },
} as const;
export type AnonymousTransport = keyof typeof WORKERS;
// Documented @hisoka-io/anon-rpc-worker 0.4.0 settings. Keep end-to-end TLS required.
// Avoid background spare-tunnel failures blacklisting exits during a slow live scan.
export const NOX_CONFIG = {
  tls: 'required',
  tlsSpares: 0,
  tlsOpenTimeoutMs: 15000,
  attemptTimeoutMs: 30000,
  callDeadlineMs: 45000,
} as const;
export function validKpsGateway(value: string): boolean {
  const match =
    /^(\d{1,3}(?:\.\d{1,3}){3}):(\d{1,5}):(u[A-Za-z0-9_-]{40,100})$/.exec(
      value,
    );
  return Boolean(
    match &&
    match[1]?.split('.').every((part) => Number(part) <= 255) &&
    Number(match[2]) > 0 &&
    Number(match[2]) <= 65535,
  );
}
export const READ_NETWORKS = {
  1: {
    id: 1,
    name: 'Ethereum',
    rpc: 'https://ethereum-rpc.publicnode.com',
    explorer: 'https://etherscan.io',
  },
  11155111: {
    id: 11155111,
    name: 'Sepolia',
    rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorer: 'https://sepolia.etherscan.io',
  },
} as const;
export type ReadChainId = keyof typeof READ_NETWORKS;
