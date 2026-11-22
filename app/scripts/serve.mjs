import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist')
const port=Number(process.env.PORT||4173)
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.json':'application/json'}
if(!fs.existsSync(root)){console.error('dist 不存在，请先运行 npm install 和 npm run build');process.exit(1)}
http.createServer((req,res)=>{
  let decoded;try{decoded=decodeURIComponent((req.url||'/').split('?')[0])}catch{res.writeHead(400);res.end();return}
  const file=path.resolve(root,'.'+(decoded==='/'?'/index.html':decoded))
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end('Not found');return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data)})
}).listen(port,'127.0.0.1',()=>console.log(`FROM ZERO TO REALITY: http://127.0.0.1:${port}\n按 Ctrl+C 停止。完全本地运行，无需联网。`))
