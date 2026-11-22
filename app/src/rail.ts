// V3 stops and station spacing are retained. Every view is derived from this clock.
export const DURATION=260
export const STOPS=[0,30,115,180,225,260]
export const clamp=(v:number,a=0,b=1)=>Math.min(b,Math.max(a,v))
export const smooth=(v:number)=>{const x=clamp(v);return x*x*(3-2*x)}
export const beats=[
 {start:0,end:30,station:0,id:'origin',label:'认识罗松涛',title:'从想法\n到交付',sub:'深圳职业技术大学 · 人工智能学院 · 软件技术',action:'理解业务问题，再让技术进入真实流程。',boundary:'个人背景 · 应聘 AI 全栈开发工程师'},
 {start:30,end:58,station:1,id:'trace',label:'TCL / 来源追溯',title:'每一个尺寸\n都能回到原图',sub:'TCL 工业研究院 · IQC 工程图纸识别',action:'从第 2 页的球标 07，定位到原始尺寸。',boundary:'验证与准确性优化阶段 · 画面为合成图纸，非 TCL 真实资料'},
 {start:58,end:86,station:1,id:'validate',label:'TCL / 错例校验',title:'先发现错例\n再确认结果',sub:'识别不是终点，校验才让结果可信。',action:'模拟错例：OCR 将 φ24.0 识别为 φ240；阻止自动通过，回看标注。',boundary:'错例为人工构造 · 未声明准确率或量产效果'},
 {start:86,end:115,station:1,id:'output',label:'TCL / 结构化交付',title:'从识别结果\n到可核对的数据',sub:'页码、球标、规格、来源区域，一起保留。',action:'校验后输出结构化记录；点击尺寸或记录，沿同一条来源链返回。',boundary:'CSV 记录为本地模拟 · 原项目代码合并等履历来自 V3 材料，未独立核验'},
 {start:115,end:147,station:2,id:'ingest',label:'基金 / 数据进入应用',title:'一张截图\n进入完整链路',sub:'基金智能分析 · 个人 Windows 应用实践',action:'截图 OCR → API → AI 结构化结果；这是一段流程演示，而非真实产品界面复刻。',boundary:'模拟数据与流程装置 · 不调用真实 AI 或行情 API · 不展示收益结论'},
 {start:147,end:180,station:2,id:'deliver',label:'基金 / 桌面交付',title:'能分析\n也要能运行',sub:'SQLite 历史留存 → Windows 安装包',action:'落库、健康检查、端口冲突与 WebView 失败回退，都是交付的一部分。',boundary:'安装包为三维示意 · 本演示不生成或冒充原应用安装包'},
 {start:180,end:225,station:3,id:'edge',label:'预鉴 / 边云可靠性',title:'断网\n也不丢失过程',sub:'城市积水预警 · 模拟边云联调原型',action:'断网停留 → Outbox 缓存 → 恢复补传 → eventId 幂等 → 人工处置',boundary:'模拟事件与网络故障 · 未接入真实雷达 · 未完成现场验收'},
 {start:225,end:260,station:4,id:'future',label:'未来 / 从构想到现实',title:'让 AI\n进入真实业务',sub:'PLATFORM × DEVICE × AI',action:'NOW 夯实基础    NEXT 承担完整模块    FUTURE 负责系统交付',boundary:'深圳华兆科技 · 求职意向与个人成长计划'}
] as const
export function beatAt(t:number){return beats.findIndex((b,i)=>t>=b.start&&(t<b.end||i===beats.length-1))}
// The original V3 rail parameter is also consumed by its Canvas adapter.
export function indexU(seconds:number){const p=seconds/260;for(let i=0;i<5;i++){const a=STOPS[i]!/260,b=STOPS[i+1]!/260;if(p<=b+1e-7){const t=clamp((p-a)/(b-a));if(i===4)return 4+.18*smooth(t);return i+(t<=.7?.14*smooth(t/.7):.14+.86*smooth((t-.7)/.3))}}return 4.18}
type Key={t:number,p:number[],look:number[]}
const keys:Key[]=[
 {t:0,p:[0,3,24],look:[3,1,0]},{t:25,p:[1,3,19],look:[3,1,-2]},
 {t:30,p:[0,7,-33],look:[3,0,-54]},{t:55,p:[1,6,-36],look:[4,0,-54]},
 {t:58,p:[2,6.3,-38],look:[3.4,0,-54]},{t:83,p:[3.5,5.8,-38],look:[3.8,0,-54]},
 {t:86,p:[3.5,7,-37],look:[3.5,0,-54]},{t:110,p:[4,7,-36],look:[3.5,0,-54]},
 {t:115,p:[0,4,-87],look:[3,0,-108]},{t:142,p:[1,4,-89],look:[4,0,-108]},
 {t:147,p:[2,4,-90],look:[4.5,0,-108]},{t:175,p:[3,4,-89],look:[5,0,-108]},
 {t:180,p:[0,4,-141],look:[3.5,0,-162]},{t:220,p:[2,4,-141],look:[4.5,0,-162]},
 {t:225,p:[0,5,-194],look:[3,1,-216]},{t:260,p:[0,8,-185],look:[3,1,-220]}
]
export function railAt(time:number){
 const t=clamp(time,0,260),beat=beatAt(t),b=beats[beat]!,u=clamp((t-b.start)/(b.end-b.start))
 let k=keys.findIndex((v,i)=>i<keys.length-1&&t>=v.t&&t<=keys[i+1]!.t);if(k<0)k=keys.length-2
 const a=keys[k]!,z=keys[k+1]!,mix=smooth((t-a.t)/(z.t-a.t))
 const lerp=(x:number[],y:number[])=>x.map((n,i)=>n+(y[i]!-n)*mix)
 return {time:t,beat,station:b.station,u,index:indexU(t),camera:lerp(a.p,z.p),look:lerp(a.look,z.look)}
}
export type RailState=ReturnType<typeof railAt>
