
# ==========================================
# EXPENSE TRACKER 2.0
# PRIVATE PRODUCTION LAUNCHER
# ==========================================

$ErrorActionPreference = "Stop"

# Move to the application root folder.
$projectRoot = Split-Path -Parent $PSScriptRoot

Set-Location $projectRoot

Write-Host ""
Write-Host "Expense Tracker 2.0"
Write-Host "Private Production Mode"
Write-Host ""

# Check whether a production build exists.
if (-not (Test-Path ".next\BUILD_ID")) {
    Write-Host "Production build not found."
    Write-Host "Creating the production build..."

    npm run build

    if ($LASTEXITCODE -ne 0) {
        throw "Production build failed."
    }
}

Write-Host ""
Write-Host "Starting Expense Tracker..."
Write-Host "Open: http://localhost:3000/dashboard"
Write-Host ""
Write-Host "Press Ctrl+C to stop the server."
Write-Host ""

# Bind to this computer only.
npm run start -- --hostname localhost

if ($LASTEXITCODE -ne 0) {
    throw "Expense Tracker server stopped with an error."
}
