import {createConnection} from 'node:net';
import {spawn} from 'node:child_process';
const children=[];
try {
 for (const [script,port] of [['scripts/serve.mjs',4347],['tests/mock-api.cjs',3001]]) {
  const occupied = await new Promise(resolve => {
   const socket=createConnection({host:'127.0.0.1',port});
   socket.once('connect',()=>{socket.destroy();resolve(true);});
   socket.once('error',()=>resolve(false));
  });
  if(occupied)throw new Error(`Port ${port} is already in use`);
  const child=spawn(process.execPath,[script],{stdio:'inherit'});children.push(child);
  let ready=false;
  for(let attempt=0;attempt<100;attempt++) {
   if(child.exitCode!==null)throw new Error(`${script} exited before startup`);
   try {await fetch(`http://127.0.0.1:${port}`);ready=true;break;} catch {await new Promise(resolve=>setTimeout(resolve,100));}
  }
  if(!ready)throw new Error(`Port ${port} did not become ready`);
 }
 const child=spawn(process.env.PYTHON||'python',[process.argv[2]||'tests/browser.py'],{stdio:'inherit',env:{...process.env,PYTHONUTF8:'1'}});children.push(child);
 process.exitCode=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>resolve(code??1));});
} finally {for(const child of children)if(child.exitCode===null)child.kill();}
