# 《非遗活了》—— 活路儿地方非遗 AR 系列互动海报

> 中国好创意大赛 · 活路儿—地方非遗生成式人工智能专项赛
> 参赛类别四：人工智能 + 数字文创类（AR 非遗数字交互文创作品）

扫描四张系列海报，川渝四大国家级非遗当场"活"过来：

| 海报 | 非遗项目 | AR 内容 | 交互 |
|------|---------|---------|------|
| 壹《龙》 | 铜梁龙舞 | 巨龙破纸腾空盘旋，火龙钢花迸溅 | 点击迸发钢花 |
| 贰《画》 | 梁平木版年画 | "一画多版"套色拍印全过程 | 点击快进拍印 |
| 叁《绣》 | 蜀绣 | 银针引线空中绣出五瓣芙蓉 | 点击加速刺绣 |
| 肆《陶》 | 荣昌陶器 | 拉坯成型→朱砂挂釉→窑变烧成 | 点击换器型 |

扫齐四艺解锁「四艺合卷」彩蛋。

## 亮点对照赛题硬性要求

- **合集模式**：单个 `targets.mind` 编译 4 张识别图，单次扫描任意识别，丢失追踪后无缝换扫任意海报
- **三端兼容**：网页端 / 安卓 / iOS 浏览器扫码直开，无需下载 APP
- **零水印**：自托管开源 MindAR + Three.js，无任何平台/厂商/个人水印
- **稳定一致**：全程序化几何建模（无外部 3D 模型文件），实例化渲染，多设备加载与交互一致
- **降级与评审友好**：`?scene=dragon|print|embroidery|pottery` 免相机预览模式；页内识别图预览支持"双屏"评审

## 目录结构

```
site/            发布目录（即线上站点）
  index.html     单页应用
  js/bundle.js   esbuild 打包产物（three + mind-ar + 业务代码）
  targets/       识别文件 targets.mind（4 目标）
  posters/       识别图（评审预览用）
posters/raw/     AI 生成海报原始画面（源文件）
posters/print/   印刷版海报（2048×3072）
src/             应用源码（主控 + 四个程序化 AR 场景）
tools/           构建工具链（海报合成/识别编译/二维码/部署）
docs/            设计文档
提交材料/         提交清单与二维码
```

## 本地开发

```powershell
npm install
node tools\serve.mjs 8177 site          # 本地预览 http://localhost:8177
node tools\render-posters.mjs           # 重新合成海报（改 tools/compose.html 后）
node tools\compile-targets.mjs          # 重新编译识别文件（海报变更后）
npx esbuild src\main.js --bundle --format=iife --target=es2019 --minify `
  --alias:fs=./src/shims/empty.js --alias:util=./src/shims/empty.js `
  --alias:buffer=./src/shims/empty.js --alias:path=./src/shims/empty.js `
  --alias:crypto=./src/shims/empty.js --alias:worker_threads=./src/shims/empty.js `
  --alias:perf_hooks=./src/shims/empty.js --alias:os=./src/shims/empty.js `
  --outfile=site\js\bundle.js           # 重新打包（改 src/ 后）
```

## 部署上线

```powershell
gh auth login                                        # 首次需要
powershell -ExecutionPolicy Bypass -File tools\deploy.ps1
```

脚本自动完成：建仓推送 → 发布 gh-pages → 启用 Pages → 生成指向正式链接的无水印二维码。

## 生成式 AI 工作流

纹样与视觉基因提取、海报视觉生成、系列化排版、程序化三维建模、交互与色彩体系
全流程由生成式人工智能辅助完成（GPT 生图 + Anthropic Claude 设计与编码），
海报画面为 AI 原创生成，无第三方素材版权风险。
