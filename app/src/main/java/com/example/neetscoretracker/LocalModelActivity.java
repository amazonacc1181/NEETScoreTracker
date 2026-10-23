package com.example.neetscoretracker;
import android.app.Activity;
import android.app.ActivityManager;
import android.app.AlertDialog;
import android.os.Bundle;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class LocalModelActivity extends Activity {
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private TextView status,progressText;
    private ProgressBar progress;
    private Button downloadSmall,downloadLarge,testButton;
    private volatile boolean downloading=false;
    private String selectedUrl,selectedFile,selectedName;
    private long selectedExpectedBytes;
    @Override public void onCreate(Bundle state){super.onCreate(state);render();}
    private void render(){
        ScrollView scroll=new ScrollView(this);
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(42,36,42,36);root.setBackgroundColor(0xFFF6F8FC);scroll.addView(root);setContentView(scroll);
        root.addView(text("NEET IQ · OFFLINE AI",22,0xFF141D30,true));
        root.addView(text("A real local language model using llama.cpp. Model weights are downloaded once and kept on this phone.",14,0xFF697488,false));
        root.addView(text("Runtime status",16,0xFF141D30,true));status=text("",13,0xFF141D30,false);root.addView(status);
        root.addView(text("Recommended for phones with limited RAM · Qwen3 1.7B Q4_K_M · about 1.28 GB",14,0xFF141D30,true));
        downloadSmall=button("Download Qwen3 1.7B (recommended)");root.addView(downloadSmall);downloadSmall.setOnClickListener(v->confirmDownload("small"));
        ActivityManager.MemoryInfo memory=new ActivityManager.MemoryInfo();((ActivityManager)getSystemService(ACTIVITY_SERVICE)).getMemoryInfo(memory);
        if(memory.totalMem>=6L*1024*1024*1024){root.addView(text("Higher reasoning · Qwen3 4B Q4_K_M · about 2.50 GB · needs more RAM and storage",14,0xFF141D30,true));downloadLarge=button("Download Qwen3 4B (high-memory phones)");root.addView(downloadLarge);downloadLarge.setOnClickListener(v->confirmDownload("large"));}
        else root.addView(text("Qwen3 4B is hidden because this phone reports limited total RAM. The 1.7B model is the safer choice.",12,0xFF697488,false));
        progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);progress.setMax(100);root.addView(progress);progressText=text("No download running",12,0xFF697488,false);root.addView(progressText);
        testButton=button("Run an actual local inference test");root.addView(testButton);testButton.setOnClickListener(v->runTest());
        Button back=button("Back to NEET IQ");root.addView(back);back.setOnClickListener(v->finish());
        Button delete=button("Delete installed model and free storage");root.addView(delete);
        delete.setOnClickListener(v->new AlertDialog.Builder(this).setTitle("Delete local model?").setMessage("This removes the downloaded weights from this phone. You can download them again later.").setNegativeButton("Cancel",null).setPositiveButton("Delete",(d,w)->{File f=new File(LocalLlmEngine.modelPath(this));if(f.exists())f.delete();getSharedPreferences("neet_iq_v2",MODE_PRIVATE).edit().remove("local_llm_model_file").remove("local_llm_model_name").apply();updateStatus();Toast.makeText(this,"Model deleted",Toast.LENGTH_SHORT).show();}).show());
        root.addView(text("Privacy: inference is local. Initial download needs internet; generation after installation does not. Weights are not bundled in the APK. Qwen3 is Apache-2.0; selected quantized files are published by bartowski. Review model cards before redistribution.",12,0xFF697488,false));updateStatus();
    }
    private TextView text(String value,int size,int color,boolean bold){TextView t=new TextView(this);t.setText(value);t.setTextSize(size);t.setTextColor(color);if(bold)t.setTypeface(null,1);t.setPadding(0,9,0,9);return t;}
    private Button button(String value){Button b=new Button(this);b.setText(value);b.setAllCaps(false);LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);lp.topMargin=8;lp.bottomMargin=8;b.setLayoutParams(lp);return b;}
    private void updateStatus(){
        String msg=LocalLlmEngine.isNativeReady()?"Native runtime: available":"Native runtime: unavailable in this build";File f=new File(LocalLlmEngine.modelPath(this));
        if(f.isFile()&&f.length()>500L*1024*1024)msg+="\nInstalled: "+getSharedPreferences("neet_iq_v2",MODE_PRIVATE).getString("local_llm_model_name",f.getName())+" ("+String.format(Locale.US,"%.2f GB",f.length()/1073741824.0)+")";else msg+="\nNo complete model installed.";
        status.setText(msg);testButton.setEnabled(LocalLlmEngine.isNativeReady()&&f.isFile()&&f.length()>500L*1024*1024&&!downloading);
    }
    private void confirmDownload(String kind){
        if(downloading)return;
        if("large".equals(kind)){selectedUrl="https://huggingface.co/bartowski/Qwen_Qwen3-4B-GGUF/resolve/main/Qwen_Qwen3-4B-Q4_K_M.gguf?download=true";selectedFile="Qwen_Qwen3-4B-Q4_K_M.gguf";selectedName="Qwen3 4B Q4_K_M";selectedExpectedBytes=2500000000L;}
        else{selectedUrl="https://huggingface.co/bartowski/Qwen_Qwen3-1.7B-GGUF/resolve/main/Qwen_Qwen3-1.7B-Q4_K_M.gguf?download=true";selectedFile="Qwen_Qwen3-1.7B-Q4_K_M.gguf";selectedName="Qwen3 1.7B Q4_K_M";selectedExpectedBytes=1280000000L;}
        new AlertDialog.Builder(this).setTitle("Download "+selectedName+"?").setMessage("Large file: about "+String.format(Locale.US,"%.2f GB",selectedExpectedBytes/1073741824.0)+". Use Wi-Fi and keep enough free storage. After download, inference works offline.").setNegativeButton("Cancel",null).setPositiveButton("Download",(d,w)->downloadModel()).show();
    }
    private void downloadModel(){
        downloading=true;downloadSmall.setEnabled(false);if(downloadLarge!=null)downloadLarge.setEnabled(false);progress.setProgress(0);progressText.setText("Starting download…");updateStatus();
        worker.execute(()->{
            File dir=new File(getFilesDir(),"models");if(!dir.exists()&&!dir.mkdirs()){fail("Cannot create model directory.");return;}
            File part=new File(dir,selectedFile+".part");HttpURLConnection connection=null;
            try{
                long free=dir.getUsableSpace();if(free<selectedExpectedBytes*1.10)throw new IllegalStateException("Not enough free storage. Free more space and retry.");
                connection=(HttpURLConnection)new URL(selectedUrl).openConnection();connection.setConnectTimeout(20000);connection.setReadTimeout(60000);connection.setInstanceFollowRedirects(true);connection.setRequestProperty("User-Agent","NEET-IQ-Android/3.0");connection.connect();
                int code=connection.getResponseCode();if(code<200||code>=300)throw new IllegalStateException("Model host returned HTTP "+code);
                long total=-1;try{total=Long.parseLong(connection.getHeaderField("Content-Length"));}catch(Exception ignored){}
                try(BufferedInputStream in=new BufferedInputStream(connection.getInputStream());FileOutputStream out=new FileOutputStream(part)){
                    byte[] buffer=new byte[1024*1024];int count;long read=0,lastUi=0;
                    while((count=in.read(buffer))!=-1){out.write(buffer,0,count);read+=count;if(read-lastUi>4*1024*1024){lastUi=read;final long done=read,all=total>0?total:selectedExpectedBytes;runOnUiThread(()->{progress.setProgress((int)Math.min(100,done*100/Math.max(1,all)));progressText.setText(String.format(Locale.US,"Downloaded %.2f / %.2f GB",done/1073741824.0,all/1073741824.0));});}}
                    out.getFD().sync();
                }
                if(part.length()<selectedExpectedBytes*0.90)throw new IllegalStateException("Downloaded file is smaller than expected; rejected.");
                try(FileInputStream in=new FileInputStream(part)){byte[] h=new byte[4];if(in.read(h)!=4||h[0]!='G'||h[1]!='G'||h[2]!='U'||h[3]!='F')throw new IllegalStateException("Downloaded file is not a GGUF model.");}
                File target=new File(dir,selectedFile);if(target.exists()&&!target.delete())throw new IllegalStateException("Cannot replace existing model.");if(!part.renameTo(target))throw new IllegalStateException("Cannot finalize downloaded model.");
                getSharedPreferences("neet_iq_v2",MODE_PRIVATE).edit().putString("local_llm_model_file",selectedFile).putString("local_llm_model_name",selectedName).apply();
                runOnUiThread(()->{downloading=false;downloadSmall.setEnabled(true);if(downloadLarge!=null)downloadLarge.setEnabled(true);progress.setProgress(100);progressText.setText("Download complete. Run the inference test.");updateStatus();});
            }catch(Exception ex){part.delete();fail(ex.getMessage()==null?ex.getClass().getSimpleName():ex.getMessage());}finally{if(connection!=null)connection.disconnect();}
        });
    }
    private void fail(String message){runOnUiThread(()->{downloading=false;downloadSmall.setEnabled(true);if(downloadLarge!=null)downloadLarge.setEnabled(true);progressText.setText("Download failed: "+message);updateStatus();});}
    private void runTest(){
        testButton.setEnabled(false);progressText.setText("Loading model and generating text. First run can take a while…");
        worker.execute(()->{String result;try{result=LocalLlmEngine.generate(this,"<|im_start|>system\nYou are NEET IQ, an accurate NEET study tutor. Answer briefly. <|im_end|>\n<|im_start|>user\nExplain why electrons flow from anode to cathode in a galvanic cell. <|im_end|>\n<|im_start|>assistant\n",96);}catch(Exception ex){result="Inference failed: "+ex.getMessage();}
            final String finalResult=result;runOnUiThread(()->{progressText.setText("Inference test result:");new AlertDialog.Builder(this).setTitle("On-device inference test").setMessage(finalResult).setPositiveButton("OK",(d,w)->{}).show();updateStatus();});});
    }
    @Override protected void onDestroy(){worker.shutdownNow();super.onDestroy();}
}