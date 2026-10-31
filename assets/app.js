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
{name:'AIIMS New Delhi',place:'Ansari Nagar · Delhi',url:'https://www.aiims.edu/',photo:'https://www.worldwidecolleges.com/wp-content/uploads/classified-listing/2023/04/All-India-Institute-of-Medical-Sciences-New-Delhi-AIIMS.jpg',credit:'https://www.worldwidecolleges.com/education/all-india-institute-of-medical-sciences-new-delhi/'},
{name:'AIIMS Bhopal',place:'Saket Nagar · Madhya Pradesh',url:'https://aiimsbhopal.edu.in/',photo:'https://feeds.abplive.com/onecms/images/uploaded-images/2024/08/07/ae66f9251624f701a31f13cf10d31e1a1723026075984998_original.jpg',credit:'https://www.abplive.com/states/madhya-pradesh/bhopal-aiims-purchasing-2-robots-worth-60-crore-rupees-to-treat-patient-in-hospital-ann-2755671'},
{name:'AIIMS Bhubaneswar',place:'Sijua · Odisha',url:'https://aiimsbhubaneswar.edu.in/',photo:'https://upload.wikimedia.org/wikipedia/commons/6/64/AIIMS_Bhubaneswar_01.jpg',credit:'https://commons.wikimedia.org/wiki/File:AIIMS_Bhubaneswar_01.jpg'},
{name:'AIIMS Jodhpur',place:'Basni · Rajasthan',url:'https://aiimsjodhpur.edu.in/',photo:'https://media.licdn.com/dms/image/v2/C5612AQGhtCinFWg_Zw/article-cover_image-shrink_600_2000/article-cover_image-shrink_600_2000/0/1620047161173?e=2147483647&t=a3-nOgtU-n6_atv4YadMstRlOO7MVpBSvLAUUL-5Mrg&v=beta',credit:'https://www.linkedin.com/pulse/aiims-jodhpur-has-introduced-new-dm-programs-medical-genetics-'},
{name:'AIIMS Patna',place:'Phulwarisharif · Bihar',url:'http://aiimspatna.org/',photo:'https://ik.imagekit.io/syustaging/SYU_PREPROD/Cover_VBT_mcCnx.webp',credit:'https://www.selectyouruniversity.com/college/all-india-institute-of-medical-sciences-aiims-patna-cid-25410'},
{name:'AIIMS Raipur',place:'Tatibandh · Chhattisgarh',url:'https://www.aiimsraipur.edu.in/',photo:'https://cf-images.assettype.com/edexlive/2026-09-30/jh28sjq7/all-india-institute-of-medical-sciences-raipur.webp?ar=40%3A21&auto=format%2Ccompress&enlarge=true&mode=crop&ogImage=true&overlay=false&overlay_position=bottom&overlay_width=100&w=1200',credit:'https://www.edexlive.com/news/aiims-raipur-hosts-lecture-on-climate-change-launches-7th-edition-of-community-medicine-textbook'},
{name:'AIIMS Rishikesh',place:'Virbhadra Road · Uttarakhand',url:'https://aiimsrishikesh.edu.in/',photo:'https://i.pinimg.com/736x/76/78/6c/76786c6d217a29e39f699621233cfd75.jpg',credit:'https://jp.pinterest.com/pin/737957088973286605/'},
{name:'AIIMS Mangalagiri',place:'Mangalagiri · Andhra Pradesh',url:'https://aiimsmangalagiri.edu.in/',photo:'https://static.wixstatic.com/media/4a0c19_dd55d28c4e544a0297821b0b65c723ea~mv2.jpg/v1/fit/w_2500%2Ch_1330%2Cal_c/4a0c19_dd55d28c4e544a0297821b0b65c723ea~mv2.jpg',credit:'https://www.amsamaiims.in/'},
{name:'AIIMS Guwahati',place:'Changsari · Assam',url:'https://aiimsguwahati.ac.in/',photo:'https://etimg.etb2bimg.com/photo/124618204.cms',credit:'https://health.economictimes.indiatimes.com/news/hospitals/clinical-trial-unit-inaugurated-at-guwahati-aiims/124618135'},
{name:'AIIMS Darbhanga',place:'Darbhanga · Bihar',url:'https://pmssy.mohfw.gov.in/',photo:'https://wpmedia.prabhatkhabar.com/uploads/2025/05/Darbhanga-aiims-news-bihar-DPR-ready-.png',credit:'https://www.prabhatkhabar.com/state/bihar/darbhanga/darbhanga-aiims-dpr-e-ready-in-next-two-months-bihar-news',alt:'Proposed AIIMS Darbhanga campus rendering'},
{name:'AIIMS Rajkot',place:'Khandheri · Gujarat',url:'https://aiimsrajkot.edu.in/',photo:'https://images.indianexpress.com/2024/02/RAJKOT-AIIMS.jpg',credit:'https://indianexpress.com/article/cities/ahmedabad/pm-to-inaugurate-aiims-rajkot-tomorrow-all-750-beds-to-be-in-place-by-december-9177863/'},
{name:'AIIMS Rewari',place:'Majra · Haryana',url:'https://pmssy.mohfw.gov.in/',photo:'https://images.bhaskarassets.com/web2images/521/2025/05/15/d8b69824-d610-48c7-b710-398f34700702_1747317221672.jpg',credit:'https://www.bhaskar.com/local/haryana/rewari/bawal/news/rewari-aiims-majra-bhalkhi-opd-ipd-services-infrastructure-development-update-135033171.html',alt:'Proposed AIIMS Rewari campus rendering'},
{name:'AIIMS Bilaspur',place:'Kothipura · Himachal Pradesh',url:'https://www.aiimsbilaspur.edu.in/',photo:'https://images.livemint.com/img/2022/10/05/1600x900/AIIMS_Bilaspur4_1664936079843_1664961750719_1664961750719.jpg',credit:'https://www.livemint.com/news/india/pm-modi-inaugurates-green-hospital-aiims-bilaspur-in-himachal-pradesh-11664961534107.html'},
{name:'AIIMS Vijaypur (Jammu)',place:'Vijaypur · Jammu & Kashmir',url:'https://www.aiimsjammu.edu.in/',photo:'https://cf-images.assettype.com/outlookindia/2025-04-14/mn4wf6wc/IMG8344.PNG?auto=format%2Ccompress&dpr=1.0&fit=max&format=webp&w=801',credit:'https://www.outlookindia.com/announcements/news-media-wire/aiims-vijaypur-jammu-honoured-with-achievement-award-for-best-construction-projects-at-cidc-vishwakarma-awards-2025'},
{name:'AIIMS Awantipora',place:'Awantipora · Kashmir',url:'https://pmssy.mohfw.gov.in/',photo:'https://i0.wp.com/lakecitytimes.com/wp-content/uploads/2025/03/AIIMS-Awantipora.jpg?fit=756%2C391&ssl=1',credit:'https://lakecitytimes.com/2025/08/24/aiims-awantipora-likely-to-miss-november-2025-deadline/'},
{name:'AIIMS Deoghar',place:'Devipur · Jharkhand',url:'https://aiimsdeoghar.edu.in/',photo:'https://dfhe5ze0n4pxu.cloudfront.net/College/Image/Image-1770109316314.jpg',credit:'https://college360.co.in/university/AIIMS-Deoghar-All-India-Institute-Of-Medical-Science-Deoghar-4629/facility',featured:true},
{name:'AIIMS Nagpur',place:'MIHAN · Maharashtra',url:'https://aiimsnagpur.edu.in/',photo:'https://ik.imagekit.io/syustaging/SYU_PREPROD/All-India-Institute-of-Medical-Sciences---_AIIMS_-_Nagpur-_Maharashtra_gRH6Nf2sS.webp',credit:'https://www.selectyouruniversity.com/college/all-india-institute-of-medical-sciences-nagpur-cid-59702'},
{name:'AIIMS Bathinda',place:'Bathinda · Punjab',url:'https://aiimsbathinda.edu.in/',photo:'https://aiimsbathinda.edu.in/images/slides/20220723095916.jpeg',credit:'https://aiimsbathinda.edu.in/'},
{name:'AIIMS Madurai',place:'Madurai · Tamil Nadu',url:'https://aiimsmadurai.edu.in/',photo:'https://aiimsmadurai.edu.in/pPnDrdXN/assets/images/Events/5.jpg',credit:'https://aiimsmadurai.edu.in/pPnDrdXN/'},
{name:'AIIMS Bibinagar',place:'Bibinagar · Telangana',url:'https://aiimsbibinagar.edu.in/',photo:'https://pbs.twimg.com/media/G938rwObUAA0-BC.jpg',credit:'https://x.com/kishanreddybjp/status/2008038853656125848'},
{name:'AIIMS Raebareli',place:'Munshiganj · Uttar Pradesh',url:'http://aiimsrbl.edu.in/',photo:'https://wpmedia.prabhatkhabar.com/uploads/2024/02/GG70aQlXUAAOMk3-1.jpg',credit:'https://www.prabhatkhabar.com/state/uttar-pradesh/raebareli-aiims-virtually-inaugurate-today-by-pm-modi-smk'},
{name:'AIIMS Gorakhpur',place:'Kunraghat · Uttar Pradesh',url:'https://aiimsgorakhpur.edu.in/',photo:'https://www.collegebatch.com/static/clg-gallery/all-india-institute-of-medical-sciences-gorakhpur-287350.webp',credit:'https://www.collegebatch.com/20874-all-india-institute-of-medical-sciences-campus-tour-gorakhpur-fs05'},
{name:'AIIMS Kalyani',place:'Kalyani · West Bengal',url:'https://aiimskalyani.edu.in/',photo:'https://assets.telegraphindia.com/abp/2024/Sep/1725533743_untitled-design-2024-09-05t162557-424.jpg',credit:'https://www.anandabazar.com/education-career/aiims-kalyani-starts-admission-process-for-diploma-in-dental-hygiene-and-diploma-in-dental-mechanics-dgtl/cid/1543654'}
];
var campusGrid=$('campusGrid');
function renderCampuses(list){
 campusGrid.innerHTML=list.map(function(item,index){
  var special=item.featured?'<span class="dream-chip">YOUR DREAM INSTITUTE</span>':'';
  return '<article class="campus-card'+(item.featured?' featured':'')+'"><div class="campus-image"><img src="'+item.photo+'" alt="'+(item.alt||item.name+' campus')+'" loading="lazy" onerror="this.onerror=null;this.src=\'assets/lastmile-icon.svg\';this.classList.add(\'image-fallback\');"><span class="campus-number">'+String(index+1).padStart(2,'0')+' / 23</span></div><div class="campus-info">'+special+'<h3>'+item.name+'</h3><p>'+item.place+'</p><div class="campus-links"><a href="'+item.url+'" target="_blank" rel="noopener">INSTITUTE / PROJECT ↗</a><a href="'+item.credit+'" target="_blank" rel="noopener">PHOTO SOURCE</a></div></div></article>';
 }).join('');
}
function shuffle(items){var array=items.slice();for(var i=array.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var temp=array[i];array[i]=array[j];array[j]=temp;}return array;}
renderCampuses(campuses);
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
{id:'qLTF8akDqZg',title:'The AIIMS fest feeling',by:'Raj [AIIMS]'}
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
 var selectedShorts=pickNew(shorts,4,lastShortIds);lastShortIds=selectedShorts.map(function(item){return item.id;});
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

