import sharp from 'sharp';
for(const size of [32,192,512]) {
 const name=size===32?'favicon-32':`icon-${size}`;
 await sharp('assets/icon.png').resize(size,size).png({compressionLevel:9,palette:true,quality:100}).toFile(`public/icons/${name}.png`);
}
