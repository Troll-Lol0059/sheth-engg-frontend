import js from "@eslint/js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import tsParser from "@typescript-eslint/parser";
import typescriptEslint from "@typescript-eslint/eslint-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

const eslintConfig = [
	...compat.extends("eslint:recommended", "next/core-web-vitals", "next/typescript", "plugin:@typescript-eslint/recommended", "prettier"),
	{
		plugins: {
			"@typescript-eslint": typescriptEslint,
		},

		languageOptions: {
			parser: tsParser,
		},
	},
];

export default eslintConfig;
