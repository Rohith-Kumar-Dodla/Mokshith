$src = 'tests'
$dst = 'Production/ME/tests'

Write-Host "Migration script starting: moving contents of '$src' into '$dst'"

if (-not (Test-Path $src)) {
  Write-Host "Source folder '$src' does not exist. Exiting."
  exit 1
}

if (-not (Test-Path $dst)) {
  Write-Host "Destination '$dst' does not exist. Creating..."
  New-Item -ItemType Directory -Path $dst | Out-Null
}

Get-ChildItem -LiteralPath $src | ForEach-Object {
  $name = $_.Name
  $srcPath = Join-Path $src $name
  $dstPath = Join-Path $dst $name
  if (-not (Test-Path $dstPath)) {
    Write-Host "Moving $srcPath -> $dstPath"
    Move-Item -LiteralPath $srcPath -Destination $dstPath
  } else {
    Write-Host "Merging children from $srcPath into $dstPath"
    Get-ChildItem -LiteralPath $srcPath | ForEach-Object {
      $child = $_.Name
      $childSrc = Join-Path $srcPath $child
      $childDst = Join-Path $dstPath $child
      if (-not (Test-Path $childDst)) {
        Write-Host " Moving child $childSrc -> $childDst"
        Move-Item -LiteralPath $childSrc -Destination $childDst
      } else {
        Write-Host " Skipping existing child $childDst"
      }
    }
    # remove srcPath if empty
    try {
      if (-not (Get-ChildItem -LiteralPath $srcPath -Force -ErrorAction SilentlyContinue)) {
        Remove-Item -LiteralPath $srcPath -Force -Recurse
      }
    } catch {}
  }
}

# remove src if empty
try {
  if (-not (Get-ChildItem -LiteralPath $src -Force -ErrorAction SilentlyContinue)) {
    Remove-Item -LiteralPath $src -Force -Recurse
    Write-Host "Removed empty source folder '$src'."
  } else {
    Write-Host "Source folder '$src' not empty after migration; please inspect remaining files."
  }
} catch {
  Write-Host "Could not remove tests folder, maybe not empty."
}

Write-Host "Migration script completed."

