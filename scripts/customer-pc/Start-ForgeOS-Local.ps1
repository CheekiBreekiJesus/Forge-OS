#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'ForgeOS-Runtime.psm1'
Import-Module $modulePath -Force

$repoRoot = Get-ForgeOSRepoRoot -StartPath $PSScriptRoot
$mode = 'local-production'

try {
    Assert-ForgeOSNode -RepoRoot $repoRoot
    Assert-ForgeOSRequiredFiles -RepoRoot $repoRoot
    Ensure-ForgeOSLocalDirectories -RepoRoot $repoRoot

    if (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'node_modules'))) {
        throw 'Dependencies are not installed. Run Setup-ForgeOS.ps1 first.'
    }

    $process = Start-ForgeOSServerProcess -RepoRoot $repoRoot -Mode $mode
    Wait-ForgeOSHealth -RepoRoot $repoRoot | Out-Null
    Open-ForgeOSBrowser -RepoRoot $repoRoot

    Write-ForgeOSLog -RepoRoot $repoRoot -Message "ForgeOS local production mode is ready at $ForgeOSUrl. Keep this window open."
    Write-ForgeOSLog -RepoRoot $repoRoot -Message 'Press Ctrl+C to stop ForgeOS safely.'

    try {
        Wait-Process -Id $process.Id
    } catch {
        # Ctrl+C or external termination
    }

    Stop-ForgeOSServer -RepoRoot $repoRoot -AllModes | Out-Null
    exit 0
} catch {
    Write-ForgeOSLog -RepoRoot $repoRoot -Message $_.Exception.Message -Level error
    Stop-ForgeOSServer -RepoRoot $repoRoot -AllModes | Out-Null
    exit 1
}
