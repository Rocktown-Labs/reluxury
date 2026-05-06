import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react],
  ignorePatterns: [
    "apps/web/src/routeTree.gen.ts",
    "packages/db/src/migrations/**",
    "packages/db/src/migrations/meta/**",
  ],
  rules: {
    "func-style": "off",
    "import/no-cycle": "off",
    "no-barrel-file": "off",
    "no-inline-comments": "off",
    "no-use-before-define": "off",
    "require-await": "off",
    "unicorn/prefer-ternary": "off",
  },
});
