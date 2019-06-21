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
hls_url='https://ext.inisoft.tv/demo/ED/hls_v4/demo.m3u8'
wrk_dir="${workspace}/1"

mkdir "${wrk_dir}"
mkdir "${wrk_dir}/1. hls"
mkdir "${wrk_dir}/2. mp4"

hlsdl --mc 5 --url "$hls_url" -P "${wrk_dir}/1. hls" --mp4 "${wrk_dir}/2. mp4/video.mp4"

# ------------------------------------------------------------------------------

# =================================
# video manifest only
# - heavy encryption
#   (each video segment has a unique encryption key)
# =================================
hls_url='https://cdn.theoplayer.com/video/big_buck_bunny_encrypted/stream-800/index.m3u8'
wrk_dir="${workspace}/2"

mkdir "${wrk_dir}"
mkdir "${wrk_dir}/1. hls"
mkdir "${wrk_dir}/2. mp4"

hlsdl --mc 5 --url "$hls_url" -P "${wrk_dir}/1. hls" --mp4 "${wrk_dir}/2. mp4/video.mp4"

# ------------------------------------------------------------------------------
