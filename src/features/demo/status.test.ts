import { expect, it } from 'vitest';
import { demoFailure, DemoReadError } from './status';
import { DemoDeadlineError } from './read';

it('keeps arbitrary provider payloads out of a stage-specific failure', () => {
  const failure = demoFailure(
    new Error('SECRET_PROVIDER_PAYLOAD'),
    'reading-token',
    'nox',
    'ready',
  );
  expect(failure).toContain(
    'Reading token metadata, balance and current allowance via nox',
  );
  expect(failure).toContain('Worker state: ready');
  expect(failure).toContain('not a zero allowance');
  expect(failure).not.toContain('SECRET_PROVIDER_PAYLOAD');
});
it('distinguishes an invalidated context from an unreadable pair without claiming a zero allowance', () => {
  const context = demoFailure(
    new DemoReadError('context-changed'),
    'checking-snapshot',
    'nym',
    'closed',
  );
  const pair = demoFailure(
    new DemoReadError('pair-unverified'),
    'checking-snapshot',
    'nox',
    'ready',
  );
  expect(context).toContain('context changed');
  expect(context).toContain('result was discarded');
  expect(pair).toContain('configured token metadata or allowance');
  expect(pair).not.toContain('context changed');
});
it('does not report the four-minute deadline when an individual anonymous operation times out earlier', () => {
  const operation = demoFailure(
    new DOMException('private timeout', 'TimeoutError'),
    'reading-token',
    'nox',
    'ready',
  );
  const deadline = demoFailure(
    new DemoDeadlineError(),
    'reading-token',
    'nox',
    'ready',
  );
  expect(operation).toContain('during an anonymous operation');
  expect(operation).not.toContain('4-minute limit');
  expect(deadline).toContain('4-minute limit');
});
