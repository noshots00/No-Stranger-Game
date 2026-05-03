<#
.SYNOPSIS
  Batch-convert mixed-size art into uniform, vivid, soft-edged game cards.

.DESCRIPTION
  For every supported image in -SourceDir, run the No Stranger Game art pipeline:
    auto-orient, force sRGB, optional trim of solid borders, fit-resize to a max box,
    auto white balance, saturation boost, sigmoidal contrast, subtle sharpen, strip
    metadata, and apply an alpha mask that combines rounded corners with a soft
    rectangular feather to transparent.

  Outputs land under a per-run timestamped folder:
    <ConvertedRoot>/Batch <yyyy-MM-dd_HH-mm-ss>/<kebab-name>.webp

  Successfully-processed sources are moved to:
    <ProcessedRoot> <yyyy-MM-dd_HH-mm-ss>/<original-name>.<ext>

  Requires ImageMagick 7+ (magick on PATH).
#>

param(
  [string] $SourceDir = "public\art\To be converted",
  [string] $ConvertedRoot = "public\art\converted",
  [string] $ProcessedRoot = "public\art\Processed",
  [int] $MaxWidth = 800,
  [int] $MaxHeight = 1064,
  [ValidateRange(1, 100)]
  [int] $Quality = 82,
  [int] $Saturation = 130,
  [string] $SigmoidalContrast = '4,50%',
  [int] $CornerRadius = 18,
  [ValidateRange(0, 40)]
  [int] $FeatherPercent = 10,
  $AutoGamma = $true,
  $Sharpen = $true,
  $Kebab = $true,
  $ForceSrgb = $true,
  $TrimBorders = $true
)

$ErrorActionPreference = 'Stop'

function Test-Magick {
  return $null -ne (Get-Command magick -ErrorAction SilentlyContinue)
}

function ConvertTo-Kebab([string] $name) {
  $s = [IO.Path]::GetFileNameWithoutExtension($name)
  $s = [Regex]::Replace($s, '([a-z0-9])([A-Z])', '$1-$2')
  $s = [Regex]::Replace($s, '[\s_]+', '-')
  $s = [Regex]::Replace($s, '[^A-Za-z0-9\-]', '')
  $s = [Regex]::Replace($s, '-+', '-').Trim('-')
  return $s.ToLowerInvariant()
}

function Get-ImageSize([string] $path) {
  $raw = (& magick identify -format '%w %h' $path).Trim()
  $parts = $raw.Split(' ')
  return [pscustomobject]@{ W = [int]$parts[0]; H = [int]$parts[1] }
}

if (-not (Test-Magick)) {
  Write-Error 'ImageMagick not found. Install with: winget install ImageMagick.ImageMagick, then restart the terminal.'
}

if (-not (Test-Path -LiteralPath $SourceDir)) {
  Write-Error ('Source folder not found: ' + $SourceDir)
}

$extensions = @('.jpg', '.jpeg', '.png', '.webp', '.gif')
$files = @(
  Get-ChildItem -LiteralPath $SourceDir -File |
    Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() }
)

if ($files.Count -eq 0) {
  Write-Host ('No images found in ' + $SourceDir)
  exit 0
}

$stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$batchDir = Join-Path $ConvertedRoot ('Batch ' + $stamp)
$processedDir = $ProcessedRoot + ' ' + $stamp

New-Item -ItemType Directory -Force -Path $batchDir | Out-Null
New-Item -ItemType Directory -Force -Path $processedDir | Out-Null

$tmpDir = Join-Path ([IO.Path]::GetTempPath()) ('nsg-art-' + $stamp)
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

$ok = 0
$fail = 0

