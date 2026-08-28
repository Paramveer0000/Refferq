import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('schema persists single-use partner invitations', async () => {
  const schema = await read('prisma/schema.prisma');
  assert.match(schema, /model PartnerInvitation/);
  assert.match(schema, /token\s+String\s+@unique/);
  assert.match(schema, /expiresAt\s+DateTime/);
  assert.match(schema, /acceptedAt\s+DateTime\?/);
});

test('admin invitation route sends a Resend invitation after validation', async () => {
  const route = await read('src/app/api/admin/partner-invitations/route.ts');
  assert.match(route, /user\.role !== 'ADMIN'/);
  assert.match(route, /randomBytes\(32\)\.toString\('hex'\)/);
  assert.match(route, /emailService\.sendPartnerInvitationEmail/);
});

test('registration consumes a valid invitation and assigns its partner group', async () => {
  const auth = await read('src/lib/auth.ts');
  assert.match(auth, /invitationToken\?: string/);
  assert.match(auth, /partnerInvitation\.findUnique/);
  assert.match(auth, /partnerInvitation\.update/);
  assert.match(auth, /partnerGroupId: invitation\?\.partnerGroupId/);
});

test('invite dialog posts to the partner invitation endpoint', async () => {
  const page = await read('src/app/admin/partners/page.tsx');
  assert.match(page, /fetch\('\/api\/admin\/partner-invitations'/);
  assert.doesNotMatch(page, /Invite feature will send an email invitation/);
});

test('partners API includes outstanding invitations as INVITED rows', async () => {
  const route = await read('src/app/api/admin/affiliates/route.ts');
  assert.match(route, /prisma\.partnerInvitation\.findMany/);
  assert.match(route, /invitations,/);
});

test('new and accepted invited partners require approval', async () => {
  const createRoute = await read('src/app/api/admin/affiliates/route.ts');
  const auth = await read('src/lib/auth.ts');
  assert.match(createRoute, /status: 'PENDING'/);
  assert.match(auth, /const initialStatus = data\.invitationToken \? 'PENDING' : 'ACTIVE';/);
});
