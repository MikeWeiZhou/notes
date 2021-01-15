# Media: Downmix Surround Sound to AAC Stereo
> Taken directly from [this link](https://forums.plex.tv/t/how-to-downmix-surround-sound-to-aac-stereo-properly-using-ffmpeg-batch-converter/575073).

Hi all,

I have decided to make available my FFmpeg commands for FFmpeg Batch Converter that have taken me so long to come up with, but which will downmix surround sound to AAC stereo properly :slight_smile:

There are many FFmpeg commands sprinkled throughout the Plex forums and the internet for that matter.
What makes these commands different?

**These commands result in an MKV file that has an extra audio track added (at top “default” position) to it in the format of AAC stereo 160Kbps that has been downmixed without drowning out the center channel (dialogue), has dynamic range compression applied appropriately and also has high device compatibility - no more transcoding!**

## Why FFmpeg Batch Converter?
I prefer to work with GUIs rather than CLIs, and this is the best frontend I could find for FFmpeg. What’s more, is it can batch process and multi-process!
Make sure to thank the developer of this nice little app.

## Why AAC stereo at 160Kbps?
Our aim is to prevent transcoding, so device compatibility is a high priority. AAC stereo is the most compatible, and 160Kbps is the highest bitrate with the highest device compatibility.

Why not just use the default stereo downmix in Handbrake / VidCoder?
When encoding from surround sound to AAC stereo using the default FFmpeg downmix algorithm (-AC 2), the center channel (all the dialogue in movies/TV shows) is usually drowned out by loud left and right channels and sometimes even the surround channels.
Also, the dynamic range of surround sound tracks is quite large, meaning that the resulting downmixed stereo track’s volume needs to be forever turned up and down during playback.

___

These commands will shift a maximum of 10 existing audio tracks and 10 existing subtitles tracks, as well as the chapters - hopefully that will cover most needs.

I have played for many hours getting these settings right, but now that I am happy with them, I have run them on every single one of my MKV files.
The result on our 2.0 soundbar is brilliant!

___

**These commands will work on all Dolby and DTS surround sound formats:**

- Dolby Digital, Dolby Digital Plus, Dolby TrueHD, Dolby Atmos, etc
- DTS, DTS-HD, DTS-HD Master Audio, DTS-X, etc

___

## How To
1. Download, install and run [FFmpeg Batch Converter](https://www.videohelp.com/software/FFmpeg-Batch)
2. Download [ff_batch.ini](./assets/files/media_ff_batch.ini).
3. In FFmpeg Batch Converter, open “Settings” and then “Restore settings” (note, this will overwrite any previous saved presets)
4. Browse to the unzipped “ff_batch.ini” file from step 2 and click “Open” (you should get a message “Configuration was restored successfully”)
5. Add source MKV files to the file list
6. Choose one of the three presets to run from the preset drop-down list (according to which audio track you want to downmix)
7. Adjust the number of CPU cores that you want to use, should you want to use “multi-file” processing
8. Encode (either “Start sequential” or “Start multi-file”)