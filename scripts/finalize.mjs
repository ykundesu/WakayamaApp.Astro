import { writeFile, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const files = await readdir('dist/_astro');
const hash = createHash('sha256');
for (const file of (await readdir('dist', {recursive:true})).sort()) {
  if (/\.(html|js|css|json|woff2|png|svg)$/.test(file) && file !== 'build.json') {
    hash.update(file).update(await readFile('dist/' + file));
  }
}
const version = hash.digest('hex').slice(0,12);
await writeFile('dist/build.json', JSON.stringify({ version }));
const assets = files.filter(file => /\.(js|css|woff2)$/.test(file)).map(file => '/_astro/' + file);
assets.push('/icons/favicon-32.png', '/icons/icon.svg', '/icons/apple-touch-icon.png', '/icons/icon-192.png', '/icons/icon-512.png');
const worker = (await readFile('public/expo-service-worker.js', 'utf8')).replace('__BUILD_VERSION__', version).replace('__BUILD_ASSETS__', JSON.stringify(assets));
await writeFile('dist/expo-service-worker.js', worker);
