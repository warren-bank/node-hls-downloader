const help = `
usage:
======
hlsdl <options>

options:
========
"-h"
"--help"
    Print a help message describing all command-line options.

"-V"
"--version"
    Display the version.

"-u <URL>"
"--url <URL>"
    Specify the URL of master manifest.

"-nc"
"--no-clobber"
    Do not allow output to overwrite existing data.
    Run an initial check before any downloading occurs, and exit with a warning if a collision is detected.

"--mc" <integer>
"--max-concurrency" <integer>
"--threads" <integer>
    Specify the maximum number of URLs to download in parallel.
    The default is 1, which processes the download queue sequentially.

"-P <dirpath>"
"--directory-prefix <dirpath>"
    Specifies the directory where the resulting file structure will be saved to.
    The default is "." (the current directory).

"-hq"
"--highest-quality"
    Download the highest quality video stream without any user interaction.

"-lq"
"--lowest-quality"
    Download the lowest quality video stream without any user interaction.

"--all-audio"
    Download all audio streams in the group ID associated with the chosen video stream.

"--all-subtitles"
    Download all subtitle streams in the group ID associated with the chosen video stream.

"--filter-audio" <substring>
    Download all audio streams in the group ID associated with the chosen video stream, having a name that constains this substring.

"--filter-subtitles" <substring>
    Download all subtitle streams in the group ID associated with the chosen video stream, having a name that constains this substring.

"--mp4 <filepath>"
    Indicates that "ffmpeg" should be used to bundle the downloaded video stream into an .mp4 file container.
    Specifies where the resulting .mp4 file will be saved.
    Does not modify audio/video encoding.
`

module.exports = help
