import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatEther } from 'viem';
import { InfoDialog } from '../../components/ui/InfoDialog';
import { Button } from '../../components/ui/Button';
import { Notice } from '../../components/ui/Notice';
import { injectedProvider, useWallet } from '../wallet/provider';
import { useInspection } from '../wallet/useInspection';
import { useInspectionSession } from '../wallet/session';
import { anonRpc } from '../anon-rpc/runtime';
import type { Permission } from '../exposure/analysis';
import {
  followRevocation,
  prepareRevocation,
  submitRevocation,
  RevocationError,
  type Prepared,
} from './engine';
import { useTransactions } from './store';

function safeError(error: unknown) {
  return error instanceof RevocationError
    ? error.message
    : 'Anonymous verification or wallet request failed. Check the wallet and transport; no revocation is claimed.';
}
export function RevocationControl({ record }: { record: Permission }) {
  const prepareButton = useRef<HTMLButtonElement>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const wallet = useWallet(),
    inspection = useInspection(),
    transactions = useTransactions(),
    cache = useQueryClient();
  const [open, setOpen] = useState(false),
    [checking, setChecking] = useState(false),
    [prepared, setPrepared] = useState<Prepared | null>(null),
    [error, setError] = useState('');
  const [scope, setScope] = useState<{
    manager: ReturnType<typeof anonRpc.current>;
    revision: number;
    provider: NonNullable<ReturnType<typeof injectedProvider>>;
  } | null>(null);
  const owner =
    wallet.address === record.owner && wallet.chainId === record.chainId;
  const codePresent = inspection.data?.kind === 'code-present';
  const verified = transactions.activity.find(
    (entry) =>
      entry.recordId === record.id &&
      entry.phase === 'verified-zero' &&
      entry.verifiedBlock !== undefined &&
      entry.verifiedBlock >= record.blockNumber,
  );
  async function prepare() {
    const provider = injectedProvider();
    if (!provider) return;
    setChecking(true);
    setPrepared(null);
    setError('');
    const manager = anonRpc.current(),
      revision = useInspectionSession.getState().revision;
    controller.current?.abort();
    const attempt = new AbortController();
    controller.current = attempt;
    try {
      const result = await prepareRevocation(
        manager,
        provider,
        record,
        attempt.signal,
      );
      attempt.signal.throwIfAborted();
      if (
        revision !== useInspectionSession.getState().revision ||
        manager !== anonRpc.current()
      )
        throw new RevocationError('Inspection context changed; prepare again');
      setScope({ manager, revision, provider });
      setPrepared(result);
      setOpen(true);
    } catch (e) {
      setError(safeError(e));
    } finally {
      setChecking(false);
    }
  }
  async function submit() {
    if (!prepared || !scope) return;
    const id = crypto.randomUUID();
    const state = useTransactions.getState();
    if (
      !state.start({
        id,
        recordId: record.id,
        chainId: record.chainId,
        phase: 'checking',
      })
    )
      return;
    setError('');
    const guard = () => {
      const target = useInspectionSession.getState();
      if (
        target.revision !== scope.revision ||
        target.target?.address !== record.owner ||
        target.target.chainId !== record.chainId ||
        scope.manager !== anonRpc.current() ||
        scope.provider !== injectedProvider() ||
        useWallet.getState().address !== record.owner ||
        useWallet.getState().chainId !== record.chainId
      )
        throw new RevocationError(
          'Account, network or inspection context changed; prepare again',
        );
    };
    let submitted = false;
    let walletRequested = false;
    try {
      guard();
      const result = await submitRevocation(
        scope.manager,
        scope.provider,
        prepared,
        guard,
        undefined,
        () => {
          walletRequested = true;
          state.update(id, { phase: 'awaiting-wallet' });
        },
      );
      submitted = true;
      state.update(id, { phase: 'pending', hash: result.hash });
      setPrepared(null);
      setOpen(false);
      const verified = await followRevocation(
        scope.manager,
        result.prepared,
        result.hash,
        (phase, hash) => state.update(id, { phase, hash }),
      );
      state.update(id, {
        phase: 'verified-zero',
        hash: verified.hash,
        verifiedBlock: verified.blockNumber,
      });
      await Promise.all(
        ['allowances', 'discovery', 'permit2'].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
    } catch (e) {
      const rejected =
        e && typeof e === 'object' && 'code' in e && e.code === 4001;
      const message = rejected
        ? 'Wallet request rejected. No revocation was verified.'
        : safeError(e);
      setError(message);
      state.update(id, {
        phase: rejected
          ? 'rejected'
          : submitted || walletRequested
            ? 'unverified'
            : 'failed',
        message,
      });
    } finally {
      state.finish();
      setPrepared(null);
    }
  }
  return (
    <div className="revocation-control">
      <h3>Owner-authorized revocation</h3>
      <p>
        Only the connected owner on the inspected network may sign. Code-present
        accounts are read-only. Simulation and gas checks run through the
        anonymous worker; wallet submission is not anonymous.
      </p>
      {!owner && (
        <p>
          Connect the inspected owner in Settings and select the matching
          network in your wallet.
        </p>
      )}
      {codePresent && (
        <p>Smart-account execution is unsupported. Revocation is disabled.</p>
      )}
      {verified && (
        <Notice
          title={`Verified zero at block ${verified.verifiedBlock?.toString()}`}
        >
          This scan predates the verified state. Refresh it before making
          another decision. Later approvals or valid permits can restore
          authority.
        </Notice>
      )}
      <Button
        ref={prepareButton}
        variant="danger"
        disabled={
          !owner ||
          codePresent ||
          record.amount === 0n ||
          checking ||
          transactions.busy ||
          Boolean(verified)
        }
        onClick={() => void prepare()}
      >
        {checking ? 'Checking revocation…' : 'Prepare revocation'}
      </Button>
      {checking && (
        <Button onClick={() => controller.current?.abort()}>
          Cancel preparation
        </Button>
      )}
      {error && <p role="alert">{error}</p>}
      <InfoDialog
        title="Confirm revocation"
        description="Review the exact target and zeroing action. Your wallet will ask for final authorization."
        open={open}
        onOpenChange={(value) => {
          if (!transactions.busy) {
            setOpen(value);
            if (!value) setPrepared(null);
          }
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          prepareButton.current?.focus();
        }}
      >
        {prepared && (
          <>
            <dl className="account-details">
              <div>
                <dt>Owner</dt>
                <dd>{prepared.intent.from}</dd>
              </div>
              <div>
                <dt>Network</dt>
                <dd>
                  {record.chainId === 1
                    ? 'Ethereum mainnet'
                    : 'Sepolia testnet'}
                </dd>
              </div>
              <div>
                <dt>Target contract</dt>
                <dd>{prepared.intent.to}</dd>
              </div>
              <div>
                <dt>Token / spender</dt>
                <dd>
                  {record.token} / {record.spender}
                </dd>
              </div>
              <div>
                <dt>Action</dt>
                <dd>
                  {record.kind === 'erc20'
                    ? 'approve(spender, 0)'
                    : 'Permit2 lockdown([(token, spender)])'}
                </dd>
              </div>
              <div>
                <dt>Prepared gas budget</dt>
                <dd>
                  {formatEther(prepared.feeCap)} ETH · {prepared.gas.toString()}{' '}
                  gas
                </dd>
              </div>
            </dl>
            <p>
              Network fees are paid in ETH. The wallet may show different fees;
              changed preflight conditions require another review. Anon-RPC
              cannot hide your wallet's own submission traffic or public
              transaction data.
            </p>
            {record.kind === 'permit2' && (
              <p>
                Lockdown clears only this stored grant amount. It does not
                invalidate unused signed permits, ordered nonces,
                SignatureTransfer signatures, other spenders, or the underlying
                ERC-20 approval.
              </p>
            )}
            <Button
              variant="danger"
              disabled={transactions.busy}
              onClick={() => void submit()}
            >
              {transactions.busy
                ? 'Checking / awaiting wallet…'
                : 'Confirm in wallet'}
            </Button>
          </>
        )}
      </InfoDialog>
    </div>
  );
}
