const routes = [
  '/',
  '/dashboard',
  '/permissions',
  '/privacy',
  '/settings',
  '/about',
  '/permissions/unverified',
  '/missing',
];
const excluded = [
  'Load configured Sepolia demo',
  'Fictional design fixtures',
  'Preview emerald',
];

export function deploymentOrigin(value) {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new Error(
      'Use an HTTPS deployment origin without credentials, paths, query parameters or fragments',
    );
  return url.origin;
}

export function localRevocationInput(config, env) {
  const {
    VITE_DEMO_OWNER: owner,
    VITE_DEMO_TOKEN: token,
    VITE_DEMO_SPENDER: spender,
  } = config;
  if (
    ![owner, token, spender].every((value) =>
      /^0x[0-9a-f]{40}$/i.test(value ?? ''),
    )
  )
    throw new Error(
      'Configure the three public demo addresses in ignored .env.local',
    );
  const hash = env.GRANTSCOPE_REVOCATION_HASH;
  if (!/^0x[0-9a-f]{64}$/i.test(hash ?? ''))
    throw new Error(
      'Set GRANTSCOPE_REVOCATION_HASH locally to the owner-confirmed transaction hash; this tool never signs or submits',
    );
  const transport = env.LIVE_TRANSPORT ?? 'nym';
  if (transport !== 'nym' && transport !== 'nox')
    throw new Error(
      'Select nym or the explicitly authorized Sepolia alternative nox',
    );
  return { owner, token, spender, hash, transport };
}

async function boundedText(response, limit) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing response body');
  let text = '',
    bytes = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        throw new Error('Response exceeds release-check size limit');
      }
      text += decoder.decode(part.value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

export async function inspectDeployment(value, fetchImpl = fetch) {
  const origin = deploymentOrigin(value);
  const checks = [];
  let entry = '';
  for (const path of routes) {
    const response = await fetchImpl(origin + path, {
      redirect: 'error',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(15000),
    });
    if (response.status !== 200)
      throw new Error(
        `Deployment route ${path} returned HTTP ${response.status}`,
      );
    if (!response.headers.get('content-type')?.includes('text/html'))
      throw new Error(`Deployment route ${path} is not HTML`);
    if (
      response.headers.get('x-content-type-options') !== 'nosniff' ||
      response.headers.get('referrer-policy') !== 'no-referrer'
    )
      throw new Error(
        `Deployment route ${path} lacks configured privacy/security headers`,
      );
    const permissions = response.headers.get('permissions-policy') ?? '';
    if (
      !['camera=()', 'microphone=()', 'geolocation=()'].every((policy) =>
        permissions.includes(policy),
      )
    )
      throw new Error(
        `Deployment route ${path} lacks the configured permissions policy`,
      );
    const html = await boundedText(response, 262144);
    if (!/<title>GrantScope/i.test(html) || !/id=["']root["']/.test(html))
      throw new Error(
        `Deployment route ${path} did not serve the application shell`,
      );
    if (path === '/') {
      const src = /<script\b[^>]*\bsrc=["']([^"']+)["']/i.exec(html)?.[1];
      if (!src) throw new Error('Application entry asset is missing');
      const asset = new URL(src, origin);
      if (
        asset.origin !== origin ||
        !asset.pathname.startsWith('/assets/') ||
        asset.search ||
        asset.hash
      )
        throw new Error(
          'Application entry asset must be served from this origin',
        );
      entry = asset.href;
    }
    checks.push({ path, status: response.status, headersVerified: true });
  }
  const asset = await fetchImpl(entry, {
    redirect: 'error',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(15000),
  });
  if (
    asset.status !== 200 ||
    !/javascript/.test(asset.headers.get('content-type') ?? '')
  )
    throw new Error('Application JavaScript asset is not served correctly');
  const source = await boundedText(asset, 4 * 1024 * 1024);
  if (!source.length || excluded.some((marker) => source.includes(marker)))
    throw new Error('Invalid or development-only entry asset');
  return {
    origin,
    checkedAt: new Date().toISOString(),
    routes: checks,
    entryAssetVerified: true,
    blockchainReads: 0,
    limitations:
      'HTTP delivery only; browser worker, wallet and live chain behavior require separate checks.',
  };
}
