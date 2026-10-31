(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var toast=function(message){var el=$('toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove('show');},2400);};
var store={get:function(key,fallback){try{var value=localStorage.getItem('tlm:'+key);return value===null?fallback:JSON.parse(value);}catch(e){return fallback;}},set:function(key,value){try{localStorage.setItem('tlm:'+key,JSON.stringify(value));}catch(e){}}};

/* Simple accessible navigation */
var menuToggle=$('menuToggle'),mobileNav=$('mobileNav');
function setMenu(open){mobileNav.classList.toggle('open',open);menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');menuToggle.textContent=open?'✕':'☰';}
menuToggle.addEventListener('click',function(){setMenu(menuToggle.getAttribute('aria-expanded')!=='true');});
mobileNav.querySelectorAll('a').forEach(function(link){link.addEventListener('click',function(){setMenu(false);});});
document.addEventListener('keydown',function(event){if(event.key==='Escape')setMenu(false);});
window.addEventListener('resize',function(){if(window.matchMedia('(min-width:761px)').matches)setMenu(false);});

/* NEET exam countdown — date is editable and intentionally marked provisional. */
var examDate=$('examDate');
examDate.value=store.get('examDate','2027-05-02');
function renderExamCountdown(){
 var raw=examDate.value;
 if(!raw){['examDays','examHours','examMinutes','examSeconds'].forEach(function(id){$(id).textContent='—';});$('examDateLabel').textContent='SET YOUR TARGET';return;}
 var target=new Date(raw+'T00:00:00'),diff=Math.max(0,target.getTime()-Date.now());
 if(!isFinite(diff))return;
 var days=Math.floor(diff/86400000),hours=Math.floor(diff%86400000/3600000),mins=Math.floor(diff%3600000/60000),secs=Math.floor(diff%60000/1000);
 $('examDays').textContent=String(days).padStart(3,'0');$('examHours').textContent=String(hours).padStart(2,'0');$('examMinutes').textContent=String(mins).padStart(2,'0');$('examSeconds').textContent=String(secs).padStart(2,'0');
 $('examDateLabel').textContent=target.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
}
examDate.addEventListener('change',function(){store.set('examDate',examDate.value);renderExamCountdown();});
renderExamCountdown();setInterval(renderExamCountdown,1000);

/* Campus wall — photo credits link to the originating pages. */
var campuses=[
{name:'AIIMS New Delhi',place:'Ansari Nagar · Delhi',url:'https://www.aiims.edu/',photo:'assets/aiims-delhi.webp',credit:'https://www.aiims.edu/'},
{name:'AIIMS Bhopal',place:'Saket Nagar · Madhya Pradesh',url:'https://aiimsbhopal.edu.in/',photo:'assets/campuses/aiims-bhopal.webp',credit:'https://www.abplive.com/states/madhya-pradesh/bhopal-aiims-purchasing-2-robots-worth-60-crore-rupees-to-treat-patient-in-hospital-ann-2755671'},
{name:'AIIMS Bhubaneswar',place:'Sijua · Odisha',url:'https://aiimsbhubaneswar.edu.in/',photo:'assets/campuses/aiims-bhubaneswar.webp',credit:'https://college360.co.in/university/AIIMS-Bhubaneswar-All-India-Institute-of-Medical-Sciences-Bhubaneswar-4616/gallery'},
{name:'AIIMS Jodhpur',place:'Basni · Rajasthan',url:'https://aiimsjodhpur.edu.in/',photo:'assets/campuses/aiims-jodhpur.webp',credit:'https://www.linkedin.com/pulse/aiims-jodhpur-has-introduced-new-dm-programs-medical-genetics-'},
{name:'AIIMS Patna',place:'Phulwarisharif · Bihar',url:'http://aiimspatna.org/',photo:'assets/campuses/aiims-patna.webp',credit:'https://www.selectyouruniversity.com/college/all-india-institute-of-medical-sciences-aiims-patna-cid-25410'},
{name:'AIIMS Raipur',place:'Tatibandh · Chhattisgarh',url:'https://www.aiimsraipur.edu.in/',photo:'assets/campuses/aiims-raipur.webp',credit:'https://www.edexlive.com/news/aiims-raipur-hosts-lecture-on-climate-change-launches-7th-edition-of-community-medicine-textbook'},
{name:'AIIMS Rishikesh',place:'Virbhadra Road · Uttarakhand',url:'https://aiimsrishikesh.edu.in/',photo:'assets/campuses/aiims-rishikesh.webp',credit:'https://jp.pinterest.com/pin/737957088973286605/'},
{name:'AIIMS Mangalagiri',place:'Mangalagiri · Andhra Pradesh',url:'https://aiimsmangalagiri.edu.in/',photo:'assets/campuses/aiims-mangalagiri.webp',credit:'https://www.amsamaiims.in/'},
{name:'AIIMS Guwahati',place:'Changsari · Assam',url:'https://aiimsguwahati.ac.in/',photo:'assets/campuses/aiims-guwahati.webp',credit:'https://health.economictimes.indiatimes.com/news/hospitals/clinical-trial-unit-inaugurated-at-guwahati-aiims/124618135'},
{name:'AIIMS Darbhanga',place:'Darbhanga · Bihar',url:'https://pmssy.mohfw.gov.in/',photo:'assets/campuses/aiims-darbhanga.webp',credit:'https://www.prabhatkhabar.com/state/bihar/darbhanga/darbhanga-aiims-dpr-e-ready-in-next-two-months-bihar-news',alt:'Proposed AIIMS Darbhanga campus rendering'},
{name:'AIIMS Rajkot',place:'Khandheri · Gujarat',url:'https://aiimsrajkot.edu.in/',photo:'assets/campuses/aiims-rajkot.webp',credit:'https://www.selectyouruniversity.com/college/all-india-institute-of-medical-sciences-aiims-rajkot-cid-63937'},
{name:'AIIMS Rewari',place:'Majra · Haryana',url:'https://pmssy.mohfw.gov.in/',photo:'assets/campuses/aiims-rewari.webp',credit:'https://www.bhaskar.com/local/haryana/rewari/bawal/news/rewari-aiims-majra-bhalkhi-opd-ipd-services-infrastructure-development-update-135033171.html',alt:'Proposed AIIMS Rewari campus rendering'},
{name:'AIIMS Bilaspur',place:'Kothipura · Himachal Pradesh',url:'https://www.aiimsbilaspur.edu.in/',photo:'assets/campuses/aiims-bilaspur.webp',credit:'https://www.livemint.com/news/india/pm-modi-inaugurates-green-hospital-aiims-bilaspur-in-himachal-pradesh-11664961534107.html'},
{name:'AIIMS Vijaypur (Jammu)',place:'Vijaypur · Jammu & Kashmir',url:'https://www.aiimsjammu.edu.in/',photo:'assets/campuses/aiims-vijaypur-jammu.webp',credit:'https://www.outlookindia.com/announcements/news-media-wire/aiims-vijaypur-jammu-honoured-with-achievement-award-for-best-construction-projects-at-cidc-vishwakarma-awards-2025'},
{name:'AIIMS Awantipora',place:'Awantipora · Kashmir',url:'https://pmssy.mohfw.gov.in/',photo:'assets/campuses/aiims-awantipora.webp',credit:'https://lakecitytimes.com/2025/08/24/aiims-awantipora-likely-to-miss-november-2025-deadline/'},
{name:'AIIMS Deoghar',place:'Devipur · Jharkhand',url:'https://aiimsdeoghar.edu.in/',photo:'assets/campuses/aiims-deoghar.webp',credit:'https://aiimsdeoghar.edu.in/',featured:true},
{name:'AIIMS Nagpur',place:'MIHAN · Maharashtra',url:'https://aiimsnagpur.edu.in/',photo:'assets/campuses/aiims-nagpur.webp',credit:'https://www.findmycollege.com/colleges/all-india-institute-of-medical-sciences-aiims-nagpur-2052/gallery'},
{name:'AIIMS Bathinda',place:'Bathinda · Punjab',url:'https://aiimsbathinda.edu.in/',photo:'assets/campuses/aiims-bathinda.webp',credit:'https://aiimsbathinda.edu.in/'},
{name:'AIIMS Madurai',place:'Madurai · Tamil Nadu',url:'https://aiimsmadurai.edu.in/',photo:'assets/campuses/aiims-madurai.webp',credit:'https://aiimsmadurai.edu.in/pPnDrdXN/'},
{name:'AIIMS Bibinagar',place:'Bibinagar · Telangana',url:'https://aiimsbibinagar.edu.in/',photo:'assets/campuses/aiims-bibinagar.webp',credit:'https://x.com/kishanreddybjp/status/2008038853656125848'},
{name:'AIIMS Raebareli',place:'Munshiganj · Uttar Pradesh',url:'http://aiimsrbl.edu.in/',photo:'assets/campuses/aiims-raebareli.webp',credit:'https://www.prabhatkhabar.com/state/uttar-pradesh/raebareli-aiims-virtually-inaugurate-today-by-pm-modi-smk'},
{name:'AIIMS Gorakhpur',place:'Kunraghat · Uttar Pradesh',url:'https://aiimsgorakhpur.edu.in/',photo:'assets/campuses/aiims-gorakhpur.webp',credit:'https://www.collegebatch.com/20874-all-india-institute-of-medical-sciences-campus-tour-gorakhpur-fs05'},
{name:'AIIMS Kalyani',place:'Kalyani · West Bengal',url:'https://aiimskalyani.edu.in/',photo:'assets/campuses/aiims-kalyani.webp',credit:'https://www.anandabazar.com/education-career/aiims-kalyani-starts-admission-process-for-diploma-in-dental-hygiene-and-diploma-in-dental-mechanics-dgtl/cid/1543654'}
];

var dreamCollegeTrigger=$('dreamCollegeTrigger');
var dreamCollegeLabel=$('dreamCollegeLabel');
var dreamCollegeMenu=$('dreamCollegeMenu');
var dreamCollegeList=$('dreamCollegeList');
var dreamCollegeSearch=$('dreamCollegeSearch');
var dreamCollegeNoResults=$('dreamCollegeNoResults');
var selectedDream=store.get('dreamCollege','');
var currentCampusOrder=campuses.slice();
function closeDreamMenu(){
 dreamCollegeMenu.hidden=true;
 dreamCollegeTrigger.setAttribute('aria-expanded','false');
}
function openDreamMenu(){
 dreamCollegeMenu.hidden=false;
 dreamCollegeTrigger.setAttribute('aria-expanded','true');
 dreamCollegeSearch.value='';
 dreamCollegeList.querySelectorAll('.dream-college-option').forEach(function(option){option.hidden=false;});
 dreamCollegeNoResults.hidden=true;
 dreamCollegeSearch.focus();
}
function toggleDreamMenu(){
 if(dreamCollegeMenu.hidden)openDreamMenu();else closeDreamMenu();
}
var campusGrid=$('campusGrid');
function renderCampuses(list){
 currentCampusOrder=list.slice();
 campusGrid.innerHTML=list.map(function(item,index){
  var chosen=item.name===selectedDream;
  var special=chosen?'<span class="dream-chip">YOUR DREAM AIIMS</span>':'';
  var photos=(item.photos&&item.photos.length?item.photos:[item.photo]).filter(Boolean);
  var photoData=JSON.stringify(photos).replace(/&/g,'&amp;').replace(/'/g,'&#39;');
  return '<article class="campus-card'+(chosen?' featured':'')+'"><div class="campus-image"><img src="'+photos[0]+'" data-photos=\''+photoData+'\' data-photo-index="0" alt="'+(item.alt||item.name+' campus')+'" loading="lazy" onerror="this.onerror=null;this.src=\'assets/lastmile-icon.svg\';this.classList.add(\'image-fallback\');"><span class="campus-number">'+String(index+1).padStart(2,'0')+' / 23</span></div><div class="campus-info">'+special+'<h3>'+item.name+'</h3><p>'+item.place+'</p><div class="campus-links"><a href="'+item.url+'" target="_blank" rel="noopener">INSTITUTE / PROJECT ↗</a><a href="'+item.credit+'" target="_blank" rel="noopener">PHOTO SOURCE</a></div></div></article>';
 }).join('');
}
function rotateRandomCampusPhotos(){
 var candidates=Array.from(campusGrid.querySelectorAll('.campus-image img[data-photos]')).filter(function(img){
  try{return JSON.parse(img.dataset.photos).length>1;}catch(e){return false;}
 });
 for(var i=candidates.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var temp=candidates[i];candidates[i]=candidates[j];candidates[j]=temp;}
 candidates.slice(0,3).forEach(function(img){
  var photos=JSON.parse(img.dataset.photos),current=Number(img.dataset.photoIndex)||0,next=current;
  while(next===current&&photos.length>1)next=Math.floor(Math.random()*photos.length);
  img.classList.add('photo-changing');
  img.onload=function(){img.classList.remove('photo-changing');};
  img.onerror=function(){img.classList.remove('photo-changing');img.onerror=null;};
  img.src=photos[next];img.dataset.photoIndex=String(next);
 });
}
setInterval(rotateRandomCampusPhotos,5000);
function setHeroCampusImage(item){
 var image=$('heroCampusImage'),usedFallback=false;
 image.classList.remove('image-fallback');
 image.onerror=function(){
  if(!usedFallback&&item.fallbackPhoto){usedFallback=true;image.src=item.fallbackPhoto;}
  else{image.onerror=null;image.src='assets/lastmile-icon.svg';image.classList.add('image-fallback');}
 };
 image.src=item.photo;
}
function updateDreamCollege(name){
 var item=campuses.find(function(campus){return campus.name===name;});
 selectedDream=item?item.name:'';
 store.set('dreamCollege',selectedDream);
 var visual=item||campuses[0];
 dreamCollegeLabel.textContent=item?item.name+' — '+item.place:'SELECT YOUR DREAM INSTITUTE';
 dreamCollegeList.querySelectorAll('.dream-college-option').forEach(function(option){
  var chosen=option.getAttribute('data-college')===selectedDream;
  option.setAttribute('aria-selected',String(chosen));
  option.classList.toggle('selected',chosen);
 });
 setHeroCampusImage(visual);
 $('heroCampusImage').alt=item?item.name+' campus, '+item.place:visual.name+' campus';
 $('heroPhotoLabel').textContent=item?'YOUR DREAM CAMPUS':'THE AIIMS DREAM ACROSS INDIA';
 $('heroPhotoCredit').textContent=item?item.name.toUpperCase()+' · '+item.place.toUpperCase():'CHOOSE YOUR DREAM AIIMS';
 $('dreamCollegeNote').textContent=item?'YOUR DREAM IS SAVED ON THIS DEVICE · CHANGE IT ANYTIME':'CHOOSE ANY AIIMS TO PERSONALISE YOUR WALL';
 renderCampuses(currentCampusOrder);
 closeDreamMenu();
}
dreamCollegeTrigger.addEventListener('click',toggleDreamMenu);
dreamCollegeList.addEventListener('click',function(event){
 var option=event.target.closest('.dream-college-option');
 if(option)updateDreamCollege(option.getAttribute('data-college'));
});
dreamCollegeSearch.addEventListener('input',function(){
 var query=this.value.trim().toLowerCase(),visible=0;
 dreamCollegeList.querySelectorAll('.dream-college-option').forEach(function(option){
  var match=option.textContent.toLowerCase().indexOf(query)!==-1;
  option.hidden=!match;
  if(match)visible++;
 });
 dreamCollegeNoResults.hidden=visible>0;
});
document.addEventListener('click',function(event){
 if(!event.target.closest('#dreamSelectWrap'))closeDreamMenu();
});
document.addEventListener('keydown',function(event){
 if(event.key==='Escape'&&!dreamCollegeMenu.hidden){closeDreamMenu();dreamCollegeTrigger.focus();}
});
if(!campuses.some(function(item){return item.name===selectedDream;}))selectedDream='';
function shuffle(items){var array=items.slice();for(var i=array.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var temp=array[i];array[i]=array[j];array[j]=temp;}return array;}
renderCampuses(campuses);
updateDreamCollege(selectedDream);
$('shuffleCampuses').addEventListener('click',function(){renderCampuses(shuffle(campuses));toast('The AIIMS wall has been reshuffled.');});

/* A refreshable, curated set of YouTube campus videos and Shorts. */
var videos=[
{id:'vHKnyKhTuHU',title:'AIIMS Delhi — complete campus tour',by:'Bharti Prajapati · AIIMS Delhi',note:'Hostels, college blocks and student spaces'},
{id:'Oifj33YUycs',title:'AIIMS Gorakhpur — detailed campus tour',by:'FluteVerse MBBS',note:'Library, lecture halls, hostel and campus life'},
{id:'TcCHxmVfrQo',title:'Inside AIIMS Deoghar',by:'Tushar AIIMS Deoghar',note:'A look at the campus and student facilities'},
{id:'7bGBGzvRIjg',title:'A day inside AIIMS Delhi',by:'Tathagat Awatar',note:'A student view of campus life'}
];
var shorts=[
{id:'tyHgDKFaCDs',title:'AIIMS Diaries — life after NEET',by:'Shivam Raj [AIIMS]'},
{id:'mdXewtqisvM',title:'AIIMS Diaries — campus moments',by:'Shivam Raj [AIIMS]'},
{id:'CZIQWOOl6yw',title:'AIIMS motivation series · Day 20',by:'Raj [AIIMS]'},
{id:'gSD0cyY1TO4',title:'No one sees the effort',by:'Raj [AIIMS]'},
{id:'6Dy_Jy0kw38',title:'NEET motivation · dream AIIMS',by:'Raj [AIIMS]'},
{id:'qLTF8akDqZg',title:'The AIIMS fest feeling',by:'Raj [AIIMS]'},
{id:'VfjIbGRdj7g',title:'AIIMS Diaries — life after NEET, Vlog 98',by:'Shivam Raj [AIIMS]'}
];
var lastVideoIds=[],lastShortIds=[];
function pickNew(list,count,previous){
 var unseen=list.filter(function(item){return previous.indexOf(item.id)===-1;});
 var earlier=shuffle(list.filter(function(item){return previous.indexOf(item.id)!==-1;}));
 var pool=unseen.concat(earlier.slice(0,Math.max(0,count-unseen.length)));
 return shuffle(pool).slice(0,Math.min(count,pool.length));
}
function renderVideos(){
 var selected=pickNew(videos,3,lastVideoIds);lastVideoIds=selected.map(function(item){return item.id;});
 $('videoGrid').innerHTML=selected.map(function(item){return '<article class="video-card"><div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/'+item.id+'?rel=0" title="'+item.title+'" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><div class="video-info"><small>CAMPUS VIDEO · YOUTUBE</small><h3>'+item.title+'</h3><p>'+item.by+' · '+item.note+'</p></div></article>';}).join('');
 var selectedShorts=pickNew(shorts,5,lastShortIds);lastShortIds=selectedShorts.map(function(item){return item.id;});
 $('shortsGrid').innerHTML=selectedShorts.map(function(item){return '<article class="short-card"><div class="short-frame"><iframe src="https://www.youtube-nocookie.com/embed/'+item.id+'?rel=0" title="'+item.title+'" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><div class="short-info"><h3>'+item.title+'</h3><small>'+item.by+'</small></div></article>';}).join('');
}
renderVideos();
$('refreshVideos').addEventListener('click',function(){renderVideos();toast('Fresh videos and Shorts selected.');});

/* Self-study countdown */
var timerTotal=50*60,timerRemaining=timerTotal,timerInterval=null,timerRunning=false,ringCirc=2*Math.PI*96;
$('timerProgress').style.strokeDasharray=ringCirc;
function paintStudyTimer(){
 var min=Math.floor(timerRemaining/60),sec=timerRemaining%60;
 $('studyTime').textContent=String(min).padStart(2,'0')+':'+String(sec).padStart(2,'0');
 $('timerProgress').style.strokeDashoffset=ringCirc*(1-timerRemaining/timerTotal);
}
function haltTimer(){if(timerInterval){clearInterval(timerInterval);timerInterval=null;}timerRunning=false;}
function setTimerButton(text,icon){$('studyStart').innerHTML=text+' <span>'+icon+'</span>';}
document.querySelectorAll('[data-minutes]').forEach(function(button){button.addEventListener('click',function(){
 haltTimer();document.querySelectorAll('[data-minutes]').forEach(function(item){item.classList.toggle('selected',item===button);});
 timerTotal=Number(button.dataset.minutes)*60;timerRemaining=timerTotal;$('studyStatus').textContent='READY WHEN YOU ARE';$('timerHint').textContent='One focused session. No distractions.';setTimerButton('START STUDY','▶');paintStudyTimer();
});});
$('studyStart').addEventListener('click',function(){
 if(timerRunning){haltTimer();setTimerButton('RESUME STUDY','▶');$('studyStatus').textContent='PAUSED';return;}
 if(timerRemaining<=0){timerRemaining=timerTotal;paintStudyTimer();}
 timerRunning=true;$('studyStatus').textContent='FOCUS IN PROGRESS';setTimerButton('PAUSE SESSION','Ⅱ');
 timerInterval=setInterval(function(){timerRemaining--;paintStudyTimer();if(timerRemaining<=0){haltTimer();$('studyStatus').textContent='SESSION COMPLETE';$('timerHint').textContent='You showed up. Take a short break, then begin again.';setTimerButton('START AGAIN','↻');toast('Study session complete. Well done.');}},1000);
});
$('studyReset').addEventListener('click',function(){haltTimer();timerRemaining=timerTotal;$('studyStatus').textContent='READY WHEN YOU ARE';$('timerHint').textContent='One focused session. No distractions.';setTimerButton('START STUDY','▶');paintStudyTimer();});
paintStudyTimer();

/* Slide-out music drawer */
var musicDrawer=$('musicDrawer'),musicBackdrop=$('musicBackdrop'),musicOpenButton=$('musicOpen'),musicFab=$('musicFab'),musicCloseButton=$('musicClose'),musicNavLink=$('musicNavLink'),drawerReturnFocus=null;
function openMusicDrawer(){
 drawerReturnFocus=document.activeElement;
 musicDrawer.classList.add('open');musicBackdrop.classList.add('open');musicDrawer.setAttribute('aria-hidden','false');musicDrawer.removeAttribute('inert');document.body.classList.add('drawer-open');
 [musicOpenButton,musicFab].forEach(function(button){if(button)button.setAttribute('aria-expanded','true');});
 if(musicCloseButton)musicCloseButton.focus();
 if(tracks.length&&autoplayBlocked&&audio.paused){autoplayBlocked=false;startMusic();}
}
function closeMusicDrawer(){
 musicDrawer.classList.remove('open');musicBackdrop.classList.remove('open');musicDrawer.setAttribute('aria-hidden','true');musicDrawer.setAttribute('inert','');document.body.classList.remove('drawer-open');
 [musicOpenButton,musicFab].forEach(function(button){if(button)button.setAttribute('aria-expanded','false');});
 if(drawerReturnFocus&&typeof drawerReturnFocus.focus==='function')drawerReturnFocus.focus();
}
[musicOpenButton,musicFab].forEach(function(button){if(button)button.addEventListener('click',openMusicDrawer);});
musicCloseButton.addEventListener('click',closeMusicDrawer);
musicBackdrop.addEventListener('click',closeMusicDrawer);
if(musicNavLink)musicNavLink.addEventListener('click',function(event){event.preventDefault();setMenu(false);openMusicDrawer();});
document.addEventListener('keydown',function(event){if(event.key==='Escape'&&musicDrawer.classList.contains('open'))closeMusicDrawer();});

/* Playlist: try autoplay on arrival; if the browser blocks sound, opening the drawer or tapping play starts it. */
var audio=$('musicAudio'),tracks=[],trackIndex=0,musicStarted=false,autoplayBlocked=false,shuffleEnabled=false,repeatOne=false;
function timeText(seconds){if(!Number.isFinite(seconds))return '0:00';return Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');}
function updateMusicStatus(message){$('musicState').textContent=message;}
function renderMusicQueue(){
 var queue=$('musicQueue');queue.replaceChildren();
 $('queueCount').textContent=tracks.length+' TRACK'+(tracks.length===1?'':'S');
 if(!tracks.length){var empty=document.createElement('div');empty.className='queue-empty';empty.textContent='Your playlist will appear here once MP3 files are added.';queue.appendChild(empty);return;}
 tracks.forEach(function(track,index){
  var button=document.createElement('button');button.type='button';button.className='queue-item'+(index===trackIndex?' current':'');button.setAttribute('aria-current',index===trackIndex?'true':'false');
  var number=document.createElement('span');number.className='queue-index';number.textContent=String(index+1).padStart(2,'0');
  var copy=document.createElement('span');copy.className='queue-copy';
  var title=document.createElement('strong');title.textContent=track.title||'Untitled track';
  var meta=document.createElement('small');meta.textContent=index===trackIndex?'NOW PLAYING':'PLAY THIS TRACK';
  copy.appendChild(title);copy.appendChild(meta);button.appendChild(number);button.appendChild(copy);
  button.addEventListener('click',function(){loadTrack(index,true);});
  queue.appendChild(button);
 });
}
function updateTrackMeta(){
 if(!tracks.length)return;
 var track=tracks[trackIndex];
 $('trackTitle').textContent=track.title||'UNTITLED TRACK';
 $('trackPosition').textContent='TRACK '+(trackIndex+1)+' OF '+tracks.length;
 renderMusicQueue();
}
function startMusic(){
 if(!tracks.length)return;
 audio.muted=false;
 var attempt;
 try{attempt=audio.play();}catch(error){autoplayBlocked=true;updateMusicStatus('TAP TO PLAY');return;}
 if(attempt&&typeof attempt.then==='function'){
  attempt.then(function(){musicStarted=true;autoplayBlocked=false;$('toggleMusic').textContent='Ⅱ';$('toggleMusic').setAttribute('aria-label','Pause music');updateMusicStatus('MUSIC PLAYING');$('musicHelp').textContent='Your soundtrack is playing. Your playlist stays in this drawer.';})
  .catch(function(){musicStarted=false;autoplayBlocked=true;$('toggleMusic').textContent='▶';$('toggleMusic').setAttribute('aria-label','Play music');updateMusicStatus('TAP TO PLAY');$('musicHelp').textContent='Your browser blocked automatic sound. Open this drawer and tap play once.';});
 }else{musicStarted=true;autoplayBlocked=false;updateMusicStatus('MUSIC PLAYING');}
}
function loadTrack(index,play){
 if(!tracks.length)return;
 trackIndex=(index+tracks.length)%tracks.length;
 audio.src=tracks[trackIndex].src;audio.load();updateTrackMeta();
 if(play)startMusic();
}
function playNext(){
 if(!tracks.length)return;
 if(repeatOne){audio.currentTime=0;startMusic();return;}
 var next=trackIndex+1;
 if(shuffleEnabled&&tracks.length>1){do{next=Math.floor(Math.random()*tracks.length);}while(next===trackIndex);}
 loadTrack(next,true);
}
function playPrevious(){
 if(!tracks.length)return;
 if(audio.currentTime>3){audio.currentTime=0;return;}
 loadTrack(trackIndex-1,true);
}
$('toggleMusic').addEventListener('click',function(){
 if(!tracks.length){toast('Your MP3 playlist will appear here once added.');return;}
 if(audio.paused){autoplayBlocked=false;startMusic();}
 else{audio.pause();musicStarted=false;$('toggleMusic').textContent='▶';$('toggleMusic').setAttribute('aria-label','Play music');updateMusicStatus('MUSIC PAUSED');}
});
$('previousTrack').addEventListener('click',playPrevious);
$('nextTrack').addEventListener('click',playNext);
$('shuffleMusic').addEventListener('click',function(){shuffleEnabled=!shuffleEnabled;this.classList.toggle('active',shuffleEnabled);this.setAttribute('aria-pressed',String(shuffleEnabled));toast(shuffleEnabled?'Shuffle is on.':'Shuffle is off.');});
$('repeatMusic').addEventListener('click',function(){repeatOne=!repeatOne;this.classList.toggle('active',repeatOne);this.setAttribute('aria-pressed',String(repeatOne));this.setAttribute('aria-label',repeatOne?'Turn repeat off':'Turn repeat on');toast(repeatOne?'Repeat current track is on.':'Repeat is off.');});
$('muteMusic').addEventListener('click',function(){audio.muted=!audio.muted;this.textContent=audio.muted?'×':'♫';this.setAttribute('aria-label',audio.muted?'Unmute music':'Mute music');});
$('musicVolume').addEventListener('input',function(){audio.volume=Number(this.value)/100;audio.muted=Number(this.value)===0;$('muteMusic').textContent=audio.muted?'×':'♫';});
audio.volume=.75;
audio.addEventListener('timeupdate',function(){var pct=audio.duration?audio.currentTime/audio.duration*100:0;$('musicSeek').value=pct;$('musicElapsed').textContent=timeText(audio.currentTime);$('musicDuration').textContent=timeText(audio.duration);});
$('musicSeek').addEventListener('input',function(){if(audio.duration)audio.currentTime=(Number(this.value)/100)*audio.duration;});
audio.addEventListener('ended',playNext);
audio.addEventListener('play',function(){musicStarted=true;$('toggleMusic').textContent='Ⅱ';$('toggleMusic').setAttribute('aria-label','Pause music');});
audio.addEventListener('pause',function(){musicStarted=false;$('toggleMusic').textContent='▶';$('toggleMusic').setAttribute('aria-label','Play music');});
fetch('music/playlist.json',{cache:'no-store'}).then(function(response){if(!response.ok)throw new Error('Playlist not available');return response.json();}).then(function(list){
 tracks=Array.isArray(list)?list.filter(function(track){return track&&typeof track.src==='string';}):[];
 renderMusicQueue();
 if(!tracks.length){updateMusicStatus('WAITING FOR YOUR PLAYLIST');$('musicHelp').textContent='Attach your MP3 files in this chat. I can put them in music/ and add them to the queue.';return;}
 $('musicHelp').textContent='Trying to start your playlist…';loadTrack(0,true);
}).catch(function(){updateMusicStatus('PLAYLIST NOT FOUND');$('musicHelp').textContent='The playlist could not be loaded. Refresh the page and try again.';});

if('serviceWorker'in navigator&&location.protocol.indexOf('http')===0){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}
})();