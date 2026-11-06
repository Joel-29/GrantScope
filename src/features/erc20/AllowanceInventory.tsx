import { useId, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Panel } from '../../components/ui/Panel';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatePanel } from '../../components/ui/StatePanel';
import { parseAddress } from '../wallet/address';
import { useAllowanceScan } from './useAllowanceScan';
import { usePairStore } from './pairStore';
import { tokenAmount } from './amounts';
import type { Erc20Permission } from './types';

export function PermissionRecord({ row }: { row: Erc20Permission }) {
  return (
    <details className="disclosure permission-record">
      <summary>
        {row.symbol} · {row.spenderName} · {row.size}
      </summary>
      <dl className="account-details">
        <div>
          <dt>Token</dt>
          <dd>{row.token}</dd>
        </div>
        <div>
          <dt>Spender</dt>
          <dd>{row.spender}</dd>
        </div>
        <div>
          <dt>Balance</dt>
          <dd>
            {tokenAmount(row.balance, row.decimals)} {row.symbol}
          </dd>
        </div>
        <div>
          <dt>Allowance</dt>
          <dd>
            {tokenAmount(row.amount, row.decimals)} {row.symbol}
          </dd>
        </div>
        <div>
          <dt>Raw allowance units</dt>
          <dd>{row.amount.toString()}</dd>
        </div>
        <div>
          <dt>Verified block</dt>
          <dd>{row.blockNumber.toString()}</dd>
        </div>
      </dl>
      <p>
        {row.knownSpender
          ? 'Known registry entry. This is not a safety guarantee.'
          : 'Unclassified contract. Unknown does not mean malicious.'}
      </p>
      {row.warnings.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
    </details>
  );
}

export function AllowanceInventory() {
  const scan = useAllowanceScan();
  const id = useId();
  const cache = useQueryClient();
  const [search, setSearch] = useState(''),
    [size, setSize] = useState('all'),
    [error, setError] = useState('');
  const add = usePairStore((state) => state.add);
  const rows = (scan.data?.rows ?? []).filter(
    (row) =>
      `${row.symbol} ${row.token} ${row.spender} ${row.spenderName}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (size === 'all' || row.size === size),
  );
  function manual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scan.target) return;
    try {
      const values = new FormData(event.currentTarget);
      add(scan.target.chainId, [
        {
          token: parseAddress(String(values.get('token'))),
          spender: parseAddress(String(values.get('spender'))),
          source: 'manual',
        },
      ]);
      setError('');
      event.currentTarget.reset();
    } catch {
      setError(
        'Enter valid checksummed or lowercase token and spender addresses.',
      );
    }
  }
  return (
    <Panel
      title="Permission inventory"
      description="Current ERC-20 state through the selected anonymous worker. Coverage is bounded."
      action={
        <Badge>
          {scan.data
            ? `${scan.data.rows.filter((row) => row.amount > 0n).length} positive checked pairs`
            : 'Not scanned'}
        </Badge>
      }
    >
      <div className="panel-body">
        {!scan.target ? (
          <StatePanel
            title="Choose an address to scan"
            description="Inspect an address first. No token or spender reads have been made."
          />
        ) : (
          <>
            <div className="button-row">
              <Button
                disabled={scan.isFetching}
                onClick={() => void scan.refetch()}
              >
                Scan selected pairs
              </Button>
              <Button
                variant="secondary"
                disabled={!scan.isFetching}
                onClick={() =>
                  void cache.cancelQueries({ queryKey: ['allowances'] })
                }
              >
                Cancel scan
              </Button>
            </div>
            <p>
              Two registered tokens × three known spenders, plus explicitly
              added pairs. Registry addresses have official deployment
              references; token metadata and authority are checked onchain. No
              exhaustive coverage is claimed.
            </p>
            <details className="disclosure">
              <summary>Add a token/spender pair</summary>
              <form className="inspection-form" onSubmit={manual}>
                <label htmlFor={`${id}-token`}>Token contract</label>
                <input
                  id={`${id}-token`}
                  name="token"
                  required
                  placeholder="0x…"
                />
                <label htmlFor={`${id}-spender`}>Spender address</label>
                <input
                  id={`${id}-spender`}
                  name="spender"
                  required
                  placeholder="0x…"
                />
                <Button type="submit">Add pair to scan</Button>
              </form>
              {error && <p role="alert">{error}</p>}
            </details>
          </>
        )}
        {scan.isFetching && (
          <div role="status" aria-live="polite">
            <p>
              Verifying {scan.progress.done} / {scan.progress.total} pairs.
              Worker initialization may take longer.
            </p>
            <progress
              aria-label="Allowance scan progress"
              value={scan.progress.done}
              max={scan.progress.total || 1}
            />
          </div>
        )}
        {scan.isError && (
          <StatePanel
            kind="error"
            title="Allowance scan failed"
            description="The anonymous worker or chain read failed. No direct RPC fallback was attempted. Initialize the worker in Privacy Lab and retry explicitly."
          />
        )}
        {scan.data && (
          <>
            <p role="status">{scan.data.coverage}</p>
            <p>
              {scan.data.failures.length} failed pair reads ·{' '}
              {new Date(scan.data.readAt).toLocaleTimeString()} · Values may
              change after this block.
            </p>
            {scan.data.failures.length > 0 && (
              <details className="disclosure">
                <summary>Incomplete pair reads</summary>
                {scan.data.failures.map((item) => (
                  <p
                    className="address-value"
                    key={`${item.pair.token}:${item.pair.spender}`}
                  >
                    {item.pair.token} / {item.pair.spender}: {item.reason}
                  </p>
                ))}
              </details>
            )}
            <div className="inventory-toolbar">
              <label htmlFor={`${id}-search`}>
                Search live permissions
                <input
                  id={`${id}-search`}
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label htmlFor={`${id}-size`}>
                Allowance size
                <select
                  id={`${id}-size`}
                  value={size}
                  onChange={(event) => setSize(event.target.value)}
                >
                  {['all', 'zero', 'limited', 'maximum', 'near-maximum'].map(
                    (value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
            <div className="desktop-inventory">
              <table>
                <caption>Verified ERC-20 pair results</caption>
                <thead>
                  <tr>
                    <th scope="col">Token</th>
                    <th scope="col">Spender</th>
                    <th scope="col">Allowance size</th>
                    <th scope="col">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <th scope="row">{row.symbol}</th>
                      <td>{row.spenderName}</td>
                      <td>{row.size}</td>
                      <td>{tokenAmount(row.balance, row.decimals)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && (
              <p>
                No matching verified pairs. Failed reads are not zero
                allowances.
              </p>
            )}
            <div aria-label="Permission details">
              {rows.map((row) => (
                <PermissionRecord key={row.id} row={row} />
              ))}
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}
