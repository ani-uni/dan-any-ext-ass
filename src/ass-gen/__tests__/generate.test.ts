import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "canvas";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import {
  BiliXmlAdapter,
  DanuniJsonTransformerConfigurator,
  DanuniPbTransformer,
} from "@dan-uni/dan-any/adapters";
import { InitedUniDB, UniDB } from "@dan-uni/dan-any/core";
import { AssAdapter, AssTransformerLikePluginConfigurator } from "@/index.ts";

let udb: InitedUniDB;
beforeAll(async () => {
  udb = await new UniDB().init();
});
afterAll(async () => {
  await udb.shrink();
  await udb.close();
});

const __dirname = dirname(fileURLToPath(import.meta.url));

describe.sequential("ori", () => {
  it("generate ass from xml", async () => {
    const filename = "898651903.xml";
    const xmlPath = path.join(__dirname, filename);
    const xmlText = fs.readFileSync(xmlPath, "utf8");
    const canvas = createCanvas(50, 50);
    const chunk = await udb.import(BiliXmlAdapter(xmlText));
    const assText = await chunk.plugin(
      AssTransformerLikePluginConfigurator(canvas.getContext("2d")),
    );
    // const assText = await generateASS(
    //   chunk,
    //   {
    //     // filename,
    //     // title: '我的忏悔',
    //   },
    //   canvas.getContext("2d"),
    // );
    fs.writeFileSync(path.join(__dirname, `${filename}.ass`), assText, "utf8");
  });
  // 恢复需要在生成之后运行，用以检测转换前后数据的一致性
  it("restore from ass", async () => {
    const filename = "898651903.xml";
    const xmlPath = path.join(__dirname, filename);
    const assPath = path.join(__dirname, `${filename}.ass`);
    const xmlText = fs.readFileSync(xmlPath, "utf8");
    const assText = fs.readFileSync(assPath, "utf8");
    const chunk2 = await udb.import(AssAdapter(assText));
    // const newPb = await chunk2.export(DanuniJsonTransformerConfigurator({ minify: true }));
    // const oldPb = await (
    //   await udb.import(BiliXmlAdapter(xmlText))
    // ).export(DanuniJsonTransformerConfigurator({ minify: true }));
    const newPb = await chunk2.export(DanuniPbTransformer);
    const oldPb = await (await udb.import(BiliXmlAdapter(xmlText))).export(DanuniPbTransformer);
    expect(newPb).toEqual(oldPb);
  });
});

describe("兼容性测试", () => {
  it("dan-any v1", async () => {
    const filename = "898651903.xml";
    const xmlPath = path.join(__dirname, filename);
    const assPath = path.join(__dirname, `${filename}.dan-any-v1.ass`);
    const xmlText = fs.readFileSync(xmlPath, "utf8");
    const assText = fs.readFileSync(assPath, "utf8");
    const chunk2 = await udb.import(AssAdapter(assText));
    const newPb = await chunk2.export(DanuniPbTransformer);
    const oldPb = await (await udb.import(BiliXmlAdapter(xmlText))).export(DanuniPbTransformer);
    expect(newPb).toEqual(oldPb);
  });
  it("biliy", async () => {
    const filename = "898651903.xml";
    const xmlPath = path.join(__dirname, filename);
    const assPath = path.join(__dirname, `${filename}.biliy.ass`);
    const xmlText = fs.readFileSync(xmlPath, "utf8");
    const assText = fs.readFileSync(assPath, "utf8");
    const chunk2 = await udb.import(AssAdapter(assText));
    const newPb = await chunk2.export(DanuniJsonTransformerConfigurator({ minify: true }));
    const oldPb = await (
      await udb.import(BiliXmlAdapter(xmlText))
    ).export(DanuniJsonTransformerConfigurator({ minify: true }));
    console.info(newPb);
    console.info(oldPb);
    // expect(newPb).toEqual(oldPb);
  });
});
