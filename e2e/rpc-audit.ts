import type { Page } from '@playwright/test';
import { toFunctionSelector } from 'viem';
import {
  READ_NETWORKS,
  WORKERS,
  type AnonymousTransport,
} from '../src/features/anon-rpc/transportRegistry';

export function classifyDirectRpc(
  url: string,
  body: unknown,
  transport: AnonymousTransport,
) {
  const calls: { method: string; bootstrap: boolean }[] = [];
  const classify = (value: unknown) => {
    if (
      !value ||
      typeof value !== 'object' ||
      !('method' in value) ||
      typeof value.method !== 'string' ||
      !/^(eth_|net_|web3_)/.test(value.method)
    )
      return;
    const params =
      'params' in value && Array.isArray(value.params) ? value.params : [];
    const call: unknown = params[0];
    const bootstrap =
      new URL(url).href ===
        new URL(READ_NETWORKS[WORKERS[transport].bootstrapChainId].rpc).href &&
      value.method === 'eth_call' &&
      params.length === 2 &&
      params[1] === 'latest' &&
      !!call &&
      typeof call === 'object' &&
      'to' in call &&
      String(call.to).toLowerCase() ===
        WORKERS[transport].specifier.toLowerCase() &&
      'data' in call &&
      [
        toFunctionSelector('workerHash()'),
        toFunctionSelector('workerResolvers()'),
      ].includes(String(call.data) as `0x${string}`) &&
      Object.keys(call).every((key) => ['to', 'data'].includes(key));
    calls.push({ method: value.method, bootstrap });
  };
  if (Array.isArray(body)) body.forEach(classify);
  else classify(body);
  return calls;
}

// Retain classifications only: never record arbitrary request parameters.
export function auditDirectRpc(page: Page, transport: AnonymousTransport) {
  const calls: ReturnType<typeof classifyDirectRpc> = [];
  page.on('request', (request) => {
    if (request.method() !== 'POST') return;
    let body: unknown;
    try {
      body = request.postDataJSON();
    } catch {
      return;
    }
    calls.push(...classifyDirectRpc(request.url(), body, transport));
  });
  return calls;
}
