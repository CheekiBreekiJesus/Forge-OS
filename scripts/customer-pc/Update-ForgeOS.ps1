#Requires -Version 5.1

param(
    [string] $Branch = 'feat/customer-pc-local-runtime',
    [string] $Remote = 'origin'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'ForgeOS-Runtime.psm1'
Import-Module $modulePath -Force

$repoRoot = Get-ForgeOSRepoRoot -StartPath $PSScriptRoot

function Get-GitPorcelainStatus {
    param([string] $Root)

    Push-Location $Root
    try {
        return (& git status --porcelain 2>$null)
    } finally {
        Pop-Location
    }
}

try {
    Ensure-ForgeOSLocalDirectories -RepoRoot $repoRoot
    Write-ForgeOSLog -RepoRoot $repoRoot -Message 'ForgeOS update started.'

    $dirty = @(Get-GitPorcelainStatus -Root $repoRoot | Where-Object { $_ -match '\S' })
    if ($dirty.Count -gt 0) {
        throw 'Local source modifications detected. Commit or stash changes before updating.'
    }

    Push-Location $repoRoot
    try {
        $currentCommit = (& git rev-parse --short HEAD).Trim()
        Write-Host "Current commit: $currentCommit"

        Write-Host ''
        Write-Host 'IMPORTANT: Export a ForgeOS JSON backup from Settings before continuing.'
        Write-Host 'Settings -> Backup -> Export JSON backup'
        Write-Host ''

        $confirm = Read-Host "Apply updates from $Remote/$Branch? Type YES to continue"
        if ($confirm -ne 'YES') {
            Write-ForgeOSLog -RepoRoot $repoRoot -Message 'Update cancelled by operator.'
            exit 0
        }

        Stop-ForgeOSServer -RepoRoot $repoRoot -AllModes | Out-Null

        & git fetch $Remote
        if ($LASTEXITCODE -ne 0) {
            throw "git fetch $Remote failed."
        }

        $range = "$currentCommit..$Remote/$Branch"
        $incoming = @(& git log --oneline $range 2>$null)
        if ($incoming.Count -gt 0) {
            Write-Host 'Commits to apply:'
            $incoming | ForEach-Object { Write-Host "  $_" }
        } else {
            Write-Host 'Repository is already up to date.'
            exit 0
        }

        & git merge --ff-only "$Remote/$Branch"
        if ($LASTEXITCODE -ne 0) {
            throw 'Fast-forward update failed. Resolve manually or contact support.'
        }

        Write-ForgeOSLog -RepoRoot $repoRoot -Message 'Running npm ci after update...'
        & npm ci
        if ($LASTEXITCODE -ne 0) {
            throw 'npm ci failed after update.'
        }

        Write-ForgeOSLog -RepoRoot $repoRoot -Message 'Running build validation...'
        & npm run build
        if ($LASTEXITCODE -ne 0) {
            throw 'npm run build failed after update.'
        }

        $newCommit = (& git rev-parse --short HEAD).Trim()
        Write-ForgeOSLog -RepoRoot $repoRoot -Message "Update complete. New commit: $newCommit"
        Write-Host ''
        Write-Host 'Rollback instructions:'
        Write-Host "  1. Stop ForgeOS (Stop-ForgeOS.ps1)"
        Write-Host "  2. git fetch $Remote"
        Write-Host "  3. git checkout $currentCommit"
        Write-Host '  4. npm ci && npm run build'
        Write-Host '  5. Restore JSON backup from Settings if needed'
        Write-Host ''
        exit 0
    } finally {
        Pop-Location
    }
} catch {
    Write-ForgeOSLog -RepoRoot $repoRoot -Message $_.Exception.Message -Level error
    exit 1
}
