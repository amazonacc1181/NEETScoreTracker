# NEET IQ — Android NEET preparation workspace

NEET IQ 2.0 is a native Android app with a minimalist interface, a local-first data store, question-level analysis, an adaptive topic-risk model, and optional online LLM reasoning.

## App features
- **Mock test tracker:** NEET marking (+4 / −1), validation of Physics (45), Chemistry (45) and Biology (90) question limits, score history, per-subject marks, average and best score.
- **Question Lab:** save the exact question stem, four options, correct key (optional), your selected answer (optional), chapter, subject, difficulty, explanation and personal notes. Search the library and edit or delete entries.
- **Question imports:** import a CSV or JSON question array, or a full exported workspace. CSV accepts headers such as `subject,chapter,question,optionA,optionB,optionC,optionD,correctAnswer,userAnswer,difficulty,explanation,note`.
- **Full-workspace backup:** export tests, question bank, mistakes, checklist progress, target settings and AI conversation as JSON. API secrets are intentionally excluded. Re-import merges into local storage.
- **Offline intelligence:** on-device analysis from saved data, question retrieval, topic-level risk estimates, accuracy statistics, suggested revision blocks and mistake patterns. Works with no internet and no API key.
- **Online Ask AI:** user-configured OpenAI API key for step-by-step reasoning about a question, options, solution and saved performance patterns. The model choice is configurable in Settings.
- **Study tools:** mock-score analytics, trend chart, six-task checklist, focus timer, searchable formula vault, mistake journal, shareable score report, question CSV export and full workspace backup.
- **Navigation:** scrollable main drawer, scrollable quick-tools drawer, and bottom navigation. All screens read from the same local preferences store.

## Offline model and model calibration
The app loads baseline parameters from `app/src/main/assets/neet_topic_risk_model.json`. `NeetLocalModel.java` applies Bayesian-smoothed topic error estimates with difficulty and repeated-error signals, ranks at-risk topics, and retrieves relevant stored questions using local term matching. This is an adaptive statistical model, not a pretrained general-purpose LLM or an official answer key.

The repository includes `ai-models/train_topic_risk.py`, a dependency-free calibration script for a labelled question-attempt CSV with these columns:

```csv
subject,chapter,difficulty,correct
Physics,Electrostatics,Hard,0
Biology,Genetics,Easy,1
```

Run it from the repository root:
```bash
python ai-models/train_topic_risk.py question_attempts.csv app/src/main/assets/neet_topic_risk_model.json
```

Use correctly labelled data only. The trained parameter file can be committed so the Android app uses the updated baseline the next time it is built.

## LLM and privacy
The general-purpose LLM runs through OpenAI's API after the user adds their own API key. The key is encrypted using Android Keystore and never included in the repository or exported backups. Only when a user submits an online Ask AI question does the app send that prompt plus bounded context from saved mock results, question examples, aggregate topic-risk data, mistake notes and planner status. A single request is bounded to avoid unexpectedly sending unlimited data. OpenAI API usage may be charged separately from a ChatGPT subscription.

Without an API key, Ask AI falls back to the on-device analyst. The offline mode can retrieve stored questions and analyse patterns, but it cannot solve arbitrary unseen question text with the linguistic ability of a large generative model. To ask the online LLM about a specific question, save it in Question Lab or paste the question into Ask AI and configure a key.

## Build and download
GitHub Actions validates the calibration script, builds the Android debug APK, and uploads the artifact `NEET-IQ-AI-2.0-APK` on pushes to `main`, pull requests, or manual workflow runs.

No API key or training dataset is committed to this repository.
