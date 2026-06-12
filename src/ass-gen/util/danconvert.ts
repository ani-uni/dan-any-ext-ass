import type { Danmaku, RGB } from "../types.ts";

import { DanmakuType } from "../types.ts";
import type { UDanmaku, UniDMObj } from "@dan-uni/dan-any/core";

function decimalToRGB888(decimal: number): RGB {
  const r = (decimal >> 16) & 0xff;
  const g = (decimal >> 8) & 0xff;
  const b = decimal & 0xff;
  return {
    r,
    g,
    b,
  } satisfies RGB;
}

export function UDanmakus2DanmakuLists(UP: UDanmaku[]): Danmaku[] {
  const dans = UP;
  let type = DanmakuType.SCROLL;
  return dans.map((d) => {
    if (d.mode === "Bottom") type = DanmakuType.BOTTOM;
    else if (d.mode === "Top") type = DanmakuType.TOP;
    return {
      time: d.progress / 1000, // 新传入的弹幕UDanmakus为ms int
      type,
      fontSizeType: d.fontsize,
      content: d.content,
      color: decimalToRGB888(d.color),
      extra: d,
    } satisfies Danmaku;
  });
}
export function DanmakuList2UDanmakus(d: Danmaku[]): UDanmaku[] {
  return d.map((d) => d.extra);
}
export function DanmakuList2UDanmakus4Biliy(
  d: Danmaku[],
): Partial<UniDMObj & { extraStr?: string }>[] {
  // 已显式指定还原为v1格式的danuni.json，progress采用float的秒
  return d.map((d) => ({
    progress: d.time,
    type: d.type,
    fontSizeType: d.fontSizeType,
    content: d.content,
    color: (d.color.r << 16) | (d.color.g << 8) | d.color.b,
  }));
}
