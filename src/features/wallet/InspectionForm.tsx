import { useId, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Panel } from '../../components/ui/Panel';
import { anonRpc, useAnonRpc } from '../anon-rpc/runtime';
import { READ_NETWORKS, type ReadChainId } from '../anon-rpc/transportRegistry';
import { parseAddress } from './address';
import { useInspectionSession } from './session';
import { useInspection } from './useInspection';
import { clearInspection } from './clearInspection';

export function InspectionForm({ onInspect }: { onInspect?: () => void }) {
  const id = useId();
  const [input, setInput] = useState('');
  const [chainId, setChainId] = useState<ReadChainId>(11155111);
  const [error, setError] = useState<string | null>(null);
  const session = useInspectionSession();
  const transport = useAnonRpc();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    try {
      const address = parseAddress(input);
      setInput(address);
      setError(null);
      if (transport.transport === 'nox' && chainId !== 11155111)
        throw new Error('Nox is currently verified for Sepolia only.');
      session.inspect(address, chainId);
      onInspect?.();
      void navigate('/dashboard');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Invalid inspection target',
      );
    }
  };
  return (
    <form onSubmit={submit} className="inspection-form">
      <div className="form-field">
        <label htmlFor={id + '-address'}>Ethereum address</label>
        <input
          id={id + '-address'}
          placeholder="0x…"
          autoComplete="off"
          spellCheck={false}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={id + '-help ' + id + '-error'}
        />
        <small id={id + '-help'}>
          Checksummed public address only. No ENS or third-party indexer lookup.
          All account reads use the selected anonymous worker.
        </small>
      </div>
      <div className="form-field">
        <label htmlFor={id + '-network'}>Inspection network</label>
        <select
          id={id + '-network'}
          value={chainId}
          onChange={(event) =>
            setChainId(Number(event.target.value) as ReadChainId)
          }
        >
          {Object.values(READ_NETWORKS).map((chain) => (
            <option
              key={chain.id}
              value={chain.id}
              disabled={transport.transport === 'nox' && chain.id !== 11155111}
            >
              {chain.name}
            </option>
          ))}
        </select>
        <small>
          The endpoint's chain ID is verified anonymously before any account
          read. Availability may vary by worker.
        </small>
      </div>
      <p id={id + '-error'} role={error ? 'alert' : undefined}>
        {error}
      </p>
      <div className="component-row">
        <Button variant="primary" type="submit">
          Inspect anonymously
        </Button>
        <Button
          onClick={() => {
            void queryClient.cancelQueries({ queryKey: ['account'] });
          }}
        >
          Cancel account read
        </Button>
      </div>
      {session.history.length > 0 && (
        <details className="disclosure">
          <summary>Session address history ({session.history.length})</summary>
          <ul className="session-history">
            {session.history.map((item) => (
              <li key={`${item.chainId}:${item.address}`}>
                <Button
                  size="sm"
                  onClick={() => {
                    setInput(item.address);
                    setChainId(item.chainId);
                  }}
                >
                  {item.address} · {READ_NETWORKS[item.chainId].name}
                </Button>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            onClick={() => {
              clearInspection(queryClient);
              setInput('');
              setError(null);
            }}
          >
            Clear inspection session
          </Button>
        </details>
      )}
    </form>
  );
}
export function InspectionPanel() {
  const inspection = useInspection();
  return (
    <Panel
      title="Inspect a public address"
      description="No wallet connection needed. Direct specifier bootstrap exceptions are disclosed in Privacy Lab."
    >
      <div className="panel-body">
        <InspectionForm />
        {inspection.isFetching && (
          <p role="status">
            Initializing the anonymous route and reading the account…
          </p>
        )}
        {inspection.isError && (
          <div role="alert" className="prose-copy">
            <p>
              Anonymous account inspection failed. No direct fallback was used.
            </p>
            <Button
              onClick={() => {
                anonRpc.close();
                void inspection.refetch();
              }}
            >
              Retry anonymously
            </Button>
          </div>
        )}
      </div>
    </Panel>
  );
}
