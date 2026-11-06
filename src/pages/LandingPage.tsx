import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  Fingerprint,
  Layers3,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const principles = [
  {
    icon: Eye,
    number: '01',
    title: 'See the permission',
    description:
      'A focused inventory of supported token spending approvals, with precise scan coverage.',
  },
  {
    icon: Layers3,
    number: '02',
    title: 'Understand the layers',
    description:
      'ERC-20 and Permit2 authority explained together, without double-counting exposure.',
  },
  {
    icon: ShieldCheck,
    number: '03',
    title: 'Act with confidence',
    description:
      'Owner-authorized revocation, followed by a fresh read of the onchain allowance.',
  },
];

export function LandingPage() {
  return (
    <div className="page landing-page">
      <div className="intro-meta">
        <span className="eyebrow">ETHEREUM PERMISSION OBSERVATORY</span>
        <span className="tag">Interface release · v0.2</span>
      </div>
      <section className="hero">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="hero-copy"
        >
          <p className="hero-kicker">
            <span />A clearer view of wallet authority
          </p>
          <h1>
            See every grant.
            <br />
            Understand every risk.
            <br />
            <span>Revoke with confidence.</span>
          </h1>
          <p className="hero-description">
            Your wallet’s permissions deserve a closer look. A privacy-first
            workspace for understanding who can spend your tokens, and the
            authority behind every approval.
          </p>
          <div className="hero-actions">
            <Link to="/dashboard" className="button button-primary">
              Explore the workspace
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/about" className="text-link">
              Read our methodology
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <p className="hero-disclaimer">
            <LockKeyhole size={14} aria-hidden="true" />
            Interface release. Live wallet inspection is not available yet.
          </p>
        </motion.div>
        <div
          className="permission-blueprint"
          aria-label="Planned permission model: account, token approval, spender. Illustration only, no wallet data."
        >
          <div className="blueprint-heading">
            <span>
              <ScanLine size={16} aria-hidden="true" />
              PERMISSION MODEL
            </span>
            <span className="blueprint-label">Conceptual</span>
          </div>
          <div className="model-node account-node">
            <div className="model-icon">
              <Eye size={22} aria-hidden="true" />
            </div>
            <span className="node-caption">THE STARTING POINT</span>
            <strong>Your Ethereum account</strong>
            <span className="muted">Public address · read-only inspection</span>
          </div>
          <div className="model-connector">
            <span>grants spending authority</span>
          </div>
          <div className="model-node approval-node">
            <Layers3 size={20} aria-hidden="true" />
            <div>
              <strong>Token approval</strong>
              <span>ERC-20 allowance · Permit2 layers</span>
            </div>
            <LockKeyhole size={15} aria-hidden="true" />
          </div>
          <div className="model-connector short">
            <span>bounded by amount & conditions</span>
          </div>
          <div className="model-node spender-node">
            <ShieldCheck size={20} aria-hidden="true" />
            <div>
              <strong>Spender contract</strong>
              <span>Permission is authority, not proof of harm</span>
            </div>
          </div>
          <div className="blueprint-footer">
            <span className="status-dot" />
            Live state has not been queried
          </div>
        </div>
      </section>
      <section
        className="principles-section"
        aria-labelledby="principles-title"
      >
        <div className="section-heading">
          <h2 id="principles-title">Clarity at every layer</h2>
          <span className="muted">The workflow we’re building</span>
        </div>
        <div className="principle-grid">
          {principles.map(({ icon: Icon, number, title, description }) => (
            <article className="principle-card" key={number}>
              <div className="principle-top">
                <Icon size={22} aria-hidden="true" />
                <span>{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="planned-label">Planned capability</span>
            </article>
          ))}
        </div>
      </section>
      <section className="privacy-banner">
        <div className="privacy-banner-icon">
          <Fingerprint size={27} aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">PRIVACY YOU CAN INSPECT</p>
          <h2>Every route should tell its story.</h2>
          <p>
            Anon-RPC is planned as the default read transport. Bootstrap
            exceptions and wallet submissions will be disclosed separately.
          </p>
        </div>
        <Link to="/privacy" className="button button-secondary">
          Visit Privacy Lab
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
