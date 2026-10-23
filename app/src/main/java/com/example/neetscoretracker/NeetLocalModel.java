package com.example.neetscoretracker;

import android.content.Context;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Offline NEET intelligence engine.
 * It performs local question retrieval and adaptive topic-risk estimation. It is not a generative LLM;
 * free-form language generation is delegated to the optional online LLM.
 */
public final class NeetLocalModel {
    public static final class Question {
        public String id="", subject="", chapter="", prompt="", optionA="", optionB="", optionC="", optionD="";
        public String correctAnswer="", userAnswer="", difficulty="Medium", explanation="", note="";
        public long timestamp;
        public boolean answered() { return userAnswer != null && !userAnswer.trim().isEmpty(); }
        public boolean correct() { return answered() && normal(userAnswer).equals(normal(correctAnswer)); }
        public boolean wrong() { return answered() && !correct(); }
    }

    public static final class TopicInsight {
        public String subject, chapter;
        public int attempts, wrong, correct;
        public double risk, accuracy;
        public TopicInsight(String s, String c, int a, int w, int ok, double r, double ac) {
            subject=s; chapter=c; attempts=a; wrong=w; correct=ok; risk=r; accuracy=ac;
        }
    }

    private final double priorError;
    private final double priorAttempts;
    private final double difficultyWeight;
    private final double repeatErrorWeight;

