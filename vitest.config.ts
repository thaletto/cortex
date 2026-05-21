import { defineConfig } from "vitest/config"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@thaletto/cortex": path.resolve(__dirname, "packages/cortex/src"),
      "@thaletto/zvec": path.resolve(__dirname, "packages/zvec/src"),
    },
  },
  ssr: {
    external: ["@zvec/zvec"],
    noExternal: ["@thaletto/cortex", "@thaletto/zvec"],
  },
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
