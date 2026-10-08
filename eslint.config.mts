import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import { configs as airbnb, plugins as airbnbPlugins } from "eslint-config-airbnb-extended";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
  },
  airbnbPlugins.importX,
  airbnbPlugins.stylistic,
  airbnbPlugins.typescriptEslint,
  airbnbPlugins.node,
  ...airbnb.base.recommended,
  ...airbnb.base.typescript,
  ...airbnb.node.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ["build/**", "eslint.config.mts"],
  },
  {
    rules: {
      "import/extensions": "off",
      "no-underscore-dangle": "off",
      "no-plusplus": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": ["error"],
      "import/no-extraneous-dependencies": "off",
      "import/no-unresolved": "off",
      "lines-between-class-members": "off",
    }
  },
]);
