# NEET IQ — Android NEET companion

NEET IQ is a native Android study workspace with a minimal, card-based interface.

## Features
- NEET mock score entry using +4 / −1 marking and subject limits (Physics 45, Chemistry 45, Biology 90).
- Locally saved test history, per-subject breakdown, personal best and average.
- Score trajectory chart and subject-strength analytics.
- Daily study checklist, focus timer, searchable formula vault and mistake journal.
- Ask AI screen for concept help and mock analysis using your own OpenAI API key.
- Left navigation drawer, right quick-tools drawer, and bottom navigation.
- Share/export a text/CSV-style performance report.

## Privacy and AI
Mock results, checklists and mistake notes stay in local app storage. Ask AI is optional and requires the user's own OpenAI API key. The key is encrypted using Android Keystore on the device; submitted questions and a small recent-test summary are sent to OpenAI for response generation. API use may be billed separately by OpenAI. No API key is embedded in the APK.

## Build
GitHub Actions builds a debug APK on every push to the main branch or manually from Actions. Download the artifact named NEET-IQ-Professional-APK from a successful run.
