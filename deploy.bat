@echo off
REM Deploys this folder to Vercel production.
REM %~dp0 is this file's own folder, so it works no matter where it's run from.
cd /d "%~dp0"
echo Deploying %CD% to production...
echo.
npx.cmd --yes vercel --prod --yes
echo.
pause
