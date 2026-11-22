<script setup lang="ts">
import {ref,computed,onMounted,onUnmounted} from 'vue'
import {gsap} from 'gsap'
import baseline from './baselineData.json'
import {profile,originNotes} from './profile'
import {beats,railAt,STOPS,DURATION,clamp} from './rail'
import {createIndustrialWorld} from './scene/industrial'
import type {Quality} from './scene/industrial'
const gpu=ref<HTMLCanvasElement>(),cpu=ref<HTMLCanvasElement>()
const time=ref(0),playing=ref(false),direction=ref(1),quality=ref<Quality>('cinema'),panel=ref(''),fps=ref(0),rendererName=ref(''),notice=ref('')
const positions=ref<{id:string,x:number,y:number,visible:boolean}[]>([])
const state=computed(()=>railAt(time.value)),beat=computed(()=>beats[state.value.beat]!),station=computed(()=>state.value.station)
const notes=computed(()=>station.value===0?originNotes:baseline.notes[station.value])
const selected=ref('07'),csvStatus=ref('')
const format=(v:number)=>`${String(Math.floor(v/60)).padStart(2,'0')}:${String(Math.floor(v%60)).padStart(2,'0')}`
const stamp=computed(()=>['ORIGIN','INDUSTRIAL AI','DESKTOP ENGINE','EDGE + CLOUD','FUTURE'][station.value])
const tclSteps=[{t:30,title:'来源追溯',desc:'页码 → 球标 → 尺寸'},{t:58,title:'错例校验',desc:'φ240 → 回看原图'},{t:86,title:'结构化输出',desc:'CSV → 来源区域'}]
const fundLabels=['截图 OCR','API','AI 结果','SQLite 留存','Windows 安装包']
const edgeLabels=['边端事件','Outbox 缓存','恢复补传','eventId 幂等','人工处置']
const minimalBoundary=computed(()=>['','合成图纸 · 方案验证阶段','模拟数据 · 流程示意','模拟原型 · 未接入真实雷达',''][station.value])
const edgePhase=computed(()=>time.value<196?0:time.value<205?1:time.value<215?2:3)
const record=computed(()=>({source:'SIMULATED-CAD',page:2,balloon:selected.value,spec:'φ24.0',ocr:state.value.beat===2?'φ240':'φ24.0',status:state.value.beat===2?'需人工回查':state.value.beat===3?'已人工核对（模拟）':'候选记录 / 待校验',region:'P02 / ROI-07'}))
const edgeState=computed(()=>{const t=time.value,ids=['SIM-E001','SIM-E002','SIM-E003'];const sent=t>=205?ids:[];const attempts=t>=210?[...sent,'SIM-E002']:sent;const accepted=[...new Set(attempts)];return {online:t>=196,outbox:t<196?ids:t<205?ids.slice(1):[],accepted,duplicates:attempts.length-accepted.length,review:t>=220?'已人工确认（模拟）':'待人工确认'}})
let world:ReturnType<typeof createIndustrialWorld>|undefined,master:gsap.core.Timeline|undefined,resizeTimer:ReturnType<typeof setTimeout>,noticeTimer:ReturnType<typeof setTimeout>
const clock={seconds:0};let lastFrame=0,windowStart=0,frameCount=0,slowWindows=0
const samples:{fps:number,time:number,quality:Quality}[]=[]
function message(s:string){notice.value=s;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>notice.value='',5000)}
function update(){
 time.value=clock.seconds
 const now=performance.now();positions.value=world?.render(railAt(clock.seconds))||[]
 if(playing.value){if(now-lastFrame<500){frameCount++;if(now-windowStart>=1000){fps.value=Math.round(frameCount*1000/(now-windowStart));samples.push({fps:fps.value,time:clock.seconds,quality:quality.value});slowWindows=fps.value<28?slowWindows+1:0;frameCount=0;windowStart=now;if(slowWindows>=3&&quality.value==='cinema'){setQuality('performance');message('连续低于 28 fps：已关闭后期与阴影，切换性能模式。');slowWindows=0}}}else{windowStart=now;frameCount=0}}
 lastFrame=now
}
function seek(t:number){master?.pause();playing.value=false;master?.time(clamp(t,0,260),false);clock.seconds=clamp(t,0,260);update()}
function togglePlay(reverse=false){if(playing.value&&!reverse){master?.pause();playing.value=false;return}direction.value=reverse?-1:1;playing.value=true;windowStart=performance.now();frameCount=0;lastFrame=0;if(reverse)master?.reverse();else{if(time.value>=260)seek(0);playing.value=true;master?.play()}}
function jump(i:number){seek(STOPS[clamp(i,0,4)]!+.01)}
function wheel(e:WheelEvent){if((e.target as Element).closest('.drawer'))return;e.preventDefault();seek(time.value+e.deltaY*.035)}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{message('全屏未获浏览器允许，可使用 F11。')}}
function setQuality(q:Quality){quality.value=q;world?.setQuality(q);update()}
function key(e:KeyboardEvent){if(e.ctrlKey||e.metaKey||e.altKey||(e.target as HTMLElement).closest('input,textarea,select'))return;const k=e.key.toLowerCase();if([' ','arrowleft','arrowright','arrowup','arrowdown'].includes(k))e.preventDefault();if(k===' ')togglePlay();else if(k==='r')togglePlay(true);else if('12345'.includes(k)&&k.length===1)jump(+k-1);else if(['arrowright','arrowdown'].includes(k))jump(station.value+1);else if(['arrowleft','arrowup'].includes(k))jump(station.value-1);else if(k==='h')panel.value=panel.value==='controls'?'':'controls';else if(k==='p')panel.value=panel.value==='profile'?'':'profile';else if(k==='n')panel.value=panel.value==='notes'?'':'notes';else if(k==='e')panel.value=panel.value==='evidence'?'':'evidence';else if(k==='f')void fullscreen();else if(k==='l')setQuality(quality.value==='cinema'?'performance':'cinema');else if(k==='escape')panel.value='';else if(k==='home')seek(0);else if(k==='end')seek(260)}
function label(id:string){return positions.value.find(p=>p.id===id)}
function at(id:string){const p=label(id),x=innerWidth<650?clamp(p?.x||0,80,innerWidth-90):p?.x||0;return {left:`${x}px`,top:`${p?.y||0}px`,visibility:p?.visible?'visible' as const:'hidden' as const}}
function exportCsv(){const r=record.value;const csv='\ufeffSIMULATED DATA — NOT TCL DRAWING\r\npage,balloon,spec,source_region,review\r\n'+`${r.page},${r.balloon},${r.spec},${r.region},manual_demo\r\n`;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='SIMULATED-IQC-OUTPUT.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);csvStatus.value='已导出带模拟标识的 CSV'}
function resize(){clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{world?.resize();update()},100)}
let touchY=0
onMounted(()=>{
 if(new URLSearchParams(location.search).get('renderer')==='canvas')quality.value='canvas'
 else if(matchMedia('(prefers-reduced-motion: reduce)').matches||navigator.hardwareConcurrency<=4)quality.value='performance'
 world=createIndustrialWorld(gpu.value!,cpu.value!,quality.value,(reason)=>{quality.value='canvas';message(reason)})
 rendererName.value=world.info().renderer
 master=gsap.timeline({paused:true,onUpdate:update,onComplete:()=>playing.value=false,onReverseComplete:()=>playing.value=false});master.to(clock,{seconds:DURATION,duration:DURATION,ease:'none'},0)
 STOPS.slice(0,5).forEach((t,i)=>master!.addLabel(baseline.stamps[i]!,t))
 addEventListener('wheel',wheel,{passive:false});addEventListener('keydown',key);addEventListener('resize',resize)
 update()
 const queryTime=Number(new URLSearchParams(location.search).get('t'));if(queryTime>0)seek(queryTime)
 ;(window as any).keynoteDebug={seek:(p:number)=>seek(p*260),seekSeconds:seek,play:()=>togglePlay(),pause:()=>{master?.pause();playing.value=false},reverse:()=>togglePlay(true),get:()=>({time:time.value,progress:time.value/260,playing:playing.value,direction:direction.value,beat:beat.value.id,station:station.value,quality:quality.value,renderer:world?.info(),rail:state.value,record:record.value,edge:edgeState.value,samples}),setQuality}
})
onUnmounted(()=>{master?.kill();world?.dispose();removeEventListener('wheel',wheel);removeEventListener('keydown',key);removeEventListener('resize',resize);clearTimeout(resizeTimer);clearTimeout(noticeTimer)})
</script>

