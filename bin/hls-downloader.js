#! /usr/bin/env node

const argv_vals     = require('./hls-downloader/process_argv')
const {downloadHLS} = require('../lib/process_cli')

downloadHLS(argv_vals)
.catch(err => {
  console.log(err)
})
.then(() => {
  process.exit(0)
})
