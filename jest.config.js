module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "tests/tsconfig.json" }] },
  // Every test file shares one in-memory MongoDB, each with its own database.
  globalSetup: "<rootDir>/tests/helpers/globalSetup.ts",
  globalTeardown: "<rootDir>/tests/helpers/globalTeardown.ts",
  setupFiles: ["<rootDir>/tests/helpers/setupEnv.ts"],
  // No test can send a real email: nodemailer is replaced everywhere.
  moduleNameMapper: { "^nodemailer$": "<rootDir>/tests/helpers/fakeNodemailer.ts" },
  maxWorkers: 1,
  testTimeout: 30000,
};
