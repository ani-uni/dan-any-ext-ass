import {
  DanuniJsonAdapter,
  DanuniPbAdapter,
  defineAdapter,
  defineMetadata,
  definePlugin,
} from "@dan-uni/dan-any/adapters";
import { generateASS, parseAssRawField, type CanvasCtx, type Options } from "./ass-gen/index.ts";

export const AssAdapter = defineAdapter((ass: string) => {
  return async (udb, uchunk) => {
    const rec = await parseAssRawField(ass);
    if (!rec) throw new Error("还原失败，未找到raw信息");
    const chunk = uchunk ?? (await udb.makeChunk({}));
    if ("new" in rec) {
      await chunk.import(DanuniPbAdapter(rec.new));
    } else if ("old" in rec) {
      await chunk.import(DanuniJsonAdapter(rec.old, { isV1: true }));
    }
    return chunk;
  };
});

/**
 * 转换为ASS格式的适配器 (plugin)
 * @description 由于需要深度定制(传入数据库信息)，该transformer实际为plugin
 */
export const AssTransformerLikePluginConfigurator = (canvasCtx: CanvasCtx, options?: Options) =>
  definePlugin(async (uchunk) => {
    const defaultOptions: Options = { substyle: {} };
    const finalOptions = options ?? defaultOptions;
    return generateASS(uchunk, finalOptions, canvasCtx);
  });

export const AssMetadata = defineMetadata({
  type: "common.ass",
  ext: [".ass"],
  check: {
    adapter: async (uchunk, body) => {
      if (typeof body !== "string") return null;
      try {
        return uchunk.import(AssAdapter(body));
      } catch {
        return null;
      }
    },
  },
});
