module.exports = {
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts"],
  preset: "ts-jest",
  transform: {
    "^.+\\.(j|t)sx?$": "ts-jest",
  },
};
