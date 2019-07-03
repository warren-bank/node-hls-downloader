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

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: master manifest w/
rem :: - several bitrates
rem :: - no encryption
rem :: =================================
rem :: http://inisoft.tv/demo/demo_desh.html
rem :: https://ext.inisoft.tv/demo.xml
rem :: =================================
set hls_url="https://ext.inisoft.tv/demo/ED/hls_v4/demo.m3u8"
set wrk_dir=%workspace%\1

mkdir "%wrk_dir%"
mkdir "%wrk_dir%\1. hls"
mkdir "%wrk_dir%\2. mp4"

call hlsdl -mc 5 --url %hls_url% -P "%wrk_dir%\1. hls" --mp4 "%wrk_dir%\2. mp4\video.mp4"

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: video manifest only
rem :: - heavy encryption
rem ::   (each video segment has a unique encryption key)
rem :: =================================
rem :: http://demo.theoplayer.com/drm-aes-protection-128-encryption
rem :: =================================
set hls_url="https://cdn.theoplayer.com/video/big_buck_bunny_encrypted/stream-800/index.m3u8"
set wrk_dir=%workspace%\2

mkdir "%wrk_dir%"
mkdir "%wrk_dir%\1. hls"
mkdir "%wrk_dir%\2. mp4"

call hlsdl -mc 5 --url %hls_url% -P "%wrk_dir%\1. hls" --mp4 "%wrk_dir%\2. mp4\video.mp4"

rem :: -------------------------------------------------------------------------

rem :: =================================
rem :: master manifest w/
rem :: - several bitrates
rem :: - no encryption
rem :: - 3x audio streams
rem :: - 6x subtitles streams
rem :: =================================
rem :: https://developer.jwplayer.com/jw-player/demos/toolbox/closed-captions/
rem :: =================================
set hls_url="https://wowzaec2demo.streamlock.net/vod-multitrack/_definst_/smil:ElephantsDream/elephantsdream2.smil/playlist.m3u8"
set wrk_dir=%workspace%\3

mkdir "%wrk_dir%"
mkdir "%wrk_dir%\1. hls"
mkdir "%wrk_dir%\2. mp4"

call hlsdl -hq -fa "^english$" -as -mc 5 --url %hls_url% -P "%wrk_dir%\1. hls" --mp4 "%wrk_dir%\2. mp4\video.mp4"

rem :: -------------------------------------------------------------------------

echo.
pause
