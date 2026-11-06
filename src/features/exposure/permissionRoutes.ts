import { keccak256, toHex } from 'viem';

// Internal record IDs contain addresses. Never put those IDs into browser URLs:
// hosting logs and copied links would otherwise disclose the inspected identities.
// The random salt stays in memory and changes on explicit inspection reset.
let salt = crypto.randomUUID();
export function permissionRouteId(recordId: string) {
  return keccak256(toHex(`${salt}:${recordId}`)).slice(2);
}
export function permissionPath(recordId: string) {
  return `/permissions/${permissionRouteId(recordId)}`;
}
export function clearPermissionRoutes() {
  salt = crypto.randomUUID();
}
