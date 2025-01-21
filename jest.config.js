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
    escapeString: true,
    printBasicPrototype: true,
  },
};
