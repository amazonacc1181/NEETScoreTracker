package com.example.neetscoretracker;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.widget.*;
import java.util.*;

public class MainActivity extends Activity {
    EditText[] fields = new EditText[6];
    EditText testName;
    TextView score, detail;
    LinearLayout history;
    android.content.SharedPreferences prefs;
    int ink=Color.rgb(25,35,52), muted=Color.rgb(104,115,132), blue=Color.rgb(46,99,230);
    public void onCreate(Bundle b) {
        super.onCreate(b); prefs=getSharedPreferences("scores",0);
        ScrollView sc=new ScrollView(this); sc.setBackgroundColor(Color.rgb(246,248,252));
        LinearLayout p=new LinearLayout(this); p.setOrientation(1); p.setPadding(dp(20),dp(25),dp(20),dp(24)); sc.addView(p);
        p.addView(txt("NEET PREP / PERFORMANCE",12,muted,true));
        p.addView(txt("Score tracker",30,ink,true));
        p.addView(txt("Every mock test is a step forward.",14,muted,false));
        LinearLayout card=card(); card.setOrientation(1); card.setPadding(dp(18),dp(18),dp(18),dp(18));
        LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2); cp.topMargin=dp(20); p.addView(card,cp);
        card.addView(txt("LATEST TEST SCORE",12,muted,true)); score=txt("-- / 720",34,ink,true); card.addView(score);
        detail=txt("Enter your answers below",14,muted,false); card.addView(detail);
        p.addView(section("Record a test")); testName=edit("Test name (e.g. Allen FT-01)"); p.addView(testName);
        LinearLayout h=new LinearLayout(this); h.setPadding(0,dp(12),0,dp(6));
        h.addView(txt("SUBJECT",11,muted,true),new LinearLayout.LayoutParams(0,-2,1.3f));
        h.addView(txt("CORRECT",11,muted,true),new LinearLayout.LayoutParams(0,-2,1));
        h.addView(txt("WRONG",11,muted,true),new LinearLayout.LayoutParams(0,-2,1)); p.addView(h);
        String[] subjects={"Physics","Chemistry","Biology"};
        for(int i=0;i<3;i++){
            LinearLayout row=new LinearLayout(this); row.setGravity(Gravity.CENTER_VERTICAL);
            row.addView(txt(subjects[i],14,ink,true),new LinearLayout.LayoutParams(0,dp(48),1.3f));
            fields[i*2]=edit("0"); fields[i*2+1]=edit("0");
            row.addView(fields[i*2],new LinearLayout.LayoutParams(0,dp(46),1));
            LinearLayout.LayoutParams wp=new LinearLayout.LayoutParams(0,dp(46),1); wp.leftMargin=dp(7); row.addView(fields[i*2+1],wp); p.addView(row);
        }
        Button save=new Button(this); save.setText("Save test result"); save.setAllCaps(false); save.setTextColor(Color.WHITE); save.setBackground(round(blue,dp(13)));
        LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(-1,dp(54)); bp.topMargin=dp(17); p.addView(save,bp); save.setOnClickListener(v->save());
        p.addView(section("Test history")); history=new LinearLayout(this); history.setOrientation(1); p.addView(history);
        Button clear=new Button(this); clear.setText("Clear history"); clear.setAllCaps(false); p.addView(clear);
        clear.setOnClickListener(v->new android.app.AlertDialog.Builder(this).setTitle("Clear history?").setMessage("Delete saved results on this device?").setNegativeButton("Cancel",null).setPositiveButton("Clear",(d,w)->{prefs.edit().clear().apply();refresh();score.setText("-- / 720");detail.setText("Enter your answers below");}).show());
        setContentView(sc); refresh();
    }
    void save(){
        int[] n=new int[6]; for(int i=0;i<6;i++) n[i]=number(fields[i]);
        if(n[0]+n[1]>45||n[2]+n[3]>45||n[4]+n[5]>90){toast("Too many questions for a subject.");return;}
        int correct=n[0]+n[2]+n[4], wrong=n[1]+n[3]+n[5], points=correct*4-wrong;
        String name=testName.getText().toString().trim(); if(name.isEmpty())name="Mock Test";
        String key="t"+System.currentTimeMillis(), val=name+"|"+points+"|"+correct+"|"+wrong;
        prefs.edit().putString(key,val).apply(); score.setText(points+" / 720");
        detail.setText(String.format(Locale.getDefault(),"%.1f%% · %d correct · %d wrong",points/720.0*100,correct,wrong));
        testName.setText(""); for(EditText e:fields)e.setText("0"); refresh(); toast("Test result saved");
    }
    int number(EditText e){try{return Math.max(0,Integer.parseInt(e.getText().toString().trim()));}catch(Exception x){return 0;}}
    void refresh(){
        if(history==null)return; history.removeAllViews(); ArrayList<String> keys=new ArrayList<>(prefs.getAll().keySet()); Collections.sort(keys,Collections.reverseOrder());
        if(keys.isEmpty()){history.addView(txt("No tests saved yet. Results will appear here.",14,muted,false));return;}
        for(String k:keys){Object o=prefs.getAll().get(k);if(!(o instanceof String))continue;String[] a=((String)o).split("\\|",-1);if(a.length<4)continue;
            LinearLayout r=card();r.setPadding(dp(13),dp(12),dp(13),dp(12));r.setGravity(Gravity.CENTER_VERTICAL);
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);lp.bottomMargin=dp(8);history.addView(r,lp);
            LinearLayout left=new LinearLayout(this);left.setOrientation(1);r.addView(left,new LinearLayout.LayoutParams(0,-2,1));
            left.addView(txt(a[0],15,ink,true));left.addView(txt(a[2]+" correct · "+a[3]+" wrong",12,muted,false));r.addView(txt(a[1]+"/720",18,blue,true));
        }
    }
    TextView section(String s){TextView t=txt(s,19,ink,true);t.setPadding(0,dp(23),0,dp(9));return t;}
    TextView txt(String s,int z,int c,boolean b){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(c);if(b)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;}
    EditText edit(String s){EditText e=new EditText(this);e.setSingleLine(true);e.setHint(s);e.setText("0");e.setTextSize(14);e.setTextColor(ink);e.setGravity(Gravity.CENTER);e.setInputType(2);e.setPadding(dp(5),0,dp(5),0);e.setBackground(round(Color.WHITE,dp(9)));return e;}
    LinearLayout card(){LinearLayout l=new LinearLayout(this);GradientDrawable d=round(Color.WHITE,dp(17));d.setStroke(dp(1),Color.rgb(231,235,242));l.setBackground(d);return l;}
    GradientDrawable round(int c,int r){GradientDrawable d=new GradientDrawable();d.setColor(c);d.setCornerRadius(r);return d;}
    int dp(int v){return (int)(v*getResources().getDisplayMetrics().density+.5f);}
    void toast(String s){Toast.makeText(this,s,Toast.LENGTH_SHORT).show();}
}
