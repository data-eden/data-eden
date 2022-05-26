"use strict";

module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  plugins: ["prettier"],
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  rules: {},
  overrides: [
    // node files
    {
      files: ["**/*.cjs"],
      parserOptions: {
        sourceType: "script",
      },
      env: {
        node: true,
      },
      plugins: ["node"],
      extends: ["plugin:node/recommended"],
    },
  ],
};
