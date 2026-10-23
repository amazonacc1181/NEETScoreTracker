# NEET IQ model fine-tuning pipeline

This pipeline is separate from Android APK builds. No model is trained by GitHub Actions.

1. Use a base model whose license permits your intended use. Initial target: Qwen/Qwen3-1.7B (Apache-2.0).
2. Create UTF-8 JSONL where each line contains messages with user and assistant roles, or prompt/completion fields.
3. Validate data: python prepare_sft.py raw.jsonl prepared.jsonl.
4. Install requirements in a CUDA Linux environment. The example uses Transformers, Datasets and PEFT; sufficient GPU memory is still required.
5. Train: python train_lora.py --train-jsonl prepared.jsonl --output-dir output/neet-iq-qwen3-lora.
6. Evaluate on held-out NEET questions, answer-key correctness, units/sign conventions, hallucination rate and option-by-option explanations. Do not evaluate only on training data.
7. Merge the adapter into the base model, export to GGUF with a compatible llama.cpp conversion workflow, quantize, and run the benchmark again on the target phone. Verify all license obligations.

Use legally obtained content and verified answer keys. Remove personal information. Keep source/edition/page and reviewer metadata where possible. Do not train on leaked exam content or unverified exam dumps. Split train/test by source or chapter to reduce leakage.

LoRA training needs a CUDA-capable GPU; a workstation with high VRAM is preferable. Phones are for inference, not training.
