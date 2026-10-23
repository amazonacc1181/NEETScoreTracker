# NEET IQ — Android NEET preparation workspace

NEET IQ AI 3.0 adds an optional real on-device generative language model to the existing local-first NEET workspace. The app remains useful without a downloaded model.

## What's new in 3.0
- Local generative AI: JNI integration with llama.cpp for GGUF inference on Android arm64-v8a. Ask AI no longer uses cloud inference or an API key.
- Model manager: download and store Qwen3 GGUF weights in app-private storage, check GGUF header/size, show progress, and run an actual generation test from the phone.
- Qwen3 1.7B Q4_K_M (~1.28 GB) is the safer default; Qwen3 4B Q4_K_M (~2.50 GB) is offered only on phones reporting at least 6 GB total RAM. Performance depends on free RAM, chipset, thermal state and OS.
- Retrieval-augmented prompts: Ask AI supplies bounded local context from saved questions, explanations, test summaries, mistake journal and topic-risk analysis.
- Fine-tuning pipeline: ai-models/finetune prepares supervised chat data and runs LoRA fine-tuning. A trained adapter must be evaluated, merged/exported, converted to GGUF and tested before shipping.
- Offline evaluation assets under ai-models/eval.

## Important model status
The APK contains the inference runtime, not the model weights. After installation, open Ask AI → Install offline AI model and download a model once (Wi-Fi recommended). After download, the model can generate responses without internet. Model weights are not committed to this GitHub repository or embedded in the APK.

A successful Android build proves that the native runtime compiled and packaged; it does not prove inference works on every phone. Open the model manager and run Run an actual local inference test on the target device. The app must display generated text before local LLM inference is considered verified.

## Model and licenses
- Qwen3 base model family: Apache-2.0. Model card: https://huggingface.co/Qwen/Qwen3-1.7B-GGUF
- Quantized files used by the downloader: https://huggingface.co/bartowski/Qwen_Qwen3-1.7B-GGUF and https://huggingface.co/bartowski/Qwen_Qwen3-4B-GGUF. Quantized weights are third-party artifacts; inspect model cards and file licenses before redistribution.
- llama.cpp: MIT license; source is fetched by CMake from https://github.com/ggml-org/llama.cpp.
- This repository intentionally does not redistribute model weights.

## Android hardware and storage
- Native build targets arm64-v8a. The app uses a 2,048-token context and caps generation to reduce peak RAM.
- Qwen3 1.7B Q4_K_M requires about 1.28 GB for weights plus runtime/context overhead; keep at least 1.5 GB free before download.
- Qwen3 4B Q4_K_M is about 2.50 GB and needs substantially more free RAM; a 6 GB total-RAM gate is only a heuristic.
- If model loading fails, close background apps, try the smaller model and ensure the file is complete. This implementation uses CPU inference; speed varies by device.

## Fine-tuning
See ai-models/finetune/README.md. Start with licensed, verified educational examples. The training script is a pipeline scaffold; no fine-tuned model is claimed to have been trained or included.

## Build
GitHub Actions installs Android NDK/CMake, builds the JNI library and APK, validates training data and uploads NEET-IQ-AI-3.0-APK. Native CMake fetches llama.cpp during CI, so the first build requires network access.

## Existing features
Mock test tracker with +4/-1 scoring, subject score history, analytics, target score, Question Lab with imports, full-workspace backup/import, mistake journal, planner, focus timer, formula vault and local topic-risk statistics. Saved data stays local; the Ask AI local path does not send chat data to a remote model.

## Limitations
- No OCR or automatic PDF/image ingestion is implemented by this change.
- The LLM may hallucinate; verify high-stakes answers against NCERT and official sources.
- A 1.7B model is materially less capable than cloud frontier models. Best local reasoning is constrained by phone RAM, speed and storage.
- No physical device is attached to GitHub Actions; on-device inference must be verified manually with the model manager test.
