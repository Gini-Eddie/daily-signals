// Disposable browser QA fixture. Never uses the owner's account or modifies their data.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawn } = require('node:child_process');
const { scryptSync, randomBytes, createHash } = require('node:crypto');
const http = require('node:http');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'daily-signals-preview-'));
fs.copyFileSync('data/store.json', path.join(dir, 'store.json'));
const salt = randomBytes(16).toString('hex');
fs.writeFileSync(path.join(dir, 'account.json'), JSON.stringify({ email: 'preview@example.com', password: salt + ':' + scryptSync('Preview-private-password', salt, 64).toString('hex'), recovery: createHash('sha256').update('preview-only').digest('hex') }));
const monday = new Date(); monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
const week = `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;
fs.writeFileSync(path.join(dir, 'weekly-goals.json'), JSON.stringify([
  {id:'preview1',week_start:week,title:'Finish four workouts',target:4,progress:3,unit:'workouts'},
  {id:'preview2',week_start:week,title:'Read something that stretches me',target:60,progress:30,unit:'pages'},
  {id:'preview3',week_start:week,title:'Ship one meaningful improvement',target:1,progress:1,unit:'feature'},
  {id:'preview4',week_start:week,title:'Reconnect with my network',target:5,progress:2,unit:'conversations'},
]));
const child = spawn(process.execPath, ['dist/server.cjs'], { env: { ...process.env, PORT:'3201', DATA_DIR:dir, NODE_ENV:'production' }, stdio:'inherit' });
// Deliberately delay entry responses to exercise typing during a pending save.
const proxy = http.createServer((req, res) => {
  const upstream = http.request({hostname:'127.0.0.1',port:3201,path:req.url,method:req.method,headers:req.headers}, reply => {
    const chunks=[]; reply.on('data', c=>chunks.push(c)); reply.on('end',()=>setTimeout(()=>{res.writeHead(reply.statusCode,reply.headers);res.end(Buffer.concat(chunks));}, req.url==='/api/habit-entries' ? 1500 : 0));
  }); upstream.on('error',()=>{res.statusCode=502;res.end('Preview starting');}); req.pipe(upstream);
});
proxy.listen(3202,'127.0.0.1',()=>console.log('Disposable UI preview: http://localhost:3202'));
const stop = () => { child.kill(); proxy.close(); };
process.on('SIGINT',stop); process.on('SIGTERM',stop);
child.on('exit',()=>{proxy.close();fs.rmSync(dir,{recursive:true,force:true});});
