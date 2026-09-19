import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Quality gate leve (Vibe Coding Toolkit).
 * Next core-web-vitals + TypeScript.
 * Para zerar avisos aos poucos: docs/ai-prompts/02-eslint-burndown.md
 * Não promover warning→error em massa sem burndown — trava o time.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "app/demo/**",
    "supabase/.temp/**",
  ]),
]);

export default eslintConfig;
