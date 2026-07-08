#Requires -Version 5.1

param(
    [string] $OutputZip
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'ForgeOS-Runtime.psm1'
Import-Module $modulePath -Force

$repoRoot = Get-ForgeOSRepoRoot -StartPath $PSScriptRoot

function Add-DiagnosticTextFile {
    param(
        [string] $Path,
        [string] $Content
    )

    $redacted = Redact-ForgeOSText -Text $Content
    Set-Content -LiteralPath $Path -Value $redacted -Encoding UTF8
}

try {
    Ensure-ForgeOSLocalDirectories -RepoRoot $repoRoot
    $bundleDir = Join-Path (Get-ForgeOSRuntimeDir -RepoRoot $repoRoot) ('diagnostics-' + (Get-Date).ToString('yyyyMMdd-HHmmss'))
    New-Item -ItemType Directory -Path $bundleDir -Force | Out-Null

    $nodeVersion = Get-ForgeOSNodeVersion
    $npmVersion = if (Test-ForgeOSCommand -Name 'npm') { (& npm -v).Trim() } else { 'missing' }
    $health = Invoke-ForgeOSHealthRequest
    $portOwner = Get-ForgeOSPortOwnerDescription -Port $ForgeOSPort
    $dbNames = Get-ForgeOSDatabaseNameFromEnv -RepoRoot $repoRoot

    Push-Location $repoRoot
    try {
        $branch = (& git branch --show-current 2>$null)
        $commit = (& git rev-parse --short HEAD 2>$null)
    } finally {
        Pop-Location
    }

    $summary = @"
ForgeOS diagnostic bundle
Generated: $((Get-Date).ToString('o'))
Windows: $([Environment]::OSVersion.VersionString)
Node: $($nodeVersion.Raw)
npm: $npmVersion
Git branch: $branch
Git commit: $commit
Application URL: $ForgeOSUrl
Runtime mode env: $($env:FORGEOS_RUNTIME_MODE)
Port 3000 owner: $(if ($portOwner) { $portOwner } else { 'free' })
Database names stable: $($dbNames.Stable)
Health OK: $($health.Ok)
Health status code: $($health.StatusCode)
"@

    Add-DiagnosticTextFile -Path (Join-Path $bundleDir 'summary.txt') -Content $summary
    Add-DiagnosticTextFile -Path (Join-Path $bundleDir 'health.json') -Content $(if ($health.Ok) { $health.Body } else { "{`"error`":`"$($health.Body)`"}" })

    $logsDir = Get-ForgeOSLogsDir -RepoRoot $repoRoot
    if (Test-Path -LiteralPath $logsDir) {
        $logBundleDir = Join-Path $bundleDir 'logs'
        New-Item -ItemType Directory -Path $logBundleDir -Force | Out-Null
        Get-ChildItem -LiteralPath $logsDir -File | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object {
            $content = Get-Content -LiteralPath $_.FullName -Raw -ErrorAction SilentlyContinue
            Add-DiagnosticTextFile -Path (Join-Path $logBundleDir $_.Name) -Content $content
        }
    }

    $buildErrorPath = Join-Path $logsDir 'local-production.stderr.log'
    if (Test-Path -LiteralPath $buildErrorPath) {
        $tail = (Get-Content -LiteralPath $buildErrorPath -Tail 80 -ErrorAction SilentlyContinue) -join [Environment]::NewLine
        Add-DiagnosticTextFile -Path (Join-Path $bundleDir 'build-error-summary.txt') -Content $tail
    }

    $previewFiles = Get-ChildItem -LiteralPath $bundleDir -Recurse -File | ForEach-Object {
        $_.FullName.Substring($bundleDir.Length + 1)
    }

    Write-Host 'Diagnostic bundle preview (files to include):'
    $previewFiles | ForEach-Object { Write-Host "  $_" }
    Write-Host ''
    Write-Host 'Excluded by policy: .env.local, OAuth tokens, browser IndexedDB, customer files, email bodies.'

    if (-not $OutputZip) {
        $OutputZip = Join-Path (Get-ForgeOSRuntimeDir -RepoRoot $repoRoot) ('forgeos-diagnostics-' + (Get-Date).ToString('yyyyMMdd-HHmmss') + '.zip')
    }

    if (Test-Path -LiteralPath $OutputZip) {
        Remove-Item -LiteralPath $OutputZip -Force
    }

    Compress-Archive -LiteralPath (Join-Path $bundleDir '*') -DestinationPath $OutputZip
    Write-Host "Diagnostic ZIP created: $OutputZip"
    exit 0
} catch {
    Write-ForgeOSLog -RepoRoot $repoRoot -Message $_.Exception.Message -Level error
    exit 1
}
