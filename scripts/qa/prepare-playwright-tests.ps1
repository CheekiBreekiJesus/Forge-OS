#Requires -Version 5.1

param(
    [int] $TestPort = 3012
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$modulePath = Join-Path (Split-Path -Parent $PSScriptRoot) 'customer-pc\ForgeOS-Runtime.psm1'
Import-Module $modulePath -Force

$repoRoot = Get-ForgeOSRepoRoot -StartPath $PSScriptRoot

try {
    $devResult = Resolve-ForgeOSWorktreeDevLock -RepoRoot $repoRoot
    if ($devResult.Freed) {
        Write-Host "Released worktree dev lock (stopped PID(s): $($devResult.ProcessIds -join ', '))."
    }

    $portResult = Resolve-ForgeOSE2EPortConflict -RepoRoot $repoRoot -Port $TestPort
    if ($portResult.Freed) {
        Write-Host "Freed test port $TestPort (stopped PID $($portResult.ProcessId))."
    } else {
        Write-Host "Test port $TestPort is free."
    }

    exit 0
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
