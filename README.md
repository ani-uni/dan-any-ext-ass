# @dan-uni/dan-any-ext-ass

`@dan-uni/dan-any-ext-ass` 是 `dan-any` 的 ASS 扩展，负责将弹幕数据生成 ASS 字幕文件，并提供与 `dan-any` 插件/适配器的集成点。

主要功能

- 从 `UniChunk` 生成标准 ASS 字幕文本
- 提供 `AssAdapter` 用于从带有 raw 信息的 ASS 还原为 `UniChunk`
- 提供 `AssTransformerLikePluginConfigurator`，以 plugin 形式将生成器注入到 `dan-any` 的处理流水中

`AssAdapter` 支持还原由 `dan-any v1 / v2` 生成的 ASS：

- v2：从 `raw.new` 读取并恢复为 `DanuniPbAdapter`
- v1：从 `raw.old` 读取并恢复为 `DanuniJsonAdapter`

快速开始

1. 安装依赖：

```bash
vp install
```

2. 运行测试：

```bash
vp test
```

3. 打包构建：

```bash
vp pack
```

使用示例

### 1) 从 `UniChunk` 生成 ASS

```ts
import fs from "node:fs";
import { AssTransformerLikePluginConfigurator } from "@dan-uni/dan-any-ext-ass";

// 你需要先准备一个 50x50 的 2D canvas 上下文
// 不同环境的获取方式见下方「Canvas 上下文获取方式」
const assText = await chunk.plugin(
  AssTransformerLikePluginConfigurator(canvasCtx, {
    filename: "video.xml",
    title: "示例",
  }),
);
fs.writeFileSync("output.ass", assText, "utf-8");
```

### 2) 从 ASS 还原为 `UniChunk`

```ts
import { AssAdapter } from "@dan-uni/dan-any-ext-ass";

// assText 是由 dan-any v1 / v2 生成的、包含 raw 信息的 ASS 文本
const restoredChunk = await udb.import(AssAdapter(assText));
```

### 3) Canvas 上下文获取方式

`generateASS` / `AssTransformerLikePluginConfigurator` 需要一个 50x50 的 2D Canvas 上下文 `CanvasCtx`。
下面是常见环境的获取方式：

```ts
// Node.js + canvas
import { createCanvas } from "canvas";

const canvas = createCanvas(50, 50);
const canvasCtx = canvas.getContext("2d");
```

```ts
// Node.js + Fabric.js
import { StaticCanvas } from "fabric/node";

const canvasCtx = new StaticCanvas(undefined, { width: 50, height: 50 }).getContext();
```

```ts
// Browser + Native Canvas
const canvas = document.createElement("canvas");
canvas.width = 50;
canvas.height = 50;

const canvasCtx = canvas.getContext("2d");
```

```ts
// Browser + Fabric.js
import { Canvas } from "fabric";

const canvasCtx = new Canvas("canvas", { width: 50, height: 50 }).getContext();
```

API 概览

- `AssAdapter(ass: string)` — 从带 raw 信息的 ASS 还原并返回 `UniChunk`，兼容 `dan-any v1 / v2`
- `AssTransformerLikePluginConfigurator(canvasCtx, options?)` — 返回一个 plugin configurator，调用后会把 `UniChunk` 转换成 ASS 文本
- `generateASS(uchunk, options, canvasCtx)` — 底层生成函数（可直接调用）
- `parseAssRawField(ass)` — 从 ASS 文本解析出内嵌的 raw 信息并还原为弹幕记录（若存在）

配置与扩展

- 可通过传入 `options` 自定义输出文件名、ASS 的 Script Info 标题、字幕样式等（参见源码 `ass-gen/types.ts` 与 `config.ts`）
- `CanvasCtx` 的类型定义与环境示例可直接参考源码 `src/ass-gen/types.ts`

许可与致谢

- 本项目许可：LGPL-3.0-or-later（详见 `package.json`）
- 依赖于 `dan-any` 核心库以完成弹幕数据结构与转换

贡献

- 欢迎提交 issues / PR。提交前请运行 `vp check` 与 `vp test`。

更多

- 源码与示例请查看 `src/ass-gen`、`src/ass`、`src/util` 子目录。
