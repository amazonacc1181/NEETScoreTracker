(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var store={get:function(key,fallback){try{var v=localStorage.getItem('tlm:'+key);return v===null?fallback:JSON.parse(v);}catch(e){return fallback;}},set:function(key,value){try{localStorage.setItem('tlm:'+key,JSON.stringify(value));return true;}catch(e){return false;}}};
function localDay(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function prettyDate(d){return d.toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).toUpperCase();}
function toast(message){var el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove('show');},2400);}
var todayKey=localDay(new Date());$('todayDate').textContent=prettyDate(new Date());$('journalDate').textContent=prettyDate(new Date());
var menuButton=$('menuButton'),mobileNav=$('mobileNav');
function setMenuOpen(open){mobileNav.classList.toggle('open',open);menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');menuButton.textContent=open?'✕':'☰';}
menuButton.addEventListener('click',function(){setMenuOpen(menuButton.getAttribute('aria-expanded')!=='true');});
document.querySelectorAll('.mobile-nav a').forEach(function(a){a.addEventListener('click',function(){setMenuOpen(false);});});
document.addEventListener('keydown',function(e){if(e.key==='Escape')setMenuOpen(false);});
window.addEventListener('resize',function(){if(window.matchMedia('(min-width: 901px)').matches)setMenuOpen(false);});
if(store.get('theme','dark')==='light')document.body.classList.add('light');
$('themeToggle').addEventListener('click',function(){document.body.classList.toggle('light');store.set('theme',document.body.classList.contains('light')?'light':'dark');});
var dateInput=$('targetDate');dateInput.value=store.get('targetDate','2027-05-02');
function updateCountdown(){var raw=dateInput.value;if(!raw){['days','hours','minutes','seconds'].forEach(function(id){$(id).textContent='—';});$('targetText').textContent='SET A PLANNING DATE';return;}var target=new Date(raw+'T00:00:00'),diff=target.getTime()-Date.now();if(!isFinite(diff))return;if(diff<0)diff=0;var day=Math.floor(diff/86400000),hour=Math.floor(diff%86400000/3600000),minute=Math.floor(diff%3600000/60000),second=Math.floor(diff%60000/1000);$('days').textContent=String(day).padStart(3,'0');$('hours').textContent=String(hour).padStart(2,'0');$('minutes').textContent=String(minute).padStart(2,'0');$('seconds').textContent=String(second).padStart(2,'0');$('targetText').textContent=target.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase()+' · PROVISIONAL';}
dateInput.addEventListener('change',function(){store.set('targetDate',dateInput.value);updateCountdown();});updateCountdown();setInterval(updateCountdown,1000);
var taskInputs=Array.from(document.querySelectorAll('[data-task]')),dayData=store.get('day:'+todayKey,{});
taskInputs.forEach(function(input){input.checked=!!dayData[input.dataset.task];input.addEventListener('change',saveTasks);});
function dayCount(key){var data=store.get('day:'+key,{});return Object.keys(data).filter(function(k){return data[k];}).length;}
function renderWeek(){var now=new Date(),total=0,labels=[];for(var i=6;i>=0;i--){var d=new Date(now);d.setDate(now.getDate()-i);var key=localDay(d),n=dayCount(key);total+=n;labels.push({n:n,label:d.toLocaleDateString('en-IN',{weekday:'short'}).slice(0,1)});}var bars=Array.from(document.querySelectorAll('.week-bar'));bars.forEach(function(bar,i){bar.querySelector('span').style.height=Math.max(3,labels[i].n/4*100)+'%';bar.querySelector('small').textContent=labels[i].label;bar.title=labels[i].n+' of 4 tasks';});$('weekTotal').textContent=total+' / 28';var streak=0;for(var j=0;j<365;j++){var d2=new Date(now);d2.setDate(now.getDate()-j);if(dayCount(localDay(d2))>0)streak++;else break;}$('streakNumber').textContent=streak;}
function saveTasks(){var data={};taskInputs.forEach(function(input){data[input.dataset.task]=input.checked;});store.set('day:'+todayKey,data);var count=taskInputs.filter(function(input){return input.checked;}).length,pct=Math.round(count/taskInputs.length*100);$('taskCount').textContent=count+' OF '+taskInputs.length+' COMPLETED';$('dayProgress').style.width=pct+'%';$('dayMessage').textContent=count===0?'START WITH ONE.':count===taskInputs.length?'ALL FOUR. YOU SHOWED UP.':'KEEP THE MOMENTUM.';renderWeek();}
saveTasks();
var duration=25*60,remaining=duration,timer=null,running=false,circumference=2*Math.PI*96;$('timerRing').style.strokeDasharray=circumference;
function paintTimer(){var m=Math.floor(remaining/60),s=remaining%60;$('timerDisplay').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');$('timerRing').style.strokeDashoffset=circumference*(1-remaining/duration);}
function stopTimer(){if(timer){clearInterval(timer);timer=null;}running=false;$('timerStart').innerHTML='START FOCUS <span>▶</span>';}
$('timerStart').addEventListener('click',function(){if(running){stopTimer();$('timerStart').innerHTML='RESUME FOCUS <span>▶</span>';return;}if(remaining===0){remaining=duration;paintTimer();}running=true;$('timerStart').innerHTML='PAUSE <span>Ⅱ</span>';timer=setInterval(function(){remaining--;paintTimer();if(remaining<=0){stopTimer();$('timerLabel').textContent='BLOCK COMPLETE';toast('Focus block complete. Take a short break.');}},1000);});
$('timerReset').addEventListener('click',function(){stopTimer();remaining=duration;$('timerLabel').textContent='MINUTES OF FOCUS';paintTimer();});
document.querySelectorAll('.preset').forEach(function(btn){btn.addEventListener('click',function(){document.querySelectorAll('.preset').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');stopTimer();duration=Number(btn.dataset.minutes)*60;remaining=duration;$('timerLabel').textContent='MINUTES OF FOCUS';paintTimer();});});paintTimer();
var tests=store.get('tests',[]);
function escapeHTML(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function renderTests(){$('testCount').textContent=tests.length;if(!tests.length){$('testAverage').textContent='—';$('bestScore').textContent='—';$('testHistory').innerHTML='<div class="empty-state">Your first score goes here. Make it a starting point, not a verdict.</div>';return;}var avg=tests.reduce(function(a,t){return a+t.score/t.max;},0)/tests.length*100,best=tests.reduce(function(a,t){return t.score/t.max>a.score/a.max?t:a;});$('testAverage').textContent=avg.toFixed(1)+'%';$('bestScore').textContent=best.score+'/'+best.max;$('testHistory').innerHTML=tests.slice(0,5).map(function(t){return '<div class="test-item"><b>'+escapeHTML(t.name)+'</b><span>'+t.date+'</span><strong>'+t.score+'/'+t.max+'</strong></div>';}).join('');}
$('scoreForm').addEventListener('submit',function(e){e.preventDefault();var name=$('testName').value.trim(),score=Number($('testScore').value),max=Number($('testMax').value);if(!name||!Number.isFinite(score)||!Number.isFinite(max)||max<1||score<0||score>max||max>720){toast('Check the test name and score.');return;}tests.unshift({name:name,score:score,max:max,date:new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short'})});tests=tests.slice(0,30);store.set('tests',tests);renderTests();$('scoreForm').reset();$('testMax').value='720';toast('Mock result saved. Learn from it.');});renderTests();
$('journalText').value=store.get('journal:'+todayKey,'');
$('saveJournal').addEventListener('click',function(){store.set('journal:'+todayKey,$('journalText').value);$('journalStatus').textContent='SAVED JUST NOW · PRIVATE TO THIS BROWSER';toast('Your note is saved.');});
$('journalText').addEventListener('input',function(){$('journalStatus').textContent='UNSAVED CHANGES';});
$('heroPromise').addEventListener('click',function(){$('promise').scrollIntoView({behavior:'smooth'});});
var audio=$('audioPlayer'),tracks=[],trackIndex=0;
function fmt(seconds){if(!Number.isFinite(seconds))return '0:00';return Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');}
function setTrack(i){if(!tracks.length)return;trackIndex=(i+tracks.length)%tracks.length;audio.src=tracks[trackIndex].src;$('trackTitle').textContent=tracks[trackIndex].title||'UNTITLED TRACK';$('trackSubtitle').textContent='TRACK '+(trackIndex+1)+' OF '+tracks.length;audio.load();audio.play().then(function(){$('playTrack').textContent='Ⅱ';}).catch(function(){$('playTrack').textContent='▶';});}
fetch('music/playlist.json').then(function(r){return r.ok?r.json():[];}).then(function(list){tracks=Array.isArray(list)?list.filter(function(t){return t&&typeof t.src==='string';}):[];$('musicEmpty').hidden=tracks.length>0;if(tracks.length)setTrack(0);}).catch(function(){});
$('playTrack').addEventListener('click',function(){if(!tracks.length){toast('Your music room is ready for your playlist.');return;}if(audio.paused){audio.play().then(function(){$('playTrack').textContent='Ⅱ';}).catch(function(){});}else{audio.pause();$('playTrack').textContent='▶';}});
$('prevTrack').addEventListener('click',function(){if(tracks.length)setTrack(trackIndex-1);});$('nextTrack').addEventListener('click',function(){if(tracks.length)setTrack(trackIndex+1);});
$('muteTrack').addEventListener('click',function(){audio.muted=!audio.muted;$('muteTrack').textContent=audio.muted?'×':'♫';});
audio.addEventListener('timeupdate',function(){var pct=audio.duration?audio.currentTime/audio.duration*100:0;$('audioSeek').value=pct;$('audioCurrent').textContent=fmt(audio.currentTime);$('audioDuration').textContent=fmt(audio.duration);});
$('audioSeek').addEventListener('input',function(){if(audio.duration)audio.currentTime=Number(this.value)/100*audio.duration;});audio.addEventListener('ended',function(){if(tracks.length)setTrack(trackIndex+1);});

/* All-India AIIMS directory: PMSSY status snapshot plus the original AIIMS New Delhi. */
var aiimsInstitutes=[
{name:'AIIMS New Delhi',city:'Ansari Nagar, New Delhi',state:'Delhi',group:'functional',status:'Original institute · fully operational',url:'https://www.aiims.edu/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Bhopal',city:'Saket Nagar, Bhopal',state:'Madhya Pradesh',group:'functional',status:'Fully functional',url:'https://aiimsbhopal.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Bhubaneswar',city:'Sijua, Bhubaneswar',state:'Odisha',group:'functional',status:'Fully functional',url:'https://www.aiimsbhubaneswar.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Jodhpur',city:'Basni, Jodhpur',state:'Rajasthan',group:'functional',status:'Fully functional',url:'https://aiimsjodhpur.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Patna',city:'Phulwarisharif, Patna',state:'Bihar',group:'functional',status:'Fully functional',url:'http://aiimspatna.org/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Raipur',city:'Tatibandh, Raipur',state:'Chhattisgarh',group:'functional',status:'Fully functional',url:'http://aiimsraipur.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Rishikesh',city:'Virbhadra Road, Rishikesh',state:'Uttarakhand',group:'functional',status:'Fully functional',url:'http://aiimsrishikesh.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Raebareli',city:'Munshiganj, Raebareli',state:'Uttar Pradesh',group:'clinical',status:'MBBS · OPD · IPD operational',url:'http://aiimsrbl.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Gorakhpur',city:'Kunraghat, Gorakhpur',state:'Uttar Pradesh',group:'clinical',status:'MBBS · OPD · IPD operational',url:'https://aiimsgorakhpur.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Mangalagiri',city:'Mangalagiri, Guntur region',state:'Andhra Pradesh',group:'clinical',status:'MBBS · OPD · IPD operational',url:'http://aiimsmangalagiri.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Nagpur',city:'MIHAN, Nagpur',state:'Maharashtra',group:'clinical',status:'MBBS · OPD · IPD operational',url:'http://aiimsnagpur.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Bathinda',city:'Bathinda',state:'Punjab',group:'clinical',status:'MBBS · OPD · IPD operational',url:'https://aiimsbathinda.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Bibinagar',city:'Bibinagar, Yadadri Bhuvanagiri',state:'Telangana',group:'clinical',status:'MBBS · OPD · IPD operational',url:'https://aiimsbibinagar.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Kalyani',city:'Kalyani, Nadia',state:'West Bengal',group:'clinical',status:'MBBS · OPD · IPD operational',url:'https://aiimskalyani.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Deoghar',city:'Devipur / Deoghar',state:'Jharkhand',group:'clinical',status:'MBBS · OPD · IPD operational',url:'https://aiimsdeoghar.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE',highlight:true},
{name:'AIIMS Bilaspur',city:'Kothipura, Bilaspur',state:'Himachal Pradesh',group:'clinical',status:'MBBS · OPD · IPD operational',url:'https://www.aiimsbilaspur.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Rajkot',city:'Khandheri, Rajkot',state:'Gujarat',group:'clinical',status:'MBBS · OPD · IPD operational',url:'https://aiimsrajkot.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Guwahati',city:'Changsari, Kamrup',state:'Assam',group:'clinical',status:'MBBS · OPD · IPD operational',url:'https://aiimsguwahati.ac.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Vijaypur (Jammu)',city:'Vijaypur, Samba',state:'Jammu & Kashmir',group:'clinical',status:'MBBS · OPD · IPD operational',url:'https://www.aiimsjammu.edu.in/',link:'OFFICIAL INSTITUTE WEBSITE'},
{name:'AIIMS Madurai',city:'Madurai / temporary academic campus at Ramanathapuram',state:'Tamil Nadu',group:'mbbs',status:'MBBS classes running · campus work ongoing',url:'https://pmssy.mohfw.gov.in/',link:'GOVERNMENT PROJECT STATUS'},
{name:'AIIMS Awantipora',city:'Awantipora, Pulwama',state:'Jammu & Kashmir',group:'building',status:'Construction in progress',url:'https://pmssy.mohfw.gov.in/',link:'GOVERNMENT PROJECT STATUS'},
{name:'AIIMS Majra (Rewari)',city:'Majra, Rewari',state:'Haryana',group:'building',status:'Construction in progress',url:'https://pmssy.mohfw.gov.in/',link:'GOVERNMENT PROJECT STATUS'},
{name:'AIIMS Darbhanga',city:'Darbhanga',state:'Bihar',group:'building',status:'Construction in progress',url:'https://pmssy.mohfw.gov.in/',link:'GOVERNMENT PROJECT STATUS'}
];
var aiimsGrid=$('aiimsGrid'),aiimsSearch=$('aiimsSearch'),aiimsEmpty=$('aiimsEmpty'),aiimsResultCount=$('aiimsResultCount'),aiimsActiveFilter='all';
function renderAiims(){
 if(!aiimsGrid)return;
 var query=(aiimsSearch&&aiimsSearch.value||'').trim().toLowerCase();
 var visible=aiimsInstitutes.filter(function(item){
  var filterMatch=aiimsActiveFilter==='all'||item.group===aiimsActiveFilter;
  var haystack=(item.name+' '+item.city+' '+item.state+' '+item.status).toLowerCase();
  return filterMatch&&(!query||haystack.indexOf(query)!==-1);
 });
 aiimsGrid.innerHTML=visible.map(function(item){
  var number=String(aiimsInstitutes.indexOf(item)+1).padStart(2,'0');
  var featured=item.highlight?' featured':'';
  var flag=item.highlight?'<span class="aiims-dream-flag">YOUR DREAM INSTITUTE</span>':'';
  return '<article class="aiims-card'+featured+'"><div class="aiims-card-art" aria-hidden="true"><span class="aiims-card-index">INSTITUTE '+number+' / 23</span><span class="aiims-card-word">AIIMS</span><span class="aiims-card-art-caption">THE INDIA-WIDE INSTITUTE NETWORK</span></div><div class="aiims-card-body">'+flag+'<span class="aiims-card-type">ALL INDIA INSTITUTE OF MEDICAL SCIENCES</span><h3>'+escapeHTML(item.name)+'</h3><p class="aiims-location">'+escapeHTML(item.city)+', '+escapeHTML(item.state)+'</p><span class="aiims-status status-'+item.group+'">'+escapeHTML(item.status)+'</span><a class="aiims-card-link" href="'+escapeHTML(item.url)+'" target="_blank" rel="noopener">'+escapeHTML(item.link)+' <span>↗</span></a></div></article>';
 }).join('');
 aiimsResultCount.textContent=visible.length+' of '+aiimsInstitutes.length+' institutes';
 aiimsEmpty.hidden=visible.length!==0;
}
if(aiimsGrid){
 document.querySelectorAll('[data-aiims-filter]').forEach(function(button){
  button.addEventListener('click',function(){
   aiimsActiveFilter=button.dataset.aiimsFilter;
   document.querySelectorAll('[data-aiims-filter]').forEach(function(other){var active=other===button;other.classList.toggle('active',active);other.setAttribute('aria-pressed',String(active));});
   renderAiims();
  });
 });
 if(aiimsSearch)aiimsSearch.addEventListener('input',renderAiims);
 renderAiims();
}

if('serviceWorker'in navigator&&location.protocol.indexOf('http')===0)window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
})();