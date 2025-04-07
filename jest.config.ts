import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      useESM: true,
    }],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "use-keyboard-shortcut": "<rootDir>/src/__mocks__/use-keyboard-shortcut.ts",
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transformIgnorePatterns: [
    "node_modules/(?!(use-keyboard-shortcut)/)",
  ],
};

export default config;
