const baseConfig = require("../jest.config.js");

module.exports = {
  ...baseConfig,
  testEnvironment: "./jest-environment.ts",
};
