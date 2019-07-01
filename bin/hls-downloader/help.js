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

"-u" <URL>
"--url" <URL>
    Specify the URL of master manifest.

"-nc"
"--no-clobber"
    Do not allow output to overwrite existing data.
    Run an initial check before any downloading occurs, and exit with a warning if a collision is detected.

"-c"
"--continue"
   Do not reinitialize output directories (ie: recursively delete).
   Rather, reuse the existing directories and leave file contents unaltered.
   Run a check before each download, and skip if the data file already exists in the output directory.

"--mc" <integer>
"--max-concurrency" <integer>
"--threads" <integer>
    Specify the maximum number of URLs to download in parallel.
    The default is 1, which processes the download queue sequentially.

"-P" <dirpath>
"--directory-prefix" <dirpath>
    Specifies the directory where the resulting file structure will be saved to.
    The default is "." (the current directory).

"-sv"
"--skip-video"
    Skip processing of the video manifest.
    Do not download video data segments, or save a local video manifest.

"-sa"
"--skip-audio"
    Skip processing of all matching audio manifests.
    Do not download audio data segments, or save local audio manifest(s).

"-ss"
"--skip-subtitles"
    Skip processing of all matching subtitles manifests.
    Do not download subtitles data segments, or save local subtitles manifest(s).

"--minb" <integer>
"--min-bandwidth" <integer>
    Exclude video streams having a bandwidth less than this value.

"--maxb" <integer>
"--max-bandwidth" <integer>
    Exclude video streams having a bandwidth greater than this value.

"-hq"
"--highest-quality"
    Download the highest quality video stream without any user interaction.
    Does not include video streams filtered by min/max bandwidth restrictions.

"-lq"
"--lowest-quality"
    Download the lowest quality video stream without any user interaction.
    Does not include video streams filtered by min/max bandwidth restrictions.

"--all-audio"
    Download all audio streams in the group ID associated with the chosen video stream.

"--all-subtitles"
    Download all subtitle streams in the group ID associated with the chosen video stream.

"--filter-audio" <regex>
    Download all audio streams in the group ID associated with the chosen video stream, having a name that matches this case-insensitive regular expression pattern.

"--filter-subtitles" <regex>
    Download all subtitle streams in the group ID associated with the chosen video stream, having a name that matches this case-insensitive regular expression pattern.

"--mp4" <filepath>
    Indicates that "ffmpeg" should be used to bundle the downloaded video stream into an .mp4 file container.
    Specifies where the resulting .mp4 file will be saved.
    Does not modify audio/video encoding.
`

module.exports = help
