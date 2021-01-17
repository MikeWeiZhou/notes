# Media: Youtube Download
How to download Youtube videos with highest quality (up to 4K). Instructions are for Linux OS, even though the application works for Windows as well.

## Contents
- [Command Line Installation](#command-line-installation)
- [Manual Installation](#manual-installation)
- [Download Video](#download-video)

## Command Line Installation
Curl Installation:
```
sudo curl -L https://yt-dl.org/downloads/latest/youtube-dl -o /usr/local/bin/youtube-dl
sudo chmod a+rx /usr/local/bin/youtube-dl
```
Or wget:
```
sudo wget https://yt-dl.org/downloads/latest/youtube-dl -O /usr/local/bin/youtube-dl
sudo chmod a+rx /usr/local/bin/youtube-dl
```

## Manual Installation
1. Download latest [youtube-dl](https://github.com/ytdl-org/youtube-dl/releases)
    - Latest version at time of writing is 2021.01.16: [download cached version](./assets/files/media-youtube-dl-2021.01.16.tar.gz)
2. Unzip it with `tar -xf youtube-dl-2021.01.16.tar.gz`
3. Move extracted `/bin/youtube-dl` to `/usr/local/bin/youtube-dl` and run:
    ```
    sudo chmod a+rx /usr/local/bin/youtube-dl
    ```

## Download Video
- `youtube-dl --list-formats`
  - `python3 $(which youtube-dl) --list-formats`
- `youtube-dl --format bestvideo+bestaudio https://www.youtube.com/watch?v=7YM0KUYL-Xc`