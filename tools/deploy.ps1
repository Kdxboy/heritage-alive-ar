# 一键部署到 GitHub Pages（需先 gh auth login）
# 用法: powershell -ExecutionPolicy Bypass -File tools\deploy.ps1 [-RepoName heritage-alive-ar]
param([string]$RepoName = "heritage-alive-ar")

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

gh auth status 2>$null
if (-not $?) { Write-Host "请先运行: gh auth login （选 GitHub.com → HTTPS → 浏览器登录）" -ForegroundColor Yellow; exit 1 }

$user = gh api user -q .login
Write-Host "GitHub 用户: $user"

if (-not (Test-Path .git)) { git init -b main | Out-Null }
git add -A
git -c core.quotepath=false commit -m "《非遗活了》活路儿AR系列互动海报" 2>$null

$remote = git remote 2>$null
if ($remote -notcontains "origin") {
  gh repo create $RepoName --public --source . --remote origin --push
} else {
  git push -u origin main
}

# 将 site/ 内容发布为 gh-pages 分支
git branch -D gh-pages-tmp 2>$null
git subtree split --prefix site -b gh-pages-tmp
git push origin gh-pages-tmp:gh-pages --force
git branch -D gh-pages-tmp

# 启用 Pages（已存在则更新）
$pagesArgs = @('-H', 'Accept: application/vnd.github+json', "repos/$user/$RepoName/pages")
gh api -X POST @pagesArgs -f "source[branch]=gh-pages" -f "source[path]=/" 2>$null
if (-not $?) { gh api -X PUT @pagesArgs -f "source[branch]=gh-pages" -f "source[path]=/" 2>$null }

$url = "https://$user.github.io/$RepoName/"
Write-Host "`n部署完成（Pages 生效约需 1-2 分钟）: $url" -ForegroundColor Green
node tools\gen-qr.mjs $url
Write-Host "提交材料/作品二维码.png 已指向正式链接" -ForegroundColor Green
