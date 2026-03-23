import globals from "globals";
export default [{
  files: ["src/**/*.ts", "src/**/*.js"],
  languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: { ...globals.node } },
  rules: {
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
    "no-eval": "error", "no-implied-eval": "error", "prefer-const": "warn", "eqeqeq": "warn"
  }
}];
