import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { clearInspection } from '../wallet/clearInspection';
import {
  clearPermissionRoutes,
  permissionPath,
  permissionRouteId,
} from './permissionRoutes';

const owner = '0x0000000000000000000000000000000000000001';
const token = '0x0000000000000000000000000000000000000002';
const spender = '0x0000000000000000000000000000000000000003';
const record = `11155111:${owner}:${token}:${spender}`;
describe('permission link privacy', () => {
  it('keeps a stable session link without putting addresses or the internal record ID into the URL', () => {
    const path = permissionPath(record);
    expect(path).toMatch(/^\/permissions\/[0-9a-f]{64}$/);
    for (const address of [owner, token, spender])
      expect(path).not.toContain(address);
    expect(path).not.toContain(encodeURIComponent(record));
    expect(path).toBe(permissionPath(record));
    expect(permissionRouteId(record)).not.toBe(
      permissionRouteId('permit2:' + record),
    );
  });
  it('invalidates prior route aliases on explicit inspection reset', () => {
    const previous = permissionRouteId(record);
    clearInspection(new QueryClient());
    expect(permissionRouteId(record)).not.toBe(previous);
  });
  it('uses a fresh salt when route state is discarded', () => {
    const previous = permissionPath(record);
    clearPermissionRoutes();
    expect(permissionPath(record)).not.toBe(previous);
  });
});
