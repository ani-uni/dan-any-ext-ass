import {
  zstdCompressSync,
  zstdDecompressSync,
  brotliCompressSync,
  brotliDecompressSync,
  gunzipSync,
  gzipSync,
} from "node:zlib";
import * as base16384 from "base16384";
import type { Context, Danmaku, SubtitleStyle } from "../types.ts";
import type { UniDMObj } from "@dan-uni/dan-any/core";

type compressType = "zstd" | "brotli" | "gzip";
type baseType = "base64" | "base18384";
const compressTypes = new Set(["zstd", "brotli", "gzip"]);
const baseTypes = new Set(["base64", "base18384"]);

export interface RawConfig {
  compressType: compressType;
  baseType: baseType;
}

function fromUint16Array(array: Uint16Array): string {
  let result = "";
  for (const element of array) {
    result += String.fromCodePoint(element);
  }
  return result;
}

export function raw(
  list: Uint8Array,
  config: SubtitleStyle,
  context: Context,
  compressType: compressType = "zstd",
  baseType: baseType = "base18384",
) {
  const rawConf = { config, context };
  const rawConfText = JSON.stringify(rawConf);
  let compressConf: Buffer, compressPb: Buffer;
  if (compressType === "zstd") {
    compressConf = zstdCompressSync(rawConfText);
    compressPb = zstdCompressSync(list);
  } else if (compressType === "brotli") {
    compressConf = brotliCompressSync(rawConfText);
    compressPb = brotliCompressSync(list);
  } else {
    compressConf = gzipSync(rawConfText);
    compressPb = gzipSync(list);
  }
  const baseCompressConf =
    baseType === "base64"
      ? compressConf.toString("base64")
      : fromUint16Array(base16384.encode(compressConf));
  const baseCompressPb =
    baseType === "base64"
      ? compressPb.toString("base64")
      : fromUint16Array(base16384.encode(compressPb));
  return `;RawCompressType: ${compressType}\n;RawBaseType: ${baseType}\n;RawConf: ${baseCompressConf}\n;RawPb: ${baseCompressPb}`;
}

export function deRaw(ass: string): {
  list: { old: Partial<UniDMObj & { extraStr?: string }>[] } | { new: Uint8Array };
  config: SubtitleStyle;
  context: Context;
} | null {
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
    let decompress: Buffer;
    if (compressType === "zstd") decompress = zstdDecompressSync(buffer);
    else if (compressType === "brotli") decompress = brotliDecompressSync(buffer);
    else decompress = gunzipSync(buffer);
    try {
      const parsed: { list: Danmaku[]; config: SubtitleStyle; context: Context } = JSON.parse(
        decompress.toString("utf8"),
      );
      if (parsed.list.every((d) => !d.extra))
        // return { ...parsed, list: { old: DanmakuList2UDanmakus4Biliy(parsed.list) } };
        throw new Error("暂不支持对biliy格式的还原，缺失过多原始数据");
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
    let decompressConf: Buffer, decompressPb: Buffer;
    if (compressType === "zstd") {
      decompressConf = zstdDecompressSync(bufferConf);
      decompressPb = zstdDecompressSync(bufferPb);
    } else if (compressType === "brotli") {
      decompressConf = brotliDecompressSync(bufferConf);
      decompressPb = brotliDecompressSync(bufferPb);
    } else {
      decompressConf = gunzipSync(bufferConf);
      decompressPb = gunzipSync(bufferPb);
    }
    try {
      const parsedConf: { config: SubtitleStyle; context: Context } = JSON.parse(
        decompressConf.toString("utf8"),
      );
      const parsedPb: Uint8Array = new Uint8Array(decompressPb);
      return { ...parsedConf, list: { new: parsedPb } };
    } catch {
      return null;
    }
  }
  return null;
}
