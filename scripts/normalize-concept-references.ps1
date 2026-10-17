<#
  Normalize the user's concept reference images for the FLUX reference path.

  Input : packages/backend/data/reference-images/concept-references/originals/*.{png,jpg,jpeg,webp,bmp}
          (any size; files are processed in name order)
  Output: packages/backend/data/reference-images/concept-references/normalized_512/ref_concept_NN.png
          Fitted inside 512x512 (aspect preserved, never upscaled), white background, PNG.
  Also writes manifest.json mapping each normalized file to its original (provenance).

  Usage: powershell -ExecutionPolicy Bypass -File scripts/normalize-concept-references.ps1
#>
param(
  [string]$Root = (Join-Path $PSScriptRoot '..\packages\backend\data\reference-images\concept-references')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$src = Join-Path $Root 'originals'
$dst = Join-Path $Root 'normalized_512'
New-Item -ItemType Directory -Force -Path $src, $dst | Out-Null

$files = Get-ChildItem -Path $src -File | Where-Object { $_.Extension -match '^\.(png|jpe?g|webp|bmp)$' } | Sort-Object Name
if ($files.Count -eq 0) {
  Write-Output "No images found in $src - copy the reference images there first."
  exit 1
}

Get-ChildItem -Path $dst -Filter 'ref_concept_*.png' -File | Remove-Item -Force
$manifest = @()
$i = 0
foreach ($f in $files) {
  $i++
  $name = 'ref_concept_{0:D2}.png' -f $i
  try {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
  } catch {
    Write-Output "SKIP $($f.Name): not a readable image ($($_.Exception.Message))"
    $i--
    continue
  }
  try {
    $scale = [Math]::Min(1.0, [Math]::Min(512.0 / $img.Width, 512.0 / $img.Height))
    $w = [Math]::Max(1, [int][Math]::Floor($img.Width * $scale))
    $h = [Math]::Max(1, [int][Math]::Floor($img.Height * $scale))
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::White)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $w, $h)
    $g.Dispose()
    $out = Join-Path $dst $name
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $manifest += [ordered]@{ id = [IO.Path]::GetFileNameWithoutExtension($name); file = $name; original = $f.Name; originalSize = "$($img.Width)x$($img.Height)"; normalizedSize = "${w}x${h}" }
    Write-Output ("{0} <- {1} ({2}x{3} -> {4}x{5})" -f $name, $f.Name, $img.Width, $img.Height, $w, $h)
  } finally {
    $img.Dispose()
  }
}
$manifest | ConvertTo-Json -Depth 3 | Set-Content -Encoding UTF8 (Join-Path $dst 'manifest.json')
Write-Output "Normalized $i reference image(s) into $dst"
