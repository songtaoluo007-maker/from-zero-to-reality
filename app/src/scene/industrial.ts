import * as T from 'three'
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js'
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import {BokehPass} from 'three/examples/jsm/postprocessing/BokehPass.js'
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js'
import {legacyLines} from './v3Fallback'
import {railAt,clamp,smooth} from '../rail'
import type {RailState} from '../rail'

export type Quality='cinema'|'performance'|'canvas'
export type Anchor={id:string,position:T.Vector3}
export function createIndustrialWorld(canvas:HTMLCanvasElement,fallback:HTMLCanvasElement,initial:Quality,onFallback:(reason:string)=>void){
 const scene=new T.Scene();scene.background=new T.Color(0x060b12);scene.fog=new T.FogExp2(0x060b12,.018)
 const camera=new T.PerspectiveCamera(42,1,.2,180)
 const stations=Array.from({length:5},(_,i)=>{const g=new T.Group();g.position.z=-54*i;scene.add(g);return g})
 const anchors:Anchor[]=[],wireMeshes:T.Mesh[]=[],textures:T.Texture[]=[]
 const materials:T.Material[]=[]
 function mat(p:T.MeshStandardMaterialParameters){const m=new T.MeshStandardMaterial(p);materials.push(m);return m}
 const silver=mat({color:0xa9b8c0,metalness:.91,roughness:.22}),dark=mat({color:0x152431,metalness:.83,roughness:.32}),black=mat({color:0x080f17,metalness:.6,roughness:.35}),paper=mat({color:0xd8d7cb,metalness:.08,roughness:.9}),gold=mat({color:0xc6a36c,metalness:.8,roughness:.26}),ice=mat({color:0x79d8ff,emissive:0x30a4de,emissiveIntensity:1.5,metalness:.3,roughness:.25}),amber=mat({color:0xffa563,emissive:0xa83e17,emissiveIntensity:1.2})
 const boxGeo=new T.BoxGeometry(1,1,1)
 function mesh(geo:T.BufferGeometry,m:T.Material,g:T.Object3D,pos:number[]=[0,0,0],scale:number[]=[1,1,1],wire=true){const o=new T.Mesh(geo,m);o.position.fromArray(pos);o.scale.fromArray(scale);o.castShadow=true;o.receiveShadow=true;g.add(o);if(wire)wireMeshes.push(o);return o}
 function box(g:T.Object3D,p:number[],s:number[],m:T.Material=dark,r=.1){return mesh(new RoundedBoxGeometry(s[0]!,s[1]!,s[2]!,2,r),m,g,p)}
 function line(g:T.Object3D,points:number[][],color=0x68c6ed,opacity=.5){const l=new T.Line(new T.BufferGeometry().setFromPoints(points.map(v=>new T.Vector3().fromArray(v))),new T.LineBasicMaterial({color,transparent:true,opacity}));g.add(l);return l}
 function mark(id:string,g:T.Object3D,p:number[]){anchors.push({id,position:new T.Vector3(p[0]!,p[1]!,p[2]!+(g.position.z||0))})}
 // Shared local environment, no HDR download or remote texture.
 scene.add(new T.HemisphereLight(0x9bceee,0x05080d,1.8))
 const key=new T.DirectionalLight(0xe3efff,4.4);key.position.set(-5,14,12);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-18;key.shadow.camera.right=18;key.shadow.camera.top=18;key.shadow.camera.bottom=-18;key.shadow.bias=-.001;scene.add(key);scene.add(key.target)
 const rim=new T.PointLight(0x65cfff,160,36,2);scene.add(rim)
 const fill=new T.PointLight(0xffca8c,95,35,2);scene.add(fill)
 const floors=stations.map(g=>{const f=mesh(new T.PlaneGeometry(110,110),mat({color:0x03070c,metalness:.28,roughness:.65,envMapIntensity:.12}),g,[0,-2.5,0],[1,1,1],false);f.rotation.x=-Math.PI/2;return f})
 // 01 City gate: instanced facades, a physical aperture and a navigable waterfront.
 function city(g:T.Group,sunrise=false){
  const buildings=new T.InstancedMesh(boxGeo,sunrise?gold:dark,66);const o=new T.Object3D();let seed=3401
  function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
  for(let i=0;i<66;i++){const h=.7+rand()*5.7;o.position.set((rand()-.5)*40,-2.5+h/2,-7-rand()*12);o.scale.set(.4+rand(),h,.8+rand());o.updateMatrix();buildings.setMatrixAt(i,o.matrix)}g.add(buildings)
  const tower=mesh(new T.CylinderGeometry(.04,.62,9,4),silver,g,[9,2,-11]);tower.rotation.y=Math.PI/4
  const aperture=mesh(new T.TorusGeometry(7,.045,12,96),sunrise?gold:ice,g,[5,1,-3]);aperture.rotation.set(.18,.15,-.2)
  const aperture2=mesh(new T.TorusGeometry(7.2,.018,8,96),gold,g,[5,1,-3.1]);aperture2.rotation.copy(aperture.rotation)
  if(sunrise){mesh(new T.SphereGeometry(2.3,40,24),new T.MeshBasicMaterial({color:0xffd096}),g,[5,-.5,-27]);mark('thanks',g,[5,5,-16])}
  for(let i=0;i<3;i++)line(g,[[i*3-1,-2.4,15],[5,-2.4,-28]],sunrise?0xe6ba78:0x5a91a8,.35)
 }
 city(stations[0]!);city(stations[4]!,true)
 // 02 A genuine non-planar optical workbench. Paper, flange, optical head and output rack coexist.
 const cad=stations[1]!
 box(cad,[6,-1.5,0],[13,.6,8],black,.18)
 box(cad,[6,-1.13,0],[12.3,.1,7.2],silver,.04)
 const sheet=mesh(new T.PlaneGeometry(9.1,5.7),paper,cad,[5.2,-1.06,.15]);sheet.rotation.x=-Math.PI/2
 const drawing=new T.Group();drawing.position.set(5,-1.03,.2);cad.add(drawing)
 const darkLine=0x456174
 for(const r of [.7,1.4,2.1]){const pts=Array.from({length:97},(_,i)=>[Math.cos(i/96*Math.PI*2)*r,0,Math.sin(i/96*Math.PI*2)*r]);line(drawing,pts,darkLine,.8)}
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;line(drawing,[[Math.cos(a)*.7,0,Math.sin(a)*.7],[Math.cos(a)*2.5,0,Math.sin(a)*2.5]],darkLine,.45)}
 line(drawing,[[-3,0,0],[3,0,0]],darkLine,.5);line(drawing,[[0,0,-2.6],[0,0,2.6]],darkLine,.5)
 // The physical component above the paper has a through-bore and real bolt holes.
 const shape=new T.Shape();shape.absarc(0,0,1.7,0,Math.PI*2,false)
 const hole=new T.Path();hole.absarc(0,0,.62,0,Math.PI*2,true);shape.holes.push(hole)
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2,h=new T.Path();h.absarc(Math.cos(a)*1.25,Math.sin(a)*1.25,.16,0,Math.PI*2,true);shape.holes.push(h)}
 const flange=mesh(new T.ExtrudeGeometry(shape,{depth:.38,bevelEnabled:true,bevelThickness:.06,bevelSize:.045,bevelSegments:3,curveSegments:48}),silver,cad,[5.1,-.52,.25]);flange.rotation.x=-Math.PI/2
 const bore=mesh(new T.TorusGeometry(.66,.06,12,72),gold,cad,[5.1,-.05,.25]);bore.rotation.x=Math.PI/2
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const bolt=mesh(new T.CylinderGeometry(.12,.12,.2,6),black,cad,[5.1+Math.cos(a)*1.25,-.01,.25+Math.sin(a)*1.25]);bolt.rotation.y=a}
 for(const x of [.5,11.5])box(cad,[x,1.5,-2.5],[.25,5.4,.35],silver,.06)
 box(cad,[6,4.2,-2.5],[11.5,.3,.45],dark,.07)
 const scanner=new T.Group();cad.add(scanner);box(scanner,[0,3.75,-2.5],[.9,.7,.9],silver,.1);mesh(new T.CylinderGeometry(.22,.3,.4,24),black,scanner,[0,3.3,-2.5]);const glass=mesh(new T.CylinderGeometry(.18,.18,.03,24),ice,scanner,[0,3.05,-2.5]);glass.rotation.x=.1
 const scan=mesh(new T.PlaneGeometry(.055,5.5),new T.MeshBasicMaterial({color:0x77daff,transparent:true,opacity:.5,side:T.DoubleSide,blending:T.AdditiveBlending,depthWrite:false}),cad,[4,-.99,.15]);scan.rotation.x=-Math.PI/2
 const beamMaterial=new T.ShaderMaterial({transparent:true,side:T.DoubleSide,blending:T.AdditiveBlending,depthWrite:false,vertexShader:'varying vec3 vLocal;varying vec3 vNormal;varying vec3 vView;void main(){vLocal=position;vec4 p=modelViewMatrix*vec4(position,1.);vView=-p.xyz;vNormal=normalMatrix*normal;gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vLocal;varying vec3 vNormal;varying vec3 vView;void main(){float h=clamp((vLocal.y+2.35)/4.7,0.,1.);float rim=pow(abs(dot(normalize(vNormal),normalize(vView))),2.);float a=.035*pow(h,.7)*rim;gl_FragColor=vec4(.13,.52,.8,a);}'})
 const beam=mesh(new T.ConeGeometry(2.5,4.7,36,8,true),beamMaterial,cad,[5,1,-.2]);beam.castShadow=false
 const selection=mesh(new T.TorusGeometry(.29,.018,8,48),ice,cad,[6.35,-.94,1.45]);selection.rotation.x=Math.PI/2
 const rejected=mesh(new T.TorusGeometry(.36,.022,8,48),amber,cad,[6.35,-.92,1.45]);rejected.rotation.x=Math.PI/2
 const rack=new T.Group();rack.position.set(10,.1,1.2);cad.add(rack)
 box(rack,[0,0,0],[1.8,.2,3.1],dark,.06)
 const records=Array.from({length:5},(_,i)=>box(rack,[0,.2+i*.16,0],[1.6,.08,2.7],i===0?gold:silver,.025))
 line(cad,[[6.35,-.8,1.45],[7.5,.2,2.2],[10,.4,1.2]],0x8adfff,.7)
 mark('page',cad,[2,-1,2.6]);mark('dimension',cad,[6.7,.4,1.8]);mark('output',cad,[10,.9,1.4]);mark('optic',cad,[7,4.6,-2.5])
 // 03 Desktop data engine. Five solid modules establish cause and effect through depth.
 const fund=stations[2]!
 box(fund,[6,-1.6,0],[13,.6,7],black,.18)
 const monitor=box(fund,[4,1,-2],[6.4,3.6,.35],silver,.18);monitor.rotation.y=.1
 box(fund,[4.022,1,-1.78],[6,3.2,.05],black,.06).rotation.y=.1;box(fund,[4,-1,-2],[.25,1,.6],silver,.04)
 const input=box(fund,[1,0,1.3],[1.5,2.4,.18],silver,.12);input.rotation.set(-.3,.2,-.12)
 for(let i=0;i<5;i++)box(fund,[1, .8-i*.34,1.42],[1.05,.055,.025],i===1?gold:ice,.01)
 const api=box(fund,[4,.1,.9],[1.3,1.3,1.3],dark,.13);mesh(new T.TorusGeometry(.47,.025,8,48),ice,api,[0,0,.68])
 const core=mesh(new T.IcosahedronGeometry(.8,1),silver,fund,[6.9,.2,.6]);mesh(new T.TorusGeometry(1.1,.018,8,80),gold,core)
 const db=new T.Group();db.position.set(9.3,-.1,1.1);fund.add(db)
 for(let i=0;i<3;i++)mesh(new T.CylinderGeometry(.63,.63,.24,40),silver,db,[0,i*.31,0]);mesh(new T.TorusGeometry(.63,.014,8,48),ice,db,[0,.64,0]).rotation.x=Math.PI/2
 const installer=box(fund,[11.3,.2,-.5],[1.3,1.7,.6],gold,.12)
 const pipenodes=[[1,.1,1.3],[4,.1,.9],[6.9,.2,.6],[9.3,.3,1.1],[11.3,.2,-.5]]
 line(fund,pipenodes,0x8adfff,.5)
 const packet=mesh(new T.SphereGeometry(.085,12,8),ice,fund)
 pipenodes.forEach((p,i)=>mark(`fund-${i}`,fund,[p[0]!,p[1]!+(i===4?2.25:1.5),p[2]!]))
 // 04 Edge → Outbox → cloud → dedupe → operator. Solid queues and gates, no network wallpaper.
 const edge=stations[3]!
 const positions=[[-.2,0,1.5],[3,0,1.5],[7,0,-1],[10,0,-.5],[12.7,0,-2]]
 box(edge,[6,-1.6,0],[16,.5,8],black,.18)
 const sensor=mesh(new T.CylinderGeometry(.5,.65,1.7,32),silver,edge,[0,-.2,1.5]);mesh(new T.SphereGeometry(.4,24,16),black,sensor,[0,.85,0],[1,.3,1])
 const outbox=box(edge,[3,-.2,1.5],[1.5,1.8,1.3],dark,.13)
 const queue=Array.from({length:4},(_,i)=>box(edge,[3,-.65+i*.33,2.18],[1.1,.12,.07],i===0?gold:ice,.015))
 const cloud=box(edge,[7,0,-1],[1.8,2.5,1.4],silver,.12)
 for(let i=0;i<5;i++)box(edge,[7,-.8+i*.4,-.24],[1.45,.045,.03],ice,.01)
 const gate=mesh(new T.TorusGeometry(1,.08,12,64),gold,edge,[10,.4,-.5]);gate.rotation.y=.3
 const operator=box(edge,[12.7,.1,-2],[2.5,1.7,.15],silver,.1);box(edge,[12.7,.1,-1.9],[2.25,1.4,.03],black,.025)
 const link=line(edge,positions,0x71d6ff,.6)
 const duplicate=mesh(new T.SphereGeometry(.12,16,12),amber,edge,[9.8,.4,-.5])
 const event=mesh(new T.SphereGeometry(.12,16,12),ice,edge,[3,.8,1.5])
 positions.forEach((p,i)=>mark(`edge-${i}`,edge,[p[0]!,p[1]!+2,p[2]!]))
 // A literal spatial corridor links the five stations. It is secondary to the current device.
 const route=new T.CatmullRomCurve3(Array.from({length:30},(_,i)=>new T.Vector3(5+Math.sin(i*.3),-2.35,15-i*9)))
 mesh(new T.TubeGeometry(route,220,.014,6,false),ice,scene,[0,0,0],[1,1,1],false)
 let renderer:T.WebGLRenderer|undefined,composer:EffectComposer|undefined,bokeh:BokehPass|undefined,env:T.WebGLRenderTarget|undefined,mode=initial,current=railAt(0),disposed=false,width=1920,height=1080
 const ctx=fallback.getContext('2d')!
 function activateCanvas(reason:string){mode='canvas';canvas.hidden=true;fallback.hidden=false;onFallback(reason)}
 if(initial!=='canvas')try{
  renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose()
  composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));bokeh=new BokehPass(scene,camera,{focus:24,aperture:.000013,maxblur:.002});composer.addPass(bokeh);composer.addPass(new UnrealBloomPass(new T.Vector2(1920,1080),.24,.45,1.05));composer.addPass(new OutputPass())
 }catch{activateCanvas('WebGL 初始化不可用，已使用 V3 Canvas 透视轨道')}
 else activateCanvas('手动选择 V3 Canvas 透视轨道')
 function updateGeometry(s:RailState){
  const exits=[30,115,180,225,260]
  stations.forEach((g,i)=>g.visible=i===s.station||(i===s.station+1&&s.time>exits[s.station]!-5))
  scanner.position.x=3.8+smooth(s.u)*3.1
  scan.position.x=scanner.position.x;scan.visible=s.beat===1
  beam.position.x=scanner.position.x;beam.visible=s.station===1
  selection.visible=s.beat===1||s.beat===3;rejected.visible=s.beat===2
  flange.rotation.z=.06+Math.sin(s.time*.025)*.025
  records.forEach((r,i)=>r.position.y=.2+i*.16+(s.beat===3?smooth(s.u)*i*.18:0))
  rack.rotation.y=s.beat===3?-.18:0
  core.rotation.set(.3,s.time*.03,.2)
  const fundPhase=smooth(clamp((s.time-115)/52))*3.999,fi=Math.min(3,Math.floor(fundPhase)),ff=fundPhase-fi
  packet.position.lerpVectors(new T.Vector3().fromArray(pipenodes[fi]!),new T.Vector3().fromArray(pipenodes[fi+1]!),ff)
  installer.rotation.y=s.beat===5?-.25:0
  const ep=clamp((s.time-180)/45);queue.forEach((q,i)=>{q.visible=ep<.55||i>Math.floor((ep-.55)*10);q.position.y=-.65+i*.33})
  ;(link.material as T.LineBasicMaterial).color.setHex(ep<.36?0x625548:0x71d6ff)
  ;(link.material as T.LineBasicMaterial).opacity=ep<.36?.18:.7
  const ex=ep<.36?3:3+smooth((ep-.36)/.36)*7
  event.position.set(ex,.5,1.5-(ex-3)/7*2);duplicate.visible=ep>.7&&ep<.88
  key.position.set(s.camera[0]!-7,14,s.camera[2]!+6);key.target.position.set(6,0,-s.station*54)
  rim.position.set(11,5,-s.station*54-5);fill.position.set(0,2,-s.station*54+5)
  const warm=s.station===4;key.color.setHex(warm?0xffd4a5:0xe3efff);scene.fog!.color.setHex(warm?0x161b22:0x060b12);scene.background=new T.Color(warm?0x101821:0x060b12)
  floors.forEach((f,i)=>f.visible=i===s.station)
  if(bokeh)(bokeh.uniforms as Record<string,{value:number}>)['focus']!.value=camera.position.distanceTo(new T.Vector3(6,0,-s.station*54))
  scene.updateMatrixWorld(true)
 }
 const edgeCache=new Map<T.BufferGeometry,T.BufferGeometry>()
 function point(p:T.Vector3){p.project(camera);if(p.z<-1||p.z>1)return null;return {x:(p.x*.5+.5)*width,y:(-.5*p.y+.5)*height}}
 function canvasDraw(){
  ctx.fillStyle=current.station===4?'#101821':'#060b12';ctx.fillRect(0,0,width,height)
  const haze=ctx.createRadialGradient(width*.7,height*.43,0,width*.7,height*.43,width*.65);haze.addColorStop(0,current.station===4?'#725a2c55':'#17415588');haze.addColorStop(1,'#060b1200');ctx.fillStyle=haze;ctx.fillRect(0,0,width,height)
  // Original V3 seeded rail lines, projected by the one global camera.
  const data=legacyLines();ctx.lineWidth=.7;ctx.strokeStyle='#5d9cbd35';ctx.beginPath()
  for(let j=0;j<data.length;j+=14){const a=point(new T.Vector3(data[j],data[j+1],data[j+2])),b=point(new T.Vector3(data[j+7],data[j+8],data[j+9]));if(!a||!b||Math.abs(a.x-b.x)>width*3)continue;ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y)}ctx.stroke()
  // Additional device edges preserve non-planar depth without a WebGL context.
  for(const m of wireMeshes){let obj:T.Object3D|null=m,visible=true;while(obj){if(!obj.visible)visible=false;obj=obj.parent}if(!visible||m.position.distanceTo(camera.position)>400)continue
   let geo=edgeCache.get(m.geometry);if(!geo){geo=new T.EdgesGeometry(m.geometry,28);edgeCache.set(m.geometry,geo)}
   const attr=geo.getAttribute('position');ctx.strokeStyle=(m.material===gold||m.material===amber)?'#d7b580aa':'#8ac7df88';ctx.beginPath()
   const stride=Math.max(2,Math.ceil(attr.count/800/2)*2)
   for(let i=0;i<attr.count;i+=stride){const a=point(new T.Vector3().fromBufferAttribute(attr,i).applyMatrix4(m.matrixWorld)),b=point(new T.Vector3().fromBufferAttribute(attr,i+1).applyMatrix4(m.matrixWorld));if(!a||!b||Math.abs(a.x-b.x)>width*2)continue;ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y)}ctx.stroke()
  }
 }
 function render(s:RailState){if(disposed)return;current=s;camera.position.fromArray(s.camera);camera.lookAt(new T.Vector3().fromArray(s.look));camera.updateMatrixWorld();updateGeometry(s)
  if(mode==='canvas')canvasDraw();else if(renderer){if(mode==='cinema'&&composer)composer.render();else renderer.render(scene,camera)}
  return anchors.map(a=>{const p=point(a.position.clone());return {id:a.id,x:p?.x||0,y:p?.y||0,visible:!!p&&p.x>0&&p.x<width&&p.y>0&&p.y<height}})
 }
 function resize(){width=innerWidth;height=innerHeight;camera.aspect=width/height;camera.updateProjectionMatrix();const dpr=mode==='performance'?1:Math.min(devicePixelRatio,1.5);renderer?.setPixelRatio(dpr);renderer?.setSize(width,height,false);composer?.setPixelRatio(dpr);composer?.setSize(width,height);fallback.width=width;fallback.height=height;render(current)}
 function setQuality(q:Quality){if(q==='canvas')activateCanvas('已选择 V3 Canvas 透视轨道');else if(renderer){mode=q;canvas.hidden=false;fallback.hidden=true;renderer.shadowMap.enabled=q==='cinema'}resize()}
 function lost(e:Event){e.preventDefault();activateCanvas('WebGL 上下文丢失，已切换至 V3 Canvas 轨道');resize()}
 canvas.addEventListener('webglcontextlost',lost);resize()
 function info(){if(!renderer)return {renderer:'Canvas2D',mode};const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),mode,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}}
 return {render,resize,setQuality,info,dispose(){disposed=true;canvas.removeEventListener('webglcontextlost',lost);scene.traverse(o=>{const m=o as T.Mesh;if(m.geometry)m.geometry.dispose();if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>x.dispose())});edgeCache.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());composer?.dispose();env?.dispose();renderer?.dispose()}}
}
