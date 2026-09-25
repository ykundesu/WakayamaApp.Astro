import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { brotliCompressSync } from 'node:zlib';
const root=resolve('dist');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.woff2':'font/woff2'};
createServer(async(req,res)=>{
 try {
  let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(/^\/school-rules\/[^/]+\/?$/.test(path))path='/rule-detail/';
  let file=resolve(root,'.'+path);
  if(!file.startsWith(root+'\\')&&!file.startsWith(root+'/')&&file!==root){res.writeHead(403);return res.end();}
  try{if((await stat(file)).isDirectory())file=resolve(file,'index.html');}catch{file=resolve(file,'index.html');}
  let data=await readFile(file);const type=types[extname(file)]||'application/octet-stream';
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control',path.startsWith('/_astro/')?'public,max-age=31536000,immutable':'no-cache');
  if(/text|javascript|json/.test(type)&&req.headers['accept-encoding']?.includes('br')){data=brotliCompressSync(data);res.setHeader('Content-Encoding','br');}
  res.end(data);
 }catch {res.writeHead(404,{'Content-Type':'text/html'});res.end(await readFile(resolve(root,'404.html')).catch(()=>Buffer.from('404')));}
}).listen(Number(process.env.PORT||4347),'127.0.0.1',()=>console.log('Static preview at http://127.0.0.1:4347'));

