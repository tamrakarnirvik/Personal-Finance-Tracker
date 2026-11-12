
import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

test("JSON backup contains saved financial records", async ({
  page,
}) => {
  // 1. Create a custom category.
  await page.goto("/settings");

  await page
    .getByLabel("Category name")
    .fill("QA Backup Category");

  
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
    page.getByText("QA Backup Category", { exact: true })
  ).toBeVisible();

  // 2. Add an expense using that category.
  await page.goto("/transactions");

  await page
    .getByRole("button", { name: "Add Transaction" })
    .click();

  const dialog = page.getByRole("dialog");

  await dialog
    .getByLabel("Amount (NPR)", { exact: true })
    .fill("123.45");

  await dialog
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "QA Backup Category" });

  await dialog
    .getByLabel("Description (optional)")
    .fill("QA Backup Expense");

  await dialog
    .getByRole("button", { name: "Save Transaction" })
    .click();

  await expect(
    page.getByText("QA Backup Expense", { exact: true })
  ).toBeVisible();

  // 3. Reopen Settings to verify persistence.
  await page.goto("/settings");

  await expect(
    page.getByText("QA Backup Category", { exact: true })
  ).toBeVisible();

  // 4. Download the JSON backup.
  const downloadPromise = page.waitForEvent("download");

  await page
    .getByRole("button", { name: "Export JSON Backup" })
    .click();

  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(
    /^expense-tracker-backup-\d{4}-\d{2}-\d{2}\.json$/
  );

  // 5. Read the downloaded file.
  const content = await readFile(
    await download.path(),
    "utf8"
  );

  const backup: unknown = JSON.parse(content);

  // 6. Validate its contents.
  expect(backup).toEqual(
    expect.objectContaining({
      format: "expense-tracker-backup",
      schemaVersion: 1,

      accounts: expect.arrayContaining([
        expect.objectContaining({
          id: "cash",
        }),
      ]),

      transactions: expect.arrayContaining([
        expect.objectContaining({
          type: "expense",
          amountPaisa: 12345,
          note: "QA Backup Expense",
        }),
      ]),

      customCategories: expect.arrayContaining([
        expect.objectContaining({
          name: "QA Backup Category",
          type: "expense",
        }),
      ]),
    })
  );
});
