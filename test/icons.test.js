import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadIconAsBase64 } from '../src/icons.js';

test('loadIconAsBase64 reads an icon file as a compact base64 string', () => {
  const file = path.join(os.tmpdir(), `ulanzi-icon-${Date.now()}.jpg`);
  fs.writeFileSync(file, Buffer.from([1, 2, 3, 4]));

  assert.equal(loadIconAsBase64(file), 'AQIDBA==');

  fs.unlinkSync(file);
});
