/** @type {import('eslint').Linter.BaseConfig} */
module.exports = {
	extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "prettier",
  ],
	rules: {
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
				prefer: "type-imports",
				disallowTypeAnnotations: true,
				fixStyle: "inline-type-imports",
      },
    ],
    "import/no-duplicates": "warn",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^_",
				caughtErrorsIgnorePattern: "^_",
      },
    ],
    "react/display-name": "off",
  },
}