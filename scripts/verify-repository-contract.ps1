$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$requiredFiles = @(
    "README.md",
    "AGENTS.md",
    "CONTRIBUTING.md",
    "products/README.md",
    "products/public-site/README.md",
    "products/climbers-lounge-pwa/README.md",
    "docs/PRODUCT_MAP.md",
    "docs/architecture/ADR-0001-two-product-monorepo.md",
    "docs/operations/SOFTWARE_STACK.md",
    "docs/recovery/CANONICAL_STATE.md",
    "docs/repository/BRANCH_AUDIT_2026-08-13.md",
    "docs/repository/FILE_AUDIT_2026-08-13.md",
    "docs/repository/CLEANUP_RUNBOOK.md",
    "website/AGENTS.md",
    "website/app/AGENTS.md",
    "website/src/AGENTS.md",
    "website/public/AGENTS.md"
)

$missing = @($requiredFiles | Where-Object { -not (Test-Path -LiteralPath (Join-Path $repoRoot $_)) })
if ($missing.Count -gt 0) {
    throw "Repository contract is incomplete. Missing: $($missing -join ', ')"
}

$rootReadme = Get-Content -LiteralPath (Join-Path $repoRoot "README.md") -Raw
foreach ($requiredText in @("Public website", "Climbers Lounge / Explore PWA", "site/", "pwa/", "SOFTWARE_STACK.md", "/contribute")) {
    if (-not $rootReadme.Contains($requiredText)) {
        throw "README.md is missing required product/stack marker: $requiredText"
    }
}

$productMap = Get-Content -LiteralPath (Join-Path $repoRoot "docs/PRODUCT_MAP.md") -Raw
foreach ($requiredText in @("website/app/public-site-v5.css", "website/app/(platform)/contribute", "no server upload")) {
    if (-not $productMap.Contains($requiredText)) {
        throw "docs/PRODUCT_MAP.md is missing current runtime marker: $requiredText"
    }
}

$agentContract = Get-Content -LiteralPath (Join-Path $repoRoot "AGENTS.md") -Raw
foreach ($requiredText in @("public-site", "climbers-lounge-pwa", "shared-data", "repository-operations")) {
    if (-not $agentContract.Contains($requiredText)) {
        throw "AGENTS.md is missing required scope: $requiredText"
    }
}

Write-Host "Repository contract PASS: $($requiredFiles.Count) required files and both product markers are present."
Write-Host "Branch: $(git branch --show-current)"
Write-Host "HEAD: $(git rev-parse HEAD)"
git status --short
