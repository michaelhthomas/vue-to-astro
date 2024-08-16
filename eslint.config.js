// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import solid from "eslint-plugin-solid";

export default tseslint.config(
	{
		ignores: ["dist/"],
	},
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	solid.configs["flat/typescript"],
);
