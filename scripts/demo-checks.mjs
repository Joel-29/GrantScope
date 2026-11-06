const specifiers = {
  nym: {
    host: 'ethereum-rpc.publicnode.com',
    address: '0x3acd9742c68f6d993066ae25533e09b9e1f60ed0',
  },
  nox: {
    host: 'ethereum-sepolia-rpc.publicnode.com',
    address: '0x35133267a8f7ec35046a83dca0f4ca8a6e1b7a9a',
  },
};

export function demoOptions(args) {
  const options = {
    origin: 'http://127.0.0.1:5173',
    transport: 'nym',
    local: false,
  };
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (seen.has(flag)) throw new Error('Duplicate demo option');
    seen.add(flag);
    if (flag === '--local') options.local = true;
    else if (flag === '--url' && args[i + 1]) options.origin = args[++i];
    else if (flag === '--transport' && args[i + 1])
      options.transport = args[++i];
    else
      throw new Error(
        'Use --url ORIGIN, --transport nym|nox and optional --local',
      );
  }
  if (!Object.hasOwn(specifiers, options.transport))
    throw new Error(
      'Select nym or explicitly select nox; no fallback is available',
    );
  let url;
  try {
    url = new URL(options.origin);
  } catch {
    throw new Error('Invalid demo origin');
  }
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/' ||
    !(url.protocol === 'https:' || (url.protocol === 'http:' && loopback))
  )
    throw new Error(
      'Use an HTTPS origin or HTTP loopback without credentials, paths or query parameters',
    );
  if (options.local && !loopback)
    throw new Error('Private configured demo checks are loopback-only');
  return { ...options, origin: url.origin };
}

export function directRpcRows(url, body, transport) {
  const expected = specifiers[transport];
  if (!expected) throw new Error('Unsupported anonymous transport');
  return (Array.isArray(body) ? body : [body]).flatMap((value) => {
    if (
      !value ||
      typeof value.method !== 'string' ||
      !/^(eth_|net_|web3_)/.test(value.method)
    )
      return [];
    const params = Array.isArray(value.params) ? value.params : [],
      call = params[0];
    return [
      {
        method: value.method,
        bootstrap:
          new URL(url).href === `https://${expected.host}/` &&
          value.method === 'eth_call' &&
          params.length === 2 &&
          params[1] === 'latest' &&
          !!call &&
          typeof call === 'object' &&
          String(call.to).toLowerCase() === expected.address &&
          ['0x3898587d', '0x1c67ff29'].includes(call.data) &&
          Object.keys(call).every((key) => ['to', 'data'].includes(key)),
      },
    ];
  });
}

export function safeDemoError(error) {
  return String(error instanceof Error ? error.message : error)
    .replace(/0x[0-9a-f]{40,}/gi, '[redacted]')
    .replace(/\b[0-9a-f]{40,}\b/gi, '[redacted]')
    .replace(/https?:\/\/[^\s;)"'<>]+/g, '[resource]')
    .slice(0, 1000);
}

// The app's export is already sanitized. Keep this tool's public output narrower:
// no arbitrary fields, worker errors, DOM snapshots, addresses, hashes or RPC bodies.
export function trafficSummary(report) {
  const totals = report.accounting.totals;
  const count = (value) => ({
    completed: value.completed,
    successful: value.successful,
    failed: value.failed,
    cancelled: value.cancelled,
    anonymized: value.anonymized,
  });
  return {
    worker: {
      transport: report.worker.transport,
      state: report.worker.state,
      successfulResponses: report.worker.successfulResponses,
      readState: report.worker.readState,
    },
    read: count(totals.read),
    bootstrap: count(totals.bootstrap),
    wallet: count(totals.wallet),
    walletSubmissions: totals.walletSubmissions,
    anonymousReadShare: report.accounting.anonymousReadShare,
  };
}
