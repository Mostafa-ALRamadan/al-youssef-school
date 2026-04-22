# Clean script for .next folder (PowerShell)
Write-Host "Cleaning .next folder..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host ".next folder cleaned" -ForegroundColor Green
}

# Clean node_modules\.cache if exists
if (Test-Path "node_modules\.cache") {
    Write-Host "Cleaning node_modules\.cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "node_modules\.cache cleaned" -ForegroundColor Green
}

# Clean TypeScript build info
Get-ChildItem -Path "." -Filter "*.tsbuildinfo" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Cleaning $($_.Name)..." -ForegroundColor Yellow
    Remove-Item $_.FullName
    Write-Host "$($_.Name) cleaned" -ForegroundColor Green
}

Write-Host "Cleanup complete!" -ForegroundColor Green
