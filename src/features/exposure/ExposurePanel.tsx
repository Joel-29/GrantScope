import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '../../components/ui/Panel';
import { Badge } from '../../components/ui/Badge';
import { tokenAmount } from '../erc20/amounts';
import { analyze, groupPermissions, type Permission } from './analysis';
import { usePermissionData } from './usePermissionData';

export function AnalysisRecord({ record }: { record: Permission }) {
  const assessment = analyze(record, {
    nowSeconds: BigInt(Math.floor(record.readAt / 1000)),
    incomplete: true,
  });
  const token = record.kind === 'erc20' ? record : record.underlying;
  return (
    <div className="permission-analysis">
      <Badge tone={assessment.needsReview ? 'warning' : 'neutral'}>
        {assessment.status}
      </Badge>
      <p>
        Layer: {assessment.layer} · Current per-permission bound:{' '}
        {tokenAmount(assessment.bound, token.decimals)} {token.symbol}
      </p>
      <ul>
        {assessment.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <details className="disclosure">
        <summary>Evidence limits</summary>
        {assessment.warnings.map((warning, i) => (
          <p key={`${i}:${warning}`}>{warning}</p>
        ))}
      </details>
    </div>
  );
}
export function ExposurePanel() {
  const data = usePermissionData();
  const [filter, setFilter] = useState('all');
  const records = data.records.filter(
    (record) =>
      filter === 'all' ||
      analyze(record, {
        nowSeconds: BigInt(Math.floor(record.readAt / 1000)),
        incomplete: true,
      }).status === filter,
  );
  return (
    <Panel
      title="Authority analysis"
      description="Deterministic explanations from verified state. No USD loss estimate or sum of overlapping permissions."
    >
      <div className="panel-body">
        {data.scans === 0 ? (
          <p>
            Run a permission scan to analyze verified records. No assessment has
            been made.
          </p>
        ) : (
          <>
            <p>
              {data.records.length} unique checked records · {data.failures}{' '}
              failed reads across retained scan results. Coverage remains
              bounded.
            </p>
            <label htmlFor="assessment-filter">Assessment filter</label>
            <select
              id="assessment-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {[
                'all',
                'review',
                'active',
                'zero',
                'expired',
                'dependency-blocked',
              ].map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
            {groupPermissions(records).map((group) => (
              <section className="analysis-group" key={group.id}>
                <h3>
                  {group.rows[0]?.kind === 'erc20'
                    ? group.rows[0].symbol
                    : group.rows[0]?.underlying.symbol}{' '}
                  <small>{group.rows[0]?.token}</small>
                </h3>
                <p>
                  {group.mixedBlocks
                    ? 'Different block snapshots: refresh before comparing. Amounts are not combined.'
                    : 'Records share a verified block. Bounds overlap and are not added.'}
                </p>
                {group.rows.map((record) => (
                  <div key={record.id}>
                    <Link
                      className="text-link address-value"
                      to={`/permissions/${encodeURIComponent(record.id)}`}
                    >
                      {record.kind === 'permit2'
                        ? 'Permit2 grant'
                        : 'ERC-20 approval'}{' '}
                      → {record.spender}
                    </Link>
                    <AnalysisRecord record={record} />
                  </div>
                ))}
              </section>
            ))}
            {records.length === 0 && (
              <p>
                No verified records match this filter. Other permissions may be
                missing.
              </p>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
