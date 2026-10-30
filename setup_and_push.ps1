# KakaoCord One-Click Push to GitHub
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " 🚀 KakaoCord GitHub 자동 푸시 & Vercel 배포 시스템" -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan

Set-Location $PSScriptRoot
node setup_and_push.js
