#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'ForgeOS-Runtime.psm1'
Import-Module $modulePath -Force

$repoRoot = Get-ForgeOSRepoRoot -StartPath $PSScriptRoot

function New-ShortcutFile {
    param(
        [string] $Path,
        [string] $Target,
        [string] $Arguments,
        [string] $WorkingDirectory,
        [string] $Description
    )

    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($Path)
    $shortcut.TargetPath = $Target
    $shortcut.Arguments = $Arguments
    $shortcut.WorkingDirectory = $WorkingDirectory
    $shortcut.Description = $Description
    $shortcut.Save()
}

try {
    $desktop = [Environment]::GetFolderPath('Desktop')
    if ([string]::IsNullOrWhiteSpace($desktop)) {
        throw 'Could not resolve current user desktop path.'
    }

    $powershell = (Get-Command powershell.exe).Source
    $scripts = @{
        'Start ForgeOS.lnk' = @{
            Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $PSScriptRoot 'Start-ForgeOS-Local.ps1')`""
            Description = 'Start ForgeOS local production mode on http://localhost:3000'
        }
        'Stop ForgeOS.lnk' = @{
            Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $PSScriptRoot 'Stop-ForgeOS.ps1')`""
            Description = 'Stop the ForgeOS local server safely'
        }
        'Open ForgeOS.lnk' = @{
            Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $PSScriptRoot 'Open-ForgeOS.ps1')`""
            Description = 'Open ForgeOS in the default browser'
        }
    }

    foreach ($entry in $scripts.GetEnumerator()) {
        $path = Join-Path $desktop $entry.Key
        New-ShortcutFile -Path $path -Target $powershell -Arguments $entry.Value.Arguments -WorkingDirectory $repoRoot -Description $entry.Value.Description
        Write-Host "Created shortcut: $path"
    }

    exit 0
} catch {
    Write-ForgeOSLog -RepoRoot $repoRoot -Message $_.Exception.Message -Level error
    exit 1
}
