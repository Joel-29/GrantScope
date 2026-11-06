import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deploymentOrigin,
  inspectDeployment,
  localRevocationInput,
} from './release-checks.mjs';

const origin = 'https://grantscope.example';
const headers = {
  'content-type': 'text/html; charset=utf-8',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};
const html =
  '<title>GrantScope</title><div id="root"></div><script type="module" src="/assets/app.js"></script>';
test('private verification requires a real supplied hash and refuses unsupported transports', () => {
  const config = {
    VITE_DEMO_OWNER: '0x' + '01'.repeat(20),
    VITE_DEMO_TOKEN: '0x' + '02'.repeat(20),
    VITE_DEMO_SPENDER: '0x' + '03'.repeat(20),
  };
  const env = {
    GRANTSCOPE_REVOCATION_HASH: '0x' + '04'.repeat(32),
    LIVE_TRANSPORT: 'nox',
  };
  assert.equal(localRevocationInput(config, env).transport, 'nox');
  assert.throws(
    () => localRevocationInput(config, {}),
    /never signs or submits/,
  );
  assert.throws(() => localRevocationInput({}, env), /ignored .env.local/);
  assert.throws(
    () =>
      localRevocationInput(config, { ...env, LIVE_TRANSPORT: 'passthrough' }),
    /Select nym/,
  );
});
function fixture(transform = (response) => response) {
  const calls = [];
  return {
    calls,
    fetch: async (url, options) => {
      calls.push({ url, options });
      return transform(
        url.endsWith('.js')
          ? new Response('export default "production"', {
              headers: { 'content-type': 'text/javascript' },
            })
          : new Response(html, { headers }),
        url,
      );
    },
  };
}
test('accepts a clean HTTPS origin and rejects credentials, targets and insecure URLs', () => {
  assert.equal(deploymentOrigin(origin + '/'), origin);
  for (const value of [
    'http://grantscope.example',
    'https://user:password@grantscope.example',
    origin + '/?owner=private',
    origin + '/#secret',
    origin + '/dashboard',
  ])
    assert.throws(() => deploymentOrigin(value));
});
test('checks deep links and same-origin assets without any blockchain requests', async () => {
  const t = fixture();
  const result = await inspectDeployment(origin, t.fetch);
  assert.equal(result.routes.length, 8);
  assert.equal(result.blockchainReads, 0);
  assert.equal(t.calls.length, 9);
  assert.ok(
    t.calls.every(
      (call) =>
        call.url.startsWith(origin + '/') &&
        call.options.credentials === 'omit' &&
        call.options.redirect === 'error' &&
        !('body' in call.options),
    ),
  );
});
test('rejects inaccessible deployments, missing headers, wrong assets and leaked preview markers', async () => {
  for (const transform of [
    () => new Response('login', { status: 401 }),
    () => new Response(html, { headers: { 'content-type': 'text/html' } }),
    (response, url) =>
      url.endsWith('.js') ? new Response(html, { headers }) : response,
    (response, url) =>
      url.endsWith('.js')
        ? new Response('Load configured Sepolia demo', {
            headers: { 'content-type': 'text/javascript' },
          })
        : response,
    (response, url) =>
      url === origin + '/'
        ? new Response(
            html.replace('/assets/app.js', 'https://outside.example/app.js'),
            { headers },
          )
        : response,
  ])
    await assert.rejects(inspectDeployment(origin, fixture(transform).fetch));
});
test('bounds response sizes rather than trusting HTTP content length', async () => {
  await assert.rejects(
    inspectDeployment(
      origin,
      fixture(() => new Response('x'.repeat(262145), { headers })).fetch,
    ),
    /size limit/,
  );
});
