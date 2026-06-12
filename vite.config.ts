import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    exclude: ["@electric-sql/pglite", "@bokuweb/zstd-wasm"],
  },
  pack: {
    entry: "src/index.ts",
    platform: "neutral",
    deps: {
      onlyBundle: ["canvas"],
    },
    dts: {
      tsgo: true,
    },
    exports: true,
    minify: true,
    attw: {
      profile: "esm-only",
    },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
  test: {
    environment: "edge-runtime",
  },
});
