#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'ForgeOS-Runtime.psm1'
Import-Module $modulePath -Force

$repoRoot = Get-ForgeOSRepoRoot -StartPath $PSScriptRoot
$mode = 'local-production'

try {
    Ensure-ForgeOSLocalDirectories -RepoRoot $repoRoot
    Resolve-ForgeOSWorktreeDevLock -RepoRoot $repoRoot | Out-Null
    Stop-ForgeOSServer -RepoRoot $repoRoot -AllModes | Out-Null

    if (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'node_modules'))) {
        Write-ForgeOSLog -RepoRoot $repoRoot -Message 'node_modules missing; running npm ci for smoke test.'
        Push-Location $repoRoot
        try {
            & npm ci
            if ($LASTEXITCODE -ne 0) { throw 'npm ci failed in smoke test.' }
        } finally {
            Pop-Location
        }
    }

    $beforePid = Read-ForgeOSSavedPid -RepoRoot $repoRoot -Mode $mode
    $process = Start-ForgeOSServerProcess -RepoRoot $repoRoot -Mode $mode
    $healthBody = Wait-ForgeOSHealth -RepoRoot $repoRoot -TimeoutSeconds 180
    if ($healthBody -notmatch '"status"') {
        throw 'Health response did not include status field.'
    }

    $page = Invoke-WebRequest -Uri $ForgeOSUrl -UseBasicParsing -TimeoutSec 15
    if ($page.StatusCode -lt 200 -or $page.StatusCode -ge 400) {
        throw "Home page returned HTTP $($page.StatusCode)"
    }

    $stopped = Stop-ForgeOSServer -RepoRoot $repoRoot -AllModes
    if (-not $stopped) {
        throw 'Stop script did not stop ForgeOS process.'
    }

    if (Test-ForgeOSProcessRunning -ProcessId $process.Id) {
        throw 'ForgeOS process is still running after stop.'
    }

    $process2 = Start-ForgeOSServerProcess -RepoRoot $repoRoot -Mode $mode
    Wait-ForgeOSHealth -RepoRoot $repoRoot -TimeoutSeconds 180 | Out-Null
    Stop-ForgeOSServer -RepoRoot $repoRoot -AllModes | Out-Null

    if (-not (Test-ForgeOSProcessRunning -ProcessId $process2.Id)) {
        Write-ForgeOSLog -RepoRoot $repoRoot -Message 'Restart smoke check completed.'
    }

    Write-ForgeOSLog -RepoRoot $repoRoot -Message 'Smoke test passed.'
    exit 0
} catch {
    Write-ForgeOSLog -RepoRoot $repoRoot -Message $_.Exception.Message -Level error
    Stop-ForgeOSServer -RepoRoot $repoRoot -AllModes | Out-Null
    exit 1
}
