
# Expense Tracker 2.0
## Final Deployment & Release Checklist

**Project:** Expense Tracker 2.0  
**Technology:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui  
**Development scope:** Phases 1–16  
**Release status:** Pending final verification  
**Storage model:** Local-first browser localStorage

---

## 1. Important Release Information

Expense Tracker 2.0 is currently a local-first
personal finance application.

Financial records are stored in the user's
browser using localStorage.

Deploying the Next.js application does not
automatically provide:

- User authentication
- A secure cloud database
- Multi-device synchronization
- Automatic online backups
- Bank account integration
- Server-side transaction processing
- Encrypted browser storage

For the current architecture, the recommended
release is a private, single-browser application.

Do not advertise the application as a secure,
multi-user financial management platform.

---

## 2. Protect Existing Financial Data

Before installing updates or deploying the
application:

- [ ] Open Settings.
- [ ] Navigate to Complete Data Backup & Restore.
- [ ] Download Complete Backup v4.
- [ ] Verify the JSON file was downloaded.
- [ ] Open the JSON file in a text editor.
- [ ] Confirm the backup has version 4.
- [ ] Verify that accounts are included.
- [ ] Verify that transactions are included.
- [ ] Verify that categories are included.
- [ ] Verify that budgets are included.
- [ ] Verify that recurring schedules are included.
- [ ] Verify that automation settings are included.
- [ ] Verify that savings goals are included.
- [ ] Verify that allocation history is included.
- [ ] Store another copy in a private, secure location.

Do not upload financial JSON backups to GitHub,
public repositories, or your application's
public directory.

### Before restoring any data

- Turn automatic recurring posting OFF.
- Close other Expense Tracker tabs.
- Download a separate recovery backup.
- Test restoration in a disposable browser profile.
- Do not overwrite the only remaining backup.

A successful backup validation does not guarantee
that a recovery copy has been saved successfully.

---

## 3. Verify Project Structure

Check that your project contains:

- app/layout.tsx
- app/(workspace)/layout.tsx
- app/(workspace)/dashboard/page.tsx
- app/(workspace)/transactions/page.tsx
- app/(workspace)/accounts/page.tsx
- app/(workspace)/budgets/page.tsx
- app/(workspace)/recurring/page.tsx
- app/(workspace)/goals/page.tsx
- app/(workspace)/analytics/page.tsx
- app/(workspace)/reports/page.tsx
- app/(workspace)/insights/page.tsx
- app/(workspace)/data-health/page.tsx
- app/(workspace)/settings/page.tsx

### Root layout

The root layout must contain the required
HTML and body tags.

Example:

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Preserve any existing fonts, theme providers,
metadata, and global stylesheet imports.

### Workspace layout

The workspace layout should contain:

- TransactionProvider
- CategoryProvider
- RecurringAutomationHost
- CrossTabWarning
- AppSidebar
- AppHeader
- PageTransition
- MobileNav

RecurringAutomationHost must be inside
both financial providers.

Do not duplicate HTML and body tags in the
workspace layout.

Do not render RecurringAutomationHost twice.

---

## 4. Check Node.js and npm

Open PowerShell inside your project folder.

```powershell
cd "C:\Users\Nirvik\Desktop\Expense Tracker\expense-tracker"

node --version

npm --version
```

Next.js 16 requires a supported Node.js version.
Use at least Node.js 20.9, preferably a maintained
LTS release.

Check that the required project dependencies
are installed.

If dependencies are missing, run:

```powershell
npm install
```

Avoid upgrading major dependencies during the
final release check unless required to fix an
identified compatibility or security issue.

---

## 5. TypeScript Verification

Run:

```powershell
npx tsc --noEmit
```

Expected result:

- No TypeScript compilation errors
- No invalid transaction union types
- No missing module imports
- No incompatible component properties

If an error appears, fix the specific file
before proceeding.

Do not suppress TypeScript errors merely to
complete the deployment.

---

## 6. ESLint Verification

Run:

```powershell
npm run lint
```

Review:

- Unused imports
- Invalid JSX
- Unescaped JSX text
- React Hook warnings
- Unexpected implicit types
- Unused variables

Resolve blocking errors before release.

For Tailwind CSS v4, follow verified canonical
class suggestions where appropriate.

---

## 7. Run Unit Tests

Run the entire unit test suite:

```powershell
npx vitest run
```

Important features to verify:

- Account calculations
- Transaction calculations
- Income and expenses
- Account transfers
- Category validation
- Monthly budgets
- Recurring transactions
- Recurring reminders
- Automatic posting safeguards
- Savings goals
- Goal allocations and releases
- Complete Backup v4
- Financial reports
- Advanced Insights
- Data Health

