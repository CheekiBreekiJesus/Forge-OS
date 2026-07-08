#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'ForgeOS-Runtime.psm1'
Import-Module $modulePath -Force

$repoRoot = Get-ForgeOSRepoRoot -StartPath $PSScriptRoot

try {
    Ensure-ForgeOSLocalDirectories -RepoRoot $repoRoot
    $stopped = Stop-ForgeOSServer -RepoRoot $repoRoot -AllModes
    if ($stopped) {
        Write-ForgeOSLog -RepoRoot $repoRoot -Message 'ForgeOS stopped.'
        exit 0
    }

    Write-ForgeOSLog -RepoRoot $repoRoot -Message 'No ForgeOS server was running.' -Level warn
    exit 0
} catch {
    Write-ForgeOSLog -RepoRoot $repoRoot -Message $_.Exception.Message -Level error
    exit 1
}
