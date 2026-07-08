<#
.SYNOPSIS
  Remove reproducible ForgeOS build and test artifacts (dry-run by default).

.DESCRIPTION
  Scans ForgeOS repository roots under a parent directory (default: parent of this repo)
  and reports or deletes allowlisted artifact folders only:
    .next, dist, build, coverage, .turbo, test-results, playwright-report, out

  Never touches: .git, node_modules (unless -IncludeNodeModules is explicitly set),
  source trees, migrations, .env*, supabase data, scripts/data-preparation/local,
  or paths outside the ForgeOS workspace parent.

.PARAMETER ParentDirectory
  Directory containing Forge-OS and Forge-OS-* worktree folders.

.PARAMETER Execute
  Actually delete matched artifact directories. Without this switch, dry-run only.

.PARAMETER IncludeNodeModules
  Also remove node_modules in non-main worktrees. NEVER removes node_modules from
  the main Forge-OS worktree. Requires -Execute.

.PARAMETER MainWorktreeName
  Name of the primary worktree folder (default: Forge-OS).

.EXAMPLE
  .\scripts\maintenance\clean-local-artifacts.ps1
  Dry-run: list reclaimable space.

.EXAMPLE
  .\scripts\maintenance\clean-local-artifacts.ps1 -Execute
  Delete allowlisted artifacts in all ForgeOS folders (keeps node_modules).

.EXAMPLE
  .\scripts\maintenance\clean-local-artifacts.ps1 -Execute -IncludeNodeModules
  Also remove node_modules from inactive worktrees (not main).
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$ParentDirectory = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [switch]$Execute,
  [switch]$IncludeNodeModules,
  [string]$MainWorktreeName = "Forge-OS"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$AllowlistedArtifacts = @(
  ".next",
  "dist",
  "build",
  "coverage",
  ".turbo",
  "test-results",
  "playwright-report",
  "out"
)

$BlockedSegmentPatterns = @(
  "\\\.git(\\|$)",
  "\\node_modules\\\.cache",
  "\\scripts\\data-preparation\\local",
  "\\supabase\\\.temp",
  "\\\.env"
)

function Test-ForgeOsRoot {
  param([string]$Path)
  return (Test-Path (Join-Path $Path "package.json")) -and (Test-Path (Join-Path $Path ".git"))
}

function Get-DirectorySizeBytes {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return 0 }
  return (Get-ChildItem -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum).Sum
}

function Test-SafeArtifactPath {
  param([string]$ArtifactPath)
  foreach ($pattern in $BlockedSegmentPatterns) {
    if ($ArtifactPath -match $pattern) { return $false }
  }
  return $true
}

$parentResolved = Resolve-Path -LiteralPath $ParentDirectory
Write-Host "ForgeOS artifact cleanup"
Write-Host "Parent: $parentResolved"
Write-Host "Mode:   $(if ($Execute) { 'EXECUTE' } else { 'DRY-RUN' })"
Write-Host ""

$repoFolders = Get-ChildItem -LiteralPath $parentResolved -Directory |
  Where-Object { $_.Name -eq $MainWorktreeName -or $_.Name -like "Forge-OS-*" -or $_.Name -like "ForgeOS-*" }

if (-not $repoFolders) {
  Write-Warning "No ForgeOS folders found under $parentResolved"
  exit 1
}

$totalReclaimable = 0L
$targets = @()

foreach ($folder in $repoFolders) {
  if (-not (Test-ForgeOsRoot $folder.FullName)) { continue }

  foreach ($artifactName in $AllowlistedArtifacts) {
    $artifactPath = Join-Path $folder.FullName $artifactName
    if (-not (Test-Path -LiteralPath $artifactPath)) { continue }
    if (-not (Test-SafeArtifactPath $artifactPath)) { continue }

    $size = Get-DirectorySizeBytes $artifactPath
    if ($size -le 0) { continue }

    $targets += [PSCustomObject]@{
      Folder   = $folder.Name
      Artifact = $artifactName
      Path     = $artifactPath
      SizeMB   = [math]::Round($size / 1MB, 2)
      SizeBytes = $size
    }
    $totalReclaimable += $size
  }

  if ($IncludeNodeModules -and $folder.Name -ne $MainWorktreeName) {
    $nmPath = Join-Path $folder.FullName "node_modules"
    if (Test-Path -LiteralPath $nmPath) {
      $size = Get-DirectorySizeBytes $nmPath
      if ($size -gt 0) {
        $targets += [PSCustomObject]@{
          Folder   = $folder.Name
          Artifact = "node_modules"
          Path     = $nmPath
          SizeMB   = [math]::Round($size / 1MB, 2)
          SizeBytes = $size
        }
        $totalReclaimable += $size
      }
    }
  }
}

if ($targets.Count -eq 0) {
  Write-Host "No allowlisted artifacts found."
  exit 0
}

$targets | Sort-Object SizeBytes -Descending | Format-Table Folder, Artifact, SizeMB, Path -AutoSize
Write-Host ("Estimated reclaimable: {0:N2} MB ({1:N2} GB)" -f ($totalReclaimable / 1MB), ($totalReclaimable / 1GB))
Write-Host ""

if (-not $Execute) {
  Write-Host "Dry-run complete. Re-run with -Execute to delete the paths above."
  exit 0
}

foreach ($target in $targets) {
  if ($PSCmdlet.ShouldProcess($target.Path, "Remove artifact directory")) {
    try {
      Remove-Item -LiteralPath $target.Path -Recurse -Force -ErrorAction Stop
      Write-Host "Removed: $($target.Path)"
    } catch {
      Write-Warning "Failed to remove $($target.Path): $($_.Exception.Message)"
    }
  }
}

Write-Host "Cleanup complete."
