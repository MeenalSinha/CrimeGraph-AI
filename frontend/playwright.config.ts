import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration.
 *
 * Honesty note (see AUDIT.md): this config and the tests in ./e2e were
 * written and are believed correct against the actual page structure of
 * this app, but were NOT executed in the environment that built this
 * repository -- `npx playwright install` requires downloading Chromium from
 * Microsoft's CDN, which this sandbox has no outbound network route to
 * (confirmed by testing, not assumed). Run `npx playwright install chromium`
 * yourself, then `npm run test:e2e`, with both the backend (:8000) and
 * frontend (:3000) running.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 1,
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
