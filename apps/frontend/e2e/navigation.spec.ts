import { expect, test } from "@playwright/test";

test("unauthenticated visitors are redirected to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Property Rent Manager" })).toBeVisible();
});

test("login form submits to the backend and surfaces an error on failure", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Exercises the full stack (Vite proxy -> Express -> Mongoose -> error handler)
  // even without a reachable database — the important thing is a clean error
  // response comes back and the UI surfaces it instead of hanging or crashing.
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 20_000 });
});
