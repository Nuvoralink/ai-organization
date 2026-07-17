param(
  [string]$SkillRoot = (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
)

$ErrorActionPreference = 'Stop'
$resolvedSkillRoot = [System.IO.Path]::GetFullPath($SkillRoot).TrimEnd([System.IO.Path]::DirectorySeparatorChar)
$missing = [System.Collections.Generic.List[string]]::new()
$markdownLinkPattern = [regex]'\]\((?<target>[^)]+\.md(?:#[^)]*)?)\)'
$backtickedPathPattern = [regex]'`(?<target>[^`\r\n]*[/\\][^`\r\n]+\.md(?:#[^`]*)?)`'

foreach ($file in Get-ChildItem -LiteralPath $SkillRoot -Recurse -File -Filter '*.md') {
  $source = Get-Content -LiteralPath $file.FullName -Raw
  foreach ($pattern in @($markdownLinkPattern, $backtickedPathPattern)) {
    foreach ($match in $pattern.Matches($source)) {
      $target = $match.Groups['target'].Value.Split('#', 2)[0]
      if ($target -match '^[a-z][a-z0-9+.-]*:' -or $target.StartsWith('#')) { continue }
      if ($pattern -eq $backtickedPathPattern -and $target -notmatch '^(?:\.{1,2}[/\\]|references[/\\]|resources[/\\]|scripts[/\\]|templates[/\\]|workflows[/\\])') { continue }
      $resolved = [System.IO.Path]::GetFullPath((Join-Path $file.DirectoryName $target))
      if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
        $relativeSource = $file.FullName.Substring($resolvedSkillRoot.Length).TrimStart([System.IO.Path]::DirectorySeparatorChar)
        $missing.Add("${relativeSource}: $target")
      }
    }
  }
}

if ($missing.Count -gt 0) {
  $missing | Sort-Object -Unique | ForEach-Object { [Console]::Error.WriteLine("Missing local skill reference: $_") }
  exit 1
}

Write-Output 'security-review-hardening reference integrity: OK'
