#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
workspace="${DIR}/workspace"

[ -d "$workspace" ] && rm -rf "$workspace"
mkdir "$workspace"
cd "$workspace"

npm init -y
npm install --save "${DIR}/.."
clear

PATH="${workspace}/node_modules/.bin:${PATH}"

# ------------------------------------------------------------------------------

# =================================
# master manifest w/
# - several bitrates
# - no encryption
# =================================
# http://inisoft.tv/demo/demo_desh.html
# https://ext.inisoft.tv/demo.xml
# =================================
hls_url='https://ext.inisoft.tv/demo/ED/hls_v4/demo.m3u8'
wrk_dir="${workspace}/1"

mkdir "${wrk_dir}"
mkdir "${wrk_dir}/1. hls"
mkdir "${wrk_dir}/2. mp4"

hlsdl -mc 5 --url "$hls_url" -P "${wrk_dir}/1. hls" --mp4 "${wrk_dir}/2. mp4/video.mp4"

# ------------------------------------------------------------------------------

# =================================
# video manifest only
# - heavy encryption
#   (each video segment has a unique encryption key)
# =================================
# http://demo.theoplayer.com/drm-aes-protection-128-encryption
# =================================
hls_url='https://cdn.theoplayer.com/video/big_buck_bunny_encrypted/stream-800/index.m3u8'
wrk_dir="${workspace}/2"

mkdir "${wrk_dir}"
mkdir "${wrk_dir}/1. hls"
mkdir "${wrk_dir}/2. mp4"

hlsdl -mc 5 --url "$hls_url" -P "${wrk_dir}/1. hls" --mp4 "${wrk_dir}/2. mp4/video.mp4"

# ------------------------------------------------------------------------------

# =================================
# master manifest w/
# - several bitrates
# - no encryption
# - 3x audio streams
# - 6x subtitles streams
# =================================
# https://developer.jwplayer.com/jw-player/demos/toolbox/closed-captions/
# =================================
hls_url='https://wowzaec2demo.streamlock.net/vod-multitrack/_definst_/smil:ElephantsDream/elephantsdream2.smil/playlist.m3u8'
wrk_dir="${workspace}/3"

mkdir "${wrk_dir}"
mkdir "${wrk_dir}/1. hls"
mkdir "${wrk_dir}/2. mp4"

# workaround for TLS error: "certificate has expired"
NODE_TLS_REJECT_UNAUTHORIZED=0 && \

hlsdl -hq -fa '^english$' -as -mc 5 --url "$hls_url" -P "${wrk_dir}/1. hls" --mp4 "${wrk_dir}/2. mp4/video.mp4"

# ------------------------------------------------------------------------------

# =================================
# master manifest w/
# - several bitrates
# - no encryption
# - no audio streams
# - 12x subtitles streams (total)
# -  6x subtitles streams (unique)
# =================================
# https://roosterteeth.com/watch/rwby-volume-6-1
# https://svod-be.roosterteeth.com/api/v1/watch/rwby-volume-6-1/videos
# =================================
hls_url='https://svod-be.roosterteeth.com/api/v1/videos/4cde6796-0a42-4b57-bb3c-dc520042b539/master.m3u8'
wrk_dir="${workspace}/4"

mkdir "${wrk_dir}"
mkdir "${wrk_dir}/1. hls"
mkdir "${wrk_dir}/2. mp4"

hlsdl -hq -sv -sa -as -mc 5 --url "$hls_url" -P "${wrk_dir}/1. hls" --mp4 "${wrk_dir}/2. mp4/video.mp4"

# ------------------------------------------------------------------------------
