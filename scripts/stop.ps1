$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if(-not $taskRoot.StartsWith('D:\',[StringComparison]::OrdinalIgnoreCase)){throw '只允许从 D 盘运行。'}
$stateFile=Join-Path $taskRoot 'runtime\state.json'
if(-not (Test-Path -LiteralPath $stateFile)){Write-Host '没有本项目记录的运行进程。';exit 0}
$state=Get-Content -LiteralPath $stateFile -Raw|ConvertFrom-Json
if($state.project -ne $taskRoot){throw '状态文件项目路径不一致，未停止任何进程。'}
foreach($kind in @('tunnel','server')){
 $number=if($kind -eq 'tunnel'){$state.tunnelPid}else{$state.serverPid}
 if(-not $number){continue}
 $process=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$number) -ErrorAction SilentlyContinue
 if(-not $process){continue}
 $expected=if($kind -eq 'tunnel'){Join-Path $taskRoot 'runtime\bin\cloudflared.exe'}else{'D:\codexAI\.toolchains\emsdk\node\24.19.0_64bit\node.exe'}
 $valid=$process.ExecutablePath -eq $expected
 if($kind -eq 'server'){
  $absolute=$process.CommandLine.Contains((Join-Path $taskRoot 'server\index.js'));$relative=$process.CommandLine -match 'server[/\\]index\.js["\s]*$';$bound=$false
  if($relative -and -not $absolute){$bound=!!(Get-NetTCPConnection -State Listen -LocalPort $state.port -ErrorAction SilentlyContinue|Where-Object OwningProcess -eq ([int]$number));try{$check=Invoke-RestMethod -Uri ($state.localUrl+'/health') -TimeoutSec 2;$bound=$bound -and $check.name -eq 'DUO PLAY'}catch{$bound=$false}}
  $valid=$valid -and ($absolute -or ($relative -and $bound))
 }
 if($valid){Stop-Process -Id ([int]$number);Write-Host "已停止本项目 $kind 进程 $number"}else{Write-Warning "进程 $number 不符合本项目身份，已保留。"}
}
Write-Host '项目数据与存档已保留。'
