# NEET IQ model components

## Offline model
`app/src/main/assets/neet_topic_risk_model.json` contains baseline parameters for the local topic-risk model. `NeetLocalModel.java` loads these parameters and updates topic risk from the user's answered question bank with Bayesian smoothing, difficulty weighting, and repeated errors. Question retrieval uses local term matching. It needs no network or ML runtime.

The model reports empirical practice patterns, not guaranteed predictions, official answer keys, or medical advice.

## Calibrating model parameters
`train_topic_risk.py` accepts a CSV of question attempts with `subject,chapter,difficulty,correct` columns. It calibrates the baseline error prior using the supplied labelled examples and exports the JSON model consumed by the Android app. Use real, correctly labelled attempts; don't train on guessed answer keys.

## LLM
The app's Ask AI client calls OpenAI's chat-completions API when the user supplies their own API key. The system prompt includes bounded context from locally stored tests, questions, mistakes, target and planner. The model weights for a general-purpose LLM are not committed to this repository; the on-device analyst remains available offline. OpenAI API use may be billed separately.
