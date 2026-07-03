# ForgeOS customer PC local runtime helpers.
# Import: Import-Module (Join-Path $PSScriptRoot 'ForgeOS-Runtime.psm1') -Force

Set-StrictMode -Version Latest

$script:ForgeOSPort = 3000
$script:ForgeOSHost = 'localhost'
$script:ForgeOSUrl = 'http://localhost:3000'
$script:ForgeOSHealthPath = '/api/health/local'
$script:ForgeOSHealthUrl = 'http://localhost:3000/api/health/local'
$script:ForgeOSE2EPort = 3012
$script:SupportedNodeMajors = @(20, 22)
$script:MinimumNodeMajor = 20
$script:RuntimeSubdir = '.customer-pc'
$script:LogsSubdir = '.customer-pc/logs'
$script:PidSubdir = '.customer-pc/runtime'
$script:CustomerEnvTemplate = '.env.customer.local.example'
$script:DefaultUpdateBranch = 'deploy/jh-gomes-local'
$script:RuntimeMetadataVersion = 1
$script:RequiredRepoFiles = @(
    'package.json',
    'package-lock.json',
    'next.config.ts',
    'AGENTS.md',
    $script:CustomerEnvTemplate
)

function Normalize-ForgeOSPath {
    param([string] $Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return ''
    }

    try {
        return ([System.IO.Path]::GetFullPath($Path)).TrimEnd('\').ToLowerInvariant()
    } catch {
        return $Path.Trim().Trim('"').Trim("'").TrimEnd('\').ToLowerInvariant()
    }
}

function ConvertTo-ForgeOSUtcIso {
    param([datetime] $Value)

    if ($Value.Kind -eq [System.DateTimeKind]::Unspecified) {
        return [datetime]::SpecifyKind($Value, [System.DateTimeKind]::Local).ToUniversalTime().ToString('o')
    }

    return $Value.ToUniversalTime().ToString('o')
}

function Get-ForgeOSRepoRoot {
    param(
        [string] $StartPath = $PSScriptRoot
    )

    $current = (Resolve-Path -LiteralPath $StartPath).Path
    while ($true) {
        if (Test-Path -LiteralPath (Join-Path $current 'package.json')) {
            return $current
        }

        $parent = Split-Path -Parent $current
        if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $current) {
            throw 'Could not locate ForgeOS repository root (package.json not found).'
        }
        $current = $parent
    }
}

function Get-ForgeOSRuntimeDir {
    param([string] $RepoRoot)

    Join-Path $RepoRoot $script:RuntimeSubdir
}

function Get-ForgeOSLogsDir {
    param([string] $RepoRoot)

    Join-Path $RepoRoot $script:LogsSubdir
}

function Get-ForgeOSPidDir {
    param([string] $RepoRoot)

    Join-Path $RepoRoot $script:PidSubdir
}

function Get-ForgeOSRuntimeMetadataFile {
    param(
        [string] $RepoRoot,
        [ValidateSet('development', 'local-production')]
        [string] $Mode
    )

    Join-Path (Get-ForgeOSPidDir -RepoRoot $RepoRoot) "forgeos-$Mode.runtime.json"
}

function Get-ForgeOSLegacyPidFile {
    param(
        [string] $RepoRoot,
        [ValidateSet('development', 'local-production')]
        [string] $Mode
    )

    Join-Path (Get-ForgeOSPidDir -RepoRoot $RepoRoot) "forgeos-$Mode.pid"
}

function Get-ForgeOSPidFile {
    param(
        [string] $RepoRoot,
        [ValidateSet('development', 'local-production')]
        [string] $Mode
    )

    Get-ForgeOSRuntimeMetadataFile -RepoRoot $RepoRoot -Mode $Mode
}

function Get-ForgeOSBuildManifestFile {
    param([string] $RepoRoot)

    Join-Path (Get-ForgeOSPidDir -RepoRoot $RepoRoot) 'production-build.json'
}

function Get-ForgeOSLastUpdateBranchFile {
    param([string] $RepoRoot)

    Join-Path (Get-ForgeOSPidDir -RepoRoot $RepoRoot) 'last-update-branch.txt'
}

function Get-ForgeOSLogFile {
    param(
        [string] $RepoRoot,
        [string] $Name
    )

    Join-Path (Get-ForgeOSLogsDir -RepoRoot $RepoRoot) $Name
}

function Redact-ForgeOSText {
    param([string] $Text)

    if ([string]::IsNullOrEmpty($Text)) {
        return $Text
    }

    $output = $Text
    $output = $output -replace '[A-Za-z]:\\Users\\[^\\]+', '[USER_HOME]'
    $output = $output -replace '(?i)(api[_-]?key|secret|token|password|authorization)\s*[:=]\s*\S+', '$1=[REDACTED]'
    $output = $output -replace '(?i)(SUPABASE|OPENAI|ABACUS|BREVO)_[A-Z_]+\s*=\s*\S+', '$1_[REDACTED]=[REDACTED]'
    return $output
}

function Write-ForgeOSLog {
    param(
        [string] $RepoRoot,
        [string] $Message,
        [ValidateSet('info', 'warn', 'error')]
        [string] $Level = 'info',
        [string] $LogName = 'runtime.log'
    )

    $logsDir = Get-ForgeOSLogsDir -RepoRoot $RepoRoot
    if (-not (Test-Path -LiteralPath $logsDir)) {
        New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
    }

    $timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    $line = "[$timestamp] [$Level] $(Redact-ForgeOSText -Text $Message)"
    $line | Add-Content -LiteralPath (Get-ForgeOSLogFile -RepoRoot $RepoRoot -Name $LogName) -Encoding UTF8

    switch ($Level) {
        'error' { Write-Host $line -ForegroundColor Red }
        'warn'  { Write-Host $line -ForegroundColor Yellow }
        default { Write-Host $line }
    }
}

function Test-ForgeOSCommand {
    param([string] $Name)

    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-ForgeOSNodeVersion {
    if (-not (Test-ForgeOSCommand -Name 'node')) {
        return $null
    }

    $raw = (& node -v 2>$null).Trim()
    if ($raw -match '^v(\d+)\.(\d+)\.(\d+)') {
        return [pscustomobject]@{
            Raw = $raw
            Major = [int]$Matches[1]
            Minor = [int]$Matches[2]
            Patch = [int]$Matches[3]
        }
    }

    return $null
}

function Assert-ForgeOSNode {
    param([string] $RepoRoot)

    if (-not (Test-ForgeOSCommand -Name 'node')) {
        throw 'Node.js is not installed or not on PATH. Install Node.js 20 LTS from https://nodejs.org/ and restart the terminal.'
    }

    if (-not (Test-ForgeOSCommand -Name 'npm')) {
        throw 'npm is not installed or not on PATH. Reinstall Node.js 20 LTS from https://nodejs.org/.'
    }

    $nodeVersion = Get-ForgeOSNodeVersion
    if ($null -eq $nodeVersion) {
        throw 'Could not parse Node.js version. Run "node -v" manually and contact support.'
    }

    if ($nodeVersion.Major -lt $script:MinimumNodeMajor) {
        throw "Node.js $($nodeVersion.Raw) is too old. Install Node.js 20 LTS or newer from https://nodejs.org/."
    }

    if ($script:SupportedNodeMajors -notcontains $nodeVersion.Major) {
        Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Node $($nodeVersion.Raw) is not an LTS-tested major; recommended: $($script:SupportedNodeMajors -join ' or ')." -Level warn
    }

    Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Node $($nodeVersion.Raw); npm $((& npm -v).Trim())"
}

function Assert-ForgeOSRequiredFiles {
    param([string] $RepoRoot)

    $missing = @()
    foreach ($relative in $script:RequiredRepoFiles) {
        if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot $relative))) {
            $missing += $relative
        }
    }

    if ($missing.Count -gt 0) {
        throw "Missing required ForgeOS files: $($missing -join ', ')"
    }
}

