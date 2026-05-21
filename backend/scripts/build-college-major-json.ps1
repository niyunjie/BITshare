param(
  [string]$WorkbookPath = 'D:\Programs\BITshare\学院及专业.xlsx',
  [string]$OutputPath = 'D:\Programs\BITshare\backend\data\catalog\colleges-majors.json'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-HashCodeValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$InputText
  )

  $sha1 = [System.Security.Cryptography.SHA1]::Create()
  try {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($InputText)
    $hash = $sha1.ComputeHash($bytes)
    return (($hash | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 10)
  } finally {
    $sha1.Dispose()
  }
}

function New-UniqueCode {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Prefix,
    [Parameter(Mandatory = $true)]
    [string]$Seed,
    [Parameter(Mandatory = $true)]
    [System.Collections.Generic.HashSet[string]]$CodeSet
  )

  $base = "$Prefix-$(Get-HashCodeValue -InputText $Seed)"
  if ($CodeSet.Add($base)) {
    return $base
  }

  $index = 2
  while ($true) {
    $candidate = "$base-$index"
    if ($CodeSet.Add($candidate)) {
      return $candidate
    }
    $index += 1
  }
}

$readerScript = 'D:\Programs\BITshare\backend\scripts\read-college-major-workbook.ps1'
$rows = powershell -NoProfile -ExecutionPolicy Bypass -File $readerScript -WorkbookPath $WorkbookPath | ConvertFrom-Json

$collegeCodeSet = [System.Collections.Generic.HashSet[string]]::new()
$majorCodeSet = [System.Collections.Generic.HashSet[string]]::new()
$collegeByName = @{}
$colleges = [System.Collections.Generic.List[object]]::new()
$majors = [System.Collections.Generic.List[object]]::new()

foreach ($row in $rows) {
  $collegeName = [string]$row.college_name_zh
  $majorName = [string]$row.major_name_zh

  if ([string]::IsNullOrWhiteSpace($collegeName) -or [string]::IsNullOrWhiteSpace($majorName)) {
    continue
  }

  if (-not $collegeByName.ContainsKey($collegeName)) {
    $college = [pscustomobject]@{
      code = New-UniqueCode -Prefix 'college' -Seed $collegeName -CodeSet $collegeCodeSet
      name_zh = $collegeName
      name_en = $null
      intro = $null
      cover_image = $null
      source_order = [int]$row.college_order
    }
    $collegeByName[$collegeName] = $college
    $colleges.Add($college)
  }

  $collegeCode = $collegeByName[$collegeName].code
  $major = [pscustomobject]@{
    code = New-UniqueCode -Prefix 'major' -Seed "$collegeCode:$majorName:$($row.source_row)" -CodeSet $majorCodeSet
    college_code = $collegeCode
    name_zh = $majorName
    name_en = $null
    intro = $null
    source_row = [int]$row.source_row
    source_order = [int]$row.major_order
    original_college_name_zh = $collegeName
  }
  $majors.Add($major)
}

$result = [pscustomobject]@{
  generated_at = (Get-Date).ToString('o')
  source_file = '学院及专业.xlsx'
  colleges = @($colleges | Sort-Object source_order)
  majors = @($majors | Sort-Object source_row)
}

$outputDir = Split-Path -Parent $OutputPath
if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$result | ConvertTo-Json -Depth 6 | Set-Content -Path $OutputPath -Encoding UTF8
Write-Output "Catalog JSON written to $OutputPath"
Write-Output "Colleges: $($result.colleges.Count)"
Write-Output "Majors: $($result.majors.Count)"
