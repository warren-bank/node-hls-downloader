const {request, download}  = require('@warren-bank/node-request-cli')

const url_parse = require('url').parse
const path      = require('path')
const fs        = require('fs')
const readline  = require('readline')
const spawn     = require('child_process').exec

// -----------------------------------------------------------------------------
// returns a Promise that resolves after all downloads are complete.

const process_cli = function(argv_vals){
  let subtitle_names

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  rl.pause()

  const validate_url = function(url){
    if (typeof url === 'string') {
      try {
        url = url.trim()

        let parsed = url_parse(url)
        if (!parsed.protocol || !parsed.hostname || !parsed.pathname) throw 'err'
        if (parsed.protocol.toLowerCase().indexOf('http') !== 0)      throw 'err'
      }
      catch(err) {
        url = null
      }
    }
    else {
      url = null
    }
    return url
  }

  const prompt_url = function(){
    return new Promise((resolve, reject) => {
      if (!argv_vals["--url"]) {
        console.clear()
        rl.resume()
        rl.question('URL of master manifest: ', (url) => {
          url = validate_url(url)
          if (url) {
            argv_vals["--url"] = url
            rl.pause()
            resolve(url)
          }
          else {
            resolve(prompt_url())
          }
        })
      }
      else {
        resolve(argv_vals["--url"])
      }
    })
  }

  const prompt_bandwidth = function(streams){
    return new Promise((resolve, reject) => {
      console.clear()
      console.log('available streams:')
      streams.forEach((stream, index) => {
        console.log(' ', `#${index + 1}:`)
        console.log('   ', 'bandwidth (bits/sec):', stream.bandwidth)
        if (stream.resolution)
          console.log('   ', 'resolution (WxH):', stream.resolution)
      })
      console.log('')

      rl.resume()
      rl.question('choose stream by index #: ', (index) => {
        try {
          index = Number.parseInt(index)

          if (!index)    throw 'err'
          index--

          if ((index < 0) || (index >= streams.length)) throw 'err'

          resolve(streams[index])
        }
        catch(err){
          resolve(prompt_bandwidth(streams))
        }
      })
    })
  }

  const prompt_media_stream = function(streams, media_type){
    return new Promise((resolve, reject) => {
      console.clear()
      console.log(`available ${media_type} streams:`)
      streams.forEach((stream, index) => {
        console.log(' ', `#${index + 1}:`)
        console.log('   ', stream.name)
      })
      console.log('')

      rl.resume()
      rl.question(`choose ${media_type} stream by index #: `, (index) => {
        try {
          index = Number.parseInt(index)

          if (!index)    throw 'err'
          index--

          if ((index < 0) || (index >= streams.length)) throw 'err'

          resolve(streams[index])
        }
        catch(err){
          resolve(prompt_media_stream(streams, media_type))
        }
      })
    })
  }

  const download_file = async function(url){
    let file
    try {
      file = await request(url)
      file = file.response.toString()
    }
    catch(err) {
      file = ""
    }
    return file
  }

  const get_streams = function(manifest){
    const streams = []
    const search_pattern     = /^#EXT-X-STREAM-INF.*?[:,]BANDWIDTH=(\d+)(?:,.*)?$/i
    const resolution_pattern = /[:,]RESOLUTION=(\d+x\d+)/i

    streams.filtered = 0

    if ((typeof manifest === 'string') && (manifest.length)) {
      let lines, i, line, match, bandwidth, url, resolution

      lines = manifest.split(/[\r\n]+/g)
      for (i=0; i < (lines.length - 1); i++) {
        line = lines[i].trim()
        match = search_pattern.exec(line)
        if (match !== null) {
          bandwidth  = Number.parseInt(match[1])
          url        = lines[i+1].trim()

          match      = resolution_pattern.exec(line)
          resolution = (match == null) ? null : match[1]

          if (argv_vals["--min-bandwidth"] && (bandwidth < argv_vals["--min-bandwidth"])) {
            streams.filtered++
            continue
          }
          if (argv_vals["--max-bandwidth"] && (bandwidth > argv_vals["--max-bandwidth"])) {
            streams.filtered++
            continue
          }

          streams.push({
            bandwidth,
            resolution,
            line,
            url
          })
        }
      }
    }

    streams.sort((a,b) => (a.bandwidth - b.bandwidth))

    return streams
  }

  const dedupe_media_streams = streams => {
    const urls = {}

    streams.forEach(obj => {
      if (urls[obj.url]) {
        // duplicate
        obj.url = null
      }
      else {
        urls[obj.url] = true
      }
    })
  }

  const get_media_streams = function(stream, manifest, base_url, media_type){
    media_type = media_type.toLowerCase()

    return new Promise((resolve, reject) => {
      // sanity check
      if ((media_type !== "audio") && (media_type !== "subtitles")) {
        resolve(null)
        return
      }

      const streams = []
      const media_pattern = new RegExp(`[:,]${media_type}="([^"]+)"`, "i")

      const match = media_pattern.exec(stream.line)
      if (match === null) {
        resolve(null)
        return
      }

      const media_group_id = match[1]
      const search_pattern = new RegExp(`^#EXT-X-MEDIA.*?[:,]TYPE=${media_type}.*?[,]GROUP-ID="${media_group_id}"`, "i")
      const uri_pattern    = /[:,]URI="([^"]+)"/i
      const name_pattern   = /[:,]NAME="([^"]+)"/i

      if ((typeof manifest === 'string') && (manifest.length)) {
        let lines, i, line, match, url, name

        lines = manifest.split(/[\r\n]+/g)
        for (i=0; i < lines.length; i++) {
          line = lines[i].trim()

          if (!search_pattern.test(line))
            continue

          match = uri_pattern.exec(line)
          if (match === null)
            continue
          url = resolve_relative_url(match[1], base_url)

          match = name_pattern.exec(line)
          if (match === null)
            continue
          name = match[1].toLowerCase()

          streams.push({
              name,
              url,
              line
          })
        }
      }

      dedupe_media_streams(streams)

      if (streams.length === 0) {
        resolve(null)
      }
      else if (streams.length === 1) {
        resolve(streams)
      }
      else if ((media_type === "audio") && argv_vals["--all-audio"]) {
        resolve(streams)
      }
      else if ((media_type === "audio") && argv_vals["--filter-audio"]) {
        resolve(
          streams.filter(stream => argv_vals["--filter-audio"].test(stream.name))
        )
      }
      else if ((media_type === "subtitles") && argv_vals["--all-subtitles"]) {
        resolve(streams)
      }
      else if ((media_type === "subtitles") && argv_vals["--filter-subtitles"]) {
        resolve(
          streams.filter(stream => argv_vals["--filter-subtitles"].test(stream.name))
        )
      }
      else {
        resolve(
          prompt_media_stream(streams, media_type)
          .then(stream => [stream])
        )
      }
    })
  }

  const get_audio_streams = function(stream, manifest, base_url){
    return get_media_streams(stream, manifest, base_url, "audio")
  }

  const get_subtitle_streams = function(stream, manifest, base_url){
    return get_media_streams(stream, manifest, base_url, "subtitles")
  }

  const get_unique_stream_names = streams => {
    let names
    names = streams.map(stream => stream.name)
    names = [...new Set(names)]
    return names
  }

  const resolve_relative_url = function(url, base_url){
    let parsed = new URL(url, base_url)
    return parsed.href
  }

  const process_stream_manifest_data = function(manifest_data, base_url, file_ext, ...sub_directory){
    const no_result = Promise.resolve(null)

    if (!manifest_data) return no_result

    const get_local_path = function(url){
      let path_sep, dirname, filename

      path_sep = '/'
    //dirname  = sub_directory.join(path_sep) + path_sep               // relative to master manifest
      dirname  = sub_directory[sub_directory.length - 1] + path_sep    // relative to "local_manifest_path"
      filename = path.basename(url_parse(url).pathname)

      return (dirname + filename)
    }

    const key_pattern  = /^(#EXT-X-KEY.*?[:,]URI=")([^"]+)(".*)$/i
    const lines        = manifest_data.split(/[\r\n]+/g)
    let local_manifest = []
    const data_urls    = []
    const key_urls     = []
    let data_url, data_name
    let key_url, key_name

    lines.forEach(line => {
      line = line.trim()
      if (line.length && (line[0] !== '#')) {
        data_url = resolve_relative_url(line, base_url)
        data_name = `segment_${data_urls.length}.${file_ext}`
        data_urls.push({url: data_url, name: data_name})
        local_manifest.push(get_local_path(data_name))
      }
      else {
        let match = key_pattern.exec(line)
        if (match !== null) {
          key_url  = resolve_relative_url(match[2], base_url)
          key_name = `key_${key_urls.length}.dat`
          key_urls.push({url: key_url, name: key_name})
          local_manifest.push(match[1] + get_local_path(key_name) + match[3])
        }
        else {
          local_manifest.push(line)
        }
      }
    })
    if (!data_urls.length) return no_result
    local_manifest = local_manifest.join("\n")

    let output_dir = argv_vals["--directory-prefix"]
    sub_directory.forEach(child => {
      output_dir = path.join(output_dir, child)
      try {
        fs.mkdirSync(output_dir)
      }
      catch(err) {
        if (err.code !== 'EEXIST') throw err
      }
    })

    console.log(`starting download of ${data_urls.length} ${sub_directory[0]} data files..`)

    const promises = []
    let promise

    promise = download({
      "--input-file":       data_urls.map(obj => `${obj.url}\t${obj.name}`),
      "--directory-prefix": output_dir,
      "--no-clobber":       true,
      "--max-concurrency":  argv_vals["--max-concurrency"]
    })
    promises.push(promise)

    if (key_urls.length) {
      promise = download({
        "--input-file":       key_urls.map(obj => `${obj.url}\t${obj.name}`),
        "--directory-prefix": output_dir,
        "--no-clobber":       true,
        "--max-concurrency":  argv_vals["--max-concurrency"]
      })
      promises.push(promise)
    }

    {
      let local_manifest_path = output_dir + '.m3u8'
      fs.writeFileSync(local_manifest_path, local_manifest)
    }

    return Promise.all(promises)
  }

  const process_video_stream_data = function(video_manifest_data, base_url){
    return process_stream_manifest_data(video_manifest_data, base_url, "ts", "video")
  }

  const process_audio_stream_data = function(audio_manifest_data, base_url, name){
    return process_stream_manifest_data(audio_manifest_data, base_url, "aac", "audio", name)
  }

  const process_subtitle_stream_data = function(subtitle_manifest_data, base_url, name){
    return process_stream_manifest_data(subtitle_manifest_data, base_url, "vtt", "subtitles", name)
  }

  const save_local_master_manifest = function(stream, audio_streams, subtitle_streams){
    const update_line = function(line, ...sub_directory) {
      let local_path = sub_directory.join('/') + '.m3u8'
      return line.replace(/([:,]URI=")([^*]+)(")/ig, `$1${local_path}$3`)
    }

    let local_manifest = []
    let local_manifest_path

    local_manifest.push("#EXTM3U")
    local_manifest.push("#EXT-X-VERSION:4")

    if (Array.isArray(audio_streams) && (audio_streams.length)) {
      audio_streams.forEach(audio_stream => {
        if (audio_stream.line && audio_stream.name) {
          local_manifest.push(
            update_line(audio_stream.line, "audio", audio_stream.name)
          )
        }
      })
    }

    if (Array.isArray(subtitle_streams) && (subtitle_streams.length)) {
      subtitle_streams.forEach(subtitle_stream => {
        if (subtitle_stream.line && subtitle_stream.name) {
          local_manifest.push(
            update_line(subtitle_stream.line, "subtitles", subtitle_stream.name)
          )
        }
      })
    }

    local_manifest.push(stream.line)
    local_manifest.push("video.m3u8")
    local_manifest.push("")

    local_manifest      = local_manifest.join("\n")
    local_manifest_path = path.join(argv_vals["--directory-prefix"], 'master.m3u8')

    fs.writeFileSync(local_manifest_path, local_manifest)
  }

  const process_stream = async function(stream, manifest, base_url){
    let audio_streams, subtitle_streams
    let url, manifest_data

    // ===================================
    // Determine additional stream assets:
    // ===================================

    await get_audio_streams(stream, manifest, base_url)
    .then(streams => {
      audio_streams = streams
    })

    await get_subtitle_streams(stream, manifest, base_url)
    .then(streams => {
      subtitle_streams = streams

      if (Array.isArray(streams)) {
        subtitle_names = get_unique_stream_names(streams)
      }
    })

    // ===================================
    // Save a modified master manifest:
    // ===================================

    save_local_master_manifest(stream, audio_streams, subtitle_streams)

    // ===================================
    // begin downloads..
    // ===================================

    console.clear()

    if (!argv_vals["--skip-video"]) {
      url = resolve_relative_url(stream.url, base_url)
      manifest_data = await download_file(url)
      await process_video_stream_data(manifest_data, url)

      console.log("done")
      console.log("")
    }

    if (!argv_vals["--skip-audio"] && Array.isArray(audio_streams) && (audio_streams.length)) {
      for (const audio_stream of audio_streams) {
        if (audio_stream.url && audio_stream.name) {
          url = audio_stream.url  // already resolved
          manifest_data = await download_file(url)
          await process_audio_stream_data(manifest_data, url, audio_stream.name)

          console.log("done")
          console.log("")
        }
      }
    }

    if (!argv_vals["--skip-subtitles"] && Array.isArray(subtitle_streams) && (subtitle_streams.length)) {
      for (const subtitle_stream of subtitle_streams) {
        if (subtitle_stream.url && subtitle_stream.name) {
          url = subtitle_stream.url  // already resolved
          manifest_data = await download_file(url)
          await process_subtitle_stream_data(manifest_data, url, subtitle_stream.name)

          console.log("done")
          console.log("")
        }
      }
    }

    console.log("download complete.")
    console.log("")
  }

  const run_main = async function(){
    await prompt_url()
    //console.log('manifest url:', "\n", argv_vals["--url"])

    const manifest = await download_file(argv_vals["--url"])
    //console.log('manifest data:', "\n", manifest)

    const streams = get_streams(manifest)
    //console.log('available streams:', "\n", streams)

    if (streams.length === 0) {
      if (streams.filtered === 0) {
        // process manifest as a video stream

        await process_video_stream_data(manifest, argv_vals["--url"])

        console.log("done")
        console.log("")
      }
      else {
        // all video streams in the master manifest have been filtered by min/max bandwidth restrictions

        console.log('ERROR: No video streams in master manifest pass the min/max bandwidth filter criteria')
        process.exit(0)
      }
    }
    else if (streams.length === 1) {
      // process the only available stream

      await process_stream(streams[0], manifest, argv_vals["--url"])
    }
    else if (argv_vals["--highest-quality"]) {
      // process the highest quality stream without user interaction

      let index = streams.length - 1
      await process_stream(streams[index], manifest, argv_vals["--url"])
    }
    else if (argv_vals["--lowest-quality"]) {
      // process the lowest quality stream without user interaction

      let index = 0
      await process_stream(streams[index], manifest, argv_vals["--url"])
    }
    else {
      // prompt the user to choose a stream

      const stream = await prompt_bandwidth(streams)
      //console.log('chosen stream:', stream)

      await process_stream(stream, manifest, argv_vals["--url"])
    }
  }

  const run_ffmpeg = function(){
    return run_ffmpeg_conversion_video()
    .then(() => {
      return run_ffmpeg_conversion_subtitles()
    })
  }

  const run_ffmpeg_conversion_video = function(){
    return new Promise((resolve, reject) => {
      if (!argv_vals["--mp4"]) {
        resolve()
        return
      }

      const manifests = {
        master: {
          path: path.join(argv_vals["--directory-prefix"], 'master.m3u8')
        },
        video: {
          path: path.join(argv_vals["--directory-prefix"], 'video.m3u8')
        }
      }
      manifests.master.found = fs.existsSync(manifests.master.path)
      manifests.video.found  = fs.existsSync(manifests.video.path)

      if (!manifests.video.found) {
        if (argv_vals["--skip-video"])
          resolve()
        else
          reject(new Error('ffmpeg error: HLS manifest not found'))
        return
      }

      const manifest = (manifests.master.found)
        ? manifests.master.path
        : manifests.video.path

      console.log("starting ffmpeg conversion of HLS stream to mp4 file..")

      const log = '-nostats -hide_banner -loglevel panic'
      const cmd = `ffmpeg ${log} -allowed_extensions ALL -i "${manifest}" -c copy -movflags +faststart ${argv_vals["--mp4-ffmpeg-options"] || ''} "${argv_vals["--mp4"]}"`
      const opt = {cwd: argv_vals["--directory-prefix"]}
      spawn(cmd, opt, (error, stdout, stderr) => {
        if (error) {
          console.log("ffmpeg error:")

          reject(error)
        }
        else {
          console.log("done")
          console.log("")

          resolve()
        }
      })
    })
  }

  const run_ffmpeg_conversion_subtitles = async function(){
    if (!argv_vals["--mp4"]) return

    if (!Array.isArray(subtitle_names)) return

    while (subtitle_names.length) {
      await run_ffmpeg_conversion_srt()
    }
  }

  const run_ffmpeg_conversion_srt = function(){
    return new Promise((resolve, reject) => {
      if (!argv_vals["--mp4"]) {
        resolve()
        return
      }

      if (!Array.isArray(subtitle_names)) {
        resolve()
        return
      }

      const subtitle_dir = path.join(argv_vals["--directory-prefix"], 'subtitles')
      const lang         = subtitle_names.shift()
      const manifest     = path.join(subtitle_dir, `${lang}.m3u8`)
      const srt_file     = argv_vals["--mp4"].replace(/(?:\.mp4)?$/i, `.${lang}.srt`)

      if (! fs.existsSync(manifest)) {
        resolve()
        return
      }

      console.log(`starting ffmpeg conversion of '${lang}' WebVTT subtitle stream to srt file..`)

      const cmd = `ffmpeg -allowed_extensions ALL -i "${manifest}" -codec:s text "${srt_file}"`
      const opt = {cwd: subtitle_dir}
      spawn(cmd, opt, (error, stdout, stderr) => {
        if (error) {
          console.log("ffmpeg error:")
          console.log(error)
          console.log("")
        }
        else {
          console.log("done")
          console.log("")
        }
        resolve()
      })
    })
  }

  return run_main()
  .then(() => {
    return run_ffmpeg()
  })
}

// -----------------------------------------------------------------------------

module.exports = {requestHTTP: request, downloadHTTP: download, downloadHLS: process_cli}
