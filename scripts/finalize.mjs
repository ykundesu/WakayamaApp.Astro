import { writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files = await readdir('dist/_astro');
const version = createHash('sha256').update(files.sort().join('\n')).digest('hex').slice(0,12);
await writeFile('dist/build.json', JSON.stringify({ version }));
