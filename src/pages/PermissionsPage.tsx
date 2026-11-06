import { ExposurePanel } from '../features/exposure/ExposurePanel';
import { PermissionDetail } from '../features/exposure/PermissionDetail';
import { Permit2Panel } from '../features/permit2/Permit2Panel';
import { DiscoveryPanel } from '../features/discovery/DiscoveryPanel';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Notice } from '../components/ui/Notice';
import { Panel } from '../components/ui/Panel';
import { AllowanceInventory } from '../features/erc20/AllowanceInventory';

export function PermissionsPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="SPENDING AUTHORITY"
        title="Permissions"
        description="A focused inventory of supported permissions and the conditions behind them."
      />
      <Notice title="Bounded allowance inspection">
        Scan known or explicitly added token/spender pairs through the selected
        anonymous worker. Bounded owner-filtered event discovery is available
        below.
      </Notice>
      <AllowanceInventory />
      <DiscoveryPanel />
      <Permit2Panel />
      <ExposurePanel />
      <div className="two-column">
        <Panel title="Know the layers">
          <div className="panel-body">
            <details className="disclosure">
              <summary>ERC-20 approvals</summary>
              <p>
                A token-level allowance bounds a spender’s authority. A positive
                or unlimited allowance does not prove malicious behavior.
              </p>
            </details>
            <details className="disclosure">
              <summary>Permit2 authorizations</summary>
              <p>
                The underlying ERC-20 approval and Permit2’s per-spender
                allowance are overlapping permission layers. SignatureTransfer
                signatures cannot be universally enumerated before use.
              </p>
            </details>
          </div>
        </Panel>
        <Panel title="Coverage comes with context">
          <div className="panel-body prose-copy">
            <p>
              Known token/spender pairs and bounded historical discovery will
              each report their coverage. Neither should be presented as a
              complete inventory.
            </p>
            <Link to="/about" className="text-link">
              Read the methodology →
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export const PermissionDetailPage = PermissionDetail;
