# 一键部署到 GitHub Pages（需先 gh auth login）
# 用法: powershell -ExecutionPolicy Bypass -File tools\deploy.ps1 [-RepoName heritage-alive-ar]
param([string]$RepoName = "heritage-alive-ar")

Set-Location (Split-Path $PSScriptRoot -Parent)

gh auth status | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "请先运行: gh auth login （选 GitHub.com → HTTPS → 浏览器登录），然后重跑本脚本" -ForegroundColor Yellow
  exit 1
}

$user = gh api user -q .login
if ($LASTEXITCODE -ne 0 -or -not $user) { Write-Host "获取 GitHub 用户失败" -ForegroundColor Red; exit 1 }
Write-Host "GitHub 用户: $user"

if (-not (Test-Path .git)) { git init -b main | Out-Null }
git add -A
git -c core.quotepath=false commit -m "deploy: 《非遗活了》活路儿AR系列互动海报"
# 无改动时 commit 返回非零，忽略

$hasOrigin = (git remote) -contains "origin"
if (-not $hasOrigin) {
  gh repo create $RepoName --public --source . --remote origin --push
  if ($LASTEXITCODE -ne 0) { Write-Host "建仓失败（若重名可加参数 -RepoName 换名）" -ForegroundColor Red; exit 1 }
} else {
  git push -u origin main
}

# 将 site/ 内容发布为 gh-pages 分支
git branch -D gh-pages-tmp
git subtree split --prefix site -b gh-pages-tmp
if ($LASTEXITCODE -ne 0) { Write-Host "subtree split 失败" -ForegroundColor Red; exit 1 }
git push origin gh-pages-tmp:gh-pages --force
git branch -D gh-pages-tmp

# 启用 Pages（已存在则更新）
gh api -X POST -H "Accept: application/vnd.github+json" "repos/$user/$RepoName/pages" -f "source[branch]=gh-pages" -f "source[path]=/"
if ($LASTEXITCODE -ne 0) {
  gh api -X PUT -H "Accept: application/vnd.github+json" "repos/$user/$RepoName/pages" -f "source[branch]=gh-pages" -f "source[path]=/"
}

$url = "https://$user.github.io/$RepoName/"
Write-Host "`n部署完成（Pages 生效约需 1-2 分钟）: $url" -ForegroundColor Green
node tools\gen-qr.mjs $url
Write-Host "提交材料/作品二维码.png 已指向正式链接" -ForegroundColor Green
