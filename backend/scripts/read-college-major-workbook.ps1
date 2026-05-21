param(
  [Parameter(Mandatory = $true)]
  [string]$WorkbookPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-ZipEntryText {
  param(
    [Parameter(Mandatory = $true)]
    [System.IO.Compression.ZipArchive]$Zip,
    [Parameter(Mandatory = $true)]
    [string]$EntryPath
  )

  $entry = $Zip.GetEntry($EntryPath)
  if (-not $entry) {
    throw "Workbook entry not found: $EntryPath"
  }

  $reader = [System.IO.StreamReader]::new($entry.Open())
  try {
    return $reader.ReadToEnd()
  } finally {
    $reader.Dispose()
  }
}

function Get-NodePropertyValue {
  param(
    [Parameter(Mandatory = $true)]
    $Node,
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  $property = $Node.PSObject.Properties[$Name]
  if (-not $property) {
    return $null
  }

  return $property.Value
}

function Get-CellText {
  param(
    [Parameter(Mandatory = $true)]
    $Cell,
    [Parameter(Mandatory = $true)]
    [string[]]$SharedStrings
  )

  if (-not $Cell) {
    return ''
  }

  $cellType = Get-NodePropertyValue -Node $Cell -Name 't'
  $cellValue = Get-NodePropertyValue -Node $Cell -Name 'v'
  $inlineString = Get-NodePropertyValue -Node $Cell -Name 'is'

  if ($cellType -eq 's' -and $null -ne $cellValue) {
    $index = [int]$cellValue
    return [string]$SharedStrings[$index]
  }

  if ($inlineString) {
    $inlineText = Get-NodePropertyValue -Node $inlineString -Name 't'
    if ($inlineText) {
      return [string]$inlineText
    }
  }

  if ($null -ne $cellValue) {
    return [string]$cellValue
  }

  return ''
}

$zip = [System.IO.Compression.ZipFile]::OpenRead($WorkbookPath)

try {
  $sharedXml = [xml](Get-ZipEntryText -Zip $zip -EntryPath 'xl/sharedStrings.xml')
  $sheetXml = [xml](Get-ZipEntryText -Zip $zip -EntryPath 'xl/worksheets/sheet1.xml')

  $sharedStrings = @()
  foreach ($item in $sharedXml.sst.si) {
    $textNode = Get-NodePropertyValue -Node $item -Name 't'
    $runNodes = Get-NodePropertyValue -Node $item -Name 'r'

    if ($textNode) {
      $sharedStrings += [string]$textNode
      continue
    }

    if ($runNodes) {
      $sharedStrings += (($runNodes | ForEach-Object { [string](Get-NodePropertyValue -Node $_ -Name 't') }) -join '')
      continue
    }

    $sharedStrings += ''
  }

  $rows = @()
  $currentCollege = ''
  $collegeOrder = 0
  $majorOrder = 0

  foreach ($row in $sheetXml.worksheet.sheetData.row) {
    if ([int]$row.r -eq 1) {
      continue
    }

    $collegeName = ''
    $majorName = ''

    foreach ($cell in $row.c) {
      $columnRef = [string](Get-NodePropertyValue -Node $cell -Name 'r')
      $column = ($columnRef -replace '\d', '')
      $value = (Get-CellText -Cell $cell -SharedStrings $sharedStrings).Trim()

      if ($column -eq 'A') {
        $collegeName = $value
      } elseif ($column -eq 'B') {
        $majorName = $value
      }
    }

    if ($collegeName) {
      $currentCollege = $collegeName
      $collegeOrder += 1
      $majorOrder = 0
    }

    if (-not $currentCollege -or -not $majorName) {
      continue
    }

    $majorOrder += 1

    $rows += [pscustomobject]@{
      college_name_zh = $currentCollege
      major_name_zh   = $majorName
      college_order   = $collegeOrder
      major_order     = $majorOrder
      source_row      = [int]$row.r
    }
  }

  $rows | ConvertTo-Json -Depth 4
} finally {
  $zip.Dispose()
}
