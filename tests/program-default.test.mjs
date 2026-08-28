import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('setting a default program atomically clears every previous default', async () => {
  const source = await readFile(new URL('../src/app/api/admin/programs/route.ts', import.meta.url), 'utf8');

  assert.match(source, /allowedFields\s*=\s*\[[^\]]*'isDefault'/s);
  assert.match(source, /updates\.isDefault[\s\S]*?prisma\.\$transaction/s);
  assert.match(source, /tx\.program\.updateMany\([\s\S]*?isDefault:\s*false/s);
});
