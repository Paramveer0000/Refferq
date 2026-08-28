import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const referralPage = new URL('../src/app/affiliate/referrals/page.tsx', import.meta.url);
const dashboardPage = new URL('../src/app/affiliate/page.tsx', import.meta.url);

test('affiliate lead forms send the camelCase numeric payload required by the referral API', async () => {
  for (const page of [referralPage, dashboardPage]) {
    const source = await readFile(page, 'utf8');
    assert.match(source, /leadName:\s*submitForm\.leadName/);
    assert.match(source, /leadEmail:\s*submitForm\.leadEmail/);
    assert.match(source, /estimatedValue:\s*Number\(submitForm\.estimatedValue\)/);
  }
});
