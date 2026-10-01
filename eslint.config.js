import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";

export default tseslint.config([
	globalIgnores([
		"dist",
		"worker-configuration.d.ts",
		"plugins",
		".inline",
		// Clones do design system do Risco-cognitivo-blog (DESIGN_SYSTEM.md): mantidos idênticos à origem.
		"admin/components/ui",
		"admin/components/plain",
		"admin/lib/plain",
		"admin/hooks",
		"admin/components/design-system/component-gallery.tsx",
		"admin/components/design-system/data-gallery.tsx",
	]),
	{
		files: ["**/*.{ts,tsx}"],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			reactHooks.configs.flat["recommended-latest"],
			reactRefresh.configs.vite,
		],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_" },
			],
		},
	},
]);
