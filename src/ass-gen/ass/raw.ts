import pako from "pako";
import * as base16384 from "base16384";
import type { Context, Danmaku, SubtitleStyle } from "../types.ts";
import type { UniDMObj } from "@dan-uni/dan-any/core";
import { DanmakuList2UDanmakus4Biliy } from "../util/danconvert.ts";
import zstd from "@bokuweb/zstd-wasm";
import brotliDecompress = require("brotli/decompress");

type compressType = "zstd" | "brotli" | "gzip";
type baseType = "base64" | "base18384";
const compressTypes = new Set(["zstd", "brotli", "gzip"]);
const baseTypes = new Set(["base64", "base18384"]);

export interface RawConfig {
  compressType: Exclude<compressType, "brotli">;
  baseType: baseType;
}

function fromUint16Array(array: Uint16Array): string {
  let result = "";
  for (const element of array) {
    result += String.fromCodePoint(element);
  }
  return result;
}

export async function raw(
  list: Uint8Array,
  config: SubtitleStyle,
  context: Context,
  compressType: Exclude<compressType, "brotli"> = "zstd",
  baseType: baseType = "base18384",
) {
  const rawConf = { config, context };
  const rawConfText = JSON.stringify(rawConf);
  let compressConf: Uint8Array, compressPb: Uint8Array;
  if (compressType === "zstd") {
    await zstd.init();
    compressConf = zstd.compress(new TextEncoder().encode(rawConfText));
    compressPb = zstd.compress(list);
  } else {
    compressConf = pako.gzip(rawConfText);
    compressPb = pako.gzip(list);
  }
  const baseCompressConf =
    baseType === "base64"
      ? Buffer.from(compressConf).toString("base64")
      : fromUint16Array(base16384.encode(compressConf));
  const baseCompressPb =
    baseType === "base64"
      ? Buffer.from(compressPb).toString("base64")
      : fromUint16Array(base16384.encode(compressPb));
  return `;RawCompressType: ${compressType}\n;RawBaseType: ${baseType}\n;RawConf: ${baseCompressConf}\n;RawPb: ${baseCompressPb}`;
}

export async function deRaw(ass: string): Promise<{
  list: { old: Partial<UniDMObj & { extraStr?: string }>[] } | { new: Uint8Array };
  config: SubtitleStyle;
  context: Context;
} | null> {
  const arr = ass.split("\n");
  const lineCompressType = arr.find((line) => line.startsWith(";RawCompressType:"));
  const lineBaseType = arr.find((line) => line.startsWith(";RawBaseType:"));
  const lineRaw = arr.find((line) => line.startsWith(";Raw:"));
  const lineRawConf = arr.find((line) => line.startsWith(";RawConf:"));
  const lineRawPb = arr.find((line) => line.startsWith(";RawPb:"));
  if (lineRaw) {
    // 旧版兼容层
    let compressType = lineCompressType?.replace(";RawCompressType: ", "").trim();
    let baseType = lineBaseType?.replace(";RawBaseType: ", "").trim();
    if (compressType === undefined || !compressTypes.has(compressType)) compressType = "gzip";
    if (baseType === undefined || !baseTypes.has(baseType)) baseType = "base64";
    const text = lineRaw.replace(";Raw: ", "").trim();
    const buffer =
      baseType === "base64"
        ? Buffer.from(text, "base64")
        : Buffer.from(base16384.decode(Buffer.from(text, "utf8").toString("utf8")));
    let decompress: Uint8Array;
    if (compressType === "zstd") {
      await zstd.init();
      decompress = zstd.decompress(buffer);
    } else if (compressType === "brotli") decompress = brotliDecompress(buffer);
    else decompress = pako.ungzip(buffer);
    try {
      const parsed: { list: Danmaku[]; config: SubtitleStyle; context: Context } = JSON.parse(
        Buffer.from(decompress).toString("utf8"),
      );
      if (parsed.list.every((d) => !d.extra))
        return { ...parsed, list: { old: DanmakuList2UDanmakus4Biliy(parsed.list) } };
      else
        return { ...parsed, list: { old: parsed.list.map((d) => d.extra as unknown as UniDMObj) } };
    } catch {
      return null;
    }
  } else if (lineRawConf && lineRawPb) {
    let compressType = lineCompressType?.replace(";RawCompressType: ", "").trim();
    let baseType = lineBaseType?.replace(";RawBaseType: ", "").trim();
    if (compressType === undefined || !compressTypes.has(compressType)) compressType = "gzip";
    if (baseType === undefined || !baseTypes.has(baseType)) baseType = "base64";
    const textConf = lineRawConf.replace(";RawConf: ", "").trim();
    const textPb = lineRawPb.replace(";RawPb: ", "").trim();
    const bufferConf =
      baseType === "base64"
        ? Buffer.from(textConf, "base64")
        : Buffer.from(base16384.decode(Buffer.from(textConf, "utf8").toString("utf8")));
    const bufferPb =
      baseType === "base64"
        ? Buffer.from(textPb, "base64")
        : Buffer.from(base16384.decode(Buffer.from(textPb, "utf8").toString("utf8")));
    let decompressConf: Uint8Array, decompressPb: Uint8Array;
    if (compressType === "zstd") {
      await zstd.init();
      decompressConf = zstd.decompress(bufferConf);
      decompressPb = zstd.decompress(bufferPb);
    } else if (compressType === "brotli") {
      decompressConf = brotliDecompress(bufferConf);
      decompressPb = brotliDecompress(bufferPb);
    } else {
      decompressConf = pako.ungzip(bufferConf);
      decompressPb = pako.ungzip(bufferPb);
    }
    try {
      const parsedConf: { config: SubtitleStyle; context: Context } = JSON.parse(
        Buffer.from(decompressConf).toString("utf8"),
      );
      const parsedPb: Uint8Array = new Uint8Array(decompressPb);
      return { ...parsedConf, list: { new: parsedPb } };
    } catch {
      return null;
    }
  }
  return null;
}
