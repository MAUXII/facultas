$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$configPath = Join-Path $root "hub-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "Crie hub-config.json a partir de hub-config.example.json" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath -Raw | ConvertFrom-Json
if ($config.mode -ne "live") {
    Write-Host "hub-config.json precisa de mode: live" -ForegroundColor Red
    exit 1
}

$base = $config.supabaseUrl.TrimEnd("/")
$key = $config.supabaseAnonKey
$ref = $config.communityId

$headers = @{
    apikey       = $key
    Authorization = "Bearer $key"
    Accept       = "application/json"
}

Write-Host "==> Buscando comunidade $ref" -ForegroundColor Cyan
$isUuid = $ref -match "^[0-9a-f-]{36}$"
$column = if ($isUuid) { "id" } else { "public_id" }
$communityUrl = "$base/rest/v1/communities?$column=eq.$ref&select=id,name,public_id&limit=1"
$community = Invoke-RestMethod -Uri $communityUrl -Headers $headers
if (-not $community -or $community.Count -eq 0) {
    Write-Host "Comunidade nao encontrada (RLS ou ID errado)" -ForegroundColor Red
    exit 1
}

$communityId = $community[0].id
Write-Host "  OK  $($community[0].name) ($communityId)" -ForegroundColor Green

Write-Host "==> Avisos" -ForegroundColor Cyan
$postsUrl = "$base/rest/v1/community_posts?community_id=eq.$communityId&select=id,body&order=created_at.desc&limit=5"
$posts = Invoke-RestMethod -Uri $postsUrl -Headers $headers
Write-Host "  $($posts.Count) aviso(s)" -ForegroundColor Green
foreach ($p in $posts) {
    $preview = if ($p.body.Length -gt 60) { $p.body.Substring(0, 60) + "..." } else { $p.body }
    Write-Host "    - $preview"
}

Write-Host "==> Materiais" -ForegroundColor Cyan
$matUrl = "$base/rest/v1/community_resources?community_id=eq.$communityId&select=id,title&order=created_at.desc&limit=5"
$mats = Invoke-RestMethod -Uri $matUrl -Headers $headers
Write-Host "  $($mats.Count) material(is)" -ForegroundColor Green

Write-Host "==> Membros" -ForegroundColor Cyan
$memUrl = "$base/rest/v1/community_members?community_id=eq.$communityId&status=neq.removed&select=user_id,role"
$mems = Invoke-RestMethod -Uri $memUrl -Headers $headers
Write-Host "  $($mems.Count) membro(s)" -ForegroundColor Green

Write-Host ""
Write-Host "Supabase OK. Edite Resources/hub-config.json com os mesmos dados e rode xtool dev." -ForegroundColor Yellow
