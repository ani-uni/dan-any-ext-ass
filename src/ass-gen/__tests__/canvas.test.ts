import { createCanvas } from "canvas";
import { assert, assertType, it } from "vite-plus/test";

import { measureTextWidthConstructor } from "../util/layout.ts";

it("canvas measureTextWidth", () => {
  const text = "一段测试文字";
  const canvas = createCanvas(50, 50);
  const width = measureTextWidthConstructor(canvas.getContext("2d"))("SimHei", 25, false, text);
  assertType<number>(width);
  console.info(width, text.length);
  assert(width >= 25 * text.length);
});
