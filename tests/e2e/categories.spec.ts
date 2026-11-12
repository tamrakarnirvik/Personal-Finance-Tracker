
import { test, expect } from "@playwright/test";

test("create, use, and rename a custom category", async ({
  page,
}) => {
  // Create a custom category in Settings.
  await page.goto("/settings");

  await page.getByLabel("Category name").fill("Education");

  
const categoryForm = page.locator("form").filter({
  has: page.getByLabel("Category name", { exact: true }),
});

await categoryForm
  .getByRole("button", {
    name: "Save category",
    exact: true,
  })
  .click();


  await expect(
    page.getByText("Education", { exact: true })
  ).toBeVisible();

  // Open the transaction form.
  await page.goto("/transactions");

  await page.getByRole("button", {
    name: "Add Transaction",
  }).click();

  const dialog = page.getByRole("dialog");

  await dialog
    .getByLabel("Amount (NPR)", { exact: true })
    .fill("600");

  
const categorySelect = dialog.getByRole("combobox", {
  name: "Category",
});

await expect(categorySelect).toBeVisible();

await categorySelect.selectOption({
  label: "Education",
});


  await dialog
    .getByLabel("Description (optional)")
    .fill("School Books");

  await dialog
    .getByRole("button", {
      name: "Save Transaction",
    })
    .click();

  await expect(
    page.getByText("School Books", { exact: true })
  ).toBeVisible();

  // Reload and filter by the custom category.
  await page.reload();

  await page
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "Education" });

  await expect(
    page.getByText("School Books", { exact: true })
  ).toBeVisible();

  // Rename the category.
  await page.goto("/settings");

  await page.getByRole("button", {
    name: "Rename Education",
  }).click();

  await page.getByLabel("Category name").fill("Learning");

  await page.getByRole("button", {
    name: "Save changes",
  }).click();

  // Verify existing transactions still use the category.
  await page.goto("/transactions");

  await page
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "Learning" });

  await expect(
    page.getByText("School Books", { exact: true })
  ).toBeVisible();
});
