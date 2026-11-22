import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')
await fs.mkdir(path.join(root,'docs'),{recursive:true})
for(const file of ['index.html','keynote.js','keynote.css'])await fs.copyFile(path.join(root,'app/dist',file),path.join(root,'docs',file))
await fs.copyFile(path.join(root,'offline/双击打开-V4.html'),path.join(root,'docs/offline.html'))
await fs.writeFile(path.join(root,'docs/.nojekyll'),'')
console.log('GitHub Pages docs/ synced with app/dist and offline build.')
