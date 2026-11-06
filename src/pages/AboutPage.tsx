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
          Account inspection, bounded ERC-20 discovery, Permit2
          AllowanceTransfer, explained authority bounds and owner-authorized
          zeroing use a fail-closed anonymous read adapter. Nym is primary; Nox
          is an explicit Sepolia alternative after failure. Tor requires an
          operational authenticated gateway. Privacy Lab separates worker
          readiness, real-response evidence, direct bootstrap exceptions and
          wallet-provider activity. Code-present accounts remain read-only. No
          unsigned or mocked transaction is called a verified live revocation.
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
          Application-controlled blockchain reads use the selected anonymous
          worker by default. Bootstrap reads and wallet submissions need
          separate disclosure. The RPC provider still sees query contents, and
          transactions remain public onchain.
        </p>
        <Link to="/privacy" className="text-link">
          Inspect measured routes and exclusions
        </Link>
      </section>
    </div>
  );
}
