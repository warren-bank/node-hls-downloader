### [HLS Downloader](https://github.com/warren-bank/node-hls-downloader)

Command-line utility for downloading an offline copy of an HLS video stream.

#### Installation:

```bash
npm install --global @warren-bank/node-hls-downloader
```

#### Features:

* interactive command-line interface (CLI)
  * prompts for URL of the master manifest
    * when not given as a CLI option
  * prompts for video resolution
    * when multiple video streams are available in the master manifest
    * when not filtered by a CLI option
  * prompts for audio stream
    * when multiple are available in the group ID associated with the chosen video stream
    * when not filtered by a CLI option
  * prompts for subtitles stream
    * when multiple are available in the group ID associated with the chosen video stream
    * when not filtered by a CLI option
* resulting file structure:
  ```bash
    |- video/
    |  |- *.ts
    |- audio/
    |  |- {name}/
    |  |  |- *.ts
    |  |- {name}.m3u8
    |- subtitles/
    |  |- {name}/
    |  |  |- *.vtt
    |  |- {name}.m3u8
    |- video.m3u8
    |- master.m3u8
  ```

#### Limitations:

* only works with static (ie: _not_ live stream) playlists,<br>which include a complete list of all:
  * video segments
  * audio segments
  * subtitle segments
  * encryption keys

#### Usage:

```bash
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
    Download all audio streams in the group ID associated with the chosen video stream, having a name that contains this case-insensitive substring.

"--filter-subtitles" <substring>
    Download all subtitle streams in the group ID associated with the chosen video stream, having a name that contains this case-insensitive substring.

"--mp4 <filepath>"
    Indicates that "ffmpeg" should be used to bundle the downloaded video stream into an .mp4 file container.
    Specifies where the resulting .mp4 file will be saved.
    Does not modify audio/video encoding.
```

#### Example:

* [this test script](https://github.com/warren-bank/node-hls-downloader/blob/master/tests/run.sh) is a good introduction

#### Requirements:

* Node version: v6.4.0 (and higher)
  * [ES6 support](http://node.green/)
    * v0.12.18+: Promise
    * v4.08.03+: Object shorthand methods
    * v5.12.00+: spread operator
    * v6.04.00+: Proxy constructor
    * v6.04.00+: Proxy 'apply' handler
    * v6.04.00+: Reflect.apply
  * tested in:
    * v7.9.0
* FFmpeg
  * only required in `PATH` when using the `--mp4` CLI option
    * successfully tested with version: 4.1.3

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