All unit tests must pass before release.

---

## 8. Run Browser Tests

Run the final release smoke tests:

```powershell
npx playwright test tests/e2e/release-smoke.spec.ts --workers=1 --reporter=list
```

If your Playwright configuration includes
desktop and mobile projects, both must pass.

Also run relevant earlier end-to-end tests
for transactions, goals, recurring entries,
reports, and backup restoration.

The smoke tests confirm basic page availability.
They do not replace full feature testing.

---

## 9. Run Automated Release Checks

The project contains:

scripts/release-check.mjs

Execute:

```powershell
node scripts/release-check.mjs
```

This checks:

1. TypeScript
2. ESLint
3. Unit tests
4. Production build

To include browser smoke tests:

```powershell
node scripts/release-check.mjs --e2e
```

If the script stops at an error, fix it before
continuing to deployment.

Passing the script does not replace manual
financial-data and recovery checks.

---

## 10. Production Build

Stop the development server first.

Press:

Ctrl + C

Then build the project:

```powershell
npm run build
```

The build must complete without errors.

Next, run the production server:

```powershell
npm run start
```

Open:

http://localhost:3000/dashboard

Verify that the Dashboard loads correctly.

Do not run the development server and production
server on the same port simultaneously.

---

## 11. Financial Feature Testing

### Dashboard

- [ ] Total Balance displays correctly.
- [ ] Monthly Income displays correctly.
- [ ] Monthly Expenses displays correctly.
- [ ] Net Cash Flow displays correctly.
- [ ] Recent Transactions display correctly.
- [ ] Accounts overview works.
- [ ] Recurring Payments widget works.
- [ ] Savings Goals widget works.

### Transactions and Accounts

- [ ] Create an income transaction.
- [ ] Create an expense transaction.
- [ ] Edit a transaction.
- [ ] Delete a test transaction.
- [ ] Transfer between test accounts.
- [ ] Verify transfer amounts are not treated as income.
- [ ] Verify account balances update correctly.
- [ ] Verify balances after refreshing the page.

### Budgets

- [ ] Create a monthly budget.
- [ ] Edit a budget.
- [ ] Verify actual spending calculations.
- [ ] Verify remaining budget calculations.

### Recurring Transactions

- [ ] Create a weekly schedule.
- [ ] Create a monthly schedule.
- [ ] Create a yearly schedule.
- [ ] Verify due-date calculations.
- [ ] Verify overdue reminders.
- [ ] Verify posted occurrences.
- [ ] Verify duplicate posting is prevented.
- [ ] Verify automation is OFF by default.
- [ ] Verify posting history is accurate.

### Savings Goals

- [ ] Create a savings goal.
- [ ] Edit a goal.
- [ ] Record an allocation.
- [ ] Record a release.
- [ ] Verify releases cannot exceed allocations.
- [ ] Verify progress percentages.
- [ ] Verify allocation history.
- [ ] Verify account balances remain unchanged.

### Financial Reports

- [ ] This Month filter works.
- [ ] Last Month filter works.
- [ ] Last 90 Days filter works.
- [ ] Custom date range works.
- [ ] Account filters work.
- [ ] Category filters work.
- [ ] Transaction-type filters work.
- [ ] CSV exports download successfully.
- [ ] Printable reports open correctly.
- [ ] PDF output shows expected financial amounts.

---

## 12. Advanced Insights Testing

Open:

http://localhost:3000/insights

Verify:

- [ ] The page loads successfully.
- [ ] The previous 12 completed months appear.
- [ ] Income trends are accurate.
- [ ] Expense trends are accurate.
- [ ] Transfers are excluded from expense trends.
- [ ] Month-over-month comparison works.
- [ ] Year-over-year comparison works.
- [ ] Top expense categories appear.
- [ ] The illustrative expense projection appears when eligible.
- [ ] Insufficient history is handled gracefully.

Forecasts are historical estimates, not
guaranteed predictions.

---

## 13. Data Health Testing

Open:

http://localhost:3000/data-health

Verify:

- [ ] Account count is correct.
- [ ] Transaction count is correct.
- [ ] Goal count is correct.
- [ ] Recurring schedule count is correct.
- [ ] Duplicate transaction IDs are detected.
- [ ] Missing account references are detected.
- [ ] Missing category references are detected.
- [ ] Invalid transfer endpoints are detected.
- [ ] Invalid goals are reported.
- [ ] Invalid recurring schedules are reported.
- [ ] Backup readiness validation works.

The Data Health page is diagnostic only.

It does not automatically repair corrupted
records or make localStorage transactions atomic.

---

## 14. Browser and Responsive Design

Test the application using:

