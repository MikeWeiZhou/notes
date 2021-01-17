# Media: Downmix Surround Sound to AAC Stereo
> Taken directly from [this link](https://forums.plex.tv/t/how-to-downmix-surround-sound-to-aac-stereo-properly-using-ffmpeg-batch-converter/575073).

**These commands result in an MKV file that has an extra audio track added (at top “default” position) to it in the format of AAC stereo 160Kbps that has been downmixed without drowning out the center channel (dialogue), has dynamic range compression applied appropriately and also has high device compatibility - no more transcoding!**

```
Left channel
FC (front center)           x 1.414 (+3dB gain)
FL (front left)             x 0.707 (-3dB gain)
FLC - front left-of-center  x 0.5 (-6dB gain)
BL - back left              x 0.5 (-6dB gain)
SL - side left              x 0.5 (-6dB gain)
LFE - low frequency         x 0.5 (-6dB gain)

Right channel
FC (front center)           x 1.414 (+3dB gain)
FR (front right)            x 0.707 (-3dB gain)
FRC - front right-of-center x 0.5 (-6dB gain)
BR - back right             x 0.5 (-6dB gain)
SR - side right             x 0.5 (-6dB gain)
LFE - low frequency         x 0.5 (-6dB gain)
```

## Contents
- [Why FFmpeg Batch Converter](#why-ffmpeg-batch-converter)
- [Why AAC stero at 160Kbps](#why-aac-stereo-at-160kbps)
- [Compatible Source Sound Tracks](#compatible-source-sound-tracks)
- [Limitations](#limitations)
- [How To](#how-to)

## Why FFmpeg Batch Converter
I prefer to work with GUIs rather than CLIs, and this is the best frontend I could find for FFmpeg. What’s more, is it can batch process and multi-process!
Make sure to thank the developer of this nice little app.

## Why AAC stereo at 160Kbps
AAC stereo is the most compatible, and 160Kbps is the highest bitrate with the highest device compatibility.

## Compatible Source Sound Tracks
These commands will work on all Dolby and DTS surround sound formats:
- Dolby Digital, Dolby Digital Plus, Dolby TrueHD, Dolby Atmos, etc
- DTS, DTS-HD, DTS-HD Master Audio, DTS-X, etc

## Limitations
These commands will shift a maximum of 10 existing audio tracks and 10 existing subtitles tracks, as well as the chapters - hopefully that will cover most needs.

## How To
1. Download, install and run [FFmpeg Batch Converter](https://www.videohelp.com/software/FFmpeg-Batch)
2. Download [ff_batch.ini](./assets/files/media_ff_batch.ini).
3. In FFmpeg Batch Converter, open “Settings” and then “Restore settings” (note, this will overwrite any previous saved presets)
4. Browse to the unzipped “ff_batch.ini” file from step 2 and click “Open” (you should get a message “Configuration was restored successfully”)
5. Add source MKV files to the file list
6. Choose one of the three presets to run from the preset drop-down list (according to which audio track you want to downmix)
7. Adjust the number of CPU cores that you want to use, should you want to use “multi-file” processing
8. Encode (either “Start sequential” or “Start multi-file”)