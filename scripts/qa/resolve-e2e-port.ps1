#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$modulePath = Join-Path (Split-Path -Parent $PSScriptRoot) 'customer-pc\ForgeOS-Runtime.psm1'
Import-Module $modulePath -Force

$repoRoot = Get-ForgeOSRepoRoot -StartPath $PSScriptRoot

try {
    $result = Resolve-ForgeOSE2EPortConflict -Port $ForgeOSE2EPort
    if ($result.Freed) {
        Write-Host "Freed E2E port $ForgeOSE2EPort (stopped PID $($result.ProcessId))."
    } else {
        Write-Host "E2E port $ForgeOSE2EPort is free."
    }
    exit 0
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
