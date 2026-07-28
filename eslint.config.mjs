import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = defineConfig([
  {
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  globalIgnores([
    ".next/**",
    "build/**",
    "coverage/**",
    "dist/**",
    "next-env.d.ts",
    "node_modules/**",
    "out/**",
    "painel-indicadores/**",
  ]),
  {
    files: ["*.config.{js,cjs,mjs}", "next.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    rules: {
      "@next/next/no-img-element": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "jsx-a11y/anchor-is-valid": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-autofocus": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "react/no-danger": "off",
    },
  },
]);

export default eslintConfig;
