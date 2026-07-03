#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'ForgeOS-Runtime.psm1'
Import-Module $modulePath -Force

$repoRoot = Get-ForgeOSRepoRoot -StartPath $PSScriptRoot

try {
    $health = Invoke-ForgeOSHealthRequest
    if (-not $health.Ok) {
        throw "ForgeOS is not responding at $ForgeOSHealthUrl. Start ForgeOS first."
    }

    Open-ForgeOSBrowser -RepoRoot $repoRoot
    exit 0
} catch {
    Write-ForgeOSLog -RepoRoot $repoRoot -Message $_.Exception.Message -Level error
    exit 1
}
