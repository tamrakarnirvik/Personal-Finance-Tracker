
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",

  fullyParallel: true,

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        channel: "chrome",
      },
    },
  ],

  webServer: {
  command: "npm run start",
  url: "http://127.0.0.1:3000",
  reuseExistingServer: false,
  timeout: 120_000,
},
});
