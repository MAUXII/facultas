$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$required = @(
    "Package.swift",
    "xtool.yml",
    "Sources/FFlowHub/FFlowHubApp.swift",
    "Sources/FFlowHub/HubView.swift",
    "Sources/FFlowHub/SupabaseHubClient.swift",
    "Sources/FFlowHub/Resources/hub-config.json"
)

Write-Host "==> Orbit Hub iOS — check de estrutura" -ForegroundColor Cyan
$ok = $true
foreach ($file in $required) {
    if (Test-Path $file) {
        Write-Host "  OK  $file" -ForegroundColor Green
    } else {
        Write-Host "  FALTA  $file" -ForegroundColor Red
        $ok = $false
    }
}

if (-not $ok) { exit 1 }

Write-Host ""
Write-Host "Modo mock [padrao]: badge MOCK no app, sem Supabase." -ForegroundColor Yellow
Write-Host ""
Write-Host "Para testar live no Windows antes do iPhone:" -ForegroundColor Yellow
Write-Host "  Copy-Item hub-config.example.json hub-config.json"
Write-Host "  # edite hub-config.json"
Write-Host "  .\scripts\test-live.ps1"
Write-Host ""
Write-Host "Para rodar no iPhone (WSL):" -ForegroundColor Yellow
Write-Host "  bash scripts/setup-xtool.sh"
Write-Host "  xtool setup"
Write-Host "  xtool dev"