function Ensure-ForgeOSLocalDirectories {
    param([string] $RepoRoot)

    foreach ($dir in @(
        (Get-ForgeOSRuntimeDir -RepoRoot $RepoRoot),
        (Get-ForgeOSLogsDir -RepoRoot $RepoRoot),
        (Get-ForgeOSPidDir -RepoRoot $RepoRoot)
    )) {
        if (-not (Test-Path -LiteralPath $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
}

function Get-ForgeOSEnvValue {
    param(
        [string] $RepoRoot,
        [string] $Name
    )

    $systemValue = [Environment]::GetEnvironmentVariable($Name)
    if (-not [string]::IsNullOrWhiteSpace($systemValue)) {
        return $systemValue.Trim()
    }

    $envLocal = Join-Path $RepoRoot '.env.local'
    if (-not (Test-Path -LiteralPath $envLocal)) {
        return $null
    }

    foreach ($line in Get-Content -LiteralPath $envLocal) {
        if ($line -match "^\s*$([regex]::Escape($Name))\s*=\s*(.+)\s*$") {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }

    return $null
}

function Get-ForgeOSCustomerTemplateValue {
    param(
        [string] $RepoRoot,
        [string] $Name
    )

    $template = Join-Path $RepoRoot $script:CustomerEnvTemplate
    if (-not (Test-Path -LiteralPath $template)) {
        return $null
    }

    foreach ($line in Get-Content -LiteralPath $template) {
        if ($line -match "^\s*$([regex]::Escape($Name))\s*=\s*(.*)\s*$") {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }

    return $null
}

function Initialize-ForgeOSEnvLocal {
    param([string] $RepoRoot)

    $envLocal = Join-Path $RepoRoot '.env.local'
    $template = Join-Path $RepoRoot $script:CustomerEnvTemplate

    if (Test-Path -LiteralPath $envLocal) {
        Write-ForgeOSLog -RepoRoot $RepoRoot -Message 'Found existing .env.local; preserving file.'
        return
    }

    if (-not (Test-Path -LiteralPath $template)) {
        throw "Customer environment template not found: $script:CustomerEnvTemplate"
    }

    Copy-Item -LiteralPath $template -Destination $envLocal
    Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Created .env.local from $script:CustomerEnvTemplate"
}

function Get-ForgeOSDatabaseNameFromEnv {
    param([string] $RepoRoot)

    $envLocal = Join-Path $RepoRoot '.env.local'
    if (-not (Test-Path -LiteralPath $envLocal)) {
        return 'forgeos:jhgomes:local'
    }

    $serverName = $null
    $publicName = $null
    foreach ($line in Get-Content -LiteralPath $envLocal) {
        if ($line -match '^\s*FORGEOS_LOCAL_DB_NAME\s*=\s*(.+)\s*$') {
            $serverName = $Matches[1].Trim().Trim('"').Trim("'")
        }
        if ($line -match '^\s*NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME\s*=\s*(.+)\s*$') {
            $publicName = $Matches[1].Trim().Trim('"').Trim("'")
        }
    }

    return [pscustomobject]@{
        Server = $serverName
        Public = $publicName
        Stable = ($serverName -and $publicName -and ($serverName -eq $publicName))
    }
}

function Get-ForgeOSConfiguredUpdateBranch {
    param([string] $RepoRoot)

    $envLocal = Join-Path $RepoRoot '.env.local'
    if (Test-Path -LiteralPath $envLocal) {
        foreach ($line in Get-Content -LiteralPath $envLocal) {
            if ($line -match '^\s*FORGEOS_UPDATE_BRANCH\s*=\s*(.*)\s*$') {
                return $Matches[1].Trim().Trim('"').Trim("'")
            }
        }
    }

    $fromEnv = [Environment]::GetEnvironmentVariable('FORGEOS_UPDATE_BRANCH')
    if ($null -ne $fromEnv) {
        return $fromEnv.Trim()
    }

    $fromTemplate = Get-ForgeOSCustomerTemplateValue -RepoRoot $RepoRoot -Name 'FORGEOS_UPDATE_BRANCH'
    if ($null -ne $fromTemplate) {
        return $fromTemplate.Trim()
    }

    return $script:DefaultUpdateBranch
}

function Resolve-ForgeOSUpdateBranch {
    param(
        [string] $RepoRoot,
        [string] $OverrideBranch,
        [switch] $AllowBranchChange
    )

    if (-not [string]::IsNullOrWhiteSpace($OverrideBranch)) {
        $branch = $OverrideBranch.Trim()
    } else {
        $branch = Get-ForgeOSConfiguredUpdateBranch -RepoRoot $RepoRoot
    }

    if ([string]::IsNullOrWhiteSpace($branch)) {
        throw 'FORGEOS_UPDATE_BRANCH is blank. Set it in .env.local or pass -Branch explicitly.'
    }

    $lastBranchFile = Get-ForgeOSLastUpdateBranchFile -RepoRoot $RepoRoot
    $lastBranch = $null
    if (Test-Path -LiteralPath $lastBranchFile) {
        $lastBranch = (Get-Content -LiteralPath $lastBranchFile -Raw).Trim()
    }

    if ($lastBranch -and $lastBranch -ne $branch -and -not $AllowBranchChange) {
        throw "Configured update branch changed from '$lastBranch' to '$branch'. Re-run with -AllowBranchChange and type YES when prompted, or pass -Branch explicitly for development testing."
    }

    return [pscustomobject]@{
        Branch = $branch
        PreviousBranch = $lastBranch
        IsOverride = -not [string]::IsNullOrWhiteSpace($OverrideBranch)
    }
}

function Set-ForgeOSLastUpdateBranch {
    param(
        [string] $RepoRoot,
        [string] $Branch
    )

    $path = Get-ForgeOSLastUpdateBranchFile -RepoRoot $RepoRoot
    Set-Content -LiteralPath $path -Value $Branch.Trim() -Encoding UTF8
}

function Test-ForgeOSOutlookFlagsDisabled {
    param([string] $RepoRoot)

    $templatePath = Join-Path $RepoRoot $script:CustomerEnvTemplate
    if (-not (Test-Path -LiteralPath $templatePath)) {
        throw "$script:CustomerEnvTemplate missing"
    }

    $flags = @{}
    foreach ($line in Get-Content -LiteralPath $templatePath) {
        if ($line -match '^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$') {
            $flags[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'").ToLowerInvariant()
        }
    }

    $required = @{
        OUTLOOK_GRAPH_ENABLED = 'false'
        OUTLOOK_LIVE_SEND_ENABLED = 'false'
        OUTREACH_REAL_SEND_ENABLED = 'false'
        OUTREACH_TEST_SEND_ENABLED = 'false'
    }

    foreach ($name in $required.Keys) {
        if (-not $flags.ContainsKey($name)) {
            throw "$name missing from customer template"
        }
        if ($flags[$name] -ne $required[$name]) {
            throw "$name must be $($required[$name]) in customer template (found $($flags[$name]))"
        }
    }

    if ($flags.ContainsKey('OUTLOOK_LOCAL_SEND_ENABLED')) {
        throw 'OUTLOOK_LOCAL_SEND_ENABLED is deprecated; use OUTLOOK_GRAPH_ENABLED and OUTLOOK_LIVE_SEND_ENABLED instead.'
    }

    return $true
}

function Get-ForgeOSPortConnections {
    param([int] $Port = $script:ForgeOSPort)

    $connections = @()
    if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
        try {
            $connections = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
        } catch {
            $connections = @()
        }
    }

    if ($connections.Length -eq 0) {
        $netstat = @(& netstat -ano 2>$null)
        foreach ($line in $netstat) {
            if ($line -match "TCP\s+.*?:$Port\s+.*?:\d+\s+LISTENING\s+(\d+)") {
                $connections += [pscustomobject]@{ OwningProcess = [int]$Matches[1] }
            }
        }
    }

    return @($connections)
}

function Get-ForgeOSPortListenerPids {
    param([int] $Port = $script:ForgeOSPort)

    return @(Get-ForgeOSPortConnections -Port $Port | Select-Object -ExpandProperty OwningProcess -Unique)
}

function Get-ForgeOSPortOwnerDescription {
    param([int] $Port = $script:ForgeOSPort)

    $connections = @(Get-ForgeOSPortConnections -Port $Port)
    if ($connections.Length -eq 0) {
        return $null
    }

    $owners = @()
    foreach ($connection in @($connections | Select-Object -ExpandProperty OwningProcess -Unique)) {
        try {
            $process = Get-Process -Id $connection -ErrorAction Stop
            $owners += "$($process.ProcessName) (PID $connection)"
        } catch {
            $owners += "PID $connection"
        }
    }

    return ($owners -join '; ')
}

function Write-ForgeOSPortConflictDiagnostics {
    param(
        [string] $RepoRoot,
        [int] $Port = $script:ForgeOSPort,
        [string] $Reason
    )

    $owner = Get-ForgeOSPortOwnerDescription -Port $Port
    Write-ForgeOSLog -RepoRoot $RepoRoot -Message $Reason -Level error
    if ($owner) {
        Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Port $Port is in use by: $owner" -Level error
    } else {
        Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Port $Port appears occupied but the listener could not be identified." -Level error
    }

    Write-Host ''
    Write-Host 'Port conflict diagnostics:'
    Write-Host "  1. Run Stop-ForgeOS.ps1 to stop a verified ForgeOS server on port $Port."
    Write-Host '  2. If the conflict persists, inspect the listener with:'
    Write-Host "       netstat -ano | findstr :$Port"
    Write-Host '  3. Identify the process in Task Manager by PID. Do not terminate unrelated Node processes.'
    Write-Host '  4. Close the application using the port, or reboot if unsure.'
    Write-Host ''
}

function Get-ForgeOSWindowsProcessSnapshot {
    param([int] $ProcessId)

    try {
        $process = Get-Process -Id $ProcessId -ErrorAction Stop
    } catch {
        return $null
    }

    $cim = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
    $executable = if ($cim -and $cim.ExecutablePath) { $cim.ExecutablePath } else { $process.Path }
    $commandLine = if ($cim) { $cim.CommandLine } else { '' }
    $startTimeUtc = if ($cim -and $cim.CreationDate) {
        ConvertTo-ForgeOSUtcIso -Value $cim.CreationDate
    } elseif ($process.StartTime) {
        ConvertTo-ForgeOSUtcIso -Value $process.StartTime
    } else {
        $null
    }

    return [pscustomobject]@{
        ProcessId = $ProcessId
        Exists = $true
        ExecutablePath = $executable
        CommandLine = $commandLine
        StartTimeUtc = $startTimeUtc
    }
}

function Test-ForgeOSProcessIdentityCore {
    param(
        [pscustomobject] $Metadata,
        [pscustomobject] $Snapshot,
        [int[]] $PortListenerPids
    )

    $failures = @()

    if ($null -eq $Snapshot -or -not $Snapshot.Exists) {
        return [pscustomobject]@{
            Verified = $false
            SafeToRemoveMetadata = $true
            Reason = 'Process is not running.'
            Failures = @('process_missing')
        }
    }

    if ($Metadata.pid -ne $Snapshot.ProcessId) {
        $failures += 'pid_mismatch'
    }

    if ($Metadata.processStartTimeUtc -and $Snapshot.StartTimeUtc) {
        $expected = [datetime]::Parse($Metadata.processStartTimeUtc).ToUniversalTime()
        $actual = [datetime]::Parse($Snapshot.StartTimeUtc).ToUniversalTime()
        $delta = [math]::Abs(($actual - $expected).TotalSeconds)
        if ($delta -gt 2) {
            $failures += 'start_time_mismatch'
        }
    }

    $expectedExecutable = Normalize-ForgeOSPath -Path $Metadata.nodeExecutable
    $actualExecutable = Normalize-ForgeOSPath -Path $Snapshot.ExecutablePath
    if ($expectedExecutable -and $actualExecutable -and $expectedExecutable -ne $actualExecutable) {
        $failures += 'executable_mismatch'
    }

    $commandLine = if ($Snapshot.CommandLine) { $Snapshot.CommandLine } else { '' }
    $signature = if ($Metadata.commandLineSignature) { $Metadata.commandLineSignature } else { '' }
    if ($signature) {
        $nextPath = ''
        if ($signature -match '^"([^"]+)"') {
            $nextPath = $Matches[1]
        } elseif ($signature -match '^(\S+)') {
            $nextPath = $Matches[1]
        }

        $normalizedNext = Normalize-ForgeOSPath -Path $nextPath
        if ($normalizedNext -and ($commandLine.ToLowerInvariant() -notmatch [regex]::Escape($normalizedNext))) {
            $failures += 'next_cli_mismatch'
        }

        $expectedRepo = Normalize-ForgeOSPath -Path $Metadata.repositoryRoot
        if ($expectedRepo -and $normalizedNext -and ($normalizedNext -notlike "$expectedRepo*")) {
            $failures += 'repository_mismatch'
        }

        if ($signature -match '\s(dev|start)\s' -and $commandLine -notmatch '\b(dev|start)\b') {
            $failures += 'next_subcommand_mismatch'
        }
    }

    $expectedPort = [int]$Metadata.expectedPort
    if ($expectedPort -gt 0) {
        if ($PortListenerPids.Count -eq 0) {
            $failures += 'port_not_listening'
        } elseif ($PortListenerPids -notcontains $Metadata.pid) {
            $failures += 'port_owner_mismatch'
        }
    }

    if ($failures.Count -gt 0) {
        return [pscustomobject]@{
            Verified = $false
            SafeToRemoveMetadata = $false
            Reason = "Runtime metadata does not match the live process ($($failures -join ', '))."
            Failures = $failures
        }
    }

    return [pscustomobject]@{
        Verified = $true
        SafeToRemoveMetadata = $false
        Reason = 'ForgeOS process identity verified.'
        Failures = @()
    }
}

function Test-ForgeOSRuntimeProcessIdentity {
    param(
        [string] $RepoRoot,
        [pscustomobject] $Metadata
    )

    $snapshot = Get-ForgeOSWindowsProcessSnapshot -ProcessId ([int]$Metadata.pid)
    $portPids = @(Get-ForgeOSPortListenerPids -Port ([int]$Metadata.expectedPort))
    return Test-ForgeOSProcessIdentityCore -Metadata $Metadata -Snapshot $snapshot -PortListenerPids $portPids
}

function Read-ForgeOSRuntimeMetadata {
    param(
        [string] $RepoRoot,
        [ValidateSet('development', 'local-production')]
        [string] $Mode
    )

    $metadataFile = Get-ForgeOSRuntimeMetadataFile -RepoRoot $RepoRoot -Mode $Mode
    if (Test-Path -LiteralPath $metadataFile) {
        $raw = Get-Content -LiteralPath $metadataFile -Raw
        return ($raw | ConvertFrom-Json)
    }

    $legacyPidFile = Get-ForgeOSLegacyPidFile -RepoRoot $RepoRoot -Mode $Mode
    if (-not (Test-Path -LiteralPath $legacyPidFile)) {
        return $null
    }

    $legacyPid = (Get-Content -LiteralPath $legacyPidFile -Raw).Trim()
    if ($legacyPid -notmatch '^\d+$') {
        return $null
    }

    return [pscustomobject]@{
        version = 0
        pid = [int]$legacyPid
        mode = $Mode
        repositoryRoot = $RepoRoot
        nodeExecutable = ''
        commandLineSignature = ''
        expectedPort = $script:ForgeOSPort
        processStartTimeUtc = $null
        forgeosCommit = 'unknown'
        metadataCreatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
        legacyPidOnly = $true
    }
}

function Save-ForgeOSRuntimeMetadata {
    param(
        [string] $RepoRoot,
        [int] $ProcessId,
        [ValidateSet('development', 'local-production')]
        [string] $Mode,
        [string] $NodeExecutable,
        [string] $CommandLineSignature,
        [string] $ForgeOSCommit
    )

    $snapshot = Get-ForgeOSWindowsProcessSnapshot -ProcessId $ProcessId
    $metadata = [ordered]@{
        version = $script:RuntimeMetadataVersion
        pid = $ProcessId
        mode = $Mode
        repositoryRoot = (Get-ForgeOSRepoRoot -StartPath $RepoRoot)
        nodeExecutable = $NodeExecutable
        commandLineSignature = $CommandLineSignature
        expectedPort = $script:ForgeOSPort
        processStartTimeUtc = if ($snapshot) { $snapshot.StartTimeUtc } else { (Get-Date).ToUniversalTime().ToString('o') }
        forgeosCommit = $ForgeOSCommit
        metadataCreatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    }

    $metadataFile = Get-ForgeOSRuntimeMetadataFile -RepoRoot $RepoRoot -Mode $Mode
    ($metadata | ConvertTo-Json -Depth 4) | Set-Content -LiteralPath $metadataFile -Encoding UTF8

    $legacyPidFile = Get-ForgeOSLegacyPidFile -RepoRoot $RepoRoot -Mode $Mode
    if (Test-Path -LiteralPath $legacyPidFile) {
        Remove-Item -LiteralPath $legacyPidFile -Force
    }
}

function Remove-ForgeOSRuntimeMetadataFile {
    param(
        [string] $RepoRoot,
        [ValidateSet('development', 'local-production')]
        [string] $Mode
    )

    $metadataFile = Get-ForgeOSRuntimeMetadataFile -RepoRoot $RepoRoot -Mode $Mode
    if (Test-Path -LiteralPath $metadataFile) {
        Remove-Item -LiteralPath $metadataFile -Force
    }

    $legacyPidFile = Get-ForgeOSLegacyPidFile -RepoRoot $RepoRoot -Mode $Mode
    if (Test-Path -LiteralPath $legacyPidFile) {
        Remove-Item -LiteralPath $legacyPidFile -Force
    }
}

function Remove-ForgeOSStaleRuntimeMetadata {
    param(
        [string] $RepoRoot,
        [ValidateSet('development', 'local-production')]
        [string] $Mode
    )

    $metadata = Read-ForgeOSRuntimeMetadata -RepoRoot $RepoRoot -Mode $Mode
    if ($null -eq $metadata) {
        return
    }

    if ($metadata.PSObject.Properties.Name -contains 'legacyPidOnly' -and $metadata.legacyPidOnly) {
        $running = Test-ForgeOSProcessRunning -ProcessId ([int]$metadata.pid)
        if (-not $running) {
            Remove-ForgeOSRuntimeMetadataFile -RepoRoot $RepoRoot -Mode $Mode
            Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Removed legacy stale runtime metadata for $Mode (PID $($metadata.pid))." -Level warn
        }
        return
    }

    $identity = Test-ForgeOSRuntimeProcessIdentity -RepoRoot $RepoRoot -Metadata $metadata
    if (-not (Test-ForgeOSProcessRunning -ProcessId ([int]$metadata.pid)) -and $identity.SafeToRemoveMetadata) {
        Remove-ForgeOSRuntimeMetadataFile -RepoRoot $RepoRoot -Mode $Mode
        Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Removed stale runtime metadata for $Mode ($($identity.Reason))" -Level warn
    }
}

function Read-ForgeOSSavedPid {
    param(
        [string] $RepoRoot,
        [ValidateSet('development', 'local-production')]
        [string] $Mode
    )

    $metadata = Read-ForgeOSRuntimeMetadata -RepoRoot $RepoRoot -Mode $Mode
    if ($null -eq $metadata) {
        return $null
    }

    return [int]$metadata.pid
}

function Save-ForgeOSServerPid {
    param(
        [string] $RepoRoot,
        [int] $ProcessId,
        [ValidateSet('development', 'local-production')]
        [string] $Mode
    )

    throw 'Save-ForgeOSServerPid is deprecated. Use Save-ForgeOSRuntimeMetadata instead.'
}

function Remove-ForgeOSStalePidFile {
    param(
        [string] $RepoRoot,
        [ValidateSet('development', 'local-production')]
        [string] $Mode
    )

    Remove-ForgeOSStaleRuntimeMetadata -RepoRoot $RepoRoot -Mode $Mode
}

function Test-ForgeOSProcessRunning {
    param([int] $ProcessId)

    try {
        $process = Get-Process -Id $ProcessId -ErrorAction Stop
        return $null -ne $process -and -not $process.HasExited
    } catch {
        return $false
    }
}

function Assert-ForgeOSPortAvailable {
    param(
        [string] $RepoRoot,
        [int] $Port = $script:ForgeOSPort,
        [switch] $AllowOwnedByForgeOS
    )

    $verifiedPid = $null
    if ($AllowOwnedByForgeOS) {
        foreach ($mode in @('development', 'local-production')) {
            $metadata = Read-ForgeOSRuntimeMetadata -RepoRoot $RepoRoot -Mode $mode
            if ($null -eq $metadata) {
                continue
            }

            $identity = Test-ForgeOSRuntimeProcessIdentity -RepoRoot $RepoRoot -Metadata $metadata
            if ($identity.Verified) {
                $verifiedPid = [int]$metadata.pid
                break
            }
        }
    }

    $owner = Get-ForgeOSPortOwnerDescription -Port $Port
    if ($null -eq $owner) {
        return
    }

    if ($AllowOwnedByForgeOS -and $verifiedPid) {
        $pids = @(Get-ForgeOSPortListenerPids -Port $Port)
        if ($pids.Length -eq 1 -and $pids[0] -eq $verifiedPid) {
            return
        }
    }

    Write-ForgeOSPortConflictDiagnostics -RepoRoot $RepoRoot -Port $Port -Reason "Port $Port is already in use."
    throw "Port $Port is already in use by: $owner. Stop that process or run Stop-ForgeOS.ps1 before starting ForgeOS."
}

function Wait-ForgeOSHealth {
    param(
        [string] $RepoRoot,
        [int] $TimeoutSeconds = 120,
        [int] $IntervalSeconds = 2
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $lastError = $null

    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $script:ForgeOSHealthUrl -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                Write-ForgeOSLog -RepoRoot $RepoRoot -Message 'Health check passed.'
                return $response.Content
            }
        } catch {
            $lastError = $_.Exception.Message
        }

        Start-Sleep -Seconds $IntervalSeconds
    }

    throw "ForgeOS did not become ready at $script:ForgeOSHealthUrl within ${TimeoutSeconds}s. Last error: $lastError"
}

function Open-ForgeOSBrowser {
    param([string] $RepoRoot)

    Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Opening $script:ForgeOSUrl"
    Start-Process $script:ForgeOSUrl | Out-Null
}

function Invoke-ForgeOSHealthRequest {
    try {
        $response = Invoke-WebRequest -Uri $script:ForgeOSHealthUrl -UseBasicParsing -TimeoutSec 5
        return [pscustomobject]@{
            Ok = $true
            StatusCode = $response.StatusCode
            Body = $response.Content
        }
    } catch {
        return [pscustomobject]@{
            Ok = $false
            StatusCode = 0
            Body = $_.Exception.Message
        }
    }
}

function Get-ForgeOSGitCommit {
    param([string] $RepoRoot)

    Push-Location $RepoRoot
    try {
        $commit = (& git rev-parse --short HEAD 2>$null)
        if ($LASTEXITCODE -ne 0) {
            return 'unknown'
        }
        return $commit.Trim()
    } finally {
        Pop-Location
    }
}

function Read-ForgeOSBuildManifest {
    param([string] $RepoRoot)

    $path = Get-ForgeOSBuildManifestFile -RepoRoot $RepoRoot
    if (-not (Test-Path -LiteralPath $path)) {
        return $null
    }

    return (Get-Content -LiteralPath $path -Raw | ConvertFrom-Json)
}

function Write-ForgeOSBuildManifest {
    param(
        [string] $RepoRoot,
        [string] $Commit
    )

    $manifest = [ordered]@{
        commit = $Commit
        builtAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    }

    $path = Get-ForgeOSBuildManifestFile -RepoRoot $RepoRoot
    ($manifest | ConvertTo-Json -Depth 3) | Set-Content -LiteralPath $path -Encoding UTF8
}

function Test-ForgeOSProductionBuildCurrent {
    param([string] $RepoRoot)

    $nextDir = Join-Path $RepoRoot '.next'
    if (-not (Test-Path -LiteralPath $nextDir)) {
        return [pscustomobject]@{ Current = $false; Reason = 'missing_next_directory' }
    }

    $manifest = Read-ForgeOSBuildManifest -RepoRoot $RepoRoot
    $commit = Get-ForgeOSGitCommit -RepoRoot $RepoRoot
    if ($null -eq $manifest -or [string]::IsNullOrWhiteSpace($manifest.commit)) {
        return [pscustomobject]@{ Current = $false; Reason = 'missing_build_manifest' }
    }

    if ($manifest.commit -ne $commit) {
        return [pscustomobject]@{ Current = $false; Reason = 'stale_commit' }
    }

    return [pscustomobject]@{ Current = $true; Reason = 'current' }
}

function Invoke-ForgeOSProductionBuild {
    param([string] $RepoRoot)

    Write-ForgeOSLog -RepoRoot $RepoRoot -Message 'Running production build (npm run build)...'
    Push-Location $RepoRoot
    try {
        & npm run build 2>&1 | ForEach-Object { Write-ForgeOSLog -RepoRoot $RepoRoot -Message $_ }
        if ($LASTEXITCODE -ne 0) {
            throw 'npm run build failed. See logs under .customer-pc/logs.'
        }
    } finally {
        Pop-Location
    }

    $commit = Get-ForgeOSGitCommit -RepoRoot $RepoRoot
    Write-ForgeOSBuildManifest -RepoRoot $RepoRoot -Commit $commit
    Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Production build complete for commit $commit."
}

function Ensure-ForgeOSProductionBuild {
    param(
        [string] $RepoRoot,
        [switch] $Rebuild
    )

    if ($Rebuild) {
        Write-ForgeOSLog -RepoRoot $RepoRoot -Message 'Rebuild requested explicitly (-Rebuild).'
        Invoke-ForgeOSProductionBuild -RepoRoot $RepoRoot
        return
    }

    $status = Test-ForgeOSProductionBuildCurrent -RepoRoot $RepoRoot
    if ($status.Current) {
        Write-ForgeOSLog -RepoRoot $RepoRoot -Message 'Reusing existing production build for current commit.'
        return
    }

    switch ($status.Reason) {
        'missing_next_directory' {
            Write-ForgeOSLog -RepoRoot $RepoRoot -Message 'No .next directory found; running first production build.' -Level warn
        }
        'missing_build_manifest' {
            Write-ForgeOSLog -RepoRoot $RepoRoot -Message 'Build manifest missing; rebuilding to record current commit.' -Level warn
        }
        'stale_commit' {
            Write-ForgeOSLog -RepoRoot $RepoRoot -Message 'Production build is stale for current commit; rebuilding.' -Level warn
        }
        default {
            Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Production build not current ($($status.Reason)); rebuilding." -Level warn
        }
    }

    Invoke-ForgeOSProductionBuild -RepoRoot $RepoRoot
}

function Stop-ForgeOSServer {
    param(
        [string] $RepoRoot,
        [switch] $AllModes
    )

    $modes = if ($AllModes) { @('development', 'local-production') } else { @('local-production', 'development') }
    $stopped = $false

    foreach ($mode in $modes) {
        Remove-ForgeOSStaleRuntimeMetadata -RepoRoot $RepoRoot -Mode $mode
        $metadata = Read-ForgeOSRuntimeMetadata -RepoRoot $RepoRoot -Mode $mode
        if ($null -eq $metadata) {
            continue
        }

        $identity = Test-ForgeOSRuntimeProcessIdentity -RepoRoot $RepoRoot -Metadata $metadata
        if (-not (Test-ForgeOSProcessRunning -ProcessId ([int]$metadata.pid))) {
            if ($identity.SafeToRemoveMetadata) {
                Remove-ForgeOSRuntimeMetadataFile -RepoRoot $RepoRoot -Mode $mode
            }
            continue
        }

        if (-not $identity.Verified) {
            Write-ForgeOSPortConflictDiagnostics -RepoRoot $RepoRoot -Port ([int]$metadata.expectedPort) -Reason "Refusing to stop PID $($metadata.pid) for ${mode}: $($identity.Reason)"
            throw "Runtime metadata for $mode is stale or unsafe. $($identity.Reason) ForgeOS was not stopped."
        }

        Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Stopping verified ForgeOS $mode server (PID $($metadata.pid))."
        Stop-Process -Id ([int]$metadata.pid) -ErrorAction Stop
        $stopped = $true
        Remove-ForgeOSRuntimeMetadataFile -RepoRoot $RepoRoot -Mode $mode
    }

    if (-not $stopped) {
        Write-ForgeOSLog -RepoRoot $RepoRoot -Message 'No verified running ForgeOS server found.' -Level warn
    }

    return $stopped
}

function Get-ForgeOSNextCli {
    param([string] $RepoRoot)

    $nextBin = Join-Path $RepoRoot 'node_modules\next\dist\bin\next'
    if (-not (Test-Path -LiteralPath $nextBin)) {
        throw 'Next.js CLI not found. Run Setup-ForgeOS.ps1 first.'
    }

    return $nextBin
}

function Start-ForgeOSServerProcess {
    param(
        [string] $RepoRoot,
        [ValidateSet('development', 'local-production')]
        [string] $Mode,
        [switch] $Rebuild
    )

    Remove-ForgeOSStaleRuntimeMetadata -RepoRoot $RepoRoot -Mode $Mode
    $existing = Read-ForgeOSRuntimeMetadata -RepoRoot $RepoRoot -Mode $Mode
    if ($null -ne $existing) {
        $identity = Test-ForgeOSRuntimeProcessIdentity -RepoRoot $RepoRoot -Metadata $existing
        if ($identity.Verified) {
            throw "ForgeOS $Mode already appears to be running (PID $($existing.pid)). Run Stop-ForgeOS.ps1 first."
        }

        if (-not $identity.SafeToRemoveMetadata) {
            throw "ForgeOS $Mode runtime metadata is unsafe ($($identity.Reason)). Resolve the port conflict before starting again."
        }

        Remove-ForgeOSRuntimeMetadataFile -RepoRoot $RepoRoot -Mode $Mode
    }

    Clear-ForgeOSOrphanPortOwner -RepoRoot $RepoRoot | Out-Null
    Assert-ForgeOSPortAvailable -RepoRoot $RepoRoot

    if ($Mode -eq 'local-production') {
        Ensure-ForgeOSProductionBuild -RepoRoot $RepoRoot -Rebuild:$Rebuild
    }

    $commit = Get-ForgeOSGitCommit -RepoRoot $RepoRoot
    $stdoutLog = Get-ForgeOSLogFile -RepoRoot $RepoRoot -Name "$Mode.stdout.log"
    $stderrLog = Get-ForgeOSLogFile -RepoRoot $RepoRoot -Name "$Mode.stderr.log"

    $nodeCmd = (Get-Command node -ErrorAction Stop).Source
    $nextCli = Get-ForgeOSNextCli -RepoRoot $RepoRoot

    $env:FORGEOS_RUNTIME_MODE = $Mode
    $env:FORGEOS_GIT_COMMIT = $commit
    $env:HOSTNAME = $script:ForgeOSHost
    $env:PORT = "$script:ForgeOSPort"

    $subcommand = if ($Mode -eq 'development') { 'dev' } else { 'start' }
    $argumentString = "`"$nextCli`" $subcommand -H $script:ForgeOSHost -p $script:ForgeOSPort"
    $commandLineSignature = "`"$nextCli`" $subcommand -H $script:ForgeOSHost -p $script:ForgeOSPort"

    Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Starting ForgeOS in $Mode mode on $script:ForgeOSUrl"
    $process = Start-Process -FilePath $nodeCmd -ArgumentList $argumentString -WorkingDirectory $RepoRoot -PassThru -WindowStyle Normal -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog
    Save-ForgeOSRuntimeMetadata -RepoRoot $RepoRoot -ProcessId $process.Id -Mode $Mode -NodeExecutable $nodeCmd -CommandLineSignature $commandLineSignature -ForgeOSCommit $commit
    Write-ForgeOSLog -RepoRoot $RepoRoot -Message "ForgeOS $Mode started with PID $($process.Id)."

    return $process
}

function Test-ForgeOSCommandLineIsRepoServer {
    param(
        [string] $RepoRoot,
        [pscustomobject] $Snapshot,
        [ValidateSet('development', 'local-production')]
        [string] $Mode
    )

    if ($null -eq $Snapshot -or -not $Snapshot.Exists) {
        return $false
    }

    $repoMarker = Normalize-ForgeOSPath -Path $RepoRoot
    $commandLine = if ($Snapshot.CommandLine) { $Snapshot.CommandLine.ToLowerInvariant() } else { '' }
    $touchesRepoNext = ($commandLine -match [regex]::Escape($repoMarker)) -and ($commandLine -match 'node_modules') -and ($commandLine -match 'next')

    if (-not $touchesRepoNext) {
        return $false
    }

    if ($Mode -eq 'development') {
        return $commandLine -match 'next(\.cmd)?["\s].*\bdev\b'
    }

    return ($commandLine -match 'next(\.cmd)?["\s].*\bstart\b') -or ($commandLine -match 'start-server\.js')
}

function Resolve-ForgeOSRepoDevStopPid {
    param(
        [string] $RepoRoot,
        [int] $ProcessId
    )

    $snapshot = Get-ForgeOSWindowsProcessSnapshot -ProcessId $ProcessId
    if ($null -eq $snapshot) {
        return $null
    }

    if (Test-ForgeOSCommandLineIsRepoServer -RepoRoot $RepoRoot -Snapshot $snapshot -Mode 'development') {
        return $ProcessId
    }

    $commandLine = if ($snapshot.CommandLine) { $snapshot.CommandLine.ToLowerInvariant() } else { '' }
    $repoMarker = Normalize-ForgeOSPath -Path $RepoRoot
    $needsParentWalk = [string]::IsNullOrWhiteSpace($commandLine) -or (
        $commandLine -match [regex]::Escape($repoMarker) -and $commandLine -match 'start-server\.js'
    )

    if ($needsParentWalk) {
        $currentPid = $ProcessId
        for ($depth = 0; $depth -lt 4; $depth++) {
            $cim = Get-CimInstance Win32_Process -Filter "ProcessId = $currentPid" -ErrorAction SilentlyContinue
            if ($null -eq $cim -or $cim.ParentProcessId -le 0) {
                break
            }

            $parentSnapshot = Get-ForgeOSWindowsProcessSnapshot -ProcessId $cim.ParentProcessId
            if (Test-ForgeOSCommandLineIsRepoServer -RepoRoot $RepoRoot -Snapshot $parentSnapshot -Mode 'development') {
                return $cim.ParentProcessId
            }

            $currentPid = $cim.ParentProcessId
        }
    }

    return $null
}

function Read-ForgeOSNextDevLock {
    param([string] $RepoRoot)

    $lockPath = Join-Path $RepoRoot '.next\dev\lock'
    if (-not (Test-Path -LiteralPath $lockPath)) {
        return $null
    }

    try {
        return (Get-Content -LiteralPath $lockPath -Raw | ConvertFrom-Json)
    } catch {
        return $null
    }
}

function Remove-ForgeOSStaleNextDevLock {
    param([string] $RepoRoot)

    $lock = Read-ForgeOSNextDevLock -RepoRoot $RepoRoot
    if ($null -eq $lock -or -not $lock.pid) {
        return $false
    }

    $lockPid = [int]$lock.pid
    if (Test-ForgeOSProcessRunning -ProcessId $lockPid) {
        return $false
    }

    $lockPath = Join-Path $RepoRoot '.next\dev\lock'
    Remove-Item -LiteralPath $lockPath -Force
    Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Removed stale Next.js dev lock for PID $lockPid." -Level warn
    return $true
}

function Get-ForgeOSVerifiedRepoDevStopPids {
    param([string] $RepoRoot)

    $stopPids = New-Object 'System.Collections.Generic.HashSet[int]'

    Remove-ForgeOSStaleNextDevLock -RepoRoot $RepoRoot | Out-Null

    $lock = Read-ForgeOSNextDevLock -RepoRoot $RepoRoot
    if ($null -ne $lock -and $lock.pid) {
        $lockPid = [int]$lock.pid
        if (Test-ForgeOSProcessRunning -ProcessId $lockPid) {
            $stopPid = Resolve-ForgeOSRepoDevStopPid -RepoRoot $RepoRoot -ProcessId $lockPid
            if ($null -ne $stopPid) {
                [void]$stopPids.Add($stopPid)
            } else {
                throw "Refusing to stop Next.js dev lock holder PID $lockPid. ForgeOS process identity could not be verified."
            }
        }
    }

    Remove-ForgeOSStaleRuntimeMetadata -RepoRoot $RepoRoot -Mode 'development'
    $metadata = Read-ForgeOSRuntimeMetadata -RepoRoot $RepoRoot -Mode 'development'
    if ($null -ne $metadata) {
        if (Test-ForgeOSProcessRunning -ProcessId ([int]$metadata.pid)) {
            $identity = Test-ForgeOSRuntimeProcessIdentity -RepoRoot $RepoRoot -Metadata $metadata
            if ($identity.Verified) {
                [void]$stopPids.Add([int]$metadata.pid)
            } elseif (-not $identity.SafeToRemoveMetadata) {
                throw "Refusing to stop development server PID $($metadata.pid): $($identity.Reason)"
            }
        }
    }

    $processes = @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue)
    foreach ($process in $processes) {
        $stopPid = Resolve-ForgeOSRepoDevStopPid -RepoRoot $RepoRoot -ProcessId $process.ProcessId
        if ($null -ne $stopPid) {
            [void]$stopPids.Add($stopPid)
        }
    }

    foreach ($listenerPid in @(Get-ForgeOSPortListenerPids -Port $ForgeOSPort)) {
        $stopPid = Resolve-ForgeOSRepoDevStopPid -RepoRoot $RepoRoot -ProcessId $listenerPid
        if ($null -ne $stopPid) {
            [void]$stopPids.Add($stopPid)
        }
    }

    return @($stopPids)
}

function Resolve-ForgeOSWorktreeDevLock {
    param([string] $RepoRoot)

    $stopPids = @(Get-ForgeOSVerifiedRepoDevStopPids -RepoRoot $RepoRoot)
    if ($stopPids.Count -eq 0) {
        Write-Host 'No verified ForgeOS dev server holds this worktree Next.js development lock.'
        return [pscustomobject]@{
            Freed = $false
            Action = 'no_dev_lock_owner'
            ProcessIds = @()
        }
    }

    Write-Host ''
    Write-Host 'Note: A free Playwright test port is not sufficient when this worktree already holds a Next.js development lock (.next/dev/lock).'
    Write-Host 'Stopping verified ForgeOS dev server(s) from this repository before tests.'
    Write-Host ''

    foreach ($stopPid in $stopPids) {
        Write-Host "Stopping verified ForgeOS dev server (PID $stopPid)."
        Stop-Process -Id $stopPid -ErrorAction Stop
    }

    Start-Sleep -Seconds 2
    return [pscustomobject]@{
        Freed = $true
        Action = 'stopped_dev_server'
        ProcessIds = $stopPids
    }
}

function Prepare-ForgeOSPlaywrightWorktree {
    param([string] $RepoRoot)

    $devResult = Resolve-ForgeOSWorktreeDevLock -RepoRoot $RepoRoot
    $portResult = Resolve-ForgeOSE2EPortConflict -RepoRoot $RepoRoot -Port $ForgeOSE2EPort

    return [pscustomobject]@{
        DevLock = $devResult
        E2ePort = $portResult
    }
}

function Clear-ForgeOSOrphanPortOwner {
    param(
        [string] $RepoRoot,
        [int] $Port = $script:ForgeOSPort
    )

    $cleared = $false
    foreach ($listenerPid in @(Get-ForgeOSPortListenerPids -Port $Port)) {
        $stopPid = Resolve-ForgeOSRepoDevStopPid -RepoRoot $RepoRoot -ProcessId $listenerPid
        if ($null -eq $stopPid) {
            $snapshot = Get-ForgeOSWindowsProcessSnapshot -ProcessId $listenerPid
            if (Test-ForgeOSCommandLineIsRepoServer -RepoRoot $RepoRoot -Snapshot $snapshot -Mode 'local-production') {
                $stopPid = $listenerPid
            }
        }

        if ($null -eq $stopPid) {
            continue
        }

        Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Stopping orphaned ForgeOS listener on port $Port (PID $stopPid)." -Level warn
        Stop-Process -Id $stopPid -ErrorAction Stop
        $cleared = $true
    }

    if ($cleared) {
        Start-Sleep -Seconds 2
    }

    return $cleared
}

function Resolve-ForgeOSE2EPortConflict {
    param(
        [string] $RepoRoot,
        [int] $Port = $script:ForgeOSE2EPort
    )

    $listenerPids = @(Get-ForgeOSPortListenerPids -Port $Port)
    if ($listenerPids.Count -eq 0) {
        return [pscustomobject]@{ Freed = $false; Action = 'port_free' }
    }

    foreach ($listenerPid in $listenerPids) {
        $stopPid = Resolve-ForgeOSRepoDevStopPid -RepoRoot $RepoRoot -ProcessId $listenerPid
        if ($null -eq $stopPid) {
            $snapshot = Get-ForgeOSWindowsProcessSnapshot -ProcessId $listenerPid
            if ($null -eq $snapshot) {
                continue
            }

            $commandLine = if ($snapshot.CommandLine) { $snapshot.CommandLine.ToLowerInvariant() } else { '' }
            $repoMarker = Normalize-ForgeOSPath -Path $RepoRoot
            $isForgeOSE2E = $commandLine -match [regex]::Escape($repoMarker) -and $commandLine -match 'node_modules' -and $commandLine -match 'next' -and ($commandLine -match '\bdev\b' -or $commandLine -match 'start-server')
            if (-not $isForgeOSE2E) {
                $owner = Get-ForgeOSPortOwnerDescription -Port $Port
                throw "E2E port $Port is in use by an unrelated process ($owner). Close that application or choose another port. ForgeOS will not terminate unrelated processes."
            }

            $stopPid = $listenerPid
        }

        Write-Host "Stopping prior ForgeOS E2E dev server on port $Port (PID $stopPid)."
        Stop-Process -Id $stopPid -Force -ErrorAction Stop
        Start-Sleep -Seconds 2
        return [pscustomobject]@{ Freed = $true; Action = 'stopped_e2e_server'; ProcessId = $stopPid }
    }

    throw "E2E port $Port is occupied but could not be resolved safely."
}

Export-ModuleMember -Function @(
    'Normalize-ForgeOSPath',
    'Get-ForgeOSRepoRoot',
    'Get-ForgeOSRuntimeDir',
    'Get-ForgeOSLogsDir',
    'Get-ForgeOSPidDir',
    'Get-ForgeOSRuntimeMetadataFile',
    'Get-ForgeOSLegacyPidFile',
    'Get-ForgeOSPidFile',
    'Get-ForgeOSBuildManifestFile',
    'Get-ForgeOSLastUpdateBranchFile',
    'Get-ForgeOSLogFile',
    'Redact-ForgeOSText',
    'Write-ForgeOSLog',
    'Test-ForgeOSCommand',
    'Get-ForgeOSNodeVersion',
    'Assert-ForgeOSNode',
    'Assert-ForgeOSRequiredFiles',
    'Ensure-ForgeOSLocalDirectories',
    'Get-ForgeOSEnvValue',
    'Get-ForgeOSCustomerTemplateValue',
    'Initialize-ForgeOSEnvLocal',
    'Get-ForgeOSDatabaseNameFromEnv',
    'Get-ForgeOSConfiguredUpdateBranch',
    'Resolve-ForgeOSUpdateBranch',
    'Set-ForgeOSLastUpdateBranch',
    'Test-ForgeOSOutlookFlagsDisabled',
    'Get-ForgeOSPortConnections',
    'Get-ForgeOSPortListenerPids',
    'Get-ForgeOSPortOwnerDescription',
    'Write-ForgeOSPortConflictDiagnostics',
    'Get-ForgeOSWindowsProcessSnapshot',
    'Test-ForgeOSProcessIdentityCore',
    'Test-ForgeOSRuntimeProcessIdentity',
    'Read-ForgeOSRuntimeMetadata',
    'Save-ForgeOSRuntimeMetadata',
    'Remove-ForgeOSRuntimeMetadataFile',
    'Remove-ForgeOSStaleRuntimeMetadata',
    'Read-ForgeOSSavedPid',
    'Save-ForgeOSServerPid',
    'Remove-ForgeOSStalePidFile',
    'Test-ForgeOSProcessRunning',
    'Assert-ForgeOSPortAvailable',
    'Wait-ForgeOSHealth',
    'Open-ForgeOSBrowser',
    'Invoke-ForgeOSHealthRequest',
    'Get-ForgeOSGitCommit',
    'Read-ForgeOSBuildManifest',
    'Write-ForgeOSBuildManifest',
    'Test-ForgeOSProductionBuildCurrent',
    'Invoke-ForgeOSProductionBuild',
    'Ensure-ForgeOSProductionBuild',
    'Stop-ForgeOSServer',
    'Get-ForgeOSNextCli',
    'Start-ForgeOSServerProcess',
    'Clear-ForgeOSOrphanPortOwner',
    'Test-ForgeOSCommandLineIsRepoServer',
    'Resolve-ForgeOSRepoDevStopPid',
    'Read-ForgeOSNextDevLock',
    'Remove-ForgeOSStaleNextDevLock',
    'Get-ForgeOSVerifiedRepoDevStopPids',
    'Resolve-ForgeOSWorktreeDevLock',
    'Prepare-ForgeOSPlaywrightWorktree',
    'Resolve-ForgeOSE2EPortConflict'
) -Variable @(
    'ForgeOSPort',
    'ForgeOSHost',
    'ForgeOSUrl',
    'ForgeOSHealthPath',
    'ForgeOSHealthUrl',
    'ForgeOSE2EPort',
    'MinimumNodeMajor',
    'SupportedNodeMajors',
    'RuntimeSubdir',
    'LogsSubdir',
    'PidSubdir',
    'CustomerEnvTemplate',
    'DefaultUpdateBranch',
    'RequiredRepoFiles'
)
