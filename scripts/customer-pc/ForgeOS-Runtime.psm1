# ForgeOS customer PC local runtime helpers.
# Import: Import-Module (Join-Path $PSScriptRoot 'ForgeOS-Runtime.psm1') -Force

Set-StrictMode -Version Latest

$script:ForgeOSPort = 3000
$script:ForgeOSHost = 'localhost'
$script:ForgeOSUrl = 'http://localhost:3000'
$script:ForgeOSHealthPath = '/api/health/local'
$script:ForgeOSHealthUrl = 'http://localhost:3000/api/health/local'
$script:SupportedNodeMajors = @(20, 22)
$script:MinimumNodeMajor = 20
$script:RuntimeSubdir = '.customer-pc'
$script:LogsSubdir = '.customer-pc/logs'
$script:PidSubdir = '.customer-pc/runtime'
$script:CustomerEnvTemplate = '.env.customer.local.example'
$script:RequiredRepoFiles = @(
    'package.json',
    'package-lock.json',
    'next.config.ts',
    'AGENTS.md',
    $script:CustomerEnvTemplate
)

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

function Get-ForgeOSPidFile {
    param(
        [string] $RepoRoot,
        [ValidateSet('development', 'local-production')]
        [string] $Mode
    )

    Join-Path (Get-ForgeOSPidDir -RepoRoot $RepoRoot) "forgeos-$Mode.pid"
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

function Assert-ForgeOSPortAvailable {
    param(
        [string] $RepoRoot,
        [int] $Port = $script:ForgeOSPort,
        [switch] $AllowOwnedByForgeOS
    )

    $savedPid = $null
    if ($AllowOwnedByForgeOS) {
        foreach ($mode in @('development', 'local-production')) {
            $pidFile = Get-ForgeOSPidFile -RepoRoot $RepoRoot -Mode $mode
            if (Test-Path -LiteralPath $pidFile) {
                $candidate = [int](Get-Content -LiteralPath $pidFile -Raw).Trim()
                if ($candidate -gt 0) {
                    $savedPid = $candidate
                    break
                }
            }
        }
    }

    $owner = Get-ForgeOSPortOwnerDescription -Port $Port
    if ($null -eq $owner) {
        return
    }

    if ($AllowOwnedByForgeOS -and $savedPid) {
        $connections = @(Get-ForgeOSPortConnections -Port $Port)
        $pids = @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
        if ($pids.Length -eq 1 -and $pids[0] -eq $savedPid) {
            return
        }
    }

    throw "Port $Port is already in use by: $owner. Stop that process or run Stop-ForgeOS.ps1 before starting ForgeOS."
}

function Read-ForgeOSSavedPid {
    param(
        [string] $RepoRoot,
        [ValidateSet('development', 'local-production')]
        [string] $Mode
    )

    $pidFile = Get-ForgeOSPidFile -RepoRoot $RepoRoot -Mode $Mode
    if (-not (Test-Path -LiteralPath $pidFile)) {
        return $null
    }

    $raw = (Get-Content -LiteralPath $pidFile -Raw).Trim()
    if ($raw -match '^\d+$') {
        return [int]$raw
    }

    return $null
}

function Save-ForgeOSServerPid {
    param(
        [string] $RepoRoot,
        [int] $ProcessId,
        [ValidateSet('development', 'local-production')]
        [string] $Mode
    )

    $pidFile = Get-ForgeOSPidFile -RepoRoot $RepoRoot -Mode $Mode
    Set-Content -LiteralPath $pidFile -Value $ProcessId -Encoding ASCII -NoNewline
}

function Remove-ForgeOSStalePidFile {
    param(
        [string] $RepoRoot,
        [ValidateSet('development', 'local-production')]
        [string] $Mode
    )

    $pidFile = Get-ForgeOSPidFile -RepoRoot $RepoRoot -Mode $Mode
    if (-not (Test-Path -LiteralPath $pidFile)) {
        return
    }

    $pid = Read-ForgeOSSavedPid -RepoRoot $RepoRoot -Mode $Mode
    if ($null -eq $pid) {
        Remove-Item -LiteralPath $pidFile -Force
        return
    }

    $running = $false
    try {
        $process = Get-Process -Id $pid -ErrorAction Stop
        $running = $null -ne $process
    } catch {
        $running = $false
    }

    if (-not $running) {
        Remove-Item -LiteralPath $pidFile -Force
        Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Removed stale PID file for $Mode (PID $pid)." -Level warn
    }
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

function Stop-ForgeOSServer {
    param(
        [string] $RepoRoot,
        [switch] $AllModes
    )

    $modes = if ($AllModes) { @('development', 'local-production') } else { @('local-production', 'development') }
    $stopped = $false

    foreach ($mode in $modes) {
        Remove-ForgeOSStalePidFile -RepoRoot $RepoRoot -Mode $mode
        $pid = Read-ForgeOSSavedPid -RepoRoot $RepoRoot -Mode $mode
        if ($null -eq $pid) {
            continue
        }

        if (Test-ForgeOSProcessRunning -ProcessId $pid) {
            Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Stopping ForgeOS $mode server (PID $pid)."
            Stop-Process -Id $pid -ErrorAction Stop
            $stopped = $true
        }

        Remove-Item -LiteralPath (Get-ForgeOSPidFile -RepoRoot $RepoRoot -Mode $mode) -Force -ErrorAction SilentlyContinue
    }

    if (-not $stopped) {
        Write-ForgeOSLog -RepoRoot $RepoRoot -Message 'No running ForgeOS server PID found.' -Level warn
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
        [string] $Mode
    )

    Remove-ForgeOSStalePidFile -RepoRoot $RepoRoot -Mode $Mode
    $existingPid = Read-ForgeOSSavedPid -RepoRoot $RepoRoot -Mode $Mode
    if ($null -ne $existingPid -and (Test-ForgeOSProcessRunning -ProcessId $existingPid)) {
        throw "ForgeOS $Mode already appears to be running (PID $existingPid). Run Stop-ForgeOS.ps1 first."
    }

    Assert-ForgeOSPortAvailable -RepoRoot $RepoRoot

    $commit = Get-ForgeOSGitCommit -RepoRoot $RepoRoot
    $stdoutLog = Get-ForgeOSLogFile -RepoRoot $RepoRoot -Name "$Mode.stdout.log"
    $stderrLog = Get-ForgeOSLogFile -RepoRoot $RepoRoot -Name "$Mode.stderr.log"

    $nodeCmd = (Get-Command node -ErrorAction Stop).Source
    $nextCli = Get-ForgeOSNextCli -RepoRoot $RepoRoot

    $env:FORGEOS_RUNTIME_MODE = $Mode
    $env:FORGEOS_GIT_COMMIT = $commit
    $env:HOSTNAME = $script:ForgeOSHost
    $env:PORT = "$script:ForgeOSPort"

    if ($Mode -eq 'local-production') {
        Write-ForgeOSLog -RepoRoot $RepoRoot -Message 'Running production build validation (npm run build)...'
        Push-Location $RepoRoot
        try {
            & npm run build 2>&1 | ForEach-Object { Write-ForgeOSLog -RepoRoot $RepoRoot -Message $_ }
            if ($LASTEXITCODE -ne 0) {
                throw 'npm run build failed. See logs under .customer-pc/logs.'
            }
        } finally {
            Pop-Location
        }
    }

    $subcommand = if ($Mode -eq 'development') { 'dev' } else { 'start' }
    $argumentString = "`"$nextCli`" $subcommand -H $script:ForgeOSHost -p $script:ForgeOSPort"

    Write-ForgeOSLog -RepoRoot $RepoRoot -Message "Starting ForgeOS in $Mode mode on $script:ForgeOSUrl"
    $process = Start-Process -FilePath $nodeCmd -ArgumentList $argumentString -WorkingDirectory $RepoRoot -PassThru -WindowStyle Normal -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog
    Save-ForgeOSServerPid -RepoRoot $RepoRoot -ProcessId $process.Id -Mode $Mode
    Write-ForgeOSLog -RepoRoot $RepoRoot -Message "ForgeOS $Mode started with PID $($process.Id)."

    return $process
}

Export-ModuleMember -Function @(
    'Get-ForgeOSRepoRoot',
    'Get-ForgeOSRuntimeDir',
    'Get-ForgeOSLogsDir',
    'Get-ForgeOSPidDir',
    'Get-ForgeOSPidFile',
    'Get-ForgeOSLogFile',
    'Redact-ForgeOSText',
    'Write-ForgeOSLog',
    'Test-ForgeOSCommand',
    'Get-ForgeOSNodeVersion',
    'Assert-ForgeOSNode',
    'Assert-ForgeOSRequiredFiles',
    'Ensure-ForgeOSLocalDirectories',
    'Initialize-ForgeOSEnvLocal',
    'Get-ForgeOSDatabaseNameFromEnv',
    'Get-ForgeOSPortConnections',
    'Get-ForgeOSPortOwnerDescription',
    'Assert-ForgeOSPortAvailable',
    'Read-ForgeOSSavedPid',
    'Save-ForgeOSServerPid',
    'Remove-ForgeOSStalePidFile',
    'Test-ForgeOSProcessRunning',
    'Wait-ForgeOSHealth',
    'Open-ForgeOSBrowser',
    'Invoke-ForgeOSHealthRequest',
    'Get-ForgeOSGitCommit',
    'Get-ForgeOSNextCli',
    'Stop-ForgeOSServer',
    'Start-ForgeOSServerProcess'
) -Variable @(
    'ForgeOSPort',
    'ForgeOSHost',
    'ForgeOSUrl',
    'ForgeOSHealthPath',
    'ForgeOSHealthUrl',
    'MinimumNodeMajor',
    'SupportedNodeMajors',
    'RuntimeSubdir',
    'LogsSubdir',
    'PidSubdir',
    'CustomerEnvTemplate',
    'RequiredRepoFiles'
)