- Google Chrome
- Microsoft Edge
- Firefox or another supported browser
- Mobile-sized browser viewports
- Desktop-sized browser viewports

Verify:

- [ ] Sidebar navigation works.
- [ ] Mobile navigation works.
- [ ] Forms are usable on mobile.
- [ ] Charts fit the screen.
- [ ] Tables scroll horizontally where needed.
- [ ] Dialogs remain visible.
- [ ] Buttons respond correctly.
- [ ] Keyboard navigation works.
- [ ] No unintended horizontal page overflow.
- [ ] No Next.js error overlays.
- [ ] No hydration errors.

Check the browser developer console for
unexpected runtime errors.

---

## 15. Privacy and Browser Storage

Expense Tracker currently uses localStorage.

Understand these limitations:

- Each browser profile has separate records.
- Each domain has separate records.
- Localhost data does not transfer to a deployed domain.
- Clearing site data can remove saved records.
- Incognito/private sessions may not retain data.
- Storage is not encrypted by the application.
- Other JavaScript running on the same origin can access localStorage.
- Cross-tab changes can cause conflicting writes.
- Backup restoration uses best-effort rollback.
- The application does not synchronize between devices.

Never treat a browser-only copy as the sole
reliable backup of important financial data.

Avoid sharing personal financial records,
screenshots, or backups publicly.

---

## 16. Deployment Options

### Option A: Private Local Application

Recommended for the current architecture.

Steps:

1. Complete the release tests.
2. Build with npm run build.
3. Start with npm run start.
4. Use a primary browser profile.
5. Maintain verified Complete Backup v4 copies.
6. Avoid simultaneous editing in multiple tabs.

This option avoids publicly hosting a financial
interface that does not yet have authentication.

### Option B: Hosted Frontend

Next.js supports deployment to a Node.js
hosting platform.

Check that package.json includes these scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

Do not replace your entire package.json with
this example. Preserve your dependencies
and existing scripts.

Deployment preparation:

- [ ] Choose a supported Node.js hosting platform.
- [ ] Use the platform's Next.js deployment preset, or configure build/start commands.
- [ ] Do not upload financial backup files.
- [ ] Do not place secrets in NEXT_PUBLIC_ variables.
- [ ] Configure HTTPS.
- [ ] Test a preview deployment.
- [ ] Check every route.
- [ ] Verify CSV and print exports.
- [ ] Test with disposable financial data.
- [ ] Explain that records remain browser-local.

Hosting the frontend does not create cloud
synchronization or account security.

Before offering public financial accounts,
develop and review a proper backend with:

- Authentication
- Authorization
- Secure server-side data storage
- Transaction validation
- Multi-device synchronization
- Reliable backup and recovery
- Privacy and security controls
- Security testing

---

## 17. Recovery and Rollback

Before a deployment:

- [ ] Create a Git commit of working source code.
- [ ] Download a verified Complete Backup v4.
- [ ] Keep a separate recovery copy.
- [ ] Record the known-good application version.

If the new version fails:

1. Stop editing real financial records.
2. Investigate the error.
3. Revert to a known-good source version if necessary.
4. Rebuild and verify the application.
5. Test the recovery process with disposable data.
6. Restore financial records only from a verified backup.
7. Keep automatic posting disabled during recovery.

Reverting Git code does not revert data in
browser localStorage.

---

## 18. Final Release Acceptance Criteria

- [ ] TypeScript passes.
- [ ] ESLint passes.
- [ ] Unit tests pass.
- [ ] Production build passes.
- [ ] Playwright desktop tests pass.
- [ ] Playwright mobile tests pass.
- [ ] Dashboard calculations are correct.
- [ ] Transactions and account balances work.
- [ ] Budgets and recurring schedules work.
- [ ] Savings goals and allocations work.
- [ ] Financial reports export correctly.
- [ ] Advanced Insights calculations are verified.
- [ ] Data Health has no unresolved critical issues.
- [ ] Complete Backup v4 is verified.
- [ ] Recovery testing succeeds in a disposable profile.
- [ ] Root and workspace layouts are correct.
- [ ] Privacy and data-storage limitations are documented.

**Release decision:**

- [ ] Approved for private local use
- [ ] Not approved — further fixes required

**Verified on:** __________

**Application commit/version:** __________

---

## 19. Official References

Next.js Installation and Requirements:
https://nextjs.org/docs/app/getting-started/installation

Next.js Deployment:
https://nextjs.org/docs/app/getting-started/deploying

Next.js Production Checklist:
https://nextjs.org/docs/app/guides/production-checklist

Next.js Environment Variables:
https://nextjs.org/docs/app/guides/environment-variables

Playwright Documentation:
https://playwright.dev/docs/intro
