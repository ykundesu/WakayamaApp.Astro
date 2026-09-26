import sharp from 'sharp';
import { copyFile, mkdir } from 'node:fs/promises';

// The SVG is the source of truth; PNGs support installed apps and older browsers.
const source = 'assets/icon.svg';
await mkdir('public/icons', { recursive: true });
await copyFile(source, 'public/icons/icon.svg');
for (const size of [32, 180, 192, 512]) {
  const name = size === 32 ? 'favicon-32' : size === 180 ? 'apple-touch-icon' : `icon-${size}`;
  await sharp(source).resize(size, size).png({ compressionLevel: 9 }).toFile(`public/icons/${name}.png`);
}
await sharp(source).resize(512, 512).png({ compressionLevel: 9 }).toFile('assets/icon.png');
