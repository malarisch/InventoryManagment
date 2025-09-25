import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [{
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]
}, ...compat.extends("next/core-web-vitals", "next/typescript")];

eslintConfig.push({
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },
    },
    rules: {
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_",
                "caughtErrorsIgnorePattern": "^_"
            }
        ]
    }
}, {
    ignores: ["**/.idea/**", "**/test-results/**", "**/playwright-report/**", "**/dist/**", "**/build/**", "**/out/**", "**/node_modules/**", "**/supabase/functions/_shared/cors.ts"],
});

export default eslintConfig;
