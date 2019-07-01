const grep_argv = require('./grep_argv')

const path = require('path')
const fs   = require('fs')

const argv_flags = {
  "--help":                   {bool:  true},
  "--version":                {bool:  true},
  "--no-clobber":             {bool:  true},
  "--continue":               {bool:  true},

  "--url":                    {},
  "--max-concurrency":        {num:   "int"},

  "--directory-prefix":       {},
  "--mp4":                    {},

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

const get_merged_argv_flags = function(){
  let argv_flags_merged = {...argv_flags}
  let key, flag_opts, aliases, alias

  for (key in argv_flag_aliases){
    flag_opts = argv_flags[key]
    aliases   = argv_flag_aliases[key]

    if ((flag_opts instanceof Object) && (Array.isArray(aliases))){
      for (alias of aliases){
        argv_flags_merged[alias] = flag_opts
      }
    }
  }

  return argv_flags_merged
}

const normalize_argv_vals = function(){
  if (!(argv_vals instanceof Object)) return

  let key, argv_val, aliases, alias

  for (key in argv_flag_aliases){
    argv_val = argv_vals[key]
    aliases  = argv_flag_aliases[key]

    if ((!argv_val) && (Array.isArray(aliases))){
      for (alias of aliases){
        argv_val = argv_vals[alias]
        if (argv_val) {
          argv_vals[key] = argv_val
          break
        }
      }
    }
  }
}

let argv_vals
try {
  argv_vals = grep_argv(get_merged_argv_flags(), true)

  normalize_argv_vals()
}
catch(e) {
  console.log('ERROR: ' + e.message)
  process.exit(0)
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
