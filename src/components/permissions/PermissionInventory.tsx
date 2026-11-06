import { useId, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, type BadgeTone } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { StatePanel } from '../ui/StatePanel';
import { Skeleton } from '../ui/Skeleton';

export type PreviewPermission = {
  id: string;
  token: string;
  symbol: string;
  spender: string;
  type: 'ERC-20' | 'Permit2';
  amount: string;
  assessment: string;
  tone: BadgeTone;
};
// Live callers cannot supply records. Fictional rows require an explicit preview variant.
type Props =
  | { mode?: 'unavailable' }
  | {
      mode: 'preview';
      rows: readonly PreviewPermission[];
      state?: 'ready' | 'loading' | 'error';
      onRetry?: () => void;
    };

export function PermissionInventory(props: Props) {
  const preview = props.mode === 'preview';
  const rows = props.mode === 'preview' ? props.rows : [];
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const id = useId();
  const filtered = rows.filter(
    (row) =>
      `${row.token} ${row.symbol} ${row.spender}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()) &&
      (type === 'all' || row.type === type),
  );
  const state =
    props.mode === 'preview' ? (props.state ?? 'ready') : 'unavailable';
  const content =
    state === 'loading' ? (
      <div role="status" aria-busy="true" className="inventory-loading">
        <span className="sr-only">Loading design fixture permissions…</span>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="skeleton-row" />
        ))}
      </div>
    ) : state === 'error' ? (
      <StatePanel
        kind="error"
        title="Preview request failed"
        description="This is an isolated design error. No RPC request was made."
        action={
          <Button
            onClick={props.mode === 'preview' ? props.onRetry : undefined}
          >
            Retry preview
          </Button>
        }
      />
    ) : state === 'unavailable' ? (
      <StatePanel
        title="Permission scanning is not implemented"
        description="No wallet has been inspected. Live permissions and scan coverage are unavailable until the blockchain modules are implemented."
        action={
          <Link className="text-link" to="/about">
            Explore the methodology
          </Link>
        }
      />
    ) : filtered.length === 0 ? (
      <StatePanel
        kind="no-results"
        title="No matching preview permissions"
        description="Try another token or spender name, or clear the filters."
        action={
          <Button
            onClick={() => {
              setSearch('');
              setType('all');
            }}
          >
            Clear filters
          </Button>
        }
      />
    ) : null;
  return (
    <Panel
      title="Permission inventory"
      description={
        preview
          ? 'Design fixtures only · Not onchain data'
          : 'Supported spending permissions, once a scan is available.'
      }
      action={
        <Badge tone={preview ? 'warning' : 'neutral'}>
          {preview ? 'Design preview' : 'Not scanned'}
        </Badge>
      }
      className="inventory-panel"
    >
      <div className="inventory-toolbar">
        <div className="search-field">
          <Search size={17} aria-hidden="true" />
          <label className="sr-only" htmlFor={`${id}-search`}>
            Search permissions
          </label>
          <input
            id={`${id}-search`}
            type="search"
            placeholder="Search tokens or spenders"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={!preview}
            aria-describedby={`${id}-help`}
          />
        </div>
        <div className="filter-field">
          <SlidersHorizontal size={16} aria-hidden="true" />
          <label className="sr-only" htmlFor={`${id}-type`}>
            Permission type
          </label>
          <select
            id={`${id}-type`}
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={!preview}
          >
            <option value="all">All permission types</option>
            <option value="ERC-20">ERC-20</option>
            <option value="Permit2">Permit2</option>
          </select>
        </div>
      </div>
      <p className="inventory-help" id={`${id}-help`}>
        {preview
          ? 'Search and filters affect these fictional rows only.'
          : 'Search and filters become available after a verified scan.'}
      </p>
      <div className="desktop-inventory">
        <table>
          <caption className="sr-only">
            {preview
              ? 'Fictional permission design fixtures'
              : 'Permission inventory: no scan available'}
          </caption>
          <thead>
            <tr>
              {[
                'Token',
                'Spender',
                'Permission',
                'Allowance',
                'Assessment',
              ].map((title) => (
                <th scope="col" key={title}>
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {content
              ? null
              : filtered.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">
                      <span className="token-cell">
                        <span className="token-avatar">
                          {row.symbol.slice(0, 1)}
                        </span>
                        <span>
                          {row.token}
                          <small>{row.symbol} · Fictional</small>
                        </span>
                      </span>
                    </th>
                    <td>{row.spender}</td>
                    <td>
                      <Badge>{row.type}</Badge>
                    </td>
                    <td className="numeric">{row.amount}</td>
                    <td>
                      <Badge tone={row.tone}>{row.assessment}</Badge>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-inventory">
        {content ? null : (
          <ul
            className="permission-cards"
            aria-label="Fictional permission design fixtures"
          >
            {filtered.map((row) => (
              <li className="permission-card" key={row.id}>
                <div>
                  <strong>{row.token}</strong>
                  <Badge tone={row.tone}>{row.assessment}</Badge>
                </div>
                <dl>
                  <div>
                    <dt>Spender</dt>
                    <dd>{row.spender}</dd>
                  </div>
                  <div>
                    <dt>Permission</dt>
                    <dd>{row.type}</dd>
                  </div>
                  <div>
                    <dt>Allowance</dt>
                    <dd>{row.amount}</dd>
                  </div>
                </dl>
                <small>Fictional design fixture</small>
              </li>
            ))}
          </ul>
        )}
      </div>
      {content}
      <div className="inventory-footer">
        <span>
          {preview
            ? `${filtered.length} design fixtures shown`
            : 'Coverage not measured'}
        </span>
        <span>ERC-20 + Permit2 AllowanceTransfer</span>
      </div>
    </Panel>
  );
}
