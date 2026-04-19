import { expect, test } from "@playwright/test";

test.describe("Home", () => {
  test("initial load shows results or explicit empty status", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("results-status")).toBeVisible();
    await expect(async () => {
      const rowCount = await page.locator('[data-testid^="car-row-"]').count();
      const status = (await page.getByTestId("results-status").textContent()) ?? "";
      expect(rowCount > 0 || status.includes("No matches")).toBeTruthy();
    }).toPass({ timeout: 25_000 });
  });

  test("search updates results status", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("results-status")).toBeVisible();
    await page.getByLabel(/Budget max/i).fill("7");
    await page.getByTestId("search-button").click();
    await expect(page.getByTestId("results-status")).toContainText(/match/i, {
      timeout: 20_000,
    });
  });

  test("rank shows human-readable tips (mock)", async ({ page }) => {
    await page.goto("/");
    await expect(async () => {
      expect(await page.locator('[data-testid^="car-row-"]').count()).toBeGreaterThan(0);
    }).toPass({ timeout: 25_000 });
    await page.getByTestId("rank-button").click();
    const section = page.getByTestId("ai-insight-section");
    await expect(section).toBeVisible({ timeout: 25_000 });
    await expect(
      section.getByRole("paragraph").filter({ hasText: /^Mock insight:/ }),
    ).toBeVisible();
  });

  test("theme toggle updates document and persists", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      try {
        localStorage.removeItem("cardekho-theme");
      } catch {
        /* ignore */
      }
    });
    await page.reload();
    const toggle = page.getByTestId("theme-toggle");
    await expect(toggle).toBeEnabled({ timeout: 10_000 });
    const before = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    await expect(toggle).toHaveAttribute("aria-checked", String(before));
    await toggle.click();
    await expect(async () => {
      const after = await page.evaluate(() =>
        document.documentElement.classList.contains("dark"),
      );
      expect(after).toBe(!before);
    }).toPass({ timeout: 5000 });
    await page.reload();
    await expect(async () => {
      const persisted = await page.evaluate(() =>
        document.documentElement.classList.contains("dark"),
      );
      expect(persisted).toBe(!before);
    }).toPass({ timeout: 10_000 });
  });

  test("shortlist checkbox persists after reload", async ({ page }) => {
    await page.goto("/");
    await expect(async () => {
      expect(await page.locator('[data-testid^="car-shortlist-"]').count()).toBeGreaterThan(0);
    }).toPass({ timeout: 25_000 });
    const first = page.locator('[data-testid^="car-shortlist-"]').first();
    await first.check();
    await page.reload();
    await expect(first).toBeChecked({ timeout: 15_000 });
  });
});
