package com.example.neetscoretracker;
import android.content.Context;
import java.io.File;
/** JNI bridge for llama.cpp. This class never performs network requests. */
public final class LocalLlmEngine {
    private static final boolean NATIVE_READY;
    static { boolean loaded; try { System.loadLibrary("neetllm"); loaded=true; } catch(Throwable ignored) { loaded=false; } NATIVE_READY=loaded; }
    private LocalLlmEngine() {}
    private static native String nativeGenerate(String modelPath, String prompt, int maxTokens, int contextSize, int threads);
    public static boolean isNativeReady() { return NATIVE_READY; }
    public static String modelPath(Context c) {
        String name=c.getSharedPreferences("neet_iq_v2",Context.MODE_PRIVATE).getString("local_llm_model_file","Qwen_Qwen3-1.7B-Q4_K_M.gguf");
        return new File(new File(c.getFilesDir(),"models"),name).getAbsolutePath();
    }
    public static boolean isModelInstalled(Context c) {
        if (!NATIVE_READY) return false;
        File f=new File(modelPath(c)); return f.isFile() && f.length()>500L*1024L*1024L;
    }
    public static String generate(Context c,String prompt,int maxTokens) {
        if(!NATIVE_READY) throw new IllegalStateException("Native llama.cpp runtime is unavailable in this build.");
        File model=new File(modelPath(c));
        if(!model.isFile() || model.length()<500L*1024L*1024L) throw new IllegalStateException("No complete local model is installed.");
        String result=nativeGenerate(model.getAbsolutePath(),prompt,maxTokens,2048,4);
        if(result==null || result.startsWith("ERROR:")) throw new IllegalStateException(result==null?"No response from native runtime.":result.substring(6).trim());
        return result.trim().isEmpty()?"The local model returned an empty answer. Try a shorter prompt.":result.trim();
    }
}