import fs from 'node:fs/promises'
const css=await fs.readFile('dist/keynote.css','utf8'),js=await fs.readFile('dist/keynote.js','utf8')
const shell=(style,script)=>`<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#060b12"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23060b12'/%3E%3Cpath d='M9 24V8h16M9 16h12' stroke='%23d8b788' fill='none'/%3E%3C/svg%3E"><title>FROM ZERO TO REALITY · 罗松涛 · V4</title>${style}<div id="app"></div>${script}</html>`
await fs.writeFile('dist/index.html',shell('<link rel="stylesheet" href="./keynote.css">','<script src="./keynote.js"></script>'))
await fs.mkdir('../offline',{recursive:true})
await fs.writeFile('../offline/双击打开-V4.html',shell(`<style>${css}</style>`,`<script>${js.replaceAll('</script','<\\/script')}</script>`))
console.log('Built local scripts + CSS, and embedded the same build into offline/双击打开-V4.html')
