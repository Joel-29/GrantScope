import type { PreviewPermission } from '../components/permissions/PermissionInventory';

// Fictional, development-only design content. Never import from production pages.
export const previewPermissions: readonly PreviewPermission[] = [
  {
    id: 'fixture-a',
    token: 'Preview emerald',
    symbol: 'DEMO-A',
    spender: 'Example exchange',
    type: 'ERC-20',
    amount: '250 DEMO-A',
    assessment: 'Limited · Preview',
    tone: 'accent',
  },
  {
    id: 'fixture-b',
    token: 'Preview violet',
    symbol: 'DEMO-B',
    spender: 'Example router',
    type: 'Permit2',
    amount: 'Unlimited · Preview',
    assessment: 'Review · Preview',
    tone: 'warning',
  },
  {
    id: 'fixture-c',
    token: 'Preview amber',
    symbol: 'DEMO-C',
    spender: 'Example vault',
    type: 'Permit2',
    amount: 'Expired · Preview',
    assessment: 'Expired · Preview',
    tone: 'neutral',
  },
];
