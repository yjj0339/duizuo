param([switch]$SkipChecks)
$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if(-not $taskRoot.StartsWith('D:\',[StringComparison]::OrdinalIgnoreCase)){throw '只允许从 D 盘运行。'}
$nodeDir='D:\codexAI\.toolchains\emsdk\node\24.19.0_64bit';$gitBin='D:\codexAI\.toolchains\git\cmd\git.exe'
$env:Path=$nodeDir+';D:\codexAI\.toolchains\git\cmd;'+$env:Path
$env:TEMP=Join-Path $taskRoot 'runtime\temp';$env:TMP=$env:TEMP;$env:npm_config_cache='D:\codexAI\.runtime\npm-cache';$env:GH_CONFIG_DIR='D:\codexAI\.runtime\github-config'
Set-Location -LiteralPath $taskRoot
if(-not $SkipChecks){& (Join-Path $nodeDir 'npm.cmd') test;if($LASTEXITCODE -ne 0){throw '测试失败，未发布'}}
& (Join-Path $nodeDir 'npm.cmd') run build;if($LASTEXITCODE -ne 0){throw '构建失败，未发布'}
Copy-Item -LiteralPath (Join-Path $taskRoot 'runtime-endpoint.json') -Destination (Join-Path $taskRoot 'dist\runtime-endpoint.json')
$stage=Join-Path $taskRoot 'runtime\pages-stage';New-Item -ItemType Directory -Force -Path $stage|Out-Null
$stage=Join-Path $taskRoot 'runtime\pages-stage';New-Item -ItemType Directory -Force -Path $stage|Out-Null
Set-Location -LiteralPath $stage
if(-not (Test-Path -LiteralPath (Join-Path $stage '.git'))){& $gitBin init -b gh-pages;& $gitBin config user.name 'DUO PLAY Publisher';& $gitBin config user.email 'yjj0339@users.noreply.github.com';& $gitBin remote add origin 'https://github.com/yjj0339/duo-play.git'}else{& $gitBin fetch origin gh-pages 2>$null;if($LASTEXITCODE -eq 0){& $gitBin reset --hard origin/gh-pages|Out-Null}}
if(Test-Path -LiteralPath (Join-Path $stage 'assets')){Remove-Item -LiteralPath (Join-Path $stage 'assets') -Recurse -Force}
foreach($stale in @('index.html','icon.svg','runtime-endpoint.json','.nojekyll')){if(Test-Path -LiteralPath (Join-Path $stage $stale)){Remove-Item -LiteralPath (Join-Path $stage $stale) -Force}}
Copy-Item -Path (Join-Path $taskRoot 'dist\*') -Destination $stage -Recurse -Force
[IO.File]::WriteAllText((Join-Path $stage '.nojekyll'),'')
& $gitBin add -A;if($LASTEXITCODE -ne 0){throw '页面暂存失败'}
& $gitBin diff --cached --quiet
if($LASTEXITCODE -ne 0){& $gitBin commit -m ('Publish DUO PLAY '+(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'));if($LASTEXITCODE -ne 0){throw '页面提交失败'}}
$pushed=$false
for($attempt=0;$attempt -lt 3;$attempt++){
 & $gitBin -c http.version=HTTP/1.1 -c http.postBuffer=5242880 push -u origin gh-pages
 if($LASTEXITCODE -eq 0){$pushed=$true;break}
 $wanted=(& $gitBin rev-parse HEAD).Trim();$remote=(& $gitBin ls-remote origin refs/heads/gh-pages 2>$null)
 if($remote -and $remote.StartsWith($wanted)){$pushed=$true;break}
 if($attempt -lt 2){Write-Host 'GitHub 连接中断，正在重试页面推送…';Start-Sleep -Seconds 2}
}
if(-not $pushed){throw '页面推送失败'}
Write-Host '已推送 GitHub Pages 发布分支：https://yjj0339.github.io/duo-play/'
# 仅推分支不会立刻刷新线上站点，需要显式触发一次 Pages 重建
$ghBin='D:\codexAI\.runtime\github-cli\gh.exe'
if(Test-Path -LiteralPath $ghBin){
 $env:GH_CONFIG_DIR='D:\codexAI\.runtime\github-config'
 try{
  & $ghBin api -X POST repos/yjj0339/duo-play/pages/builds | Out-Null
  if($LASTEXITCODE -eq 0){Write-Host '已触发 GitHub Pages 重建，线上页面约 1 分钟内更新。'}
  else{Write-Warning 'Pages 重建未触发，线上可能仍是旧版本，可用 GitHub 页面设置手动重建。'}
 }catch{Write-Warning 'Pages 重建未触发，线上可能仍是旧版本。'}
}
