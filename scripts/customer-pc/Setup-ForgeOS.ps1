#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'ForgeOS-Runtime.psm1'
Import-Module $modulePath -Force

$repoRoot = Get-ForgeOSRepoRoot -StartPath $PSScriptRoot

try {
    Write-ForgeOSLog -RepoRoot $repoRoot -Message 'ForgeOS setup started.'
    Assert-ForgeOSNode -RepoRoot $repoRoot
    Assert-ForgeOSRequiredFiles -RepoRoot $repoRoot
    Ensure-ForgeOSLocalDirectories -RepoRoot $repoRoot
    Initialize-ForgeOSEnvLocal -RepoRoot $repoRoot

    $dbNames = Get-ForgeOSDatabaseNameFromEnv -RepoRoot $repoRoot
    if (-not $dbNames.Stable) {
        throw 'FORGEOS_LOCAL_DB_NAME and NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME must match in .env.local.'
    }

    Write-ForgeOSLog -RepoRoot $repoRoot -Message "IndexedDB name: $($dbNames.Server)"
    Write-ForgeOSLog -RepoRoot $repoRoot -Message 'Installing dependencies with npm ci...'
    Push-Location $repoRoot
  try {
    & npm ci
    if ($LASTEXITCODE -ne 0) {
      throw 'npm ci failed.'
    }
  } finally {
    Pop-Location
  }

    Write-ForgeOSLog -RepoRoot $repoRoot -Message 'Setup complete. Use Start-ForgeOS-Local.ps1 for normal use or Start-ForgeOS-Dev.ps1 for development testing.'
    exit 0
} catch {
    Write-ForgeOSLog -RepoRoot $repoRoot -Message $_.Exception.Message -Level error
    exit 1
}
