import { test, expect } from "@playwright/test";

/**
 * End-to-end coverage of the core demo workflow (see README.md "Demo script").
 * Requires both the backend (:8000) and frontend (:3000) running -- these
 * are NOT mocked, they exercise the real API. See playwright.config.ts for
 * why these haven't been executed in this repository's build environment.
 */

test.describe("Dashboard", () => {
  test("loads and shows KPI cards with real numbers, not placeholders", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Total Incidents")).toBeVisible();
    // KPI values load async from the API -- wait for a real number to replace
    // the "--" loading placeholder rather than asserting immediately.
    await expect(page.getByText("--")).toHaveCount(0, { timeout: 10000 });
  });

  test("heatmap panel renders ward risk data", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Live Crime Heatmap")).toBeVisible();
    // At least one ward label should render on the SVG map.
    await expect(page.locator("svg text").first()).toBeVisible({ timeout: 10000 });
  });

  test("Command AI answers a question", async ({ page }) => {
    await page.goto("/dashboard");
    const input = page.getByLabel("Ask Command AI");
    await input.fill("why is central zone high risk");
    await page.getByRole("button", { name: "Ask" }).click();
    // A second AI message bubble should appear beyond the initial greeting.
    await expect(page.locator("text=/risk score|risk band/i")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Prediction page", () => {
  test("running a prediction shows a risk score and explanation", async ({ page }) => {
    await page.goto("/prediction");
    await page.getByRole("button", { name: /run prediction/i }).click();
    await expect(page.getByText("EXPLAINABILITY")).toBeVisible({ timeout: 10000 });
  });

  test("scenario simulator produces a baseline vs adjusted comparison", async ({ page }) => {
    await page.goto("/prediction");
    await page.getByRole("button", { name: /simulate/i }).click();
    await expect(page.getByText("Baseline")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Adjusted")).toBeVisible();
  });
});

test.describe("Navigation", () => {
  const routes = ["/dashboard", "/prediction", "/network", "/investigations", "/patrol", "/analytics", "/alerts", "/reports"];
  for (const route of routes) {
    test(`${route} loads without a client-side error boundary`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      await page.goto(route);
      await expect(page.locator("text=SOMETHING WENT WRONG")).toHaveCount(0);
      expect(errors).toHaveLength(0);
    });
  }
});

test.describe("Investigations", () => {
  test("opening a case shows the AI investigation brief", async ({ page }) => {
    await page.goto("/investigations");
    const firstCase = page.locator("table tbody tr").first().locator("a");
    await firstCase.click();
    await expect(page.getByText("AI Investigation Suggestions")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Reports", () => {
  test("both PDF and CSV download links are present for every report", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.getByRole("link", { name: "PDF" })).toHaveCount(3);
    await expect(page.getByRole("link", { name: "CSV" })).toHaveCount(3);
  });
});

test.describe("Accessibility basics", () => {
  test("skip-to-content is not required but every icon button has an aria-label", async ({ page }) => {
    await page.goto("/dashboard");
    const iconButtons = page.locator("button:not(:has-text(''))").filter({ hasNot: page.locator("text=/.+/") });
    const count = await iconButtons.count();
    for (let i = 0; i < count; i++) {
      const label = await iconButtons.nth(i).getAttribute("aria-label");
      expect(label).toBeTruthy();
    }
  });

  test("keyboard focus is visible when tabbing through the sidebar", async ({ page }) => {
    await page.goto("/dashboard");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus-visible");
    await expect(focused).toBeVisible();
  });
});
