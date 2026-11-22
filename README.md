# FROM ZERO TO REALITY｜从构想到现实

罗松涛 · AI 全栈开发工程师 · 260 秒滚动叙事个人介绍

**在线观看：https://songtaoluo007-maker.github.io/from-zero-to-reality/**

网页无需登录。建议使用桌面 Chrome / Edge；滚轮控制镜头，空格播放或暂停，R 倒放，数字 1–5 跳转章节，F 全屏。H 打开操作菜单，P 个人履历，N 讲稿，E 项目证据，L 性能模式。大标题不带标点，不显示常驻播放进度。

## 离线演示

下载 [offline/双击打开-V4.html](offline/双击打开-V4.html) 并在浏览器打开；所有 JS / CSS 均嵌入同一个文件，无 CDN、在线 API 或字体下载。也可访问 [网页版单文件](https://songtaoluo007-maker.github.io/from-zero-to-reality/offline.html) 后另存为 HTML。

## 内容与证据边界

- 个人教育、认证、在校和服役经历按本人提供的两版 2027 届简历保留，未在此工程中独立认证证书或任职原件。
- TCL 实习案例处于方案验证与准确性优化阶段。所有 CAD 图纸、球标、尺寸、错例与 CSV 均为合成示意，不是 TCL 真实资料或量产结果。
- 基金智能分析展示个人桌面应用的交付链路；此网页不调用真实 OCR、AI、行情 API，不执行 SQLite 或打包 Windows 应用，也不展示收益结论。
- 预鉴是边云联调模拟原型，未接入真实雷达，未完成现场验收。网页用内存模拟断网、补传与 eventId 幂等。
- 知宠和拾忆置于追问面板。知宠公开静态站不代表服务端生产投用。

## 工程结构

- app/：Vue 3 + Vite + TypeScript + GSAP + Three.js 源码。
- docs/：本次已验证构建，GitHub Pages 直接从 main 分支的 /docs 发布。
- offline/：与在线构建同源的单文件离线版。
- scripts/sync-pages.mjs：将重新构建的内容同步到 docs/。

原始简历、证书、归档模板、浏览器配置、依赖目录与本机验证录像不随此公开仓库发布。本地完整交付包单独保留。程序化三维几何与中文 DOM 文字不需要远程素材。

## 开发和更新

Node.js 22.12+；在仓库根目录执行：

```sh
cd app
npm ci
npm run dev
# 准备更新部署时
npm run build
cd ..
node scripts/sync-pages.mjs
git add app docs offline scripts README.md
git commit -m "Update keynote"
git push
```

开发地址为 http://127.0.0.1:5184/ 。生产构建 app/dist 为相对资源路径，适用于项目子目录。推送 docs 后由 GitHub Pages 发布，无需重新安装浏览器端依赖。

## 兼容性

优先 WebGL 实时三维；低性能自动降级，WebGL 不可用时回退到 Canvas 透视轨道。NVIDIA RTX 4060 Ti 本机、断网单文件、WebGL 限制与桌面 / 小屏布局有本地测试证据；AMD、Intel 与面试现场投影设备未完成实测，不作已通过声明。

第三方依赖声明见 [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt)。
