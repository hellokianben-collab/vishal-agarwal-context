<#
  Install this repo's skills into Claude Code at USER scope (Windows / PowerShell 5.1).

    powershell -ExecutionPolicy Bypass -File tools\install-skills.ps1
    powershell -ExecutionPolicy Bypass -File tools\install-skills.ps1 -DryRun

  PowerShell 5.1 notes: no '&&', no ternary, no '??'. Written accordingly.
  See skills/windows-agent-automation for the rest of that list.
#>

param([switch]$DryRun)

$ErrorActionPreference = 'Stop'

$Repo = Split-Path -Parent $PSScriptRoot
$Src  = Join-Path $Repo 'skills'
$Dest = Join-Path $HOME '.claude\skills'

Write-Host "source : $Src"
Write-Host "dest   : $Dest"
if ($DryRun) { Write-Host "mode   : DRY RUN (nothing will be written)" }
Write-Host ""

if (-not (Test-Path $Dest)) { New-Item -ItemType Directory -Force -Path $Dest | Out-Null }

$installed = 0
$skipped   = 0

foreach ($dir in Get-ChildItem -Path $Src -Directory) {
    $skillFile = Join-Path $dir.FullName 'SKILL.md'
    if (-not (Test-Path $skillFile)) {
        Write-Host ("skip  {0} (no SKILL.md)" -f $dir.Name)
        $skipped++
        continue
    }

    # frontmatter name must match the directory or the skill will not register
    $fmLine = Select-String -Path $skillFile -Pattern '^name:\s*(.+)$' | Select-Object -First 1
    if ($fmLine) {
        $fmName = $fmLine.Matches[0].Groups[1].Value.Trim()
        if ($fmName -and ($fmName -ne $dir.Name)) {
            Write-Host ("WARN  {0} - frontmatter name is '{1}'; it will not register under '{2}'" -f $dir.Name, $fmName, $dir.Name) -ForegroundColor Yellow
        }
    }

    $target = Join-Path $Dest $dir.Name
    if ($DryRun) {
        Write-Host ("would install  {0}" -f $dir.Name)
    } else {
        if (Test-Path $target) { Remove-Item -Recurse -Force $target }
        Copy-Item -Recurse -Path $dir.FullName -Destination $target
        Write-Host ("installed      {0}" -f $dir.Name)
    }
    $installed++
}

Write-Host ""
Write-Host ("{0} skill(s), {1} skipped." -f $installed, $skipped)
if ($DryRun) { return }

Write-Host ""
Write-Host "Next:"
Write-Host "  1. Restart your Claude Code session - skills are read at startup."
Write-Host "  2. Verify:   (Get-ChildItem `$HOME\.claude\skills -Directory).Count"
Write-Host "  3. If one does not appear under /, check in this order:"
Write-Host "       - SKILL.md is at the directory ROOT (not one level deeper)"
Write-Host "       - frontmatter 'name:' matches the directory name"
Write-Host "       - it landed in ~\.claude\skills, not .\.claude\skills"
Write-Host "     Full diagnostic ladder: skills\claude-code-setup-ops\SKILL.md"
Write-Host ""
Write-Host "Read AGENTS.md before starting work."
