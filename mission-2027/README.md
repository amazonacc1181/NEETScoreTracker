# The White Coat Journal — NEET 2027

A static, mobile-first motivational and study companion website designed for a final NEET-UG attempt. It is intentionally hand-crafted as an editorial journal / cinematic campus experience rather than a template dashboard.

## Included
- Cinematic landing page and medical-college life imagery.
- Daily Biology, Chemistry and Physics checklist.
- Optional NEET date countdown (blank until the official date is known).
- Daily promise / streak, focus timer, study log and question counter.
- Local browser storage and JSON progress export.
- AIIMS directory: AIIMS New Delhi + the 22 PMSSY institutes, with status labels and official-site/video links.
- Campus-life YouTube discovery links and a student-made AIIMS Deoghar campus tour.
- YouTube embeds for selected songs, started only after the user presses Play.
- Lightweight PWA manifest and offline shell caching.

## Run locally
Open `index.html` in a modern browser. For service-worker/PWA behaviour, serve this folder over localhost or HTTPS.

## Publish on GitHub Pages
This project is in its own `mission-2027/` folder so it does not replace the Android NEETScoreTracker app. The workflow at `.github/workflows/deploy-mission.yml` publishes only this folder. In GitHub repository settings, open **Pages → Build and deployment → Source** and choose **GitHub Actions**. Then push to `main` or run the workflow manually. The project will be served from the repository's GitHub Pages URL.

## Privacy and data
No account or backend is used. Checklist, study notes, streaks and selected exam date are stored in localStorage on the current browser/device. Use **Export my progress** to download a JSON backup before changing devices or clearing browser data. Do not store sensitive information in the notes field.

## Media and attribution
- Campus photograph in the hero: AIIMS New Delhi image surfaced from Sartha's college profile.
- Other editorial photographs are hot-linked from Unsplash image CDN and may require an internet connection.
- Music remains on YouTube; the site uses official video embeds/search links and does not host or redistribute audio files.
- Campus video links include student-created content and are not official endorsements by AIIMS.

## AIIMS directory note
The directory contains 23 entries: AIIMS New Delhi plus 22 institutes approved under PMSSY. Status labels are simplified for this motivational site and should not be used for counselling decisions. Verify current status and seat availability from official notices.
