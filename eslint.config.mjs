import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat,  } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [{
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "**/.idea/**", "**/test-results/**", "**/playwright-report/**", "**/dist/**", "**/build/**", "**/out/**", "**/node_modules/**", "**/supabase/functions/_shared/cors.ts"],

}, ...compat.extends("next", "next/typescript")];

eslintConfig.push({
    rules: {
        '@typescript-eslint/no-unused-vars': [
            "error",
            {
                "args": "all",
                "argsIgnorePattern": "^_",
                "caughtErrors": "all",
                "caughtErrorsIgnorePattern": "^_",
                "destructuredArrayIgnorePattern": "^_",
                "varsIgnorePattern": "^_",
                "ignoreRestSiblings": true
            }
        ]
    }
}, {});

export default eslintConfig;
