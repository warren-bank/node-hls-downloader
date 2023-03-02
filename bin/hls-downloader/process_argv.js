const process_argv = require('@warren-bank/node-process-argv')

const path = require('path')
const fs   = require('fs')

const argv_flags = {
  "--help":                   {bool:  true},
  "--version":                {bool:  true},
  "--no-check-certificate":   {bool:  true},
  "--no-clobber":             {bool:  true},
  "--continue":               {bool:  true},

  "--url":                    {},
  "--max-concurrency":        {num:   "int"},

  "--directory-prefix":       {},
  "--mp4":                    {},
  "--mp4-ffmpeg-options":     {},

  "--skip-video":             {bool:  true},
  "--skip-audio":             {bool:  true},
  "--skip-subtitles":         {bool:  true},

  "--min-bandwidth":          {num:   "int"},
  "--max-bandwidth":          {num:   "int"},
  "--highest-quality":        {bool:  true},
  "--lowest-quality":         {bool:  true},

  "--all-audio":              {bool:  true},
  "--all-subtitles":          {bool:  true},
  "--filter-audio":           {regex: "i"},
  "--filter-subtitles":       {regex: "i"},
}

const argv_flag_aliases = {
  "--help":                   ["-h"],
  "--version":                ["-V"],
  "--no-check-certificate":   ["-ncc"],
  "--no-clobber":             ["-nc"],
  "--continue":               ["-c"],
  "--url":                    ["-u"],
  "--max-concurrency":        ["-mc", "--threads"],
  "--directory-prefix":       ["-P"],

  "--skip-video":             ["-sv"],
  "--skip-audio":             ["-sa"],
  "--skip-subtitles":         ["-ss"],

  "--min-bandwidth":          ["-minb"],
  "--max-bandwidth":          ["-maxb"],
  "--highest-quality":        ["-hq"],
  "--lowest-quality":         ["-lq"],

  "--all-audio":              ["-aa"],
  "--all-subtitles":          ["-as"],
  "--filter-audio":           ["-fa"],
  "--filter-subtitles":       ["-fs"]
}

let argv_vals = {}

try {
  argv_vals = process_argv(argv_flags, argv_flag_aliases)
}
catch(e) {
  console.log('ERROR: ' + e.message)
  process.exit(1)
}

if (argv_vals["--help"]) {
  const help = require('./help')
  console.log(help)
  process.exit(0)
}

if (argv_vals["--version"]) {
  const data = require('../../package.json')
  console.log(data.version)
  process.exit(0)
}

// =============================================================================
// references:
// =============================================================================
//   https://nodejs.org/api/cli.html#cli_environment_variables
//   https://nodejs.org/api/cli.html#cli_node_tls_reject_unauthorized_value
// =============================================================================
if (argv_vals["--no-check-certificate"]) {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
}

if (argv_vals["--continue"]) {
  argv_vals["--no-clobber"] = false
}

if (typeof argv_vals["--max-concurrency"] === 'number') {
  if (argv_vals["--max-concurrency"] < 2) {
    argv_vals["--max-concurrency"] = 1
  }
}

if (typeof argv_vals["--min-bandwidth"] === 'number') {
  if (argv_vals["--min-bandwidth"] < 0) {
    argv_vals["--min-bandwidth"] = 0
  }
}

if (typeof argv_vals["--max-bandwidth"] === 'number') {
  if (argv_vals["--max-bandwidth"] < 0) {
    argv_vals["--max-bandwidth"] = 0
  }
}

if (argv_vals["--min-bandwidth"] && argv_vals["--max-bandwidth"]) {
  if (argv_vals["--min-bandwidth"] > argv_vals["--max-bandwidth"]) {
    argv_vals["--min-bandwidth"] = 0
    argv_vals["--max-bandwidth"] = 0
  }
}

if (!argv_vals["--directory-prefix"]) {
  argv_vals["--directory-prefix"] = process.cwd()
}

if (argv_vals["--directory-prefix"]) {
  argv_vals["--directory-prefix"] = path.resolve(argv_vals["--directory-prefix"])

  if (! fs.existsSync(argv_vals["--directory-prefix"])) {
    console.log('ERROR: Output directory does not exist')
    process.exit(0)
  }

  // files
  ;["master.m3u8","video.m3u8"].forEach(child => {
    let childpath = path.join(argv_vals["--directory-prefix"], child)
    if (fs.existsSync(childpath)) {
      if (argv_vals["--no-clobber"]) {
        console.log('ERROR: Output file already exists @', childpath)
        process.exit(0)
      }
      else {
        // special case
        if ((child === "video.m3u8") && argv_vals["--continue"] && argv_vals["--skip-video"]) {
          // noop
        }
        else {
          fs.unlinkSync(childpath)
        }
      }
    }
  })

  // directories
  if (!argv_vals["--continue"]) {
    ;["audio","video","subtitles"].forEach(child => {
      let childpath = path.join(argv_vals["--directory-prefix"], child)
      if (fs.existsSync(childpath)) {
        if (argv_vals["--no-clobber"]) {
          console.log('ERROR: Output directory already exists @', childpath)
          process.exit(0)
        }
        else {
          try {
            fs.rmdirSync(childpath)
          }
          catch(e){
            console.log('ERROR: Unable to delete a non-empty output directory that already exists @', childpath)
            process.exit(0)
          }
        }
      }
    })
  }
}

if (argv_vals["--mp4"]) {
  argv_vals["--mp4"] = path.resolve(argv_vals["--mp4"])

  let output_dir = path.dirname(argv_vals["--mp4"])

  if (! fs.existsSync(output_dir)) {
    console.log('ERROR: Directory of output mp4 file does not exist')
    process.exit(0)
  }

  if (fs.existsSync(argv_vals["--mp4"])) {
    if (argv_vals["--no-clobber"]) {
      console.log('ERROR: Output mp4 file already exists')
      process.exit(0)
    }
    else {
      fs.unlinkSync(argv_vals["--mp4"])
    }
  }
}

module.exports = argv_vals
