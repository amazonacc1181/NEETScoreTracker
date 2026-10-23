package com.example.neetscoretracker;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.text.Editable;
import android.text.InputType;
import android.text.TextWatcher;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.content.Context;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;

/**
 * NEET IQ — a local-first NEET preparation companion.
 * No third-party UI libraries are required.
 */
public class MainActivity extends Activity {
    private static final int BG = Color.rgb(246, 248, 252);
    private static final int WHITE = Color.WHITE;
    private static final int INK = Color.rgb(20, 29, 48);
    private static final int MUTED = Color.rgb(105, 116, 136);
    private static final int BLUE = Color.rgb(55, 88, 224);
    private static final int BLUE_DARK = Color.rgb(41, 68, 190);
    private static final int NAVY = Color.rgb(18, 28, 53);
    private static final int TEAL = Color.rgb(20, 166, 139);
    private static final int AMBER = Color.rgb(205, 135, 37);
    private static final int LINE = Color.rgb(229, 233, 241);
    private static final int PALE_BLUE = Color.rgb(237, 241, 255);
    private static final int PALE_TEAL = Color.rgb(230, 248, 243);
    private static final String PREFS = "neet_iq_v2";
    private static final String API_KEY_ALIAS = "neet_iq_openai_key_v1";

    private android.content.SharedPreferences prefs;
    private LinearLayout appRoot, contentHost, bottomNav;
    private String currentPage = "home";
    private EditText testNameField;
    private EditText[] answerFields = new EditText[6];
    private TextView liveScorePreview;
    private EditText formulaSearch;
    private LinearLayout formulaResults;
    private EditText mistakeChapter, mistakeNote;
    private Spinner mistakeSubject, mistakeType;
    private EditText aiInput;
    private TextView aiSendButton;
    private final ArrayList<ChatMessage> chatMessages = new ArrayList<>();
    private final ExecutorService aiExecutor = Executors.newSingleThreadExecutor();
    private boolean aiBusy = false;
    private CountDownTimer focusTimer;
    private long focusRemainingMs = 25 * 60 * 1000L;
    private boolean focusRunning = false;
    private TextView focusClock;
    private String[] plannerTasks = {
            "Biology NCERT — active recall",
            "Physics — 30 timed questions",
            "Chemistry — revise weak reactions",
            "Biology — 90-question practice set",
            "Review yesterday's mistakes",
            "Analyse one full mock test"
    };
    private String[] plannerTaskIds = {"bio_recall", "physics_q", "chem_revise", "bio_ft", "mistake_review", "mock_analysis"};

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(WHITE);
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        buildShell();
        renderScreen("home");
    }

    @Override
    protected void onDestroy() {
        if (focusTimer != null) focusTimer.cancel();
        aiExecutor.shutdownNow();
        super.onDestroy();
    }

    private void buildShell() {
        appRoot = new LinearLayout(this);
        appRoot.setOrientation(LinearLayout.VERTICAL);
        appRoot.setBackgroundColor(BG);

        LinearLayout top = new LinearLayout(this);
        top.setOrientation(LinearLayout.HORIZONTAL);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(dp(18), dp(9), dp(16), dp(8));
        top.setBackgroundColor(BG);

        TextView menu = iconButton("☰", 21, INK);
        menu.setContentDescription("Open navigation drawer");
        menu.setOnClickListener(v -> openDrawer(false));
        top.addView(menu, new LinearLayout.LayoutParams(dp(42), dp(44)));

        LinearLayout brand = new LinearLayout(this);
        brand.setOrientation(LinearLayout.HORIZONTAL);
        brand.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams brandLp = new LinearLayout.LayoutParams(0, -2, 1f);
        brandLp.leftMargin = dp(7);
        top.addView(brand, brandLp);

        TextView mark = txt("N", 20, WHITE, true);
        mark.setGravity(Gravity.CENTER);
        mark.setBackground(round(BLUE, dp(12)));
        brand.addView(mark, new LinearLayout.LayoutParams(dp(38), dp(38)));

        LinearLayout brandCopy = new LinearLayout(this);
        brandCopy.setOrientation(LinearLayout.VERTICAL);
        brandCopy.setPadding(dp(9), 0, 0, 0);
        brand.addView(brandCopy);
        brandCopy.addView(txt("NEET IQ", 17, INK, true));
        brandCopy.addView(txt("PREP WORKSPACE", 9, MUTED, true));

        TextView tools = iconButton("⋯", 25, INK);
        tools.setContentDescription("Open quick tools drawer");
        tools.setOnClickListener(v -> openDrawer(true));
        top.addView(tools, new LinearLayout.LayoutParams(dp(42), dp(44)));

        appRoot.addView(top, new LinearLayout.LayoutParams(-1, dp(62)));
        View divider = new View(this);
        divider.setBackgroundColor(LINE);
        appRoot.addView(divider, new LinearLayout.LayoutParams(-1, dp(1)));

        contentHost = new LinearLayout(this);
        contentHost.setOrientation(LinearLayout.VERTICAL);
        appRoot.addView(contentHost, new LinearLayout.LayoutParams(-1, 0, 1f));

        bottomNav = new LinearLayout(this);
        bottomNav.setOrientation(LinearLayout.HORIZONTAL);
        bottomNav.setGravity(Gravity.CENTER_VERTICAL);
        bottomNav.setPadding(dp(7), dp(6), dp(7), dp(6));
        bottomNav.setBackgroundColor(WHITE);
        View navDivider = new View(this);
        navDivider.setBackgroundColor(LINE);
        appRoot.addView(navDivider, new LinearLayout.LayoutParams(-1, dp(1)));
        appRoot.addView(bottomNav, new LinearLayout.LayoutParams(-1, dp(68)));
        setContentView(appRoot);
    }

    private void renderScreen(String page) {
        currentPage = page;
        contentHost.removeAllViews();
        switch (page) {
            case "tests": buildTests(); break;
            case "analytics": buildAnalytics(); break;
            case "planner": buildPlanner(); break;
            case "formula": buildFormulaVault(); break;
            case "mistakes": buildMistakes(); break;
            case "ai": buildAI(); break;
            case "settings": buildSettings(); break;
            case "focus": buildFocus(); break;
            default: buildDashboard(); break;
        }
        buildBottomNav();
    }

    private void buildBottomNav() {
        bottomNav.removeAllViews();
        addBottomItem("⌂", "Today", "home");
        addBottomItem("▦", "Tests", "tests");
        addBottomItem("↗", "Trends", "analytics");
        addBottomItem("✦", "Ask AI", "ai");
    }

    private void addBottomItem(String symbol, String label, String page) {
        boolean selected = currentPage.equals(page) ||
                (page.equals("tests") && currentPage.equals("mistakes")) ||
                (page.equals("analytics") && currentPage.equals("planner"));
        LinearLayout item = new LinearLayout(this);
        item.setOrientation(LinearLayout.VERTICAL);
        item.setGravity(Gravity.CENTER);
        item.setPadding(0, dp(4), 0, dp(3));
        item.setBackground(round(selected ? PALE_BLUE : WHITE, dp(13)));
        TextView ico = txt(symbol, 19, selected ? BLUE : MUTED, true);
        ico.setGravity(Gravity.CENTER);
        item.addView(ico);
        TextView name = txt(label, 10, selected ? BLUE : MUTED, selected);
        name.setGravity(Gravity.CENTER);
        item.addView(name);
        item.setOnClickListener(v -> renderScreen(page));
        bottomNav.addView(item, new LinearLayout.LayoutParams(0, -1, 1f));
    }

    private ScrollView pageScroll() {
        ScrollView s = new ScrollView(this);
        s.setFillViewport(true);
        s.setClipToPadding(false);
        s.setVerticalScrollBarEnabled(false);
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(dp(20), dp(20), dp(20), dp(28));
        s.addView(page, new ScrollView.LayoutParams(-1, -2));
        contentHost.addView(s, new LinearLayout.LayoutParams(-1, -1));
        return s;
    }

    private LinearLayout pageContent(ScrollView s) {
        return (LinearLayout) s.getChildAt(0);
    }

    private void buildDashboard() {
        ScrollView s = pageScroll();
        LinearLayout p = pageContent(s);
        p.addView(txt(new SimpleDateFormat("EEEE, d MMMM", Locale.getDefault()).format(new Date()).toUpperCase(Locale.getDefault()), 10, MUTED, true));
        TextView headline = txt("Your prep, in focus.", 29, INK, true);
        headline.setPadding(0, dp(5), 0, dp(4));
        p.addView(headline);
        p.addView(txt("A calmer way to track progress and stay consistent.", 13, MUTED, false));

        ArrayList<TestResult> records = getResults();
        TestResult latest = records.isEmpty() ? null : records.get(0);
        int target = getTargetScore();
        LinearLayout hero = new LinearLayout(this);
        hero.setOrientation(LinearLayout.VERTICAL);
        hero.setPadding(dp(20), dp(19), dp(20), dp(18));
        hero.setBackground(round(NAVY, dp(22)));
        LinearLayout.LayoutParams heroLp = new LinearLayout.LayoutParams(-1, -2);
        heroLp.topMargin = dp(22);
        p.addView(hero, heroLp);

        LinearLayout htop = new LinearLayout(this);
        htop.setGravity(Gravity.CENTER_VERTICAL);
        htop.addView(txt("LATEST MOCK SCORE", 10, Color.rgb(183, 194, 221), true), new LinearLayout.LayoutParams(0, -2, 1f));
        TextView badge = txt("TARGET  " + target, 10, Color.rgb(220, 229, 255), true);
        badge.setPadding(dp(10), dp(7), dp(10), dp(7));
        badge.setBackground(round(Color.rgb(39, 51, 84), dp(11)));
        htop.addView(badge);
        hero.addView(htop);

        LinearLayout scoreLine = new LinearLayout(this);
        scoreLine.setGravity(Gravity.BOTTOM);
        scoreLine.setPadding(0, dp(12), 0, dp(1));
        TextView scoreValue = txt(latest == null ? "—" : String.valueOf(latest.score), 39, WHITE, true);
        scoreLine.addView(scoreValue);
        TextView denominator = txt("  / 720", 15, Color.rgb(183, 194, 221), false);
        denominator.setPadding(0, 0, 0, dp(7));
        scoreLine.addView(denominator);
        hero.addView(scoreLine);
        hero.addView(txt(latest == null ? "Save your first mock to start seeing trends." :
                formatDate(latest.timestamp) + "  ·  " + latest.correct + " correct  ·  " + latest.wrong + " wrong",
                12, Color.rgb(190, 200, 220), false));

        LinearLayout progressWrap = new LinearLayout(this);
        progressWrap.setOrientation(LinearLayout.VERTICAL);
        progressWrap.setPadding(0, dp(17), 0, 0);
        hero.addView(progressWrap);
        LinearLayout progressLabels = new LinearLayout(this);
        progressLabels.addView(txt("Progress to target", 11, Color.rgb(183, 194, 221), false),
                new LinearLayout.LayoutParams(0, -2, 1f));
        progressLabels.addView(txt(latest == null ? "0%" :
                        Math.round(Math.max(0, latest.score) * 100f / Math.max(1, target)) + "%",
                11, WHITE, true));
        progressWrap.addView(progressLabels);
        progressWrap.addView(new ProgressTrack(this, latest == null ? 0 :
                Math.max(0, Math.min(1, latest.score / (float) Math.max(1, target))),
                Color.rgb(104, 132, 255), Color.rgb(49, 61, 94)),
                new LinearLayout.LayoutParams(-1, dp(7)));

        p.addView(section("Performance snapshot"));
        LinearLayout metrics = new LinearLayout(this);
        metrics.setOrientation(LinearLayout.HORIZONTAL);
        p.addView(metrics);
        addMetric(metrics, "Tests logged", String.valueOf(records.size()), "Lifetime", BLUE, true);
        addMetric(metrics, "Average score", records.isEmpty() ? "—" : String.valueOf(Math.round(averageScore(records))),
                records.isEmpty() ? "No data yet" : "Across all mocks", TEAL, false);
        LinearLayout metrics2 = new LinearLayout(this);
        metrics2.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams metrics2Lp = new LinearLayout.LayoutParams(-1, -2);
        metrics2Lp.topMargin = dp(10);
        p.addView(metrics2, metrics2Lp);
        addMetric(metrics2, "Personal best", records.isEmpty() ? "—" : String.valueOf(bestScore(records)),
                "Out of 720", AMBER, true);
        int done = completedTasks();
        addMetric(metrics2, "Study checklist", done + " / " + plannerTasks.length,
                "Today's progress", BLUE, false);

        p.addView(section("Quick actions"));
        LinearLayout quicks = new LinearLayout(this);
        quicks.setOrientation(LinearLayout.HORIZONTAL);
        p.addView(quicks);
        addQuickAction(quicks, "+  Record test", "tests");
        addQuickAction(quicks, "◷  Focus", "focus");
        addQuickAction(quicks, "✦  Ask AI", "ai");

        p.addView(section("Subject balance"));
        LinearLayout subjectCard = card();
        subjectCard.setPadding(dp(16), dp(14), dp(16), dp(14));
        p.addView(subjectCard);
        String[] subjects = {"Physics", "Chemistry", "Biology"};
        int[] caps = {180, 180, 360};
        for (int i = 0; i < 3; i++) {
            double avg = averageSubject(records, i);
            addProgressRow(subjectCard, subjects[i], records.isEmpty() ? "No scores yet" :
                    String.format(Locale.getDefault(), "%.0f%% of section marks", avg / caps[i] * 100),
                    records.isEmpty() ? 0 : Math.max(0, Math.min(1, avg / caps[i])),
                    i == 2 ? TEAL : BLUE);
        }

        p.addView(section("Recent tests"));
        if (records.isEmpty()) {
            p.addView(emptyState("Nothing recorded yet", "Log a mock test and your recent results will appear here."));
        } else {
            for (int i = 0; i < Math.min(3, records.size()); i++) p.addView(testCard(records.get(i), false));
            TextView all = txt("View all tests  →", 13, BLUE, true);
            all.setPadding(0, dp(14), 0, dp(3));
            all.setOnClickListener(v -> renderScreen("tests"));
            p.addView(all);
        }
    }

    private void addMetric(LinearLayout row, String title, String value, String note, int accent, boolean left) {
        LinearLayout c = card();
        c.setPadding(dp(14), dp(14), dp(12), dp(14));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -2, 1f);
        if (!left) lp.leftMargin = dp(10);
        row.addView(c, lp);
        View dot = new View(this);
        dot.setBackground(round(accent, dp(3)));
        c.addView(dot, new LinearLayout.LayoutParams(dp(22), dp(4)));
        c.addView(txt(title, 11, MUTED, true), margin(0, 10, 0, 0));
        TextView big = txt(value, 26, INK, true);
        big.setPadding(0, dp(3), 0, dp(1));
        c.addView(big);
        c.addView(txt(note, 10, MUTED, false));
    }

    private void addQuickAction(LinearLayout parent, String label, String page) {
        TextView b = txt(label, 11, page.equals("ai") ? BLUE : INK, true);
        b.setGravity(Gravity.CENTER);
        b.setPadding(dp(12), dp(13), dp(12), dp(13));
        b.setBackground(round(page.equals("ai") ? PALE_BLUE : WHITE, dp(13)));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -2, 1f);
        lp.rightMargin = dp(7);
        parent.addView(b, lp);
        b.setOnClickListener(v -> renderScreen(page));
    }

    private void buildTests() {
        ScrollView s = pageScroll();
        LinearLayout p = pageContent(s);
        pageHeading(p, "Mock tests", "Enter your response count. NEET marking is +4 / −1.");
        LinearLayout form = card();
        form.setPadding(dp(16), dp(16), dp(16), dp(16));
        p.addView(form);
        form.addView(txt("TEST DETAILS", 10, MUTED, true));
        testNameField = editField("Test name (e.g. Allen FT-01)", "", false);
        LinearLayout.LayoutParams nameLp = new LinearLayout.LayoutParams(-1, dp(50));
        nameLp.topMargin = dp(9);
        form.addView(testNameField, nameLp);

        LinearLayout labels = new LinearLayout(this);
        labels.setGravity(Gravity.CENTER_VERTICAL);
        labels.setPadding(0, dp(19), 0, dp(8));
        labels.addView(txt("SUBJECT", 10, MUTED, true), new LinearLayout.LayoutParams(0, -2, 1.25f));
        TextView correct = txt("CORRECT", 9, TEAL, true);
        correct.setGravity(Gravity.CENTER);
        labels.addView(correct, new LinearLayout.LayoutParams(0, -2, 1f));
        TextView wrong = txt("WRONG", 9, Color.rgb(203, 83, 83), true);
        wrong.setGravity(Gravity.CENTER);
        labels.addView(wrong, new LinearLayout.LayoutParams(0, -2, 1f));
        form.addView(labels);

        String[] subjects = {"Physics", "Chemistry", "Biology"};
        String[] caps = {"45 questions", "45 questions", "90 questions"};
        for (int i = 0; i < 3; i++) {
            LinearLayout row = new LinearLayout(this);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(0, dp(5), 0, dp(5));
            LinearLayout label = new LinearLayout(this);
            label.setOrientation(LinearLayout.VERTICAL);
            label.addView(txt(subjects[i], 13, INK, true));
            label.addView(txt(caps[i], 10, MUTED, false));
            row.addView(label, new LinearLayout.LayoutParams(0, -2, 1.25f));
            answerFields[i * 2] = editField("0", "0", true);
            answerFields[i * 2 + 1] = editField("0", "0", true);
            row.addView(answerFields[i * 2], new LinearLayout.LayoutParams(0, dp(45), 1f));
            LinearLayout.LayoutParams wrongLp = new LinearLayout.LayoutParams(0, dp(45), 1f);
            wrongLp.leftMargin = dp(8);
            row.addView(answerFields[i * 2 + 1], wrongLp);
            form.addView(row);
            if (i < 2) form.addView(line());
        }

        LinearLayout preview = new LinearLayout(this);
        preview.setOrientation(LinearLayout.VERTICAL);
        preview.setPadding(dp(14), dp(12), dp(14), dp(12));
        preview.setBackground(round(PALE_BLUE, dp(14)));
        LinearLayout.LayoutParams pv = new LinearLayout.LayoutParams(-1, -2);
        pv.topMargin = dp(14);
        form.addView(preview, pv);
        preview.addView(txt("LIVE SCORE PREVIEW", 9, BLUE_DARK, true));
        liveScorePreview = txt("0 / 720", 24, INK, true);
        preview.addView(liveScorePreview);
        preview.addView(txt("Correct × 4 − wrong × 1. Unattempted questions score 0.", 10, MUTED, false));
        for (EditText e : answerFields) {
            e.addTextChangedListener(new TextWatcher() {
                public void beforeTextChanged(CharSequence x, int st, int count, int after) {}
                public void onTextChanged(CharSequence x, int st, int before, int count) { updateLiveScore(); }
                public void afterTextChanged(Editable e2) {}
            });
        }
        TextView save = primaryButton("Save test result");
        LinearLayout.LayoutParams saveLp = new LinearLayout.LayoutParams(-1, dp(51));
        saveLp.topMargin = dp(14);
        form.addView(save, saveLp);
        save.setOnClickListener(v -> saveTest());

        p.addView(section("Saved test history"));
        ArrayList<TestResult> results = getResults();
        if (results.isEmpty()) {
            p.addView(emptyState("Your history starts here", "Saved scores stay on this device. Long-press any result to delete it."));
        } else {
            for (TestResult r : results) p.addView(testCard(r, true));
        }
        TextView share = secondaryButton("Share score report");
        LinearLayout.LayoutParams shareLp = new LinearLayout.LayoutParams(-1, dp(47));
        shareLp.topMargin = dp(13);
        p.addView(share, shareLp);
        share.setOnClickListener(v -> shareReport());
    }

    private void updateLiveScore() {
        if (liveScorePreview == null || answerFields[0] == null) return;
        int[] n = new int[6];
        for (int i = 0; i < 6; i++) n[i] = safeNumber(answerFields[i]);
        int score = (n[0] - n[1]) * 4 + 3 * n[1] + (n[2] - n[3]) * 4 + 3 * n[3] +
                (n[4] - n[5]) * 4 + 3 * n[5];
        // Equivalent to correct*4 - wrong; the explicit form keeps preview arithmetic easy to audit.
        score = (n[0] + n[2] + n[4]) * 4 - (n[1] + n[3] + n[5]);
        liveScorePreview.setText(score + " / 720");
    }

    private void saveTest() {
        int[] n = new int[6];
        for (int i = 0; i < 6; i++) n[i] = safeNumber(answerFields[i]);
        if (n[0] + n[1] > 45 || n[2] + n[3] > 45 || n[4] + n[5] > 90) {
            showToast("Correct + wrong cannot exceed the subject question limit.");
            return;
        }
        int correct = n[0] + n[2] + n[4];
        int wrong = n[1] + n[3] + n[5];
        int score = correct * 4 - wrong;
        String name = testNameField == null ? "" : testNameField.getText().toString().trim();
        if (name.isEmpty()) name = "Mock Test";
        name = name.replace("|", " ").replace("\n", " ");
        long now = System.currentTimeMillis();
        int ps = n[0] * 4 - n[1];
        int cs = n[2] * 4 - n[3];
        int bs = n[4] * 4 - n[5];
        String data = name + "|" + score + "|" + correct + "|" + wrong + "|" + ps + "|" + cs + "|" + bs +
                "|" + now + "|" + n[0] + "|" + n[1] + "|" + n[2] + "|" + n[3] + "|" + n[4] + "|" + n[5];
        prefs.edit().putString("t" + now, data).apply();
        if (testNameField != null) testNameField.setText("");
        for (EditText e : answerFields) if (e != null) e.setText("0");
        hideKeyboard();
        showToast("Test saved · " + score + " / 720");
        renderScreen("tests");
    }

    private LinearLayout testCard(TestResult r, boolean deletable) {
        LinearLayout c = card();
        c.setPadding(dp(14), dp(13), dp(14), dp(13));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.bottomMargin = dp(9);
        c.setLayoutParams(lp);

        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        c.addView(top);
        LinearLayout left = new LinearLayout(this);
        left.setOrientation(LinearLayout.VERTICAL);
        top.addView(left, new LinearLayout.LayoutParams(0, -2, 1f));
        left.addView(txt(r.name, 14, INK, true));
        left.addView(txt(formatDate(r.timestamp) + "  ·  " + r.correct + " correct  ·  " + r.wrong + " wrong",
                10, MUTED, false), margin(0, 4, 0, 0));
        TextView score = txt(r.score + " / 720", 18, BLUE, true);
        score.setGravity(Gravity.RIGHT | Gravity.CENTER_VERTICAL);
        top.addView(score);
        if (r.hasSubjectBreakdown) {
            LinearLayout chips = new LinearLayout(this);
            chips.setPadding(0, dp(10), 0, 0);
            chips.addView(scoreChip("PHY  " + r.physics, PALE_BLUE, BLUE));
            chips.addView(scoreChip("CHE  " + r.chemistry, Color.rgb(255, 245, 228), AMBER), margin(7, 0, 0, 0));
            chips.addView(scoreChip("BIO  " + r.biology, PALE_TEAL, TEAL), margin(7, 0, 0, 0));
            c.addView(chips);
        }
        if (deletable) {
            c.setOnLongClickListener(v -> {
                new AlertDialog.Builder(this).setTitle("Delete this result?")
                        .setMessage("This removes \"" + r.name + "\" from history on this device.")
                        .setNegativeButton("Cancel", null)
                        .setPositiveButton("Delete", (d, w) -> {
                            prefs.edit().remove(r.key).apply();
                            renderScreen("tests");
                        }).show();
                return true;
            });
        }
        return c;
    }

    private TextView scoreChip(String text, int bg, int color) {
        TextView t = txt(text, 9, color, true);
        t.setGravity(Gravity.CENTER);
        t.setPadding(dp(8), dp(6), dp(8), dp(6));
        t.setBackground(round(bg, dp(9)));
        return t;
    }

    private void buildAnalytics() {
        ScrollView s = pageScroll();
        LinearLayout p = pageContent(s);
        pageHeading(p, "Performance", "Read the pattern, not just the score.");
        ArrayList<TestResult> records = getResults();
        if (records.isEmpty()) {
            p.addView(emptyState("Analytics need a little data", "Record at least one mock test to see averages, score trends and subject balance."));
            TextView b = primaryButton("Record your first test");
            p.addView(b, margin(0, 15, 0, 0));
            b.setOnClickListener(v -> renderScreen("tests"));
            return;
        }
        int avg = (int) Math.round(averageScore(records));
        int best = bestScore(records);
        int latest = records.get(0).score;
        int delta = records.size() > 1 ? latest - records.get(1).score : 0;

        LinearLayout topMetrics = new LinearLayout(this);
        topMetrics.setOrientation(LinearLayout.HORIZONTAL);
        p.addView(topMetrics);
        addMetric(topMetrics, "Latest", String.valueOf(latest), "/ 720", BLUE, true);
        addMetric(topMetrics, "Average", String.valueOf(avg), "All saved tests", TEAL, false);
        LinearLayout secondMetrics = new LinearLayout(this);
        secondMetrics.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams sml = new LinearLayout.LayoutParams(-1, -2);
        sml.topMargin = dp(10);
        p.addView(secondMetrics, sml);
        addMetric(secondMetrics, "Personal best", String.valueOf(best), "Lifetime high", AMBER, true);
        addMetric(secondMetrics, "Latest change", (delta > 0 ? "+" : "") + delta,
                records.size() > 1 ? "vs previous test" : "Need another test", delta >= 0 ? TEAL : AMBER, false);

        p.addView(section("Score trajectory"));
        LinearLayout chartCard = card();
        chartCard.setPadding(dp(12), dp(15), dp(12), dp(12));
        p.addView(chartCard);
        ArrayList<Integer> scores = new ArrayList<>();
        int count = Math.min(8, records.size());
        for (int i = count - 1; i >= 0; i--) scores.add(records.get(i).score);
        chartCard.addView(new TrendChart(this, scores), new LinearLayout.LayoutParams(-1, dp(180)));
        chartCard.addView(txt("Most recent " + count + " test" + (count == 1 ? "" : "s") + " · scale 0–720",
                10, MUTED, false), margin(4, 4, 0, 0));

        p.addView(section("Subject performance"));
        LinearLayout scard = card();
        scard.setPadding(dp(16), dp(15), dp(16), dp(15));
        p.addView(scard);
        addProgressRow(scard, "Physics", formatSubjectAverage(records, 0, 180), subjectProgress(records, 0, 180), BLUE);
        addProgressRow(scard, "Chemistry", formatSubjectAverage(records, 1, 180), subjectProgress(records, 1, 180), AMBER);
        addProgressRow(scard, "Biology", formatSubjectAverage(records, 2, 360), subjectProgress(records, 2, 360), TEAL);

        p.addView(section("What to focus on next"));
        LinearLayout advice = card();
        advice.setPadding(dp(16), dp(15), dp(16), dp(16));
        p.addView(advice);
        int weakest = weakestSubject(records);
        String[] names = {"Physics", "Chemistry", "Biology"};
        advice.addView(txt("Give " + names[weakest] + " the next focused block.", 15, INK, true));
        String[] tips = {
                "Prioritise concept recall, then solve timed numericals. Keep a short list of recurring calculation errors.",
                "Rotate NCERT line-by-line revision with reaction recall and mixed problem sets.",
                "Protect daily NCERT recall. Track confusing diagrams, facts and repeated wrong options."
        };
        advice.addView(txt(tips[weakest], 12, MUTED, false), margin(0, 7, 0, 0));
        TextView ask = secondaryButton("Get a personalised plan from Ask AI  →");
        LinearLayout.LayoutParams askLp = new LinearLayout.LayoutParams(-1, dp(46));
        askLp.topMargin = dp(12);
        p.addView(ask, askLp);
        ask.setOnClickListener(v -> renderScreen("ai"));
    }

    private void buildPlanner() {
        ScrollView s = pageScroll();
        LinearLayout p = pageContent(s);
        pageHeading(p, "Study planner", "A small, repeatable checklist beats a perfect plan you never start.");
        int done = completedTasks();
        LinearLayout hero = card();
        hero.setPadding(dp(17), dp(16), dp(17), dp(16));
        p.addView(hero);
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.addView(txt("Today's study rhythm", 15, INK, true), new LinearLayout.LayoutParams(0, -2, 1f));
        row.addView(scoreChip(done + " / " + plannerTasks.length, PALE_BLUE, BLUE));
        hero.addView(row);
        hero.addView(new ProgressTrack(this, done / (float) plannerTasks.length, TEAL, LINE),
                margin(0, 14, 0, 0));
        hero.addView(txt(done == plannerTasks.length ? "All planned blocks checked off. Nice work." :
                "Check each block when you finish it. Progress is saved on this device.",
                11, MUTED, false), margin(0, 8, 0, 0));

        p.addView(section("Core checklist"));
        LinearLayout list = card();
        list.setPadding(dp(13), dp(6), dp(13), dp(6));
        p.addView(list);
        for (int i = 0; i < plannerTasks.length; i++) {
            final int ix = i;
            CheckBox check = new CheckBox(this);
            check.setText(plannerTasks[i]);
            check.setTextSize(13);
            check.setTextColor(INK);
            check.setButtonTintList(android.content.res.ColorStateList.valueOf(BLUE));
            check.setPadding(dp(3), dp(5), dp(2), dp(5));
            check.setChecked(prefs.getBoolean("task:" + plannerTaskIds[i], false));
            list.addView(check, new LinearLayout.LayoutParams(-1, -2));
            check.setOnCheckedChangeListener((button, checked) -> {
                prefs.edit().putBoolean("task:" + plannerTaskIds[ix], checked).apply();
                if (currentPage.equals("planner")) {
                    // Update summary and progress in place without losing the current checklist.
                    int c = completedTasks();
                    row.removeViewAt(1);
                    row.addView(scoreChip(c + " / " + plannerTasks.length, PALE_BLUE, BLUE));
                    hero.removeViewAt(1);
                    hero.addView(new ProgressTrack(this, c / (float) plannerTasks.length, TEAL, LINE), 1,
                            margin(0, 14, 0, 0));
                    hero.removeViewAt(2);
                    hero.addView(txt(c == plannerTasks.length ? "All planned blocks checked off. Nice work." :
                            "Check each block when you finish it. Progress is saved on this device.",
                            11, MUTED, false), 2, margin(0, 8, 0, 0));
                }
            });
            if (i < plannerTasks.length - 1) list.addView(line());
        }

        p.addView(section("Suggested weekly cadence"));
        addInfoCard(p, "01  Learn", "Use the first block for NCERT/concept review. Finish with 10 minutes of closed-book recall.", "CONCEPTS", BLUE);
        addInfoCard(p, "02  Practise", "Solve a timed question set without checking solutions mid-way. Mark guesses separately.", "QUESTIONS", TEAL);
        addInfoCard(p, "03  Correct", "Review errors the same day. Record why each answer went wrong and retry it later.", "ANALYSIS", AMBER);
        TextView timer = primaryButton("Start a 25-minute focus session");
        p.addView(timer, margin(0, 13, 0, 0));
        timer.setOnClickListener(v -> renderScreen("focus"));
    }

    private void buildFormulaVault() {
        ScrollView s = pageScroll();
        LinearLayout p = pageContent(s);
        pageHeading(p, "Formula vault", "A searchable quick-reference space for last-mile revision.");
        formulaSearch = editField("Search a formula, topic or subject", "", false);
        p.addView(formulaSearch, new LinearLayout.LayoutParams(-1, dp(50)));
        formulaResults = new LinearLayout(this);
        formulaResults.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams listLp = new LinearLayout.LayoutParams(-1, -2);
        listLp.topMargin = dp(14);
        p.addView(formulaResults, listLp);
        fillFormulaList("");
        formulaSearch.addTextChangedListener(new TextWatcher() {
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            public void onTextChanged(CharSequence s, int start, int before, int count) { fillFormulaList(s.toString()); }
            public void afterTextChanged(Editable e) {}
        });
    }

    private static final String[][] FORMULAS = {
            {"Physics","Kinematics","v = u + at","Uniform acceleration"},
            {"Physics","Displacement","s = ut + ½at²","Uniform acceleration"},
            {"Physics","Velocity relation","v² = u² + 2as","Uniform acceleration"},
            {"Physics","Newton's second law","F = ma","Net force"},
            {"Physics","Work","W = Fs cos θ","Constant force"},
            {"Physics","Kinetic energy","K = ½mv²","Translational motion"},
            {"Physics","Gravitation","F = Gm₁m₂ / r²","Point masses"},
            {"Physics","Ohm's law","V = IR","Ohmic conductor"},
            {"Physics","Electric power","P = VI = I²R = V²/R","Circuit power"},
            {"Physics","Wave speed","v = fλ","Wave relation"},
            {"Physics","Lens formula","1/f = 1/v − 1/u","Cartesian sign convention"},
            {"Chemistry","Moles","n = m / M","Mass divided by molar mass"},
            {"Chemistry","Molarity","M = moles of solute / volume (L)","Solution concentration"},
            {"Chemistry","Ideal gas","PV = nRT","Use consistent units"},
            {"Chemistry","pH","pH = −log₁₀[H⁺]","Dilute aqueous solutions"},
            {"Chemistry","Equilibrium","Kc = [products]ⁿ / [reactants]ⁿ","Powers are stoichiometric coefficients"},
            {"Chemistry","First-order half-life","t½ = 0.693 / k","First-order kinetics"},
            {"Chemistry","Gibbs energy","ΔG = ΔH − TΔS","Spontaneity at constant T, P"},
            {"Chemistry","Faraday relation","Q = It","Charge through a circuit"},
            {"Biology","Hardy–Weinberg","p² + 2pq + q² = 1","Allele frequencies p + q = 1"},
            {"Biology","Net primary productivity","NPP = GPP − R","Energy fixed minus plant respiration"},
            {"Biology","Population density","Density = population / area","Use the stated sampling area"},
            {"Biology","Osmotic pressure","π = CRT","For dilute ideal solutions"},
            {"Biology","Magnification","M = image size / object size","Keep units consistent"}
    };

    private void fillFormulaList(String query) {
        if (formulaResults == null) return;
        formulaResults.removeAllViews();
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        int shown = 0;
        for (String[] f : FORMULAS) {
            String all = (f[0] + " " + f[1] + " " + f[2] + " " + f[3]).toLowerCase(Locale.ROOT);
            if (!all.contains(q)) continue;
            LinearLayout c = card();
            c.setPadding(dp(15), dp(14), dp(15), dp(14));
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
            lp.bottomMargin = dp(9);
            formulaResults.addView(c, lp);
            LinearLayout top = new LinearLayout(this);
            top.setGravity(Gravity.CENTER_VERTICAL);
            top.addView(txt(f[1], 14, INK, true), new LinearLayout.LayoutParams(0, -2, 1f));
            c.addView(top);
            c.addView(scoreChip(f[0].toUpperCase(Locale.ROOT), f[0].equals("Physics") ? PALE_BLUE :
                    f[0].equals("Chemistry") ? Color.rgb(255, 245, 228) : PALE_TEAL,
                    f[0].equals("Physics") ? BLUE : f[0].equals("Chemistry") ? AMBER : TEAL),
                    margin(0, 8, 0, 0));
            TextView formula = txt(f[2], 20, BLUE_DARK, true);
            formula.setPadding(0, dp(12), 0, dp(4));
            c.addView(formula);
            c.addView(txt(f[3], 11, MUTED, false));
            shown++;
        }
        if (shown == 0) formulaResults.addView(emptyState("No matching formula", "Try searching a shorter topic or subject name."));
    }

    private void buildMistakes() {
        ScrollView s = pageScroll();
        LinearLayout p = pageContent(s);
        pageHeading(p, "Mistake journal", "Capture the reason behind a wrong answer so it does not repeat.");
        LinearLayout form = card();
        form.setPadding(dp(15), dp(15), dp(15), dp(15));
        p.addView(form);
        form.addView(txt("LOG A MISTAKE", 10, MUTED, true));
        mistakeSubject = new Spinner(this);
        mistakeSubject.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item,
                new String[]{"Physics", "Chemistry", "Biology"}));
        form.addView(mistakeSubject, margin(0, 7, 0, 0));
        mistakeType = new Spinner(this);
        mistakeType.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item,
                new String[]{"Concept gap", "Calculation error", "Forgot NCERT fact", "Misread question", "Blind guess", "Time pressure"}));
        form.addView(mistakeType, margin(0, 3, 0, 0));
        mistakeChapter = editField("Chapter / topic", "", false);
        form.addView(mistakeChapter, margin(0, 5, 0, 0));
        mistakeNote = editField("What went wrong? What will you do next time?", "", false);
        mistakeNote.setSingleLine(false);
        mistakeNote.setMinLines(3);
        mistakeNote.setGravity(Gravity.TOP | Gravity.LEFT);
        form.addView(mistakeNote, margin(0, 8, 0, 0));
        TextView save = primaryButton("Save mistake");
        form.addView(save, margin(0, 10, 0, 0));
        save.setOnClickListener(v -> saveMistake());

        p.addView(section("Review log"));
        ArrayList<Mistake> mistakes = getMistakes();
        if (mistakes.isEmpty()) p.addView(emptyState("No entries yet", "Add a mistake after reviewing a mock. Be specific about the correction."));
        else for (Mistake m : mistakes) p.addView(mistakeCard(m));
    }

    private void saveMistake() {
        String chapter = mistakeChapter.getText().toString().trim();
        String note = mistakeNote.getText().toString().trim();
        if (chapter.isEmpty() || note.isEmpty()) {
            showToast("Add a chapter and a short note first.");
            return;
        }
        String subject = String.valueOf(mistakeSubject.getSelectedItem());
        String type = String.valueOf(mistakeType.getSelectedItem());
        long now = System.currentTimeMillis();
        String data = cleanPart(subject) + "|" + cleanPart(type) + "|" + cleanPart(chapter) + "|" + cleanPart(note) + "|" + now;
        prefs.edit().putString("m:" + now, data).apply();
        hideKeyboard();
        showToast("Mistake saved for review");
        renderScreen("mistakes");
    }

    private LinearLayout mistakeCard(Mistake m) {
        LinearLayout c = card();
        c.setPadding(dp(14), dp(13), dp(14), dp(13));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.bottomMargin = dp(9);
        c.setLayoutParams(lp);
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.addView(txt(m.chapter, 14, INK, true), new LinearLayout.LayoutParams(0, -2, 1f));
        row.addView(scoreChip(m.subject.toUpperCase(Locale.ROOT),
                m.subject.equals("Biology") ? PALE_TEAL : PALE_BLUE,
                m.subject.equals("Biology") ? TEAL : BLUE));
        c.addView(row);
        c.addView(txt(m.type + "  ·  " + formatDate(m.timestamp), 10, MUTED, false), margin(0, 6, 0, 0));
        c.addView(txt(m.note, 12, INK, false), margin(0, 8, 0, 0));
        c.setOnLongClickListener(v -> {
            new AlertDialog.Builder(this).setTitle("Remove journal entry?")
                    .setNegativeButton("Cancel", null)
                    .setPositiveButton("Delete", (d, w) -> {
                        prefs.edit().remove(m.key).apply();
                        renderScreen("mistakes");
                    }).show();
            return true;
        });
        return c;
    }

    private void buildAI() {
        ScrollView s = pageScroll();
        LinearLayout p = pageContent(s);
        pageHeading(p, "Ask AI", "A study coach for NEET concepts, mock analysis and revision planning.");
        LinearLayout connect = card();
        connect.setPadding(dp(14), dp(13), dp(14), dp(13));
        p.addView(connect);
        LinearLayout status = new LinearLayout(this);
        status.setGravity(Gravity.CENTER_VERTICAL);
        TextView statusDot = txt("●", 13, getStoredApiKey().isEmpty() ? AMBER : TEAL, true);
        status.addView(statusDot, margin(0, 0, 8, 0));
        status.addView(txt(getStoredApiKey().isEmpty() ? "AI connection not configured" : "OpenAI key connected",
                12, INK, true), new LinearLayout.LayoutParams(0, -2, 1f));
        TextView keyButton = txt(getStoredApiKey().isEmpty() ? "Set up" : "Manage", 11, BLUE, true);
        status.addView(keyButton);
        keyButton.setOnClickListener(v -> showApiKeyDialog());
        connect.addView(status);
        connect.addView(txt("Bring your own OpenAI API key. It is encrypted on this device and is only sent to OpenAI when you ask a question. API usage may be billed by OpenAI.",
                10, MUTED, false), margin(0, 7, 0, 0));

        p.addView(section("Conversation"));
        if (chatMessages.isEmpty()) {
            LinearLayout welcome = card();
            welcome.setPadding(dp(17), dp(17), dp(17), dp(17));
            p.addView(welcome);
            TextView spark = txt("✦", 24, BLUE, true);
            welcome.addView(spark);
            welcome.addView(txt("What are we working on today?", 17, INK, true), margin(0, 3, 0, 0));
            welcome.addView(txt("Ask for a concept explanation, a realistic revision plan, or help finding patterns in your saved mock scores.",
                    12, MUTED, false), margin(0, 6, 0, 0));
            welcome.addView(txt("TRY A PROMPT", 9, MUTED, true), margin(0, 16, 0, 0));
            addPromptButton(welcome, "Analyse my latest mock", "Analyse my latest NEET mock score and give me 3 practical improvements.");
            addPromptButton(welcome, "Make a 7-day revision plan", "Create a realistic 7-day NEET revision plan that balances Physics, Chemistry and Biology.");
            addPromptButton(welcome, "Explain a difficult concept", "Explain a difficult NEET concept step by step, with a simple analogy and 3 practice questions.");
        } else {
            for (ChatMessage msg : chatMessages) {
                LinearLayout bubble = new LinearLayout(this);
                bubble.setOrientation(LinearLayout.VERTICAL);
                bubble.setPadding(dp(13), dp(11), dp(13), dp(11));
                boolean user = msg.role.equals("user");
                bubble.setBackground(round(user ? PALE_BLUE : WHITE, dp(15)));
                LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
                lp.bottomMargin = dp(9);
                p.addView(bubble, lp);
                bubble.addView(txt(user ? "YOU" : "NEET IQ  ·  AI COACH", 9,
                        user ? BLUE : TEAL, true));
                bubble.addView(txt(msg.text, 13, INK, false), margin(0, 5, 0, 0));
            }
        }
        LinearLayout composer = card();
        composer.setPadding(dp(10), dp(9), dp(10), dp(9));
        LinearLayout.LayoutParams composerLp = new LinearLayout.LayoutParams(-1, -2);
        composerLp.topMargin = dp(6);
        p.addView(composer, composerLp);
        aiInput = editField("Ask about NEET preparation…", "", false);
        aiInput.setSingleLine(false);
        aiInput.setMinLines(2);
        aiInput.setMaxLines(5);
        aiInput.setGravity(Gravity.TOP | Gravity.LEFT);
        composer.addView(aiInput);
        aiSendButton = primaryButton(aiBusy ? "Thinking…" : "Send question  →");
        LinearLayout.LayoutParams sendLp = new LinearLayout.LayoutParams(-1, dp(47));
        sendLp.topMargin = dp(7);
        composer.addView(aiSendButton, sendLp);
        aiSendButton.setOnClickListener(v -> {
            if (!aiBusy) {
                String question = aiInput == null ? "" : aiInput.getText().toString().trim();
                sendAIQuestion(question);
            }
        });
        if (aiBusy) aiInput.setEnabled(false);
        p.addView(txt("Educational support only. Double-check high-stakes answers against NCERT and official exam material.",
                10, MUTED, false), margin(2, 12, 2, 0));
    }

    private void addPromptButton(LinearLayout parent, String label, String prompt) {
        TextView b = txt(label + "  →", 12, INK, true);
        b.setPadding(0, dp(11), 0, dp(11));
        parent.addView(b);
        b.setOnClickListener(v -> sendAIQuestion(prompt));
        View d = line();
        parent.addView(d);
    }

    private void sendAIQuestion(String question) {
        if (question == null || question.trim().isEmpty()) {
            showToast("Type a question first.");
            return;
        }
        if (getStoredApiKey().isEmpty()) {
            showApiKeyDialog();
            return;
        }
        if (aiBusy) return;
        hideKeyboard();
        chatMessages.add(new ChatMessage("user", question.trim()));
        aiBusy = true;
        renderScreen("ai");
        aiExecutor.execute(() -> {
            String answer = callOpenAI(question.trim());
            runOnUiThread(() -> {
                chatMessages.add(new ChatMessage("assistant", answer));
                aiBusy = false;
                renderScreen("ai");
            });
        });
    }

    private String callOpenAI(String question) {
        HttpURLConnection conn = null;
        try {
            JSONArray messages = new JSONArray();
            String system = "You are NEET IQ, a precise, supportive NEET-UG study coach for an Indian student. " +
                    "Explain concepts clearly, state assumptions, use correct units, and distinguish NCERT facts from shortcuts. " +
                    "Never fabricate exam announcements, official cutoffs, or answer keys. Prefer concise structured help, practical study plans, and step-by-step reasoning. " +
                    "If asked a medical question, keep it educational and do not diagnose.";
            messages.put(new JSONObject().put("role", "system").put("content", system));
            ArrayList<ChatMessage> context = new ArrayList<>();
            int start = Math.max(0, chatMessages.size() - 10);
            for (int i = start; i < chatMessages.size(); i++) context.add(chatMessages.get(i));
            for (ChatMessage msg : context) {
                messages.put(new JSONObject().put("role", msg.role).put("content", msg.text));
            }
            String performance = buildPerformanceContext();
            if (!performance.isEmpty()) {
                messages.put(new JSONObject().put("role", "user").put("content",
                        "My locally saved performance context, use only if relevant:\n" + performance));
            }
            JSONObject body = new JSONObject();
            body.put("model", "gpt-4o-mini");
            body.put("messages", messages);
            body.put("temperature", 0.4);
            body.put("max_tokens", 1000);

            conn = (HttpURLConnection) new URL("https://api.openai.com/v1/chat/completions").openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(20000);
            conn.setReadTimeout(45000);
            conn.setDoOutput(true);
            conn.setRequestProperty("Authorization", "Bearer " + getStoredApiKey());
            conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
            conn.setFixedLengthStreamingMode(bytes.length);
            try (OutputStream out = conn.getOutputStream()) { out.write(bytes); }

            int code = conn.getResponseCode();
            InputStream stream = code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream();
            String responseText = readStream(stream);
            JSONObject response = new JSONObject(responseText);
            if (code < 200 || code >= 300) {
                String detail = "The request was rejected (HTTP " + code + ").";
                if (response.has("error")) {
                    String message = response.getJSONObject("error").optString("message", "");
                    if (!message.isEmpty()) detail += "\n" + message;
                }
                return detail + "\n\nCheck the key, API access and billing in your OpenAI account.";
            }
            JSONArray choices = response.getJSONArray("choices");
            if (choices.length() == 0) return "The AI service returned an empty response. Please try again.";
            return choices.getJSONObject(0).getJSONObject("message").optString("content",
                    "I couldn't read the response. Please ask again.");
        } catch (Exception ex) {
            return "I couldn't reach the AI service. Check your internet connection and try again.\n\n" +
                    "Details: " + safeMessage(ex);
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private String buildPerformanceContext() {
        ArrayList<TestResult> results = getResults();
        if (results.isEmpty()) return "";
        StringBuilder b = new StringBuilder("Saved mock tests (newest first):\n");
        for (int i = 0; i < Math.min(5, results.size()); i++) {
            TestResult r = results.get(i);
            b.append("- ").append(r.name).append(": ").append(r.score).append("/720, ")
                    .append(r.correct).append(" correct, ").append(r.wrong).append(" wrong");
            if (r.hasSubjectBreakdown) b.append("; Physics ").append(r.physics)
                    .append(", Chemistry ").append(r.chemistry).append(", Biology ").append(r.biology);
            b.append('\n');
        }
        b.append("Number of saved tests: ").append(results.size()).append(". Target score: ").append(getTargetScore()).append("/720.");
        return b.toString();
    }

    private String readStream(InputStream stream) throws Exception {
        if (stream == null) return "";
        StringBuilder b = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) b.append(line);
        }
        return b.toString();
    }

    private void showApiKeyDialog() {
        LinearLayout body = new LinearLayout(this);
        body.setOrientation(LinearLayout.VERTICAL);
        body.setPadding(dp(20), dp(8), dp(20), dp(4));
        body.addView(txt("Use your own OpenAI API key. The app encrypts it on this device; the key is sent to OpenAI only when you submit an AI question. API use can incur charges.",
                12, MUTED, false));
        EditText field = new EditText(this);
        field.setSingleLine(true);
        field.setHint("sk-…");
        field.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        field.setTextColor(INK);
        field.setPadding(dp(12), dp(9), dp(12), dp(9));
        field.setBackground(round(BG, dp(10)));
        body.addView(field, margin(0, 12, 0, 0));

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Connect Ask AI")
                .setView(body)
                .setNegativeButton("Cancel", null)
                .setNeutralButton(getStoredApiKey().isEmpty() ? "Help" : "Remove key", null)
                .setPositiveButton("Save key", null).create();
        dialog.setOnShowListener(d -> {
            Button save = dialog.getButton(AlertDialog.BUTTON_POSITIVE);
            save.setOnClickListener(v -> {
                String key = field.getText().toString().trim();
                if (key.length() < 20 || !key.startsWith("sk-")) {
                    field.setError("Enter a valid-looking OpenAI API key");
                    return;
                }
                try {
                    storeApiKey(key);
                    dialog.dismiss();
                    renderScreen("ai");
                    showToast("API key saved securely on this device.");
                } catch (Exception ex) {
                    field.setError("Could not encrypt the key on this device.");
                }
            });
            Button aux = dialog.getButton(AlertDialog.BUTTON_NEUTRAL);
            aux.setOnClickListener(v -> {
                if (!getStoredApiKey().isEmpty()) {
                    new AlertDialog.Builder(this).setTitle("Remove saved API key?")
                            .setMessage("Ask AI will be disconnected until you add a key again.")
                            .setNegativeButton("Cancel", null)
                            .setPositiveButton("Remove", (dd, w) -> {
                                prefs.edit().remove("openai_key_enc").apply();
                                renderScreen("ai");
                                showToast("API key removed.");
                            }).show();
                    dialog.dismiss();
                } else {
                    new AlertDialog.Builder(this).setTitle("Where to get a key")
                            .setMessage("Create an API key in the OpenAI developer platform. API billing is separate from a ChatGPT subscription. Never share your key with anyone.")
                            .setPositiveButton("Got it", null).show();
                }
            });
        });
        dialog.show();
    }

    private void storeApiKey(String key) throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (!keyStore.containsAlias(API_KEY_ALIAS)) {
            KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(API_KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .build());
            generator.generateKey();
        }
        SecretKey secretKey = (SecretKey) keyStore.getKey(API_KEY_ALIAS, null);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, secretKey);
        byte[] encrypted = cipher.doFinal(key.getBytes(StandardCharsets.UTF_8));
        String packed = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP) + "." +
                Base64.encodeToString(encrypted, Base64.NO_WRAP);
        prefs.edit().putString("openai_key_enc", packed).apply();
    }

    private String getStoredApiKey() {
        String packed = prefs.getString("openai_key_enc", "");
        if (packed.isEmpty()) return "";
        try {
            String[] pieces = packed.split("\\.", 2);
            if (pieces.length != 2) return "";
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            SecretKey secretKey = (SecretKey) keyStore.getKey(API_KEY_ALIAS, null);
            if (secretKey == null) return "";
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(128,
                    Base64.decode(pieces[0], Base64.NO_WRAP)));
            return new String(cipher.doFinal(Base64.decode(pieces[1], Base64.NO_WRAP)), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            return "";
        }
    }

    private void buildSettings() {
        ScrollView s = pageScroll();
        LinearLayout p = pageContent(s);
        pageHeading(p, "Settings", "Choose a target that helps you measure the next step.");
        LinearLayout targetCard = card();
        targetCard.setPadding(dp(16), dp(16), dp(16), dp(16));
        p.addView(targetCard);
        targetCard.addView(txt("TARGET SCORE", 10, MUTED, true));
        EditText target = editField("Target score (100–720)", String.valueOf(getTargetScore()), true);
        targetCard.addView(target, margin(0, 8, 0, 0));
        targetCard.addView(txt("Optional exam date (YYYY-MM-DD). Leave blank if you have not chosen one.",
                11, MUTED, false), margin(0, 12, 0, 0));
        EditText date = editField("YYYY-MM-DD", prefs.getString("target_date", ""), false);
        targetCard.addView(date, margin(0, 6, 0, 0));
        TextView save = primaryButton("Save preferences");
        targetCard.addView(save, margin(0, 13, 0, 0));
        save.setOnClickListener(v -> {
            int score = safeNumber(target);
            if (score < 100 || score > 720) {
                target.setError("Target must be between 100 and 720.");
                return;
            }
            String d = date.getText().toString().trim();
            if (!d.isEmpty() && !d.matches("\\d{4}-\\d{2}-\\d{2}")) {
                date.setError("Use YYYY-MM-DD.");
                return;
            }
            prefs.edit().putInt("target_score", score).putString("target_date", d).apply();
            showToast("Preferences saved");
            renderScreen("settings");
        });

        p.addView(section("AI & privacy"));
        LinearLayout ai = card();
        ai.setPadding(dp(15), dp(14), dp(15), dp(14));
        p.addView(ai);
        ai.addView(txt(getStoredApiKey().isEmpty() ? "Ask AI is not connected" : "Ask AI is connected",
                14, INK, true));
        ai.addView(txt("The API key is encrypted locally with Android Keystore. Questions and relevant score context are sent to OpenAI only when you submit them.",
                11, MUTED, false), margin(0, 6, 0, 0));
        TextView aiButton = secondaryButton(getStoredApiKey().isEmpty() ? "Connect OpenAI API key" : "Manage API key");
        ai.addView(aiButton, margin(0, 10, 0, 0));
        aiButton.setOnClickListener(v -> showApiKeyDialog());

        p.addView(section("Data & maintenance"));
        TextView share = secondaryButton("Export / share score report");
        p.addView(share);
        share.setOnClickListener(v -> shareReport());
        TextView clear = secondaryButton("Clear all saved mock results");
        p.addView(clear, margin(0, 9, 0, 0));
        clear.setOnClickListener(v -> new AlertDialog.Builder(this)
                .setTitle("Clear all mock results?")
                .setMessage("This permanently deletes saved mock results on this device. Mistake notes and preferences stay.")
                .setNegativeButton("Cancel", null)
                .setPositiveButton("Clear results", (d, w) -> {
                    for (String k : new ArrayList<>(prefs.getAll().keySet())) {
                        if (k.matches("t\\d+")) prefs.edit().remove(k).apply();
                    }
                    renderScreen("settings");
                    showToast("Mock history cleared");
                }).show());
        TextView clearJournal = secondaryButton("Clear all mistake journal entries");
        p.addView(clearJournal, margin(0, 9, 0, 0));
        clearJournal.setOnClickListener(v -> new AlertDialog.Builder(this)
                .setTitle("Clear mistake journal?")
                .setNegativeButton("Cancel", null)
                .setPositiveButton("Clear", (d, w) -> {
                    for (String k : new ArrayList<>(prefs.getAll().keySet())) {
                        if (k.startsWith("m:")) prefs.edit().remove(k).apply();
                    }
                    renderScreen("settings");
                }).show());

        p.addView(section("About NEET IQ"));
        LinearLayout about = card();
        about.setPadding(dp(15), dp(14), dp(15), dp(14));
        p.addView(about);
        about.addView(txt("Built for focused preparation", 14, INK, true));
        about.addView(txt("Version 2.0  ·  Offline-first score tracking  ·  NEET marking: +4 / −1",
                11, MUTED, false), margin(0, 5, 0, 0));
        about.addView(txt("Formula notes are quick revision aids. Verify details against your current NCERT material and official exam instructions.",
                11, MUTED, false), margin(0, 8, 0, 0));
    }

    private void buildFocus() {
        ScrollView s = pageScroll();
        LinearLayout p = pageContent(s);
        pageHeading(p, "Focus session", "One task. One block. No need to overthink the perfect schedule.");
        LinearLayout timerCard = new LinearLayout(this);
        timerCard.setOrientation(LinearLayout.VERTICAL);
        timerCard.setGravity(Gravity.CENTER_HORIZONTAL);
        timerCard.setPadding(dp(20), dp(25), dp(20), dp(23));
        timerCard.setBackground(round(NAVY, dp(24)));
        p.addView(timerCard);
        timerCard.addView(txt("POMODORO  ·  25 MIN", 10, Color.rgb(183, 194, 221), true));
        focusClock = txt(formatClock(focusRemainingMs), 51, WHITE, true);
        focusClock.setGravity(Gravity.CENTER);
        focusClock.setPadding(0, dp(13), 0, dp(13));
        timerCard.addView(focusClock);
        timerCard.addView(txt(focusRunning ? "Session in progress" : "Ready when you are",
                12, Color.rgb(183, 194, 221), false));
        TextView toggle = primaryButton(focusRunning ? "Pause focus session" : "Start focus session");
        LinearLayout.LayoutParams toggleLp = new LinearLayout.LayoutParams(-1, dp(49));
        toggleLp.topMargin = dp(21);
        timerCard.addView(toggle, toggleLp);
        toggle.setOnClickListener(v -> {
            if (focusRunning) pauseFocusTimer();
            else startFocusTimer();
            renderScreen("focus");
        });
        TextView reset = secondaryButton("Reset to 25 minutes");
        timerCard.addView(reset, margin(0, 9, 0, 0));
        reset.setOnClickListener(v -> {
            if (focusTimer != null) focusTimer.cancel();
            focusTimer = null;
            focusRunning = false;
            focusRemainingMs = 25 * 60 * 1000L;
            renderScreen("focus");
        });
        p.addView(section("Make the block count"));
        addInfoCard(p, "Before starting", "Write one exact outcome: for example, finish 25 electrostatics MCQs and review every error.", "INTENTION", BLUE);
        addInfoCard(p, "During the block", "Keep the phone still, solve without checking notes, and mark uncertain answers for review.", "EXECUTION", TEAL);
        addInfoCard(p, "After the block", "Take a short break, then record recurring mistakes in your journal.", "REVIEW", AMBER);
    }

    private void startFocusTimer() {
        if (focusRemainingMs <= 0) focusRemainingMs = 25 * 60 * 1000L;
        if (focusTimer != null) focusTimer.cancel();
        focusRunning = true;
        focusTimer = new CountDownTimer(focusRemainingMs, 1000) {
            public void onTick(long millis) {
                focusRemainingMs = millis;
                if (focusClock != null) focusClock.setText(formatClock(millis));
            }
            public void onFinish() {
                focusRemainingMs = 0;
                focusRunning = false;
                if (focusClock != null) focusClock.setText("00:00");
                showToast("Focus block complete. Take a short break.");
            }
        }.start();
    }

    private void pauseFocusTimer() {
        if (focusTimer != null) focusTimer.cancel();
        focusTimer = null;
        focusRunning = false;
    }

    private String formatClock(long ms) {
        long secs = Math.max(0, ms / 1000);
        return String.format(Locale.getDefault(), "%02d:%02d", secs / 60, secs % 60);
    }

    private void openDrawer(boolean toolsDrawer) {
        Dialog d = new Dialog(this);
        d.requestWindowFeature(Window.FEATURE_NO_TITLE);
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setPadding(dp(19), dp(23), dp(17), dp(20));
        panel.setBackground(round(WHITE, toolsDrawer ? dp(22) : dp(0)));

        LinearLayout header = new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout hc = new LinearLayout(this);
        hc.setOrientation(LinearLayout.VERTICAL);
        hc.addView(txt(toolsDrawer ? "Quick tools" : "NEET IQ", 22, INK, true));
        hc.addView(txt(toolsDrawer ? "Useful shortcuts" : "Your preparation space", 11, MUTED, false),
                margin(0, 3, 0, 0));
        header.addView(hc, new LinearLayout.LayoutParams(0, -2, 1f));
        TextView close = iconButton("×", 25, INK);
        close.setOnClickListener(v -> d.dismiss());
        header.addView(close, new LinearLayout.LayoutParams(dp(38), dp(42)));
        panel.addView(header);
        panel.addView(line(), margin(0, 16, 0, 14));

        if (toolsDrawer) {
            LinearLayout targetCard = card();
            targetCard.setPadding(dp(14), dp(13), dp(14), dp(13));
            targetCard.addView(txt("CURRENT SCORE TARGET", 9, MUTED, true));
            targetCard.addView(txt(getTargetScore() + " / 720", 27, INK, true), margin(0, 5, 0, 0));
            targetCard.addView(txt("Edit target and exam date in Settings.", 10, MUTED, false), margin(0, 2, 0, 0));
            panel.addView(targetCard);
            panel.addView(section("Shortcuts"));
            addNavRow(panel, d, "◷", "Focus timer", "25-minute study block", "focus");
            addNavRow(panel, d, "✎", "Mistake journal", "Learn from wrong answers", "mistakes");
            addNavRow(panel, d, "∑", "Formula vault", "Fast subject-wise revision", "formula");
            addNavRow(panel, d, "✓", "Study planner", "Today's checklist", "planner");
            addNavRow(panel, d, "⚙", "Settings", "Target, data and AI key", "settings");
        } else {
            addNavRow(panel, d, "⌂", "Today", "Overview and quick actions", "home");
            addNavRow(panel, d, "▦", "Mock tests", "Record scores and history", "tests");
            addNavRow(panel, d, "↗", "Performance", "Average, trend and subjects", "analytics");
            addNavRow(panel, d, "✓", "Study planner", "Checklist and routine", "planner");
            addNavRow(panel, d, "∑", "Formula vault", "Search revision formulas", "formula");
            addNavRow(panel, d, "✎", "Mistake journal", "Save recurring errors", "mistakes");
            addNavRow(panel, d, "◷", "Focus timer", "Build a focused block", "focus");
            addNavRow(panel, d, "✦", "Ask AI", "Study coach and mock analysis", "ai");
            addNavRow(panel, d, "⚙", "Settings", "Target, API key and data", "settings");
            View space = new View(this);
            panel.addView(space, new LinearLayout.LayoutParams(-1, 0, 1f));
            LinearLayout footer = card();
            footer.setPadding(dp(13), dp(13), dp(13), dp(13));
            footer.addView(txt("A little better each test.", 13, INK, true));
            footer.addView(txt("Your saved results remain on this device.", 10, MUTED, false), margin(0, 4, 0, 0));
            panel.addView(footer);
        }

        d.setContentView(panel);
        Window w = d.getWindow();
        if (w != null) {
            w.setBackgroundDrawableResource(android.R.color.transparent);
            w.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            WindowManager.LayoutParams a = w.getAttributes();
            a.width = dp(toolsDrawer ? 326 : 320);
            a.height = WindowManager.LayoutParams.MATCH_PARENT;
            a.gravity = (toolsDrawer ? Gravity.END : Gravity.START) | Gravity.TOP;
            a.dimAmount = 0.42f;
            w.setAttributes(a);
        }
        d.show();
        w = d.getWindow();
        if (w != null) w.setLayout(dp(toolsDrawer ? 326 : 320), WindowManager.LayoutParams.MATCH_PARENT);
    }

    private void addNavRow(LinearLayout parent, Dialog dialog, String symbol, String label, String description, String page) {
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(4), dp(10), dp(4), dp(10));
        TextView ico = txt(symbol, 20, BLUE, true);
        ico.setGravity(Gravity.CENTER);
        ico.setBackground(round(PALE_BLUE, dp(11)));
        row.addView(ico, new LinearLayout.LayoutParams(dp(41), dp(41)));
        LinearLayout copy = new LinearLayout(this);
        copy.setOrientation(LinearLayout.VERTICAL);
        copy.setPadding(dp(12), 0, 0, 0);
        copy.addView(txt(label, 14, INK, true));
        copy.addView(txt(description, 10, MUTED, false), margin(0, 3, 0, 0));
        row.addView(copy, new LinearLayout.LayoutParams(0, -2, 1f));
        TextView arrow = txt("›", 22, MUTED, false);
        row.addView(arrow);
        parent.addView(row, new LinearLayout.LayoutParams(-1, -2));
        row.setOnClickListener(v -> {
            dialog.dismiss();
            renderScreen(page);
        });
        row.setBackground(round(WHITE, dp(12)));
    }

    private void shareReport() {
        ArrayList<TestResult> records = getResults();
        StringBuilder report = new StringBuilder("NEET IQ — Mock Test Report\n");
        report.append("Target: ").append(getTargetScore()).append("/720\n\n");
        if (records.isEmpty()) report.append("No mock tests recorded yet.\n");
        else {
            report.append("Date,Test,Score,Correct,Wrong,Physics,Chemistry,Biology\n");
            for (TestResult r : records) {
                report.append(formatDate(r.timestamp)).append(",")
                        .append(r.name.replace(",", " ")).append(",")
                        .append(r.score).append(",").append(r.correct).append(",").append(r.wrong).append(",")
                        .append(r.hasSubjectBreakdown ? r.physics : "").append(",")
                        .append(r.hasSubjectBreakdown ? r.chemistry : "").append(",")
                        .append(r.hasSubjectBreakdown ? r.biology : "").append("\n");
            }
            report.append("\nAverage score: ").append(Math.round(averageScore(records))).append("/720\n");
            report.append("Personal best: ").append(bestScore(records)).append("/720\n");
        }
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType("text/plain");
        send.putExtra(Intent.EXTRA_SUBJECT, "NEET IQ — Mock Test Report");
        send.putExtra(Intent.EXTRA_TEXT, report.toString());
        startActivity(Intent.createChooser(send, "Share score report"));
    }

    private void addInfoCard(LinearLayout parent, String title, String body, String tag, int color) {
        LinearLayout c = card();
        c.setPadding(dp(14), dp(13), dp(14), dp(14));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.bottomMargin = dp(9);
        parent.addView(c, lp);
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.addView(txt(title, 14, INK, true), new LinearLayout.LayoutParams(0, -2, 1f));
        c.addView(row);
        c.addView(txt(body, 11, MUTED, false), margin(0, 6, 0, 0));
        TextView chip = txt(tag, 9, color, true);
        chip.setPadding(dp(8), dp(5), dp(8), dp(5));
        chip.setBackground(round(color == TEAL ? PALE_TEAL : color == AMBER ? Color.rgb(255, 245, 228) : PALE_BLUE, dp(8)));
        c.addView(chip, margin(0, 10, 0, 0));
    }

    private void addProgressRow(LinearLayout parent, String label, String value, float fraction, int color) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams outer = new LinearLayout.LayoutParams(-1, -2);
        outer.bottomMargin = dp(15);
        parent.addView(row, outer);
        LinearLayout header = new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.addView(txt(label, 12, INK, true), new LinearLayout.LayoutParams(0, -2, 1f));
        header.addView(txt(value, 10, MUTED, false));
        row.addView(header);
        row.addView(new ProgressTrack(this, fraction, color, LINE), margin(0, 8, 0, 0));
    }

    private TextView emptyState(String title, String body) {
        LinearLayout c = card();
        c.setOrientation(LinearLayout.VERTICAL);
        c.setPadding(dp(17), dp(17), dp(17), dp(17));
        c.addView(txt(title, 14, INK, true));
        c.addView(txt(body, 11, MUTED, false), margin(0, 5, 0, 0));
        // Return a TextView-compatible lightweight holder is not possible; this method is wrapped below.
        return new EmptyStateText(this, c);
    }

    private class EmptyStateText extends TextView {
        EmptyStateText(Context context, LinearLayout child) {
            super(context);
            setVisibility(View.GONE);
            child.setLayoutParams(new LinearLayout.LayoutParams(-1, -2));
            setTag(child);
        }
    }

    private void pageHeading(LinearLayout p, String title, String subtitle) {
        TextView t = txt(title, 27, INK, true);
        t.setPadding(0, 0, 0, dp(5));
        p.addView(t);
        p.addView(txt(subtitle, 12, MUTED, false), margin(0, 0, 0, 15));
    }

    private TextView section(String label) {
        TextView t = txt(label, 17, INK, true);
        t.setPadding(0, dp(22), 0, dp(10));
        return t;
    }

    private EditText editField(String hint, String initial, boolean numeric) {
        EditText e = new EditText(this);
        e.setSingleLine(true);
        e.setHint(hint);
        e.setText(initial == null ? "" : initial);
        e.setTextSize(13);
        e.setTextColor(INK);
        e.setHintTextColor(Color.rgb(150, 159, 176));
        e.setPadding(dp(13), dp(7), dp(13), dp(7));
        e.setBackground(round(WHITE, dp(11)));
        GradientDrawable bg = round(WHITE, dp(11));
        bg.setStroke(dp(1), LINE);
        e.setBackground(bg);
        if (numeric) e.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_SIGNED);
        return e;
    }

    private TextView primaryButton(String label) {
        TextView b = txt(label, 13, WHITE, true);
        b.setGravity(Gravity.CENTER);
        b.setPadding(dp(14), dp(10), dp(14), dp(10));
        b.setBackground(round(BLUE, dp(13)));
        b.setClickable(true);
        return b;
    }

    private TextView secondaryButton(String label) {
        TextView b = txt(label, 12, INK, true);
        b.setGravity(Gravity.CENTER);
        b.setPadding(dp(13), dp(10), dp(13), dp(10));
        GradientDrawable d = round(WHITE, dp(13));
        d.setStroke(dp(1), LINE);
        b.setBackground(d);
        b.setClickable(true);
        return b;
    }

    private TextView iconButton(String symbol, int size, int color) {
        TextView b = txt(symbol, size, color, true);
        b.setGravity(Gravity.CENTER);
        b.setBackground(round(BG, dp(12)));
        return b;
    }

    private TextView txt(String value, int size, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(value);
        t.setTextSize(size);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        t.setIncludeFontPadding(true);
        return t;
    }

    private LinearLayout card() {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable b = round(WHITE, dp(17));
        b.setStroke(dp(1), LINE);
        c.setBackground(b);
        return c;
    }

    private GradientDrawable round(int color, int radius) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(radius);
        return d;
    }

    private View line() {
        View v = new View(this);
        v.setBackgroundColor(LINE);
        return v;
    }

    private LinearLayout.LayoutParams margin(int left, int top, int right, int bottom) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1, -2);
        p.leftMargin = dp(left);
        p.topMargin = dp(top);
        p.rightMargin = dp(right);
        p.bottomMargin = dp(bottom);
        return p;
    }

    private int dp(float value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }

    private int safeNumber(EditText e) {
        try { return Math.max(0, Integer.parseInt(e.getText().toString().trim())); }
        catch (Exception ex) { return 0; }
    }

    private String cleanPart(String s) {
        return s == null ? "" : s.replace("|", " ").replace("\n", " ").replace("\r", " ");
    }

    private int getTargetScore() {
        return prefs.getInt("target_score", 650);
    }

    private void showToast(String text) {
        Toast.makeText(this, text, Toast.LENGTH_SHORT).show();
    }

    private void hideKeyboard() {
        try {
            InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
            if (imm != null && getCurrentFocus() != null) imm.hideSoftInputFromWindow(getCurrentFocus().getWindowToken(), 0);
        } catch (Exception ignored) {}
    }

    private String formatDate(long time) {
        if (time <= 0) return "Saved test";
        return new SimpleDateFormat("d MMM yyyy", Locale.getDefault()).format(new Date(time));
    }

    private String formatSubjectAverage(ArrayList<TestResult> records, int subject, int max) {
        if (records.isEmpty()) return "No data";
        return String.format(Locale.getDefault(), "%.0f / %d avg", averageSubject(records, subject), max);
    }

    private float subjectProgress(ArrayList<TestResult> records, int subject, int max) {
        if (records.isEmpty()) return 0;
        return (float) Math.max(0, Math.min(1, averageSubject(records, subject) / max));
    }

    private int weakestSubject(ArrayList<TestResult> records) {
        int weak = 0;
        double low = Double.MAX_VALUE;
        int[] caps = {180, 180, 360};
        for (int i = 0; i < 3; i++) {
            double ratio = averageSubject(records, i) / caps[i];
            if (ratio < low) { low = ratio; weak = i; }
        }
        return weak;
    }

    private double averageSubject(ArrayList<TestResult> records, int subject) {
        if (records.isEmpty()) return 0;
        double sum = 0;
        for (TestResult r : records) sum += subject == 0 ? r.physics : subject == 1 ? r.chemistry : r.biology;
        return sum / records.size();
    }

    private int averageScore(ArrayList<TestResult> records) {
        if (records.isEmpty()) return 0;
        long total = 0;
        for (TestResult r : records) total += r.score;
        return (int) Math.round(total / (double) records.size());
    }

    private int bestScore(ArrayList<TestResult> records) {
        int best = Integer.MIN_VALUE;
        for (TestResult r : records) best = Math.max(best, r.score);
        return records.isEmpty() ? 0 : best;
    }

    private ArrayList<TestResult> getResults() {
        ArrayList<TestResult> out = new ArrayList<>();
        Map<String, ?> all = prefs.getAll();
        for (String key : all.keySet()) {
            if (!key.matches("t\\d+")) continue;
            Object raw = all.get(key);
            if (!(raw instanceof String)) continue;
            try {
                String[] a = ((String) raw).split("\\|", -1);
                if (a.length < 4) continue;
                TestResult r = new TestResult();
                r.key = key;
                r.name = a[0].isEmpty() ? "Mock Test" : a[0];
                r.score = Integer.parseInt(a[1]);
                r.correct = Integer.parseInt(a[2]);
                r.wrong = Integer.parseInt(a[3]);
                r.physics = a.length > 4 ? Integer.parseInt(a[4]) : 0;
                r.chemistry = a.length > 5 ? Integer.parseInt(a[5]) : 0;
                r.biology = a.length > 6 ? Integer.parseInt(a[6]) : 0;
                r.timestamp = a.length > 7 ? Long.parseLong(a[7]) : parseTime(key);
                r.hasSubjectBreakdown = a.length > 8;
                out.add(r);
            } catch (Exception ignored) {}
        }
        Collections.sort(out, (a, b) -> Long.compare(b.timestamp, a.timestamp));
        return out;
    }

    private long parseTime(String key) {
        try { return Long.parseLong(key.substring(1)); } catch (Exception ex) { return 0; }
    }

    private int completedTasks() {
        int done = 0;
        for (String id : plannerTaskIds) if (prefs.getBoolean("task:" + id, false)) done++;
        return done;
    }

    private ArrayList<Mistake> getMistakes() {
        ArrayList<Mistake> out = new ArrayList<>();
        Map<String, ?> all = prefs.getAll();
        for (String key : all.keySet()) {
            if (!key.startsWith("m:")) continue;
            Object raw = all.get(key);
            if (!(raw instanceof String)) continue;
            try {
                String[] a = ((String) raw).split("\\|", 5);
                if (a.length < 5) continue;
                Mistake m = new Mistake();
                m.key = key; m.subject = a[0]; m.type = a[1]; m.chapter = a[2]; m.note = a[3];
                m.timestamp = Long.parseLong(a[4]);
                out.add(m);
            } catch (Exception ignored) {}
        }
        Collections.sort(out, (a, b) -> Long.compare(b.timestamp, a.timestamp));
        return out;
    }

    private static String safeMessage(Exception e) {
        if (e == null || e.getMessage() == null || e.getMessage().trim().isEmpty()) return e == null ? "Unknown error" : e.getClass().getSimpleName();
        return e.getMessage();
    }

    private static class TestResult {
        String key, name;
        int score, correct, wrong, physics, chemistry, biology;
        long timestamp;
        boolean hasSubjectBreakdown;
    }

    private static class Mistake {
        String key, subject, type, chapter, note;
        long timestamp;
    }

    private static class ChatMessage {
        String role, text;
        ChatMessage(String r, String t) { role = r; text = t; }
    }

    private class ProgressTrack extends View {
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final float fraction;
        private final int color, trackColor;
        ProgressTrack(Context context, float f, int c, int t) {
            super(context);
            fraction = Math.max(0, Math.min(1, f));
            color = c; trackColor = t;
            setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        }
        @Override protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
            int width = MeasureSpec.getSize(widthMeasureSpec);
            int height = dp(7);
            setMeasuredDimension(width, height);
        }
        @Override protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            float h = getHeight();
            float r = h / 2f;
            paint.setColor(trackColor);
            canvas.drawRoundRect(0, 0, getWidth(), h, r, r, paint);
            paint.setColor(color);
            float w = Math.max(h, getWidth() * fraction);
            canvas.drawRoundRect(0, 0, Math.min(getWidth(), w), h, r, r, paint);
        }
    }

    private class TrendChart extends View {
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final ArrayList<Integer> values;
        TrendChart(Context context, ArrayList<Integer> v) {
            super(context);
            values = v;
        }
        @Override protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            float left = dp(22), right = getWidth() - dp(12), top = dp(12), bottom = getHeight() - dp(21);
            float chartW = Math.max(1, right - left), chartH = Math.max(1, bottom - top);
            paint.setStrokeWidth(dp(1));
            paint.setColor(LINE);
            for (int i = 0; i <= 4; i++) {
                float y = top + chartH * i / 4f;
                canvas.drawLine(left, y, right, y, paint);
            }
            if (values.isEmpty()) return;
            Path path = new Path();
            int n = values.size();
            for (int i = 0; i < n; i++) {
                float x = n == 1 ? (left + right) / 2f : left + chartW * i / (n - 1f);
                float score = Math.max(0, Math.min(720, values.get(i)));
                float y = bottom - chartH * score / 720f;
                if (i == 0) path.moveTo(x, y); else path.lineTo(x, y);
            }
            paint.setColor(BLUE);
            paint.setStrokeWidth(dp(2.5f));
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeCap(Paint.Cap.ROUND);
            paint.setStrokeJoin(Paint.Join.ROUND);
            canvas.drawPath(path, paint);
            paint.setStyle(Paint.Style.FILL);
            for (int i = 0; i < n; i++) {
                float x = n == 1 ? (left + right) / 2f : left + chartW * i / (n - 1f);
                float score = Math.max(0, Math.min(720, values.get(i)));
                float y = bottom - chartH * score / 720f;
                paint.setColor(WHITE);
                canvas.drawCircle(x, y, dp(5), paint);
                paint.setColor(BLUE);
                paint.setStyle(Paint.Style.STROKE);
                paint.setStrokeWidth(dp(2));
                canvas.drawCircle(x, y, dp(5), paint);
                paint.setStyle(Paint.Style.FILL);
            }
            paint.setColor(MUTED);
            paint.setTextSize(dp(9));
            canvas.drawText("720", 0, top + dp(4), paint);
            canvas.drawText("0", dp(8), bottom, paint);
        }
    }
}