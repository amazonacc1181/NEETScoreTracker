(function(){
'use strict';
var $=function(id){return document.getElementById(id);},PREFIX='tlm:';
var get=function(key,fallback){try{var raw=localStorage.getItem(PREFIX+key);return raw===null?fallback:JSON.parse(raw);}catch(e){return fallback;}};
var set=function(key,value){try{localStorage.setItem(PREFIX+key,JSON.stringify(value));}catch(e){}};
var themeColors={love:'#f3a6c8',joy:'#ffd36e',retro:'#e4b36c',sad:'#aeb9f5',hectic:'#ff9d7e'};
var activeTheme=get('studyTheme','love');if(!themeColors[activeTheme])activeTheme='love';document.documentElement.setAttribute('data-study-theme',activeTheme);
var themeName=function(t){return ({love:'LOVE STUDY',joy:'JOY STUDY',retro:'RETRO STUDY',sad:'SAD STUDY',hectic:'HECTIC STUDY'})[t]||'LOVE STUDY';};
var profile=get('profile',null),session=get('activeStudySession',null),ticker=null,persistTicker=null,mathAnswer=null,finished=false;
var channel=('BroadcastChannel' in window)?new BroadcastChannel('tlm-study-session'):null;
var categoryIndex={General:0,EWS:1,OBC:2,SC:3,ST:4};
var cutoffs={'AIIMS New Delhi':[51,292,192,793,987],'AIIMS Bhopal':[567,1220,1084,7782,8673],'AIIMS Bhubaneswar':[664,1660,1233,5396,10926],'AIIMS Jodhpur':[343,879,714,3941,4457],'AIIMS Patna':[1593,2675,2054,16709,24984],'AIIMS Raipur':[1008,2323,1683,12796,16950],'AIIMS Rishikesh':[537,1089,979,6429,8532],'AIIMS Nagpur':[792,1839,1350,8360,13431],'AIIMS Bathinda':[1630,2910,2190,18819,26664],'AIIMS Mangalagiri':[1314,3021,2079,16901,21776],'AIIMS Bibinagar':[1705,3180,2592,17543,28792],'AIIMS Deoghar':[3090,4569,3771,25371,40599],'AIIMS Gorakhpur':[2114,3085,2443,19159,33950],'AIIMS Kalyani':[2188,3955,3049,18440,37522],'AIIMS Raebareli':[2634,3586,3160,22455,35875],'AIIMS Rajkot':[2039,2889,2892,20222,31646],'AIIMS Vijaypur (Jammu)':[3327,4748,3834,27322,34696],'AIIMS Guwahati':[2997,4802,3823,27539,37116],'AIIMS Bilaspur':[2260,3287,2786,20129,30805],'AIIMS Madurai':[3421,5416,4281,27253,44940],'AIIMS Rewari':[3810,5492,4382,28615,39811]};
function targetAIR(){
 if(session&&Number.isFinite(Number(session.targetRank)))return Number(session.targetRank);
 var p=(session&&session.profile)||profile||{},v=cutoffs[p.dreamCollege],i=categoryIndex[p.category]||0;
 return v?Math.max(1,Math.floor(v[i]*.8)):null;
}
function elapsed(){
 return session?Math.max(0,Number(session.elapsedMs)||0)+(!session.paused&&session.segmentStartedAt?Math.max(0,Date.now()-session.segmentStartedAt):0):0;
}
function format(ms){
 var sec=Math.floor(ms/1000),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;
 return [h,m,s].map(function(n){return String(n).padStart(2,'0');}).join(':');
}
function persist(){
 if(!session||finished)return;
 if(!session.paused&&session.segmentStartedAt){var now=Date.now();session.elapsedMs=(Number(session.elapsedMs)||0)+Math.max(0,now-session.segmentStartedAt);session.segmentStartedAt=now;}
 set('activeStudySession',session);
}
function paint(){if(session)$('studySessionClock').textContent=format(elapsed());}
function startTicker(){stopTicker();paint();ticker=setInterval(paint,1000);persistTicker=setInterval(persist,5000);}
function stopTicker(){if(ticker){clearInterval(ticker);ticker=null;}if(persistTicker){clearInterval(persistTicker);persistTicker=null;}}
function saveHistory(reason){
 if(!session||finished)return false;
 persist();
 var now=Date.now(),duration=Math.max(0,Number(session.elapsedMs)||0),history=get('studyHistory',[]);
 if(!Array.isArray(history))history=[];
 if(!history.some(function(row){return row.id===session.id;})){
  history.unshift({id:session.id,startedAt:session.startedAt,endedAt:now,durationMs:duration,endReason:reason||'completed'});set('studyHistory',history);
 }
 finished=true;set('activeStudySession',null);stopTicker();
 if(channel)channel.postMessage({type:'session-ended',sessionId:session.id,reason:reason||'completed'});
 session=null;return true;
}
function saveAndClose(){
 saveHistory('completed');
 $('studySessionScreen').classList.remove('active');$('studyMathGate').classList.remove('open');$('studyDoneScreen').hidden=false;
 document.title='Session Saved — The Last Mile';
 setTimeout(function(){try{window.close();}catch(e){}},300);
}
function newMath(){
 var ops=['+','−','×'],op=ops[Math.floor(Math.random()*ops.length)],a,b;
 if(op==='+'){a=4+Math.floor(Math.random()*17);b=3+Math.floor(Math.random()*16);mathAnswer=a+b;}
 else if(op==='−'){a=12+Math.floor(Math.random()*19);b=2+Math.floor(Math.random()*Math.min(11,a-1));mathAnswer=a-b;}
 else{a=2+Math.floor(Math.random()*8);b=2+Math.floor(Math.random()*8);mathAnswer=a*b;}
 $('studyMathQuestion').textContent=a+' '+op+' '+b+' = ?';$('studyMathAnswer').value='';$('studyMathFeedback').textContent='';
}
function pause(){if(!session||session.paused)return;persist();session.paused=true;session.segmentStartedAt=null;set('activeStudySession',session);$('pauseStudySession').hidden=true;$('resumeStudySession').hidden=false;$('studySessionState').textContent='SESSION PAUSED';paint();}
function resume(){if(!session||!session.paused)return;session.paused=false;session.segmentStartedAt=Date.now();set('activeStudySession',session);$('pauseStudySession').hidden=false;$('resumeStudySession').hidden=true;$('studySessionState').textContent='FOCUS IN PROGRESS';startTicker();}
function autoEnd(reason,closeWindow){if(!session||finished)return;saveHistory(reason||'page-closed');if(closeWindow){try{window.close();}catch(e){}}}
function onPageHide(){autoEnd('session-page-closed',false);}
function setup(){
 var p=(session&&session.profile)||profile;
 if(!p||!session){$('studySessionScreen').classList.remove('active');$('studyDoneScreen').hidden=false;$('studyDoneScreen').querySelector('h1').innerHTML='No active<br><em>study session.</em>';$('studyDoneScreen').querySelector('p').textContent='Start a new session from your Last Mile dashboard.';return false;}
 var name=String(p.name||'Aspirant').replace(/[&<>"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch];});
 $('sessionDoctorName').textContent='Dr. '+name;$('sessionDreamCampus').textContent=p.dreamCollege||'Your dream AIIMS';
 var rank=targetAIR();$('sessionRequiredRank').textContent=rank?'AIR ≤ '+rank.toLocaleString('en-IN'):'TARGET AIR UNAVAILABLE';
 var photo=session.photo||'assets/aiims-delhi.webp';$('sessionCampusImage').src=photo;$('sessionCampusImage').alt=(p.dreamCollege||'AIIMS')+' campus';
 $('studySessionState').textContent=session.paused?'SESSION PAUSED':'FOCUS IN PROGRESS';
 $('pauseStudySession').hidden=!!session.paused;$('resumeStudySession').hidden=!session.paused;
 document.title='Focus Mode — Dr. '+p.name+' | The Last Mile';return true;
}
$('pauseStudySession').addEventListener('click',pause);$('resumeStudySession').addEventListener('click',resume);
$('endStudySession').addEventListener('click',function(){if(!session)return;newMath();$('studyMathGate').classList.add('open');$('studyMathGate').setAttribute('aria-hidden','false');$('studyMathAnswer').focus();});
$('cancelStudyEnd').addEventListener('click',function(){$('studyMathGate').classList.remove('open');$('studyMathGate').setAttribute('aria-hidden','true');$('studyMathAnswer').value='';});
$('studyMathForm').addEventListener('submit',function(event){event.preventDefault();if(Number($('studyMathAnswer').value)!==mathAnswer){$('studyMathFeedback').textContent='Not quite. Solve the new problem.';return;}saveAndClose();});
function checkHomeClosed(){var marker=get('studyHomeClosedAt',null);if(marker&&session&&marker.sessionId===session.id)autoEnd('home-closed',true);}
if(channel)channel.addEventListener('message',function(event){if(event.data&&event.data.type==='home-closed'&&session&&event.data.sessionId===session.id)autoEnd('home-closed',true);});
window.addEventListener('storage',function(event){if(event.key==='tlm:studyHomeClosedAt')checkHomeClosed();});
document.addEventListener('visibilitychange',function(){if(!document.hidden){checkHomeClosed();paint();persist();}});
checkHomeClosed();
window.addEventListener('pagehide',onPageHide);
window.addEventListener('storage',function(event){if(event.key==='tlm:activeStudySession'&&event.newValue==='null')autoEnd('ended-elsewhere',false);});
if(setup())startTicker();

/* Music drawer is available on this tab too. Playback is never paused on tab visibility changes. */
var toast=function(message){var el=$('toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove('show');},2400);};
var drawer=$('musicDrawer'),backdrop=$('musicBackdrop'),fab=$('musicFab'),close=$('musicClose'),returnFocus=null;
function openMusic(){returnFocus=document.activeElement;drawer.classList.add('open');backdrop.classList.add('open');drawer.setAttribute('aria-hidden','false');drawer.removeAttribute('inert');document.body.classList.add('drawer-open');fab.setAttribute('aria-expanded','true');close.focus();if(tracks.length&&autoplayBlocked&&audio.paused){autoplayBlocked=false;playMusic();}}
function closeMusic(){drawer.classList.remove('open');backdrop.classList.remove('open');drawer.setAttribute('aria-hidden','true');drawer.setAttribute('inert','');document.body.classList.remove('drawer-open');fab.setAttribute('aria-expanded','false');if(returnFocus)returnFocus.focus();}
fab.addEventListener('click',openMusic);close.addEventListener('click',closeMusic);backdrop.addEventListener('click',closeMusic);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&drawer.classList.contains('open'))closeMusic();});
var audio=$('musicAudio'),tracks=[],trackIndex=0,autoplayBlocked=false,shuffle=false,repeat=false;
function timeText(n){return Number.isFinite(n)?Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0'):'0:00';}
function musicStatus(v){$('musicState').textContent=v;}
function renderQueue(){
 var queue=$('musicQueue');queue.replaceChildren();$('queueCount').textContent=tracks.length+' TRACK'+(tracks.length===1?'':'S');
 if(!tracks.length){var empty=document.createElement('div');empty.className='queue-empty';empty.textContent='Your playlist will appear here once MP3 files are added.';queue.appendChild(empty);return;}
 tracks.forEach(function(t,i){var b=document.createElement('button');b.type='button';b.className='queue-item'+(i===trackIndex?' current':'');var n=document.createElement('span');n.className='queue-index';n.textContent=String(i+1).padStart(2,'0');var copy=document.createElement('span');copy.className='queue-copy';var title=document.createElement('strong');title.textContent=t.title||'Untitled track';var meta=document.createElement('small');meta.textContent=i===trackIndex?'NOW PLAYING':'PLAY THIS TRACK';copy.appendChild(title);copy.appendChild(meta);b.appendChild(n);b.appendChild(copy);b.addEventListener('click',function(){loadTrack(i,true);});queue.appendChild(b);});
}
function updateTrack(){if(!tracks.length)return;$('trackTitle').textContent=tracks[trackIndex].title||'UNTITLED TRACK';$('trackPosition').textContent='TRACK '+(trackIndex+1)+' OF '+tracks.length;renderQueue();}
function playMusic(){
 if(!tracks.length)return;audio.muted=false;var promise;
 try{promise=audio.play();}catch(e){autoplayBlocked=true;musicStatus('TAP TO PLAY');return;}
 if(promise&&promise.then)promise.then(function(){autoplayBlocked=false;$('toggleMusic').textContent='Ⅱ';$('toggleMusic').setAttribute('aria-label','Pause music');musicStatus('MUSIC PLAYING');}).catch(function(){autoplayBlocked=true;$('toggleMusic').textContent='▶';musicStatus('TAP TO PLAY');});
}
function loadTrack(i,play){if(!tracks.length)return;trackIndex=(i+tracks.length)%tracks.length;audio.src=tracks[trackIndex].src;audio.load();updateTrack();if(play)playMusic();}
var playlistCache={},playlistLoads={},playlistTicket=0;

function getMoodPlaylist(theme){
 if(Object.prototype.hasOwnProperty.call(playlistCache,theme))return Promise.resolve(playlistCache[theme]);
 if(playlistLoads[theme])return playlistLoads[theme];
 playlistLoads[theme]=fetch('music/'+theme+'/playlist.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('Playlist unavailable');return r.json();}).then(function(list){var safe=Array.isArray(list)?list.filter(function(t){return t&&typeof t.src==='string';}):[];playlistCache[theme]=safe;delete playlistLoads[theme];return safe;}).catch(function(e){delete playlistLoads[theme];throw e;});
 return playlistLoads[theme];
}
function switchMoodPlaylist(theme,play){
 var ticket=++playlistTicket,mood=$('musicMoodLabel');if(mood)mood.textContent=themeName(theme)+' · MOOD PLAYLIST';
 audio.pause();audio.removeAttribute('src');audio.load();musicStatus('LOADING '+themeName(theme));
 getMoodPlaylist(theme).then(function(list){
  if(ticket!==playlistTicket||theme!==activeTheme)return;tracks=list;trackIndex=0;renderQueue();
  if(!tracks.length){audio.pause();$('trackTitle').textContent=themeName(theme)+' SOUNDTRACK';$('trackPosition').textContent='NO TRACKS IN THIS MOOD YET';$('toggleMusic').textContent='▶';musicStatus('NO SONGS ADDED YET');$('musicHelp').textContent='Add MP3 files to music/'+theme+'/ and add their paths to that folder playlist.json.';return;}
  $('musicHelp').textContent='Your '+themeName(theme)+' soundtrack.';loadTrack(0,play);
 }).catch(function(){if(ticket!==playlistTicket)return;tracks=[];renderQueue();musicStatus('PLAYLIST NOT FOUND');});
}
Object.keys(themeColors).forEach(function(t){getMoodPlaylist(t).catch(function(){});});
window.addEventListener('storage',function(e){
 if(e.key!==PREFIX+'studyTheme')return;var next='love';try{next=JSON.parse(e.newValue)||'love';}catch(err){}
 if(!themeColors[next])next='love';
 if(next!==activeTheme){activeTheme=next;document.documentElement.setAttribute('data-study-theme',next);var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',themeColors[next]);switchMoodPlaylist(next,true);}
});

function next(){if(!tracks.length)return;if(repeat){audio.currentTime=0;playMusic();return;}var i=trackIndex+1;if(shuffle&&tracks.length>1){do{i=Math.floor(Math.random()*tracks.length);}while(i===trackIndex);}loadTrack(i,true);}
function previous(){if(!tracks.length)return;if(audio.currentTime>3){audio.currentTime=0;return;}loadTrack(trackIndex-1,true);}
$('toggleMusic').addEventListener('click',function(){if(!tracks.length){toast('Your MP3 playlist will appear here once added.');return;}if(audio.paused){autoplayBlocked=false;playMusic();}else{audio.pause();$('toggleMusic').textContent='▶';musicStatus('MUSIC PAUSED');}});
$('previousTrack').addEventListener('click',previous);$('nextTrack').addEventListener('click',next);
$('shuffleMusic').addEventListener('click',function(){shuffle=!shuffle;this.classList.toggle('active',shuffle);this.setAttribute('aria-pressed',String(shuffle));});
$('repeatMusic').addEventListener('click',function(){repeat=!repeat;this.classList.toggle('active',repeat);this.setAttribute('aria-pressed',String(repeat));});
$('muteMusic').addEventListener('click',function(){audio.muted=!audio.muted;this.textContent=audio.muted?'×':'♫';});
$('musicVolume').addEventListener('input',function(){audio.volume=Number(this.value)/100;audio.muted=Number(this.value)===0;});
audio.volume=.75;
audio.addEventListener('timeupdate',function(){var pct=audio.duration?audio.currentTime/audio.duration*100:0;$('musicSeek').value=pct;$('musicElapsed').textContent=timeText(audio.currentTime);$('musicDuration').textContent=timeText(audio.duration);});
$('musicSeek').addEventListener('input',function(){if(audio.duration)audio.currentTime=Number(this.value)/100*audio.duration;});
audio.addEventListener('ended',next);
audio.addEventListener('play',function(){$('toggleMusic').textContent='Ⅱ';$('toggleMusic').setAttribute('aria-label','Pause music');});
audio.addEventListener('pause',function(){$('toggleMusic').textContent='▶';$('toggleMusic').setAttribute('aria-label','Play music');});
switchMoodPlaylist(activeTheme,true);
if('mediaSession'in navigator){try{navigator.mediaSession.metadata=new MediaMetadata({title:'The Last Mile study session',artist:'NEET 2027',album:'Focus Mode'});navigator.mediaSession.setActionHandler('play',playMusic);navigator.mediaSession.setActionHandler('pause',function(){audio.pause();});navigator.mediaSession.setActionHandler('previoustrack',previous);navigator.mediaSession.setActionHandler('nexttrack',next);}catch(e){}}
if('serviceWorker'in navigator&&location.protocol.indexOf('http')===0){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}
})();