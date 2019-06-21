@echo off

set DIR=%~dp0.
set workspace=%DIR%\workspace

if exist "%workspace%" rmdir /Q /S "%workspace%"
mkdir "%workspace%"
cd "%workspace%"

call npm init -y
call npm install --save "%DIR%\.."
cls

set PATH=%workspace%\node_modules\.bin;%PATH%

mkdir "%workspace%\1. hls"
mkdir "%workspace%\2. mp4"

call hlsdl --mc 5 --url "https://ext.inisoft.tv/demo/ED/hls_v4/demo.m3u8" -P "%workspace%\1. hls" --mp4 "%workspace%\2. mp4\video.mp4"

echo.
pause
