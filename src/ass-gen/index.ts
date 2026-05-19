import type { RawConfig } from "./ass/raw.ts";
import type { CanvasCtx, SubtitleStyle } from "./types.ts";

import { ass } from "./ass/create.ts";
import { deRaw } from "./ass/raw.ts";
import { getConfig } from "./config.ts";
import { layoutDanmaku } from "./util/index.ts";
import type { UniChunk } from "@dan-uni/dan-any/core";
import { MergePluginConfigurator } from "@dan-uni/dan-any/plugins";
import { DanuniPbTransformer } from "@dan-uni/dan-any/adapters";

export type { CanvasCtx };

export type Options = {
  filename?: string;
  title?: string;
  substyle?: Partial<SubtitleStyle>;
  raw?: RawConfig;
};

/**
 * 使用bilibili弹幕(XMl)生成ASS字幕文件
 * @param {string} danmaku XML弹幕文件内容
 * @param {Options} options 杂项
 * @returns {string} 返回ASS字幕文件内容
 * @description 杂项相关  
`filename`: 还原文件为XML时使用的默认文件名  
`title`: ASS [Script Info] Title 项的值,显示于播放器字幕选择  
`substyle`: ASS字幕样式
 * @example ```ts
import fs from 'fs'
const filename = 'example.xml'
const xmlText = fs.readFileSync(filename, 'utf-8')
const assText = generateASS(xmlText, { filename, title: 'Quick Example' })
fs.writeFileSync(`${filename}.ass`, assText, 'utf-8')
```
 */
export async function generateASS(
  danmaku: UniChunk,
  options: Options,
  canvasCtx: CanvasCtx,
): Promise<string> {
  // const result = parse(text)
  const config = getConfig(options.substyle);
  // const filteredList = filterDanmaku(result.list, config.block)
  const mergedList = await danmaku.plugin(MergePluginConfigurator(config.mergeIn));
  const layoutList = layoutDanmaku(await mergedList.$danmakus, config, canvasCtx);
  const content = ass(
    layoutList,
    await danmaku.export(DanuniPbTransformer),
    config,
    {
      filename: options?.filename || "unknown",
      title: options?.title || "unknown",
    },
    options.raw,
  );
  await mergedList.delete();

  return content;
}

export function parseAssRawField(ass: string) {
  const raw = deRaw(ass);
  if (raw) {
    return raw.list;
  } else {
    return null;
  }
}
