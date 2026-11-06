import { getAddress, isAddress, type Address } from 'viem';

export function parseAddress(input: string): Address {
  const value = input.trim();
  if (!isAddress(value, { strict: true }))
    throw new Error(
      'Enter a 0x Ethereum address with 40 hexadecimal characters and a valid mixed-case checksum. ENS names are not resolved.',
    );
  return getAddress(value);
}
export function accountKind(code: unknown): 'eoa' | 'code-present' {
  if (typeof code !== 'string' || !/^0x(?:[0-9a-f]{2})*$/i.test(code))
    throw new Error('Invalid account bytecode response');
  return code === '0x' ? 'eoa' : 'code-present';
}
