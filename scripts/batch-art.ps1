<#
.SYNOPSIS
  Batch-convert mixed-size art to economical WebPs: fit inside max box, preserve aspect, strip metadata.

.DESCRIPTION
  Requires ImageMagick 7+ (`magick` on PATH). Does NOT crop or stretch; smaller sources are not enlarged.

.PARAMETER SourceDir
  Folder containing .jpg, .jpeg, .png, .webp, .gif (default: public\art\To be converted)

.PARAMETER DestDir
  Output folder for .webp files (default: public\art\converted)

.PARAMETER MaxWidth
  Max width of output (default: 800 — 2x of a 400px-wide UI slot)

.PARAMETER MaxHeight
  Max height of output (default: 1064 — 2x of a 532px-tall UI slot)

.PARAMETER Quality
  WebP quality 1-100 (default: 82)

.PARAMETER Sharpen
  Apply light unsharp after resize (good for photos; optional for painted art)
#>

param(
  [string] $SourceDir = "public\art\To be converted",
  [string] $DestDir = "public\art\converted",
  [int] $MaxWidth = 800,
  [int] $MaxHeight = 1064,
  [ValidateRange(1, 100)]
  [int] $Quality = 82,
  [switch] $Sharpen
)

$ErrorActionPreference = "Stop"

function Test-Magick {
  return $null -ne (Get-Command magick -ErrorAction SilentlyContinue)
}

if (-not (Test-Magick)) {
  Write-Error 'ImageMagick not found. Install with: winget install ImageMagick.ImageMagick, then restart the terminal.'
}

if (-not (Test-Path -LiteralPath $SourceDir)) {
  Write-Error "Source folder not found: $SourceDir"
}

New-Item -ItemType Directory -Force -Path $DestDir | Out-Null

$extensions = @(".jpg", ".jpeg", ".png", ".webp", ".gif")
$files = Get-ChildItem -LiteralPath $SourceDir -File | Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() }

if ($files.Count -eq 0) {
  Write-Host "No images found in $SourceDir"
  exit 0
}

$resizeArg = "${MaxWidth}x${MaxHeight}>"
$count = 0

foreach ($f in $files) {
  $out = Join-Path $DestDir ("{0}.webp" -f $f.BaseName)
  $argsList = @(
    $f.FullName,
    "-auto-orient",
    "-resize", $resizeArg,
    "-strip",
    "-quality", "$Quality"
  )
  if ($Sharpen) {
    $argsList += @("-unsharp", "0x0.6+0.6+0.008")
  }
  $argsList += $out

  & magick @argsList
  if ($LASTEXITCODE -ne 0) {
    Write-Error ('magick failed for ' + $f.Name)
  }

  $dims = (& magick identify -format '%w x %h' $out).Trim()
  $line = 'OK  {0,-40} => {1}  ({2})' -f $f.Name, $out, $dims
  Write-Host $line
  $count++
}

Write-Host ""
Write-Host ('Done: ' + $count + ' file(s) -> ' + $DestDir + ' (max box ' + $MaxWidth + 'x' + $MaxHeight + ', fit inside, q=' + $Quality + ')')
