$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if(-not $taskRoot.StartsWith('D:\',[StringComparison]::OrdinalIgnoreCase)){throw '只允许从 D 盘运行。'}
$stateFile=Join-Path $taskRoot 'runtime\state.json'
if(-not (Test-Path -LiteralPath $stateFile)){Write-Host '没有本项目记录的运行进程。';exit 0}
$state=Get-Content -LiteralPath $stateFile -Raw|ConvertFrom-Json
if($state.project -ne $taskRoot){throw '状态文件项目路径不一致，未停止任何进程。'}
$nodeBin='D:\codexAI\.toolchains\emsdk\node\24.19.0_64bit\node.exe'
$tunnelBin=Join-Path $taskRoot 'runtime\bin\cloudflared.exe'
function Test-GameServer($proc){
 if(-not $proc){return $false}
 $absolute=$proc.CommandLine.Contains((Join-Path $taskRoot 'server\index.js'))
 $relative=$proc.CommandLine -match 'server[/\\]index\.js["\s]*$'
 return ($proc.ExecutablePath -eq $nodeBin) -and ($absolute -or $relative)
}
foreach($kind in @('tunnel','server')){
 $number=if($kind -eq 'tunnel'){$state.tunnelPid}else{$state.serverPid}
 $process=if($number){Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$number) -ErrorAction SilentlyContinue}else{$null}
 $valid=$false
 if($kind -eq 'server'){
  $valid=Test-GameServer $process
  if($valid -and -not $process.CommandLine.Contains((Join-Path $taskRoot 'server\index.js'))){
   $bound=!!(Get-NetTCPConnection -State Listen -LocalPort $state.port -ErrorAction SilentlyContinue|Where-Object OwningProcess -eq ([int]$number))
   $check=$null;try{$check=Invoke-RestMethod -Uri ($state.localUrl+'/health') -TimeoutSec 2}catch{}
   $valid=$bound -and $check -and $check.name -eq 'DUO PLAY'
  }
  if(-not $valid){
   $livePid=Get-NetTCPConnection -State Listen -LocalPort $state.port -ErrorAction SilentlyContinue|Select-Object -ExpandProperty OwningProcess -First 1
   if($livePid){$candidate=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$livePid) -ErrorAction SilentlyContinue;if(Test-GameServer $candidate){$process=$candidate;$number=$livePid;$valid=$true}}
  }
 }else{
  $valid=$process -and $process.ExecutablePath -eq $tunnelBin
  if(-not $valid){
   $candidate=Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" -ErrorAction SilentlyContinue|Where-Object{$_.ExecutablePath -eq $tunnelBin -and $_.CommandLine.Contains($state.localUrl)}|Select-Object -First 1
   if($candidate){$process=$candidate;$number=$candidate.ProcessId;$valid=$true}
  }
 }
 if($valid){Stop-Process -Id ([int]$number);Write-Host "已停止本项目 $kind 进程 $number"}elseif($number -and $process){Write-Warning "进程 $number 不符合本项目身份，已保留。"}
}
Write-Host '项目数据与存档已保留。'