import type { Context, SubtitleStyle } from "../types.ts";
import type { RawConfig } from "./raw.ts";

import { UDanmakus2DanmakuLists } from "../util/index.ts";
import { event } from "./event.ts";
import { info } from "./info.ts";
import { raw } from "./raw.ts";
import { style } from "./style.ts";
import type { UDanmaku } from "@dan-uni/dan-any/adapters";

const default_context = { filename: "unknown", title: "unknown" };

export const ass = (
  list: UDanmaku[],
  rawList: Uint8Array,
  config: SubtitleStyle,
  context: Context = default_context,
  rawConfig?: RawConfig,
) => {
  const Elist = UDanmakus2DanmakuLists(list);
  const content = [info(config, context), style(config), event(Elist, config)];

  if (config.includeRaw) {
    content.push(raw(rawList, config, context, rawConfig?.compressType, rawConfig?.baseType));
  }

  return `${content.join("\n\n")}\n`;
};
