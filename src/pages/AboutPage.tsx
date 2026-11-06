import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';

export function AboutPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="METHODOLOGY & BOUNDARIES"
        title="Authority, made understandable."
        description="GrantScope is being built as an open-source, privacy-first Ethereum permission observatory."
      />
      <section className="panel prose-panel">
        <h2>Current implementation</h2>
        <p>
          Module 2 provides the responsive application shell, dark and light
          themes, accessible dialogs, permission inventory layouts, and
          development tooling. There is no wallet connection, RPC transport,
          scanner, exposure assessment, Permit2 integration, or transaction
          execution.
        </p>
        <h2>The permission model</h2>
        <p>
          An ERC-20 allowance authorizes a spender to use tokens within the
          token contract’s rules. A positive or unlimited allowance does not
          prove malicious behavior.
        </p>
        <p>
          Permit2 adds another permission layer: the underlying ERC-20 allowance
          to Permit2 and its per-spender AllowanceTransfer authorization. These
          can overlap and must not be summed as independent exposure.
          Outstanding offchain SignatureTransfer signatures cannot be
          universally enumerated before use.
        </p>
        <h2>Coverage has limits</h2>
        <p>
          Known-pair scans and bounded event discovery cannot guarantee a
          complete permission inventory. Smart accounts may have additional
          delegation mechanisms; generic EOA revocation must stay disabled for
          unsupported contract accounts.
        </p>
        <h2>Privacy by evidence</h2>
        <p>
          Future blockchain reads must use a verified anonymous worker by
          default. Bootstrap reads and wallet submissions need separate
          disclosure. The RPC provider still sees query contents, and
          transactions remain public onchain.
        </p>
        <Link to="/privacy" className="text-link">
          Read the planned transparency model
        </Link>
      </section>
    </div>
  );
}
