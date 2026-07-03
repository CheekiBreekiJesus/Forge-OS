#Requires -Version 5.1

param(
    [switch] $IncludeSmoke
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'ForgeOS-Runtime.psm1'
Import-Module $modulePath -Force

$repoRoot = Get-ForgeOSRepoRoot -StartPath $PSScriptRoot
$failures = 0

function Assert-Test {
    param(
        [string] $Name,
        [scriptblock] $Test
    )

    try {
        & $Test
        Write-Host "[PASS] $Name" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] $Name :: $($_.Exception.Message)" -ForegroundColor Red
        $script:failures++
    }
}

function New-TestMetadata {
    param(
        [int] $ProcessId,
        [string] $RepoRoot,
        [string] $NodeExecutable,
        [string] $NextCli,
        [string] $Subcommand = 'start',
        [string] $StartTimeUtc = (Get-Date).ToUniversalTime().ToString('o')
    )

    return [pscustomobject]@{
        version = 1
        pid = $ProcessId
        mode = 'local-production'
        repositoryRoot = $RepoRoot
        nodeExecutable = $NodeExecutable
        commandLineSignature = "`"$NextCli`" $Subcommand -H localhost -p 3000"
        expectedPort = 3000
        processStartTimeUtc = $StartTimeUtc
        forgeosCommit = 'test'
        metadataCreatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    }
}

function New-TestSnapshot {
    param(
        [int] $ProcessId,
        [string] $NodeExecutable,
        [string] $NextCli,
        [string] $Subcommand = 'start',
        [string] $StartTimeUtc = (Get-Date).ToUniversalTime().ToString('o')
    )

    return [pscustomobject]@{
        ProcessId = $ProcessId
        Exists = $true
        ExecutablePath = $NodeExecutable
        CommandLine = "`"$NodeExecutable`" `"$NextCli`" $Subcommand -H localhost -p 3000"
        StartTimeUtc = $StartTimeUtc
    }
}

Write-Host 'ForgeOS customer PC runtime validation'
Write-Host "Repository: $repoRoot"
Write-Host ''

Assert-Test 'Stable URL is localhost:3000' {
    if ($ForgeOSUrl -ne 'http://localhost:3000') {
        throw "Unexpected URL: $ForgeOSUrl"
    }
}

Assert-Test 'Health endpoint path' {
    if ($ForgeOSHealthPath -ne '/api/health/local') {
        throw "Unexpected health path: $ForgeOSHealthPath"
    }
}

Assert-Test 'Node is available' {
    if (-not (Test-ForgeOSCommand -Name 'node')) {
        throw 'node command missing'
    }
}

Assert-Test 'npm is available' {
    if (-not (Test-ForgeOSCommand -Name 'npm')) {
        throw 'npm command missing'
    }
}

Assert-Test 'Node major version acceptable' {
    $version = Get-ForgeOSNodeVersion
    if ($null -eq $version) {
        throw 'Could not parse node -v'
    }
    if ($version.Major -lt 20) {
        throw "Node major $($version.Major) is below minimum 20"
    }
}

Assert-Test 'Required repository files exist' {
    Assert-ForgeOSRequiredFiles -RepoRoot $repoRoot
}

Assert-Test 'Customer env template exists' {
    if (-not (Test-Path -LiteralPath (Join-Path $repoRoot $CustomerEnvTemplate))) {
        throw "$CustomerEnvTemplate missing"
    }
}

Assert-Test 'Outlook flags disabled by default' {
    Test-ForgeOSOutlookFlagsDisabled -RepoRoot $repoRoot | Out-Null
}

Assert-Test 'Database name variables are stable in customer template' {
    $templatePath = Join-Path $repoRoot $CustomerEnvTemplate
    $server = $null
    $public = $null
    foreach ($line in Get-Content -LiteralPath $templatePath) {
        if ($line -match '^\s*FORGEOS_LOCAL_DB_NAME\s*=\s*(.+)\s*$') { $server = $Matches[1].Trim() }
        if ($line -match '^\s*NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME\s*=\s*(.+)\s*$') { $public = $Matches[1].Trim() }
    }
    if (-not $server -or -not $public -or $server -ne $public) {
        throw 'FORGEOS_LOCAL_DB_NAME and NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME must match'
    }
}

Assert-Test 'Update branch loaded from environment template' {
    $branch = Get-ForgeOSConfiguredUpdateBranch -RepoRoot $repoRoot
    if ($branch -ne 'deploy/jh-gomes-local') {
        throw "Expected deploy/jh-gomes-local, got $branch"
    }
}