/* Playlist: attempts audible autoplay, then waits for a visitor gesture if the browser blocks it. */
var audio=$('musicAudio'),tracks=[],trackIndex=0,musicStarted=false;
function timeText(seconds){if(!Number.isFinite(seconds))return '0:00';return Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');}
function updateMusicStatus(message){$('musicState').textContent=message;}
function startMusic(){
 if(!tracks.length)return;
 audio.muted=false;
 var attempt=audio.play();
 if(attempt&&typeof attempt.then==='function'){
  attempt.then(function(){musicStarted=true;$('toggleMusic').textContent='Ⅱ';$('toggleMusic').setAttribute('aria-label','Pause music');updateMusicStatus('MUSIC PLAYING');$('musicHelp').textContent='Music is playing. Use the controls to change tracks or pause.';})
  .catch(function(){musicStarted=false;$('toggleMusic').textContent='▶';$('toggleMusic').setAttribute('aria-label','Play music');updateMusicStatus('TAP ONCE TO ENABLE MUSIC');$('musicHelp').textContent='Your browser blocked automatic sound. Tap the play button once to start your playlist.';});
 }else{musicStarted=true;updateMusicStatus('MUSIC PLAYING');}
}
function loadTrack(index,play){
 if(!tracks.length)return;
 trackIndex=(index+tracks.length)%tracks.length;var track=tracks[trackIndex];
 audio.src=track.src;$('trackTitle').textContent=track.title||'UNTITLED TRACK';$('trackPosition').textContent='TRACK '+(trackIndex+1)+' OF '+tracks.length;audio.load();
 if(play)startMusic();
}
fetch('music/playlist.json',{cache:'no-store'}).then(function(response){if(!response.ok)throw new Error('Playlist not available');return response.json();}).then(function(list){
 tracks=Array.isArray(list)?list.filter(function(track){return track&&typeof track.src==='string';}):[];
 if(!tracks.length){updateMusicStatus('WAITING FOR YOUR PLAYLIST');$('musicHelp').textContent='Attach your MP3 files in this chat and I’ll add them to music/playlist.json. The player will pick them up automatically.';return;}
 $('musicHelp').textContent='Trying to start your playlist…';loadTrack(0,true);
}).catch(function(){updateMusicStatus('PLAYLIST NOT FOUND');$('musicHelp').textContent='The music playlist could not be loaded. Try refreshing the page.';});
$('toggleMusic').addEventListener('click',function(){
 if(!tracks.length){toast('Your MP3 playlist will appear here once added.');return;}
 if(audio.paused){startMusic();}else{audio.pause();musicStarted=false;$('toggleMusic').textContent='▶';$('toggleMusic').setAttribute('aria-label','Play music');updateMusicStatus('MUSIC PAUSED');}
});
$('previousTrack').addEventListener('click',function(){if(tracks.length)loadTrack(trackIndex-1,true);});
$('nextTrack').addEventListener('click',function(){if(tracks.length)loadTrack(trackIndex+1,true);});
$('muteMusic').addEventListener('click',function(){audio.muted=!audio.muted;$('muteMusic').textContent=audio.muted?'×':'♫';});
audio.addEventListener('timeupdate',function(){var percent=audio.duration?audio.currentTime/audio.duration*100:0;$('musicSeek').value=percent;$('musicElapsed').textContent=timeText(audio.currentTime);$('musicDuration').textContent=timeText(audio.duration);});
$('musicSeek').addEventListener('input',function(){if(audio.duration)audio.currentTime=(Number(this.value)/100)*audio.duration;});
audio.addEventListener('ended',function(){if(tracks.length)loadTrack(trackIndex+1,true);});
/* A first user tap anywhere can satisfy browsers that blocked autoplay. */
window.addEventListener('pointerdown',function(event){if(event.target&&event.target.closest&&event.target.closest('.music-player'))return;if(tracks.length&&!musicStarted&&audio.paused)startMusic();},{passive:true});

if('serviceWorker'in navigator&&location.protocol.indexOf('http')===0){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}
})();