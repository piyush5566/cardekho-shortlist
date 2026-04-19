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
      const after = await page.evaluate(() => document.documentElement.classList.contains("dark"));
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
});

/** Serial: first navigation establishes session cookie before parallel tabs would race. */
test.describe.serial("Server shortlist", () => {
  test("save shows in panel and survives reload", async ({ page }) => {
    await page.goto("/");
    await expect(async () => {
      expect(await page.locator('[data-testid^="car-shortlist-"]').count()).toBeGreaterThan(0);
    }).toPass({ timeout: 25_000 });

    const saveBtn = page.locator('[data-testid^="car-shortlist-"]').first();
    await expect(saveBtn).toBeEnabled({ timeout: 20_000 });
    await saveBtn.click();
    await expect(saveBtn).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });

    const rowTestId = await saveBtn.getAttribute("data-testid");
    const carId = rowTestId?.replace("car-shortlist-", "") ?? "";
    expect(carId.length).toBeGreaterThan(0);

    await expect(page.getByTestId(`shortlist-row-${carId}`)).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await expect(page.getByTestId(`shortlist-row-${carId}`)).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(`[data-testid="car-shortlist-${carId}"]`)).toHaveAttribute(
      "aria-pressed",
      "true",
      { timeout: 15_000 },
    );
  });

  test("remove clears row from panel", async ({ page }) => {
    await page.goto("/");
    await expect(async () => {
      expect(await page.locator('[data-testid^="car-shortlist-"]').count()).toBeGreaterThan(0);
    }).toPass({ timeout: 25_000 });

    const saveBtn = page.locator('[data-testid^="car-shortlist-"]').first();
    await expect(saveBtn).toBeEnabled({ timeout: 20_000 });
    await saveBtn.click();
    await expect(saveBtn).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });

    const rowTestId = await saveBtn.getAttribute("data-testid");
    const carId = rowTestId?.replace("car-shortlist-", "") ?? "";
    await expect(page.getByTestId(`shortlist-row-${carId}`)).toBeVisible({ timeout: 15_000 });

    const removeBtn = page.getByTestId(`shortlist-remove-${carId}`);
    await expect(removeBtn).toBeEnabled({ timeout: 10_000 });
    await removeBtn.click();
    await expect(page.getByTestId(`shortlist-row-${carId}`)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator(`[data-testid="car-shortlist-${carId}"]`)).toHaveAttribute(
      "aria-pressed",
      "false",
      { timeout: 15_000 },
    );
  });
});
