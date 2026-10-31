# The Last Mile — NEET 2027

A static, mobile-first study dashboard in a separate Git branch inside the NEETScoreTracker repository. The Android project on main is not changed.

## Publish with GitHub Pages

1. Open Settings, then Pages in this repository.
2. Under Build and deployment, choose Deploy from a branch.
3. Select branch the-last-mile and folder /(root), then press Save.
4. The published site URL will be:
   https://amazonacc1181.github.io/NEETScoreTracker/

The first deployment can take a few minutes.

## What's included

- Cinematic, responsive NEET 2027 personal dashboard.
- Editable provisional countdown. NEET 2027's official date is not assumed.
- Daily task checklist, local streak and seven-day activity view.
- 25 and 50-minute focus timer.
- Mock-test score log with average and personal best.
- Private journal saved in the current browser.
- AIIMS Deoghar goal wall and official institute link.
- Music player prepared for a playlist.
- Dark/light theme and a simple offline shell cache.

## Personal data

No account or server is used. Checklist history, scores, theme, target date and journal notes are stored in the browser's local storage on the device where you use the site. They do not automatically sync to another phone or computer. Clearing browser data can remove them.

## Music

Add only audio you own or are licensed to host and distribute. A public GitHub repository makes committed MP3 files publicly accessible; uploading a song file does not grant permission to redistribute it.

When you have rights to use a track, put it in the music folder and add it to music/playlist.json in this format:

    [
      {"title":"Track title","src":"music/track-file.mp3"}
    ]

For large audio collections, use an audio host or storage service designed for media rather than committing many large files to Git.

## Notes

- The default countdown date (2 May 2027) is an editable planning placeholder, not an NTA-confirmed date.
- Campus imagery is loaded from external image hosts; an internet connection is needed to display it.
- The site is plain HTML, CSS and JavaScript. No build step or framework is required.
