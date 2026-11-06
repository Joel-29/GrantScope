import { expect, it } from 'vitest';
import { preparationFailure } from './preparation';

it('keeps timeout, HTTP and wallet disconnection categories separate without arbitrary messages', () => {
  expect(
    preparationFailure(
      new DOMException('PRIVATE_TIMEOUT', 'TimeoutError'),
      'reading-nonce',
    ),
  ).toContain('operation timed out');
  expect(
    preparationFailure(new Error('RPC HTTP 503'), 'reading-fees'),
  ).toContain('HTTP 503');
  expect(
    preparationFailure(
      { code: 4901, message: 'PRIVATE_CONTEXT' },
      'rechecking-wallet',
    ),
  ).toContain('disconnected');
  expect(preparationFailure({ code: 4901 }, 'simulating')).not.toContain(
    'wallet is disconnected',
  );
});
it('handles malformed provider error objects without echoing data or failing its own diagnostics', () => {
  const cause = {
    get name(): string {
      throw new Error('PRIVATE_ERROR');
    },
  };
  const message = preparationFailure(cause, 'simulating');
  expect(message).toContain('Simulating the zeroing transaction');
  expect(message).toContain('no revocation is claimed');
  expect(message).not.toContain('PRIVATE_ERROR');
});
