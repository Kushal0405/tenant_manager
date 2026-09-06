import { expect, test } from "@playwright/test";

test("redirects to dashboard and can navigate to properties", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByRole("link", { name: "Properties" }).click();
  await expect(page).toHaveURL(/\/properties$/);
  await expect(page.getByRole("heading", { name: "Properties" })).toBeVisible();
});