    public NeetLocalModel(Context context) {
        double p=0.28, n=4.0, d=0.18, rep=0.12;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                context.getAssets().open("neet_topic_risk_model.json"), StandardCharsets.UTF_8))) {
            StringBuilder b = new StringBuilder(); String line;
            while ((line=reader.readLine())!=null) b.append(line);
            JSONObject model = new JSONObject(b.toString());
            p=model.optDouble("prior_error_rate",p);
            n=model.optDouble("prior_attempts",n);
            d=model.optDouble("difficulty_weight",d);
            rep=model.optDouble("repeat_error_weight",rep);
        } catch (Exception ignored) {}
        priorError = clamp(p,0.05,0.75);
        priorAttempts = clamp(n,1,30);
        difficultyWeight = clamp(d,0,0.5);
        repeatErrorWeight = clamp(rep,0,0.5);
    }

    public List<TopicInsight> rankTopics(List<Question> questions) {
        Map<String,Group> groups = new HashMap<>();
        for (Question q : questions) {
            if (!q.answered()) continue;
            String sub = clean(q.subject).isEmpty() ? "Other" : clean(q.subject);
            String chapter = clean(q.chapter).isEmpty() ? "Unsorted" : clean(q.chapter);
            String key = sub + "\u001f" + chapter;
            Group g = groups.get(key);
            if (g==null) { g=new Group(sub,chapter); groups.put(key,g); }
            g.attempts++;
            if (q.correct()) g.correct++; else g.wrong++;
            g.difficulty += difficulty(q.difficulty);
            if (q.wrong()) g.consecutiveWrong++;
        }
        List<TopicInsight> out = new ArrayList<>();
        for (Group g : groups.values()) {
            double smoothedError = (g.wrong + priorError*priorAttempts)/(g.attempts+priorAttempts);
            double meanDiff = g.attempts == 0 ? 1 : g.difficulty/g.attempts;
            double repeat = Math.min(1, (double)g.consecutiveWrong/Math.max(2,g.attempts));
            double risk = clamp(smoothedError + difficultyWeight*(meanDiff-1) + repeatErrorWeight*repeat,0,1);
            double accuracy = g.attempts==0 ? 0 : 100.0*g.correct/g.attempts;
            out.add(new TopicInsight(g.subject,g.chapter,g.attempts,g.wrong,g.correct,risk,accuracy));
        }
        Collections.sort(out, (a,b) -> {
            int risk=Double.compare(b.risk,a.risk);
            if(risk!=0)return risk;
            return Integer.compare(b.attempts,a.attempts);
        });
        return out;
    }

    public String analyse(String prompt, List<Question> questions, List<String> tests,
                          List<String> mistakes, int targetScore) {
        int answered=0, correct=0, wrong=0, total=questions.size();
        for (Question q : questions) if(q.answered()){answered++;if(q.correct())correct++;else wrong++;}
        List<TopicInsight> topics=rankTopics(questions);
        StringBuilder out=new StringBuilder();
        out.append("NEET IQ · OFFLINE INTELLIGENCE REPORT\n");
        out.append("This report was generated on this device from your saved app data.\n\n");
        out.append("QUESTION BANK\n");
        out.append("• Saved questions: ").append(total).append("\n");
        out.append("• Answered: ").append(answered).append("  ·  Correct: ").append(correct)
           .append("  ·  Incorrect: ").append(wrong).append("\n");
        out.append("• Answer accuracy: ").append(answered==0 ? "not enough answered questions" :
                String.format(Locale.US,"%.1f%%",100.0*correct/answered)).append("\n");
        out.append("• Score target: ").append(targetScore).append("/720\n\n");

        out.append("TOPIC RISK MODEL\n");
        if(topics.isEmpty()) {
            out.append("No answered questions have topic labels yet. Add questions, answer them, and include the chapter to train the topic-risk estimates.\n");
        } else {
            for(int i=0;i<Math.min(6,topics.size());i++) {
                TopicInsight t=topics.get(i);
                out.append(i+1).append(". ").append(t.subject).append(" / ").append(t.chapter)
                   .append(" — risk ").append(Math.round(t.risk*100)).append("%; ")
                   .append(t.wrong).append(" wrong of ").append(t.attempts)
                   .append(" answered (").append(String.format(Locale.US,"%.0f%%",t.accuracy)).append(" accuracy).\n");
            }
            TopicInsight top=topics.get(0);
            out.append("\nSuggested next block: spend 25–35 focused minutes on ")
               .append(top.chapter).append(" (").append(top.subject).append("), revisit the core concept,")
               .append(" then solve 10–15 similar questions and review every error.\n");
        }

        if(!tests.isEmpty()) {
            out.append("\nMOCK-TEST CONTEXT\n");
            for(int i=0;i<Math.min(5,tests.size());i++)out.append("• ").append(tests.get(i)).append("\n");
        }
        if(!mistakes.isEmpty()) {
            out.append("\nMISTAKE PATTERNS\n");
            for(int i=0;i<Math.min(5,mistakes.size());i++)out.append("• ").append(mistakes.get(i)).append("\n");
        }

        String q = prompt==null ? "" : prompt.trim();
        if(!q.isEmpty()) {
            out.append("\nYOUR QUESTION\n").append(q).append("\n");
            List<Question> matched = retrieve(q,questions,3);
            if(!matched.isEmpty()) {
                out.append("\nMOST RELEVANT SAVED QUESTIONS\n");
                for(Question item:matched) {
                    out.append("• [").append(item.subject).append(" / ").append(item.chapter).append("] ")
                       .append(shorten(item.prompt,220)).append("\n");
                    if(!item.correctAnswer.isEmpty())out.append("  Official/saved answer: ").append(item.correctAnswer).append("\n");
                    if(!item.explanation.isEmpty())out.append("  Explanation: ").append(shorten(item.explanation,260)).append("\n");
                    if(item.answered())out.append("  Your answer: ").append(item.userAnswer)
                        .append(item.correct()?" (correct)":" (incorrect)").append("\n");
                }
            } else {
                out.append("I could not find a close match in your saved question bank. Add the question with its options, answer and explanation to analyse it locally.\n");
            }
            out.append("\nOFFLINE LIMITATION\nThis local mode can search your saved questions, calculate performance patterns, flag at-risk topics and summarise your stored notes. It does not contain a general-purpose generative LLM, so it cannot reliably solve arbitrary new text questions that are not in your saved data. Connect an OpenAI API key in Settings for full natural-language reasoning.\n");
        }
        return out.toString();
    }

    public List<Question> retrieve(String query,List<Question> questions,int limit) {
        Set<String> terms=terms(query);
        List<ScoredQuestion> scores=new ArrayList<>();
        for(Question q:questions) {
            String content=(q.subject+" "+q.chapter+" "+q.prompt+" "+q.explanation+" "+q.note+" "+
                q.optionA+" "+q.optionB+" "+q.optionC+" "+q.optionD).toLowerCase(Locale.ROOT);
            int matched=0;
            for(String t:terms)if(content.contains(t))matched++;
            if(matched>0)scores.add(new ScoredQuestion(q, (double)matched/Math.max(1,terms.size())));
        }
        Collections.sort(scores,(a,b)->Double.compare(b.score,a.score));
        List<Question> out=new ArrayList<>();
        for(int i=0;i<Math.min(limit,scores.size());i++)out.add(scores.get(i).question);
        return out;
    }

    private static Set<String> terms(String text) {
        Set<String> set=new HashSet<>();
        if(text==null)return set;
        for(String part:text.toLowerCase(Locale.ROOT).split("[^a-z0-9]+"))
            if(part.length()>2 && !Arrays.asList("the","and","for","you","what","how","why","from","this","that","with","can","are","was","were","into","about","neet").contains(part))
                set.add(part);
        return set;
    }
    private static String normal(String s){return s==null?"":s.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]","");}
    private static String clean(String s){return s==null?"":s.trim();}
    private static String shorten(String s,int n){if(s==null)return "";return s.length()<=n?s:s.substring(0,n)+"…";}
    private static double difficulty(String s){
        String d=s==null?"":s.toLowerCase(Locale.ROOT);
        if(d.contains("hard")||d.contains("difficult"))return 1.5;
        if(d.contains("easy"))return 0.65;
        return 1.0;
    }
    private static double clamp(double x,double lo,double hi){return Math.max(lo,Math.min(hi,x));}
    private static final class Group {
        String subject,chapter;int attempts,wrong,correct,consecutiveWrong;double difficulty;
        Group(String s,String c){subject=s;chapter=c;}
    }
    private static final class ScoredQuestion {
        Question question;double score;
        ScoredQuestion(Question q,double s){question=q;score=s;}
    }
}
