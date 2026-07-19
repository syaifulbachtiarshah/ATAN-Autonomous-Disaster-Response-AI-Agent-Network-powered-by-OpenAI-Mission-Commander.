import fs from 'node:fs';

for (const directory of ['dist', 'build']) {
  fs.rmSync(directory, { recursive: true, force: true });
}
