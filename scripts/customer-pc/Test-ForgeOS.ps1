#Requires -Version 5.1

param(
    [switch] $IncludeSmoke
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'ForgeOS-Runtime.psm1'
Import-Module $modulePath -Force

$repoRoot = Get-ForgeOSRepoRoot -StartPath $PSScriptRoot
$failures = 0

function Assert-Test {
    param(
        [string] $Name,
        [scriptblock] $Test
    )

    try {
        & $Test
        Write-Host "[PASS] $Name" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] $Name :: $($_.Exception.Message)" -ForegroundColor Red
        $script:failures++
    }
}

Write-Host 'ForgeOS customer PC runtime validation'
Write-Host "Repository: $repoRoot"
Write-Host ''

Assert-Test 'Stable URL is localhost:3000' {
    if ($ForgeOSUrl -ne 'http://localhost:3000') {
        throw "Unexpected URL: $ForgeOSUrl"
    }
}

Assert-Test 'Health endpoint path' {
    if ($ForgeOSHealthPath -ne '/api/health/local') {
        throw "Unexpected health path: $ForgeOSHealthPath"
    }
}

Assert-Test 'Node is available' {
    if (-not (Test-ForgeOSCommand -Name 'node')) {
        throw 'node command missing'
    }
}

Assert-Test 'npm is available' {
    if (-not (Test-ForgeOSCommand -Name 'npm')) {
        throw 'npm command missing'
    }
}

Assert-Test 'Node major version acceptable' {
    $version = Get-ForgeOSNodeVersion
    if ($null -eq $version) {
        throw 'Could not parse node -v'
    }
    if ($version.Major -lt 20) {
        throw "Node major $($version.Major) is below minimum 20"
    }
}

Assert-Test 'Required repository files exist' {
    Assert-ForgeOSRequiredFiles -RepoRoot $repoRoot
}

Assert-Test 'Customer env template exists' {
    if (-not (Test-Path -LiteralPath (Join-Path $repoRoot $CustomerEnvTemplate))) {
        throw "$CustomerEnvTemplate missing"
    }
}

Assert-Test 'Database name variables are stable in customer template' {
    $templatePath = Join-Path $repoRoot $CustomerEnvTemplate
    $server = $null
    $public = $null
    foreach ($line in Get-Content -LiteralPath $templatePath) {
        if ($line -match '^\s*FORGEOS_LOCAL_DB_NAME\s*=\s*(.+)\s*$') { $server = $Matches[1].Trim() }
        if ($line -match '^\s*NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME\s*=\s*(.+)\s*$') { $public = $Matches[1].Trim() }
    }
    if (-not $server -or -not $public -or $server -ne $public) {
        throw 'FORGEOS_LOCAL_DB_NAME and NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME must match'
    }
}

Assert-Test 'Setup preserves existing .env.local' {
    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("forgeos-test-" + [guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $tempRoot | Out-Null
    try {
        Copy-Item -LiteralPath (Join-Path $repoRoot 'package.json') -Destination (Join-Path $tempRoot 'package.json')
        Copy-Item -LiteralPath (Join-Path $repoRoot 'package-lock.json') -Destination (Join-Path $tempRoot 'package-lock.json')
        Copy-Item -LiteralPath (Join-Path $repoRoot 'next.config.ts') -Destination (Join-Path $tempRoot 'next.config.ts')
        Copy-Item -LiteralPath (Join-Path $repoRoot 'AGENTS.md') -Destination (Join-Path $tempRoot 'AGENTS.md')
        Copy-Item -LiteralPath (Join-Path $repoRoot $CustomerEnvTemplate) -Destination (Join-Path $tempRoot $CustomerEnvTemplate)
        'CUSTOM_MARKER=1' | Set-Content -LiteralPath (Join-Path $tempRoot '.env.local') -Encoding UTF8
        Initialize-ForgeOSEnvLocal -RepoRoot $tempRoot
        $content = Get-Content -LiteralPath (Join-Path $tempRoot '.env.local') -Raw
        if ($content -notmatch 'CUSTOM_MARKER=1') {
            throw '.env.local was overwritten'
        }
    } finally {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Assert-Test 'Setup creates .env.local when absent' {
    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("forgeos-test-" + [guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $tempRoot | Out-Null
    try {
        Copy-Item -LiteralPath (Join-Path $repoRoot $CustomerEnvTemplate) -Destination (Join-Path $tempRoot $CustomerEnvTemplate)
        Initialize-ForgeOSEnvLocal -RepoRoot $tempRoot
        if (-not (Test-Path -LiteralPath (Join-Path $tempRoot '.env.local'))) {
            throw '.env.local was not created'
        }
    } finally {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Assert-Test 'Stale PID file cleanup' {
    Ensure-ForgeOSLocalDirectories -RepoRoot $repoRoot
    $pidFile = Get-ForgeOSPidFile -RepoRoot $repoRoot -Mode 'development'
    Set-Content -LiteralPath $pidFile -Value '999999' -Encoding ASCII
    Remove-ForgeOSStalePidFile -RepoRoot $repoRoot -Mode 'development'
    if (Test-Path -LiteralPath $pidFile) {
        throw 'Stale PID file was not removed'
    }
}

Assert-Test 'Port owner detection returns structured text or null' {
    $owner = Get-ForgeOSPortOwnerDescription -Port $ForgeOSPort
    if ($null -ne $owner -and $owner -notmatch 'PID') {
        throw "Unexpected owner description: $owner"
    }
}

Assert-Test 'Redaction removes user home paths' {
    $sample = 'C:\Users\Example User\ForgeOS\.env.local'
    $redacted = Redact-ForgeOSText -Text $sample
    if ($redacted -match 'Example User') {
        throw 'User path was not redacted'
    }
}

Assert-Test 'Diagnostics excludes .env.local' {
    $previewScript = Join-Path $PSScriptRoot 'Collect-ForgeOS-Diagnostics.ps1'
    if (-not (Test-Path -LiteralPath $previewScript)) {
        throw 'Collect-ForgeOS-Diagnostics.ps1 missing'
    }
    $content = Get-Content -LiteralPath $previewScript -Raw
    if ($content -notmatch '\.env\.local') {
        throw 'Diagnostics script should document .env.local exclusion'
    }
}

if ($IncludeSmoke) {
    Write-Host ''
    Write-Host 'Running smoke test...' -ForegroundColor Cyan
    $smokeScript = Join-Path $PSScriptRoot 'Invoke-ForgeOSSmokeTest.ps1'
    if (-not (Test-Path -LiteralPath $smokeScript)) {
        Write-Host '[FAIL] Smoke test script missing' -ForegroundColor Red
        $failures++
    } else {
        & $smokeScript
        if ($LASTEXITCODE -ne 0) {
            $failures++
        }
    }
}

Write-Host ''
if ($failures -gt 0) {
    Write-Host "Validation finished with $failures failure(s)." -ForegroundColor Red
    exit 1
}

Write-Host 'All validation checks passed.' -ForegroundColor Green
exit 0