try {
  foreach ($f in $files) {
    $kebab = if ($Kebab) { ConvertTo-Kebab $f.Name } else { [IO.Path]::GetFileNameWithoutExtension($f.Name) }
    $outFinal = Join-Path $batchDir ($kebab + '.webp')
    $outPart  = $outFinal + '.part'
    $tmpStage = Join-Path $tmpDir ($kebab + '.png')

    try {
      $stage1 = @($f.FullName, '-auto-orient')
      if ($ForceSrgb)   { $stage1 += @('-colorspace', 'sRGB') }
      if ($TrimBorders) { $stage1 += @('-trim', '+repage') }
      $stage1 += @('-resize', ($MaxWidth.ToString() + 'x' + $MaxHeight.ToString() + '>'))
      if ($AutoGamma)   { $stage1 += @('-auto-gamma') }
      if ($Saturation -ne 100) {
        $stage1 += @('-modulate', ('100,' + $Saturation.ToString() + ',100'))
      }
      if ($SigmoidalContrast) {
        $stage1 += @('-sigmoidal-contrast', $SigmoidalContrast)
      }
      if ($Sharpen) {
        $stage1 += @('-unsharp', '0x0.5+0.5+0.005')
      }
      $stage1 += @('-strip', $tmpStage)

      & magick @stage1
      if ($LASTEXITCODE -ne 0) { throw 'magick stage1 failed' }

      $size = Get-ImageSize $tmpStage
      $W = $size.W
      $H = $size.H
      $shorter = [Math]::Min($W, $H)
      $feather = [int][Math]::Round($shorter * ($FeatherPercent / 100.0))
      if ($feather -lt 1) { $feather = 1 }
      $blurSigma = [Math]::Max(1.0, [double]$feather / 2.0)

      $maskOuter = Join-Path $tmpDir ($kebab + '-mask-outer.png')
      $maskInner = Join-Path $tmpDir ($kebab + '-mask-inner.png')

      $outerArgs = @(
        '-size', ($W.ToString() + 'x' + $H.ToString()), 'xc:black',
        '-fill', 'white',
        '-draw', ('roundrectangle 0,0 ' + ($W - 1) + ',' + ($H - 1) + ' ' + $CornerRadius + ',' + $CornerRadius),
        $maskOuter
      )
      & magick @outerArgs
      if ($LASTEXITCODE -ne 0) { throw 'magick outer mask failed' }

      $innerLeft = $feather
      $innerTop = $feather
      $innerRight = $W - $feather - 1
      $innerBottom = $H - $feather - 1
      if ($innerRight -le $innerLeft) { $innerRight = $innerLeft + 1 }
      if ($innerBottom -le $innerTop) { $innerBottom = $innerTop + 1 }

      $innerArgs = @(
        '-size', ($W.ToString() + 'x' + $H.ToString()), 'xc:black',
        '-fill', 'white',
        '-draw', ('rectangle ' + $innerLeft + ',' + $innerTop + ' ' + $innerRight + ',' + $innerBottom),
        '-blur', ('0x' + ('{0:0.##}' -f $blurSigma)),
        $maskInner
      )
      & magick @innerArgs
      if ($LASTEXITCODE -ne 0) { throw 'magick inner mask failed' }

      $applyArgs = @(
        $tmpStage,
        '(', $maskOuter, $maskInner, '-compose', 'Multiply', '-composite', ')',
        '-alpha', 'Off',
        '-compose', 'CopyOpacity', '-composite',
        '-define', 'webp:lossless=false',
        '-define', 'webp:method=6',
        '-quality', $Quality.ToString(),
        ('WEBP:' + $outPart)
      )
      & magick @applyArgs
      if ($LASTEXITCODE -ne 0) { throw 'magick apply mask failed' }

      Move-Item -LiteralPath $outPart -Destination $outFinal -Force

      $movedSrc = Join-Path $processedDir $f.Name
      Move-Item -LiteralPath $f.FullName -Destination $movedSrc -Force

      $finalSize = Get-ImageSize $outFinal
      $line = 'OK  {0,-40} -> {1}  ({2}x{3})' -f $f.Name, ($kebab + '.webp'), $finalSize.W, $finalSize.H
      Write-Host $line
      $ok++
    }
    catch {
      $fail++
      Write-Warning ('FAIL ' + $f.Name + ' :: ' + $_.Exception.Message)
      if (Test-Path -LiteralPath $outPart) { Remove-Item -LiteralPath $outPart -Force -ErrorAction SilentlyContinue }
    }
    finally {
      foreach ($p in @($tmpStage, $maskOuter, $maskInner)) {
        if ($p -and (Test-Path -LiteralPath $p)) {
          Remove-Item -LiteralPath $p -Force -ErrorAction SilentlyContinue
        }
      }
    }
  }
}
finally {
  if (Test-Path -LiteralPath $tmpDir) {
    Remove-Item -LiteralPath $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Write-Host ''
Write-Host ('Done: ' + $ok + ' ok, ' + $fail + ' failed')
Write-Host ('Outputs:        ' + $batchDir)
Write-Host ('Moved sources:  ' + $processedDir)