<template>
<main class="keynote" :data-station="station" :data-beat="beat.id" :data-quality="quality" @touchstart="(e:TouchEvent)=>touchY=e.touches[0]!.clientY" @touchmove="(e:TouchEvent)=>{if(!(e.target as Element).closest('.drawer')){const y=e.touches[0]!.clientY;seek(time+(touchY-y)*.1);touchY=y}}">
 <canvas ref="gpu" class="world" aria-label="实时三维工业演示"></canvas><canvas ref="cpu" class="world" :hidden="quality!=='canvas'" aria-label="V3 Canvas 透视轨道"></canvas><div class="lens-shade"></div>
 <section class="story-copy" :class="{'future-copy':station===4}"><h1>{{beat.title}}</h1><p class="subtitle">{{beat.sub}}</p><template v-if="station===0"><p class="education-meta">{{profile.education}}</p><p class="intro-name">{{profile.name}} <span>AI FULL-STACK DEVELOPER</span></p></template><p v-else-if="station===4" class="end-thanks">谢谢各位面试官</p></section>
 <section v-if="station===0" class="profile-summary" aria-label="个人履历摘要"><div><h2>专业认证</h2><ul><li v-for="cert in profile.certificates" :key="cert">{{cert}}</li></ul></div><div><h2>在校与其他经历</h2><ul><li v-for="item in profile.campus" :key="item">{{item}}</li><li class="service-period">{{profile.service}}</li></ul></div></section>
 <div v-if="station===1" class="physical-labels" aria-label="TCL 模拟标注"><button :style="at('page')" class="world-label page-label" @click="seek(32)">第 2 页</button><button :style="at('dimension')" class="world-label dimension-label" @click="selected='07';seek(62)"><b>{{beat.id==='validate'?'φ240 ≠ φ24.0':'07 / φ24.0'}}</b></button><button v-if="beat.id==='output'" :style="at('output')" class="world-label output-label" @click="seek(93)"><span>第 2 页 · 球标 07 · φ24.0</span></button></div>
 <div v-if="station===2" class="physical-labels"><div v-for="(s,i) in fundLabels" :key="s" :style="at(`fund-${i}`)" class="world-label device-label" :class="{lit:time>=115+i*11}">{{s}}</div></div>
 <div v-if="station===3" class="physical-labels"><div v-for="(s,i) in edgeLabels" :key="s" :style="at(`edge-${i}`)" class="world-label device-label">{{s}}</div><div class="edge-reading"><span :class="{offline:!edgeState.online}">{{edgeState.online?'连接恢复':'连接中断 · 记录保留'}}</span></div></div>
 <p v-if="minimalBoundary" class="minimal-boundary">{{minimalBoundary}}</p>
 <aside v-if="panel" class="drawer" :aria-label="panel==='notes'?'演讲者讲稿':panel==='evidence'?'项目证据':panel==='controls'?'操作菜单':panel==='profile'?'个人履历':'渲染设置'"><button class="close" aria-label="关闭面板" @click="panel=''">×</button><template v-if="panel==='notes'"><small>演讲者讲稿</small><h2>{{baseline.labels[station]}}</h2><p class="notes-text">{{notes}}</p><div class="notes-hint">{{beat.label}} · {{beat.end-beat.start}} 秒表达状态<br/>空格暂停 / R 倒放 / 滚轮手动接管<br/>讲稿会显示在当前窗口，镜像投屏时请关闭。</div></template><template v-else-if="panel==='profile'"><small>PERSONAL BACKGROUND</small><h2>罗松涛 · 个人履历</h2><article><h3>教育背景</h3><p>{{profile.school}} · {{profile.faculty}}<br>{{profile.major}} · {{profile.education}}<br>{{profile.period}}</p></article><article><h3>专业认证</h3><p v-for="cert in profile.certificates" :key="cert">{{cert}}</p></article><article><h3>在校经历</h3><p v-for="item in profile.campus" :key="item">{{item}}</p></article><article><h3>服役经历</h3><p>{{profile.service}}</p></article><p class="drawer-intro">以上按你提供的两版 2027 届简历核对。认证、任职和荣誉沿用简历陈述，本轮未独立核验原始证书及任职证明。未补造认证日期、奖学金年份或任职起止时间。</p></template><template v-else-if="panel==='evidence'"><small>PROJECT EVIDENCE / 来源：V3 材料</small><h2>实绩与演示的边界</h2><p class="drawer-intro">以下履历已与所提供的两版 2027 届简历及 V3 内容核对；未独立核验原始证书与团队仓库。所有图纸、持仓和边云事件均为模拟。装置用于解释过程，不冒充项目实际界面。</p><article v-for="e in baseline.evidence" :key="e[0]"><h3>{{e[0]}}</h3><em>{{e[1]}}</em><p>{{e[2]}}</p></article></template><template v-else-if="panel==='controls'"><h2>操作</h2><div class="backstage-actions"><button @click="togglePlay();panel=''">{{playing?'暂停':'播放'}}</button><button @click="togglePlay(true);panel=''">倒放</button><button @click="fullscreen">全屏</button></div><nav class="backstage-chapters" aria-label="章节导航"><button v-for="(s,i) in baseline.labels" :key="s" @click="jump(i);panel=''">{{s}}</button></nav><div v-if="station===1" class="backstage-detail"><button v-for="s in tclSteps" :key="s.t" @click="seek(s.t+.1);panel=''">{{s.title}}</button><button v-if="beat.id==='output'" @click="exportCsv">导出模拟 CSV</button><p role="status">{{csvStatus}}</p></div><div v-if="station===3" class="backstage-detail"><button @click="seek(185);panel=''">断网停留</button><button @click="seek(199);panel=''">恢复补传</button><button @click="seek(212);panel=''">重发同 eventId</button><button @click="seek(222);panel=''">人工确认</button></div><div class="backstage-actions"><button @click="panel='profile'">个人履历</button><button @click="panel='notes'">讲稿</button><button @click="panel='evidence'">项目证据</button><button @click="panel='quality'">画质</button></div><p class="shortcuts">空格 播放/暂停 · R 倒放 · 1–5 章节<br>滚轮 前进/后退 · H 操作 · P 履历 · Esc 关闭</p></template><template v-else><small>RENDERING / ACTUAL DEVICE</small><h2>稳定演示优先</h2><p class="renderer-name">{{rendererName}}</p><button v-for="q in (['cinema','performance','canvas'] as const)" :key="q" class="quality-option" :aria-pressed="quality===q" @click="setQuality(q)">{{q==='cinema'?'电影：PBR · 阴影 · 景深 · 泛光':q==='performance'?'性能：单通道 · 像素比 1 · 无阴影':'兼容：V3 Canvas 透视轨道'}}</button><p class="drawer-intro">演示画面隐藏性能读数。电影模式连续 3 个采样窗低于 28 fps，自动降为性能模式。WebGL 受限或上下文丢失自动进入 Canvas。暂停时不持续绘制。AMD / Intel 是否通过以验证报告为准。</p><div class="shortcuts">空格 播放/暂停 · R 倒放 · 1–5 章节<br/>L 画质 · F 全屏 · N 讲稿 · E 证据</div></template></aside>
 <button class="operator-toggle" aria-label="打开操作菜单" title="操作 H" @click="panel=panel==='controls'?'':'controls'">⋯</button>
 <div v-if="notice&&panel" role="status" class="toast">{{notice}}</div>
</main>
</template>
