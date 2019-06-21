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

mkdir "${workspace}/1. hls"
mkdir "${workspace}/2. mp4"

hlsdl --mc 5 --url "https://ext.inisoft.tv/demo/ED/hls_v4/demo.m3u8" -P "${workspace}/1. hls" --mp4 "${workspace}/2. mp4/video.mp4"
