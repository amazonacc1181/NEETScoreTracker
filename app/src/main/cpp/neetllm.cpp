#include <jni.h>
#include <android/log.h>
#include <algorithm>
#include <string>
#include <vector>
#include <thread>
#include "llama.h"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, "NEET-IQ-LLM", __VA_ARGS__)

extern "C" JNIEXPORT jstring JNICALL
Java_com_example_neetscoretracker_LocalLlmEngine_nativeGenerate(JNIEnv* env, jclass,
        jstring jModelPath, jstring jPrompt, jint maxTokens, jint contextSize, jint requestedThreads) {
    const char* modelChars = env->GetStringUTFChars(jModelPath, nullptr);
    const char* promptChars = env->GetStringUTFChars(jPrompt, nullptr);
    if (!modelChars || !promptChars) {
        if (modelChars) env->ReleaseStringUTFChars(jModelPath, modelChars);
        if (promptChars) env->ReleaseStringUTFChars(jPrompt, promptChars);
        return env->NewStringUTF("ERROR: Unable to read model path or prompt.");
    }
    const std::string modelPath(modelChars), prompt(promptChars);
    env->ReleaseStringUTFChars(jModelPath, modelChars); env->ReleaseStringUTFChars(jPrompt, promptChars);
    llama_backend_init();
    llama_model_params mp = llama_model_default_params();
    llama_model* model = llama_model_load_from_file(modelPath.c_str(), mp);
    if (!model) { llama_backend_free(); return env->NewStringUTF("ERROR: Model could not be loaded. Check GGUF file and free RAM."); }
    llama_context_params cp = llama_context_default_params();
    cp.n_ctx = static_cast<uint32_t>(std::max(512, std::min(4096, static_cast<int>(contextSize))));
    cp.n_batch = 256;
    const unsigned hc = std::max(2u, std::thread::hardware_concurrency());
    cp.n_threads = std::max(2, std::min(static_cast<int>(hc), static_cast<int>(requestedThreads)));
    cp.n_threads_batch = cp.n_threads;
    llama_context* ctx = llama_init_from_model(model, cp);
    if (!ctx) { llama_model_free(model); llama_backend_free(); return env->NewStringUTF("ERROR: Not enough memory for inference context. Try the smaller model or close other apps."); }
    const llama_vocab* vocab = llama_model_get_vocab(model);
    int32_t n = -llama_tokenize(vocab, prompt.c_str(), static_cast<int32_t>(prompt.size()), nullptr, 0, true, true);
    if (n <= 0 || n > 12000) { llama_free(ctx); llama_model_free(model); llama_backend_free(); return env->NewStringUTF("ERROR: Prompt is empty or too long."); }
    std::vector<llama_token> tokens(static_cast<size_t>(n));
    n = llama_tokenize(vocab, prompt.c_str(), static_cast<int32_t>(prompt.size()), tokens.data(), static_cast<int32_t>(tokens.size()), true, true);
    if (n <= 0) { llama_free(ctx); llama_model_free(model); llama_backend_free(); return env->NewStringUTF("ERROR: Tokenization failed."); }
    llama_batch batch = llama_batch_get_one(tokens.data(), n);
    if (llama_decode(ctx, batch) != 0) { llama_free(ctx); llama_model_free(model); llama_backend_free(); return env->NewStringUTF("ERROR: Model prefill failed; prompt may exceed context."); }
    llama_sampler* sampler = llama_sampler_chain_init(llama_sampler_chain_default_params());
    llama_sampler_chain_add(sampler, llama_sampler_init_top_k(30));
    llama_sampler_chain_add(sampler, llama_sampler_init_top_p(0.9f, 1));
    llama_sampler_chain_add(sampler, llama_sampler_init_temp(0.45f));
    llama_sampler_chain_add(sampler, llama_sampler_init_dist(42));
    std::string output; output.reserve(4096);
    const int limit = std::max(16, std::min(512, static_cast<int>(maxTokens)));
    for (int i=0; i<limit; ++i) {
        const llama_token token = llama_sampler_sample(sampler, ctx, -1);
        if (llama_vocab_is_eog(vocab, token)) break;
        char piece[2048];
        const int pieceLen = llama_token_to_piece(vocab, token, piece, sizeof(piece), 0, false);
        if (pieceLen > 0) output.append(piece, static_cast<size_t>(pieceLen));
        if (output.size() > 24000) break;
        llama_token nextToken = token;
        llama_batch next = llama_batch_get_one(&nextToken, 1);
        if (llama_decode(ctx, next) != 0) break;
    }
    llama_sampler_free(sampler); llama_free(ctx); llama_model_free(model); llama_backend_free();
    return env->NewStringUTF(output.c_str());
}
