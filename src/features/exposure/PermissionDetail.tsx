import { RevocationControl } from '../revocation/RevocationControl';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { StatePanel } from '../../components/ui/StatePanel';
import { PermissionRecord } from '../erc20/AllowanceInventory';
import { Permit2Record } from '../permit2/Permit2Panel';
import { usePermissionData } from './usePermissionData';
import { AnalysisRecord } from './ExposurePanel';
import { permissionRouteId } from './permissionRoutes';

export function PermissionDetail() {
  const { id } = useParams();
  const { records } = usePermissionData();
  const record = records.find((row) => permissionRouteId(row.id) === id);
  return (
    <div className="page">
      <PageHeader
        eyebrow="VERIFIED AUTHORITY"
        title={record ? 'Permission details' : 'Permission unavailable'}
        description="A detail URL resolves only to successful records from this session and worker."
      />
      <Panel title="Authorization details">
        <div className="panel-body">
          {record ? (
            <>
              {record.kind === 'erc20' ? (
                <PermissionRecord row={record} />
              ) : (
                <Permit2Record grant={record} />
              )}
              <AnalysisRecord record={record} />
              <RevocationControl record={record} />
            </>
          ) : (
            <StatePanel
              title="Nothing to inspect yet"
              description="Run a scan in this session. A URL alone does not establish a verified allowance."
            />
          )}
          <Link className="text-link" to="/permissions">
            Back to permissions
          </Link>
        </div>
      </Panel>
    </div>
  );
}
