param(
  [string]$SkillRoot = (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
)

$ErrorActionPreference = 'Stop'
$missing = [System.Collections.Generic.List[string]]::new()
$markdownLinkPattern = [regex]'\]\((?<target>[^)]+\.md(?:#[^)]*)?)\)'
$backtickedPathPattern = [regex]'`(?<target>[^`\r\n]*[/\\][^`\r\n]+\.md(?:#[^`]*)?)`'

foreach ($file in Get-ChildItem -LiteralPath $SkillRoot -Recurse -File -Filter '*.md') {
  $source = Get-Content -LiteralPath $file.FullName -Raw
  foreach ($pattern in @($markdownLinkPattern, $backtickedPathPattern)) {
    foreach ($match in $pattern.Matches($source)) {
      $target = $match.Groups['target'].Value.Split('#', 2)[0]
      if ($target -match '^[a-z][a-z0-9+.-]*:' -or $target.StartsWith('#')) { continue }
      $resolved = [System.IO.Path]::GetFullPath((Join-Path $file.DirectoryName $target))
      if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
        $relativeSource = [System.IO.Path]::GetRelativePath($SkillRoot, $file.FullName)
        $missing.Add("${relativeSource}: $target")
      }
    }
  }
}

if ($missing.Count -gt 0) {
  $missing | Sort-Object -Unique | ForEach-Object { Write-Error "Missing local skill reference: $_" }
  exit 1
}

Write-Output 'code-review-quality reference integrity: OK'
