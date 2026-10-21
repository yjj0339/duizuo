param([int]$Port=4390,[switch]$LocalOnly,[switch]$NoBrowser,[switch]$NoBuild)
$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if(-not $taskRoot.StartsWith('D:\',[StringComparison]::OrdinalIgnoreCase)){throw '本项目只允许从 D 盘运行。'}
$nodeBin='D:\codexAI\.toolchains\emsdk\node\24.19.0_64bit\node.exe'
$npmBin=Join-Path (Split-Path $nodeBin) 'npm.cmd'
$ghBin='D:\codexAI\.runtime\github-cli\gh.exe'
if(-not (Test-Path -LiteralPath $nodeBin)){throw "请先准备 D 盘 Node.js：$nodeBin"}
$runtimeDir=Join-Path $taskRoot 'runtime'
foreach($folder in @('temp','logs','data','bin')){New-Item -ItemType Directory -Force -Path (Join-Path $runtimeDir $folder)|Out-Null}
$env:TEMP=Join-Path $runtimeDir 'temp';$env:TMP=$env:TEMP
$env:npm_config_cache='D:\codexAI\.runtime\npm-cache'
$env:GH_CONFIG_DIR='D:\codexAI\.runtime\github-config'
$env:TUNNEL_ORIGIN_CERT=Join-Path $runtimeDir 'origin-cert.pem'
$env:PORT=[string]$Port
$env:Path=(Split-Path $nodeBin)+';D:\codexAI\.toolchains\git\cmd;'+$env:Path
Set-Location -LiteralPath $taskRoot
if(-not (Test-Path -LiteralPath (Join-Path $taskRoot 'node_modules\socket.io'))){Write-Host '正在安装 D 盘项目依赖…';& $npmBin ci --no-audit --no-fund;if($LASTEXITCODE -ne 0){throw '依赖安装失败'}}
if(-not $NoBuild){Write-Host '正在构建游戏页面…';& $npmBin run build;if($LASTEXITCODE -ne 0){throw '页面构建失败'}}
elseif(-not (Test-Path -LiteralPath (Join-Path $taskRoot 'dist\index.html'))){throw '缺少 dist/index.html，请去掉 -NoBuild 重新启动。'}
$localUrl="http://127.0.0.1:$Port"
$stateFile=Join-Path $runtimeDir 'state.json'
$oldState=$null;if(Test-Path -LiteralPath $stateFile){try{$oldState=Get-Content -LiteralPath $stateFile -Raw|ConvertFrom-Json}catch{}}
$ready=$false;try{$health=Invoke-RestMethod -Uri "$localUrl/health" -TimeoutSec 2;if($health.ok -and $health.name -eq 'DUO PLAY' -and $health.version -eq '1.0.0'){throw '该端口运行旧版服务，请使用新版默认 4390 端口。旧服务不会被自动停止。'};$ready=$health.ok -and $health.name -eq 'DUO PLAY' -and $health.version -eq '2.0.0'}catch{if($_.Exception.Message -like '*旧版服务*'){throw}}
$serverProcess=$null
if(-not $ready){
 $stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
 $serverProcess=Start-Process -FilePath $nodeBin -ArgumentList @(('"'+(Join-Path $taskRoot 'server\index.js')+'"')) -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir "logs\server-$stamp.log") -RedirectStandardError (Join-Path $runtimeDir "logs\server-$stamp.err.log") -PassThru
 for($i=0;$i -lt 30;$i++){Start-Sleep -Milliseconds 500;try{$health=Invoke-RestMethod -Uri "$localUrl/health" -TimeoutSec 2;if($health.ok -and $health.name -eq 'DUO PLAY'){$ready=$true;break}}catch{};if($serverProcess.HasExited){break}}
 if(-not $ready){throw '对战服务未启动，请查看 runtime/logs。该端口可能被其他程序占用；脚本不会停止其他程序。'}
}
$serverNumber=if($serverProcess){$serverProcess.Id}elseif($oldState){$oldState.serverPid}else{0}
if(-not $serverProcess){
 $livePid=Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue|Select-Object -ExpandProperty OwningProcess -First 1
 if($livePid){$liveProcess=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$livePid) -ErrorAction SilentlyContinue;if($liveProcess.ExecutablePath -eq $nodeBin -and ($liveProcess.CommandLine.Contains((Join-Path $taskRoot 'server\index.js')) -or $liveProcess.CommandLine -match 'server[/\\]index\.js["\s]*$')){$serverNumber=$livePid}}
}
$state=[ordered]@{project=$taskRoot;port=$Port;serverPid=$serverNumber;tunnelPid=0;server=$localUrl;updatedAt=(Get-Date).ToString('o');localUrl=$localUrl;playUrl=$localUrl}
Write-Host "本地服务已就绪：$localUrl"
if(-not $LocalOnly){
 $publicUrl=$null;$tunnelProcess=$null
 if($oldState -and $oldState.port -eq $Port -and $oldState.tunnelPid -and $oldState.server -like 'https://*.trycloudflare.com'){
  $existing=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$oldState.tunnelPid) -ErrorAction SilentlyContinue
  if($existing -and $existing.ExecutablePath -eq (Join-Path $runtimeDir 'bin\cloudflared.exe')){try{$check=Invoke-RestMethod -Uri ($oldState.server+'/health') -TimeoutSec 6;if($check.ok){$publicUrl=$oldState.server;$state.tunnelPid=$oldState.tunnelPid}}catch{}}
 }
 if(-not $publicUrl){
  $tunnelBin=Join-Path $runtimeDir 'bin\cloudflared.exe'
  if(-not (Test-Path -LiteralPath $tunnelBin)){
   Write-Host '正在把公网隧道工具下载到 D 盘…'
   Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/download/2026.10.3/cloudflared-windows-amd64.exe' -OutFile $tunnelBin
   if((Get-FileHash -LiteralPath $tunnelBin -Algorithm SHA256).Hash -ne '76B2805253D0D6FFACB092A7ACFBEE99E7AF6917835C0C5410E23F3EF5052DA2'){throw '隧道工具校验失败，请删除该下载后重新启动。'}
  }
  $stamp=Get-Date -Format 'yyyyMMdd-HHmmss';$tunnelLog=Join-Path $runtimeDir "logs\tunnel-$stamp.log"
  Write-Host '正在连接公网入口…'
  $tunnelProcess=Start-Process -FilePath $tunnelBin -ArgumentList @('tunnel','--no-autoupdate','--url',$localUrl,'--protocol','http2','--logfile',('"'+$tunnelLog+'"')) -WorkingDirectory $taskRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir "logs\tunnel-$stamp.stdout.log") -RedirectStandardError (Join-Path $runtimeDir "logs\tunnel-$stamp.stderr.log") -PassThru
  $state.tunnelPid=$tunnelProcess.Id
  for($i=0;$i -lt 60;$i++){Start-Sleep -Milliseconds 500;if(Test-Path -LiteralPath $tunnelLog){$match=[regex]::Match((Get-Content -LiteralPath $tunnelLog -Raw),'https://[a-z0-9-]+\.trycloudflare\.com');if($match.Success){$publicUrl=$match.Value;break}};if($tunnelProcess.HasExited){break}}
 }
 if($publicUrl){
  $publicReady=$false;for($i=0;$i -lt 8;$i++){try{$check=Invoke-RestMethod -Uri ($publicUrl+'/health') -TimeoutSec 5;if($check.ok){$publicReady=$true;break}}catch{};Start-Sleep -Milliseconds 700}
  if($publicReady){
   $state.server=$publicUrl;$state.playUrl='https://yjj0339.github.io/duo-play/?server='+[Uri]::EscapeDataString($publicUrl)
   $endpoint=@{server=$publicUrl;kind='temporary-tunnel';updatedAt=(Get-Date).ToUniversalTime().ToString('o')}|ConvertTo-Json
   Set-Content -LiteralPath (Join-Path $runtimeDir 'endpoint.json') -Value $endpoint -Encoding utf8
   Set-Content -LiteralPath (Join-Path $taskRoot 'dist\runtime-endpoint.json') -Value $endpoint -Encoding utf8
   if(Test-Path -LiteralPath $ghBin){
    try{
     $remoteText=& $ghBin api repos/yjj0339/duo-play/contents/runtime-endpoint.json 2>$null
     if($LASTEXITCODE -eq 0){
      $remote=$remoteText|ConvertFrom-Json;$current=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(($remote.content -replace '\s','')))|ConvertFrom-Json
      if($current.server -ne $publicUrl){
       $body=@{message='chore: update public multiplayer endpoint';sha=$remote.sha;content=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($endpoint))}|ConvertTo-Json -Compress
       $bodyFile=Join-Path $runtimeDir 'temp\endpoint-request.json';[IO.File]::WriteAllText($bodyFile,$body,[Text.UTF8Encoding]::new($false))
       & $ghBin api repos/yjj0339/duo-play/contents/runtime-endpoint.json --method PUT --input $bodyFile --jq '.commit.sha' | Out-Null
       if($LASTEXITCODE -ne 0){Write-Warning '公开地址未自动同步；请使用下面带服务器参数的链接。'}else{Write-Host 'GitHub 页面已同步新的服务器地址。'}
      }
     }else{Write-Warning 'GitHub 地址未同步；带服务器参数的邀请链接仍可使用。'}
    }catch{Write-Warning 'GitHub 地址未同步；带服务器参数的邀请链接仍可使用。'}
   }
   Write-Host "公网服务已验证：$publicUrl"
  }else{Write-Warning '公网入口暂未通过健康检查，本地服务可用。请检查网络后重试。'}
 }else{Write-Warning '暂未取得公网入口，请查看 runtime/logs 后重试。本地服务仍可使用。'}
}
$state|ConvertTo-Json|Set-Content -LiteralPath $stateFile -Encoding utf8
Write-Host "游玩链接：$($state.playUrl)"
Write-Host '保持电脑、对战服务和隧道运行。停止请双击“停止双人游乐场.cmd”。'
if(-not $NoBrowser){Start-Process -FilePath 'D:\codexAI\.runtime\browsers\chromium-1234\chrome-win64\chrome.exe' -ArgumentList @('--user-data-dir='+('"'+(Join-Path $runtimeDir 'browser-profile')+'"'),('--app='+$state.playUrl)) -WorkingDirectory $taskRoot -WindowStyle Hidden}
