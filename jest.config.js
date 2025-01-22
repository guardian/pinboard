module.exports = {
  roots: ["<rootDir>"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.(j|t)sx?$": "ts-jest",
    "^.+\\.svg$": "<rootDir>/fileTransformer.js",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/fileTransformer.js",
  },
  testEnvironment: "jest-environment-node",
  snapshotFormat: {
    // Use pre v28 Jest snapshot defaults, to prevent incompatible snapshots
    escapeString: true,
    printBasicPrototype: true,
  },
  moduleNameMapper: {
    // Force module uuid to resolve with the CJS entry point, because Jest does not support package.json.exports. See https://github.com/uuidjs/uuid/issues/451
    "^uuid$": require.resolve("uuid"),
  },
};
