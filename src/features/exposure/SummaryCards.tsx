import {
  Layers3,
  ShieldCheck,
  Infinity as InfinityIcon,
  ScanLine,
} from 'lucide-react';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { usePermissionData } from './usePermissionData';
import { analyze } from './analysis';
export function SummaryCards() {
  const data = usePermissionData();
  const assessments = data.records.map((row) =>
    analyze(row, {
      nowSeconds: BigInt(Math.floor(row.readAt / 1000)),
      incomplete: true,
    }),
  );
  const measured = data.scans > 0;
  return (
    <div className="summary-grid">
      <MetricCard
        title="Positive authority records"
        icon={Layers3}
        value={
          measured
            ? String(
                assessments.filter(
                  (a) => a.status === 'active' || a.status === 'review',
                ).length,
              )
            : undefined
        }
        detail="Checked records overlap; counts are not independent exposure"
      />
      <MetricCard
        title="Review suggested"
        icon={ShieldCheck}
        value={
          measured
            ? String(assessments.filter((a) => a.needsReview).length)
            : undefined
        }
        detail="Deterministic reasons, not a maliciousness score"
      />
      <MetricCard
        title="Maximum allowances"
        icon={InfinityIcon}
        value={
          measured
            ? String(
                data.records.filter((row) =>
                  row.kind === 'erc20'
                    ? row.size === 'maximum' || row.size === 'near-maximum'
                    : row.amount === (1n << 160n) - 1n,
                ).length,
              )
            : undefined
        }
        detail="Checked sizes only; not a theft prediction"
      />
      <MetricCard
        title="Scan coverage"
        icon={ScanLine}
        value={measured ? 'Bounded' : undefined}
        detail={
          measured
            ? `${data.scans} retained scans · ${data.failures} failed reads`
            : 'No successful permission scan'
        }
      />
    </div>
  );
}