Assert-Test 'Blank update branch rejected' {
    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("forgeos-test-" + [guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $tempRoot | Out-Null
    try {
        Copy-Item -LiteralPath (Join-Path $repoRoot $CustomerEnvTemplate) -Destination (Join-Path $tempRoot $CustomerEnvTemplate)
        $templatePath = Join-Path $tempRoot $CustomerEnvTemplate
        $content = Get-Content -LiteralPath $templatePath
        $content = $content -replace 'FORGEOS_UPDATE_BRANCH=.+', 'FORGEOS_UPDATE_BRANCH='
        Set-Content -LiteralPath $templatePath -Value $content -Encoding UTF8
        'FORGEOS_UPDATE_BRANCH=' | Set-Content -LiteralPath (Join-Path $tempRoot '.env.local') -Encoding UTF8
        $null = Resolve-ForgeOSUpdateBranch -RepoRoot $tempRoot
        throw 'Expected blank branch rejection'
    } catch {
        if ($_.Exception.Message -notmatch 'blank') {
            throw $_.Exception.Message
        }
    } finally {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Assert-Test 'Explicit update-branch override' {
    $resolved = Resolve-ForgeOSUpdateBranch -RepoRoot $repoRoot -OverrideBranch 'feat/customer-pc-local-runtime'
    if (-not $resolved.IsOverride -or $resolved.Branch -ne 'feat/customer-pc-local-runtime') {
        throw 'Override branch was not applied'
    }
}

Assert-Test 'Setup preserves existing .env.local' {
    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("forgeos-test-" + [guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $tempRoot | Out-Null
    try {
        Copy-Item -LiteralPath (Join-Path $repoRoot 'package.json') -Destination (Join-Path $tempRoot 'package.json')
        Copy-Item -LiteralPath (Join-Path $repoRoot 'package-lock.json') -Destination (Join-Path $tempRoot 'package-lock.json')
        Copy-Item -LiteralPath (Join-Path $repoRoot 'next.config.ts') -Destination (Join-Path $tempRoot 'next.config.ts')
        Copy-Item -LiteralPath (Join-Path $repoRoot 'AGENTS.md') -Destination (Join-Path $tempRoot 'AGENTS.md')
        Copy-Item -LiteralPath (Join-Path $repoRoot $CustomerEnvTemplate) -Destination (Join-Path $tempRoot $CustomerEnvTemplate)
        'CUSTOM_MARKER=1' | Set-Content -LiteralPath (Join-Path $tempRoot '.env.local') -Encoding UTF8
        Initialize-ForgeOSEnvLocal -RepoRoot $tempRoot
        $content = Get-Content -LiteralPath (Join-Path $tempRoot '.env.local') -Raw
        if ($content -notmatch 'CUSTOM_MARKER=1') {
            throw '.env.local was overwritten'
        }
    } finally {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Assert-Test 'Setup creates .env.local when absent' {
    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("forgeos-test-" + [guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $tempRoot | Out-Null
    try {
        Copy-Item -LiteralPath (Join-Path $repoRoot $CustomerEnvTemplate) -Destination (Join-Path $tempRoot $CustomerEnvTemplate)
        Initialize-ForgeOSEnvLocal -RepoRoot $tempRoot
        if (-not (Test-Path -LiteralPath (Join-Path $tempRoot '.env.local'))) {
            throw '.env.local was not created'
        }
    } finally {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Assert-Test 'Stale runtime metadata cleanup when process missing' {
    Ensure-ForgeOSLocalDirectories -RepoRoot $repoRoot
    $metadataFile = Get-ForgeOSRuntimeMetadataFile -RepoRoot $repoRoot -Mode 'development'
    $payload = @{
        version = 1
        pid = 999999
        mode = 'development'
        repositoryRoot = $repoRoot
        nodeExecutable = 'C:\Program Files\nodejs\node.exe'
        commandLineSignature = '"C:\ForgeOS\node_modules\next\dist\bin\next" dev -H localhost -p 3000'
        expectedPort = 3000
        processStartTimeUtc = (Get-Date).ToUniversalTime().ToString('o')
        forgeosCommit = 'test'
        metadataCreatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    } | ConvertTo-Json -Depth 4
    Set-Content -LiteralPath $metadataFile -Value $payload -Encoding UTF8
    Remove-ForgeOSStaleRuntimeMetadata -RepoRoot $repoRoot -Mode 'development'
    if (Test-Path -LiteralPath $metadataFile) {
        throw 'Stale runtime metadata was not removed'
    }
}

Assert-Test 'PID reused by unrelated process is not stopped' {
    $node = (Get-Command node -ErrorAction Stop).Source
    $nextCli = Join-Path $repoRoot 'node_modules\next\dist\bin\next'
    $metadata = New-TestMetadata -ProcessId 424242 -RepoRoot $repoRoot -NodeExecutable $node -NextCli $nextCli
    $snapshot = New-TestSnapshot -ProcessId 424242 -NodeExecutable $node -NextCli 'C:\Other\node_modules\next\dist\bin\next'
    $result = Test-ForgeOSProcessIdentityCore -Metadata $metadata -Snapshot $snapshot -PortListenerPids @(424242)
    if ($result.Verified -or $result.SafeToRemoveMetadata) {
        throw 'Unrelated process should not verify or be safe to remove when PID is reused'
    }
}

Assert-Test 'Node process with wrong command line is rejected' {
    $node = (Get-Command node -ErrorAction Stop).Source
    $nextCli = Join-Path $repoRoot 'node_modules\next\dist\bin\next'
    $metadata = New-TestMetadata -ProcessId 515151 -RepoRoot $repoRoot -NodeExecutable $node -NextCli $nextCli
    $snapshot = New-TestSnapshot -ProcessId 515151 -NodeExecutable $node -NextCli $nextCli -Subcommand 'exec unrelated-script.js'
    $result = Test-ForgeOSProcessIdentityCore -Metadata $metadata -Snapshot $snapshot -PortListenerPids @(515151)
    if ($result.Verified) {
        throw 'Wrong command line should fail identity verification'
    }
}

Assert-Test 'Process start-time mismatch is rejected' {
    $node = (Get-Command node -ErrorAction Stop).Source
    $nextCli = Join-Path $repoRoot 'node_modules\next\dist\bin\next'
    $metadata = New-TestMetadata -ProcessId 616161 -RepoRoot $repoRoot -NodeExecutable $node -NextCli $nextCli -StartTimeUtc '2020-01-01T00:00:00.0000000Z'
    $snapshot = New-TestSnapshot -ProcessId 616161 -NodeExecutable $node -NextCli $nextCli -StartTimeUtc '2026-01-01T00:00:00.0000000Z'
    $result = Test-ForgeOSProcessIdentityCore -Metadata $metadata -Snapshot $snapshot -PortListenerPids @(616161)
    if ($result.Verified) {
        throw 'Start-time mismatch should fail identity verification'
    }
}

Assert-Test 'ForgeOS process identity success path' {
    $node = (Get-Command node -ErrorAction Stop).Source
    $nextCli = Join-Path $repoRoot 'node_modules\next\dist\bin\next'
    $start = (Get-Date).ToUniversalTime().ToString('o')
    $metadata = New-TestMetadata -ProcessId 717171 -RepoRoot $repoRoot -NodeExecutable $node -NextCli $nextCli -StartTimeUtc $start
    $snapshot = New-TestSnapshot -ProcessId 717171 -NodeExecutable $node -NextCli $nextCli -StartTimeUtc $start
    $result = Test-ForgeOSProcessIdentityCore -Metadata $metadata -Snapshot $snapshot -PortListenerPids @(717171)
    if (-not $result.Verified) {
        throw "Expected verified identity, got $($result.Reason)"
    }
}

Assert-Test 'Unrelated process is never stopped by metadata mismatch' {
    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("forgeos-test-" + [guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path (Join-Path $tempRoot '.customer-pc\runtime') -Force | Out-Null
    try {
        $node = (Get-Command node -ErrorAction Stop).Source
        $nextCli = Join-Path $repoRoot 'node_modules\next\dist\bin\next'
        $metadata = New-TestMetadata -ProcessId $PID -RepoRoot $repoRoot -NodeExecutable $node -NextCli 'C:\Wrong\next'
        ($metadata | ConvertTo-Json -Depth 4) | Set-Content -LiteralPath (Join-Path $tempRoot '.customer-pc\runtime\forgeos-local-production.runtime.json') -Encoding UTF8
        try {
            Stop-ForgeOSServer -RepoRoot $tempRoot -AllModes | Out-Null
            throw 'Stop should have refused unsafe metadata'
        } catch {
            if ($_.Exception.Message -notmatch 'stale or unsafe') {
                throw $_.Exception.Message
            }
        }
        if (-not (Test-ForgeOSProcessRunning -ProcessId $PID)) {
            throw 'Current PowerShell process was stopped unexpectedly'
        }
    } finally {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Assert-Test 'Daily startup reuses valid build' {
    $manifestPath = Get-ForgeOSBuildManifestFile -RepoRoot $repoRoot
    $backup = $null
    if (Test-Path -LiteralPath $manifestPath) {
        $backup = Get-Content -LiteralPath $manifestPath -Raw
    }

    try {
        $commit = Get-ForgeOSGitCommit -RepoRoot $repoRoot
        New-Item -ItemType Directory -Path (Join-Path $repoRoot '.next') -Force -ErrorAction SilentlyContinue | Out-Null
        Write-ForgeOSBuildManifest -RepoRoot $repoRoot -Commit $commit
        $status = Test-ForgeOSProductionBuildCurrent -RepoRoot $repoRoot
        if (-not $status.Current) {
            throw "Expected current build, got $($status.Reason)"
        }
    } finally {
        if ($null -ne $backup) {
            Set-Content -LiteralPath $manifestPath -Value $backup -Encoding UTF8
        } elseif (Test-Path -LiteralPath $manifestPath) {
            Remove-Item -LiteralPath $manifestPath -Force
        }
    }
}

Assert-Test 'Stale build triggers rebuild requirement' {
    $manifestPath = Get-ForgeOSBuildManifestFile -RepoRoot $repoRoot
    $backup = $null
    if (Test-Path -LiteralPath $manifestPath) {
        $backup = Get-Content -LiteralPath $manifestPath -Raw
    }

    try {
        New-Item -ItemType Directory -Path (Join-Path $repoRoot '.next') -Force -ErrorAction SilentlyContinue | Out-Null
        Write-ForgeOSBuildManifest -RepoRoot $repoRoot -Commit 'deadbeef'
        $status = Test-ForgeOSProductionBuildCurrent -RepoRoot $repoRoot
        if ($status.Current -or $status.Reason -ne 'stale_commit') {
            throw "Expected stale_commit, got $($status.Reason)"
        }
    } finally {
        if ($null -ne $backup) {
            Set-Content -LiteralPath $manifestPath -Value $backup -Encoding UTF8
        } elseif (Test-Path -LiteralPath $manifestPath) {
            Remove-Item -LiteralPath $manifestPath -Force
        }
    }
}

Assert-Test 'Explicit -Rebuild path exists on Start-ForgeOS-Local.ps1' {
    $scriptPath = Join-Path $PSScriptRoot 'Start-ForgeOS-Local.ps1'
    $content = Get-Content -LiteralPath $scriptPath -Raw
    if ($content -notmatch '\[switch\]\s*\$Rebuild') {
        throw 'Start-ForgeOS-Local.ps1 must expose -Rebuild'
    }
}

Assert-Test 'Port owner detection returns structured text or null' {
    $owner = Get-ForgeOSPortOwnerDescription -Port $ForgeOSPort
    if ($null -ne $owner -and $owner -notmatch 'PID') {
        throw "Unexpected owner description: $owner"
    }
}

Assert-Test 'Redaction removes user home paths' {
    $sample = 'C:\Users\Example User\ForgeOS\.env.local'
    $redacted = Redact-ForgeOSText -Text $sample
    if ($redacted -match 'Example User') {
        throw 'User path was not redacted'
    }
}

Assert-Test 'Diagnostics excludes .env.local' {
    $previewScript = Join-Path $PSScriptRoot 'Collect-ForgeOS-Diagnostics.ps1'
    if (-not (Test-Path -LiteralPath $previewScript)) {
        throw 'Collect-ForgeOS-Diagnostics.ps1 missing'
    }
    $content = Get-Content -LiteralPath $previewScript -Raw
    if ($content -notmatch '\.env\.local') {
        throw 'Diagnostics script should document .env.local exclusion'
    }
}

Assert-Test 'PowerShell syntax validation for customer-pc scripts' {
    $scripts = Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.ps1' -File
    foreach ($script in $scripts) {
        $tokens = $null
        $errors = $null
        [void][System.Management.Automation.Language.Parser]::ParseFile($script.FullName, [ref]$tokens, [ref]$errors)
        if ($errors -and $errors.Count -gt 0) {
            throw "$($script.Name): $($errors[0].Message)"
        }
    }

    $moduleErrors = $null
    [void][System.Management.Automation.Language.Parser]::ParseFile($modulePath, [ref]$null, [ref]$moduleErrors)
    if ($moduleErrors -and $moduleErrors.Count -gt 0) {
        throw "ForgeOS-Runtime.psm1: $($moduleErrors[0].Message)"
    }
}

if ($IncludeSmoke) {
    Write-Host ''
    Write-Host 'Running smoke test...' -ForegroundColor Cyan
    $smokeScript = Join-Path $PSScriptRoot 'Invoke-ForgeOSSmokeTest.ps1'
    if (-not (Test-Path -LiteralPath $smokeScript)) {
        Write-Host '[FAIL] Smoke test script missing' -ForegroundColor Red
        $failures++
    } else {
        & $smokeScript
        if ($LASTEXITCODE -ne 0) {
            $failures++
        }
    }
}

Write-Host ''
if ($failures -gt 0) {
    Write-Host "Validation finished with $failures failure(s)." -ForegroundColor Red
    exit 1
}

Write-Host 'All validation checks passed.' -ForegroundColor Green
exit 0
