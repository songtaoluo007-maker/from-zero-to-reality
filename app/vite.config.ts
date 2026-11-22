import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({plugins:[vue()],base:'./',define:{'process.env.NODE_ENV':'"production"'},build:{outDir:'dist',emptyOutDir:true,lib:{entry:'src/main.ts',name:'RealityKeynote',formats:['iife'],fileName:()=> 'keynote.js',cssFileName:'keynote'},cssCodeSplit:false,rollupOptions:{output:{inlineDynamicImports:true}}}})
