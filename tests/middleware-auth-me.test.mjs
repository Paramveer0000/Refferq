import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('/api/auth/me is treated as an authenticated route by middleware', async () => {
  const middleware = await readFile(new URL('../src/middleware.ts', import.meta.url), 'utf8');

  assert.match(middleware, /const isAuthMeRoute = pathname === '\/api\/auth\/me';/);
  assert.match(middleware, /if \(!isAdminRoute && !isAffiliateRoute && !isAuthMeRoute\)/);
});
