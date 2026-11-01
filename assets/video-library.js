(function(){
'use strict';
var DB_NAME='TheLastMileVideoVault';
var STORE_NAME='videos';
var records=[];
var dbPromise=null;
var pageByMode={videos:1,shorts:1};
var PAGE_SIZE=18;
var topics=[
 {icon:'🧭',title:'NEET 2027 strategy',sub:'Roadmaps, schedules and realistic plans',q:'NEET 2027 preparation strategy roadmap'},
 {icon:'⚡',title:'Physics full lectures',sub:'Concepts, numericals and problem solving',q:'NEET Physics full syllabus lectures'},
 {icon:'🧪',title:'Chemistry masterclass',sub:'Physical, organic and inorganic chemistry',q:'NEET Chemistry complete course lectures'},
 {icon:'🧬',title:'Biology NCERT',sub:'Line-by-line Botany and Zoology',q:'NEET Biology NCERT line by line lectures'},
 {icon:'🌿',title:'Botany',sub:'Plant physiology, genetics and ecology',q:'NEET Botany complete chapter lectures'},
 {icon:'🦴',title:'Zoology',sub:'Human physiology and animal kingdom',q:'NEET Zoology complete chapter lectures'},
 {icon:'📖',title:'NCERT line-by-line',sub:'Read, revise and retain every key line',q:'NEET NCERT line by line Biology Chemistry'},
 {icon:'📝',title:'Previous year questions',sub:'Chapter-wise PYQs with explanations',q:'NEET previous year questions chapterwise solutions'},
 {icon:'🎯',title:'Mock test analysis',sub:'Learn from mistakes and improve accuracy',q:'NEET full mock test paper analysis'},
 {icon:'🔁',title:'Revision marathons',sub:'Rapid revision before the exam',q:'NEET full syllabus revision marathon'},
 {icon:'🏆',title:'Topper interviews',sub:'Study methods and lessons from toppers',q:'NEET AIR topper interview preparation strategy'},
 {icon:'🔥',title:'Dropper comeback stories',sub:'Consistency, setbacks and second attempts',q:'NEET dropper success story comeback'},
 {icon:'🏥',title:'AIIMS campus tours',sub:'Explore hostels, libraries and campus life',q:'AIIMS campus tour hostel library MBBS'},
 {icon:'🩺',title:'MBBS day in the life',sub:'A look at life after getting your seat',q:'AIIMS MBBS student day in the life'},
 {icon:'🏡',title:'Hostel and college life',sub:'Rooms, mess, friends and student routines',q:'AIIMS MBBS hostel life college vlog'},
 {icon:'⏳',title:'Study with me',sub:'Quiet desk sessions and deep-focus videos',q:'study with me NEET aspirant real time'},
 {icon:'🍅',title:'Pomodoro sessions',sub:'25/5, 50/10 and long study blocks',q:'study with me pomodoro 50 10 timer'},
 {icon:'💪',title:'Motivation',sub:'A reminder to keep going on hard days',q:'NEET aspirant study motivation'},
 {icon:'🧠',title:'Memory and productivity',sub:'Recall, active learning and focus habits',q:'active recall spaced repetition study techniques'},
 {icon:'📚',title:'Exam hall strategy',sub:'Time management and question selection',q:'NEET exam hall strategy time management'},
 {icon:'🔬',title:'Anatomy and medicine',sub:'A first glimpse into the world of medicine',q:'MBBS anatomy physiology beginner lecture'},
 {icon:'❤️',title:'Medical student stories',sub:'Real experiences from medical colleges',q:'Indian medical student experience MBBS vlog'},
 {icon:'🌙',title:'Late-night study sessions',sub:'Quiet routines for the final stretch',q:'late night study with me NEET'},
 {icon:'☀️',title:'Morning routines',sub:'Build a steady start to your day',q:'NEET aspirant productive morning routine'}
];
function openDb(){
 if(!window.indexedDB)return Promise.reject(new Error('IndexedDB unavailable'));
 if(dbPromise)return dbPromise;
 dbPromise=new Promise(function(resolve,reject){
  var request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=function(){
   var db=request.result;
   if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME,{keyPath:'id'});
  };
  request.onsuccess=function(){resolve(request.result);};
  request.onerror=function(){reject(request.error||new Error('Could not open media library'));};
 });
 return dbPromise;
}
function fallbackRead(){
 try{var data=JSON.parse(localStorage.getItem('tlm:videoVault')||'[]');return Array.isArray(data)?data:[];}
 catch(e){return [];}
}
function readAll(){
 return openDb().then(function(db){
  return new Promise(function(resolve,reject){
   var request=db.transaction(STORE_NAME,'readonly').objectStore(STORE_NAME).getAll();
   request.onsuccess=function(){resolve(request.result||[]);};
   request.onerror=function(){reject(request.error);};
  });
 }).catch(function(){return fallbackRead();});
}
function writeBatch(items){
 return openDb().then(function(db){
  return new Promise(function(resolve,reject){
   var tx=db.transaction(STORE_NAME,'readwrite'),store=tx.objectStore(STORE_NAME);
   items.forEach(function(item){store.put(item);});
   tx.oncomplete=function(){resolve();};
   tx.onerror=function(){reject(tx.error||new Error('Could not save imported videos'));};
   tx.onabort=function(){reject(tx.error||new Error('Import was interrupted'));};
  });
 }).catch(function(){
  try{localStorage.setItem('tlm:videoVault',JSON.stringify(items));}
  catch(e){throw new Error('This browser storage is full. Use a browser with IndexedDB enabled, or import a smaller batch.');}
 });
}
function writeOne(item){
 return openDb().then(function(db){
  return new Promise(function(resolve,reject){
   var tx=db.transaction(STORE_NAME,'readwrite');tx.objectStore(STORE_NAME).put(item);
   tx.oncomplete=resolve;tx.onerror=function(){reject(tx.error);};
  });
 }).catch(function(){
  var all=fallbackRead(),index=all.findIndex(function(x){return x.id===item.id;});
  if(index<0)all.push(item);else all[index]=item;
  localStorage.setItem('tlm:videoVault',JSON.stringify(all));
 });
}
function deleteOne(id){
 return openDb().then(function(db){
  return new Promise(function(resolve,reject){
   var tx=db.transaction(STORE_NAME,'readwrite');tx.objectStore(STORE_NAME).delete(id);
   tx.oncomplete=resolve;tx.onerror=function(){reject(tx.error);};
  });
 }).catch(function(){
  localStorage.setItem('tlm:videoVault',JSON.stringify(fallbackRead().filter(function(x){return x.id!==id;})));
 });
}
function youtubeId(value){
 var raw=String(value||'').trim();
 if(/^[A-Za-z0-9_-]{11}$/.test(raw))return raw;
 try{
  var url=new URL(raw.indexOf('://')===-1?'https://'+raw:raw);
  var host=url.hostname.replace(/^www\./,'').toLowerCase();
  if(host==='youtu.be')return (url.pathname.split('/').filter(Boolean)[0]||'').slice(0,11);
  if(host==='youtube.com'||host.endsWith('.youtube.com')){
   var v=url.searchParams.get('v');if(v)return v.slice(0,11);
   var parts=url.pathname.split('/').filter(Boolean);
   var marker=parts.findIndex(function(p){return ['shorts','embed','live','v'].indexOf(p)!==-1;});
   if(marker!==-1&&parts[marker+1])return parts[marker+1].slice(0,11);
  }
 }catch(e){}
 var match=raw.match(/[A-Za-z0-9_-]{11}/);
 return match?match[0]:'';
}
function csvFields(line){
 var out=[],field='',quoted=false;
 for(var i=0;i<line.length;i++){
  var ch=line[i];
  if(ch==='"'){if(quoted&&line[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
  else if(ch===','&&!quoted){out.push(field.trim());field='';}
  else field+=ch;
 }
 out.push(field.trim());return out;
}
function makeRecord(url,title,type,category,creator){
 var id=youtubeId(url);if(!id)return null;
 var shortPath=/\/shorts\//i.test(String(url||''));
 var normalizedType=(/^(short|shorts)$/i.test(String(type||''))||shortPath)?'shorts':'video';
 var link='https://www.youtube.com/watch?v='+id;
 if(normalizedType==='shorts')link='https://www.youtube.com/shorts/'+id;
 return {id:id,title:String(title||'').trim()||('YouTube '+(normalizedType==='shorts'?'Short':'video')+' · '+id),type:normalizedType,category:String(category||'').trim()||(normalizedType==='shorts'?'Shorts':'Imported'),creator:String(creator||'').trim(),url:link,saved:false,addedAt:Date.now()};
}
function parseImport(raw){
 var input=String(raw||'').trim();if(!input)return [];
 var out=[];
 if(input.charAt(0)==='['||input.charAt(0)==='{'){
  try{
   var parsed=JSON.parse(input);if(!Array.isArray(parsed))parsed=[parsed];
   parsed.forEach(function(item){
    if(typeof item==='string'){var r=makeRecord(item,'','','','');if(r)out.push(r);return;}
    if(item&&typeof item==='object'){
     var url=item.url||item.link||item.videoUrl||item.id||'';
     var r=makeRecord(url,item.title,item.type||item.format,item.category,item.creator||item.channel||item.by);
     if(r)out.push(r);
    }
   });
   if(out.length)return out;
  }catch(e){}
 }
 var lines=input.split(/\r?\n/).map(function(line){return line.trim();}).filter(Boolean);
 if(lines.length&&/^(title|name)\s*,.*(url|link)/i.test(lines[0]))lines.shift();
 lines.forEach(function(line){
  var fields=csvFields(line);
  var urlField=fields.find(function(field){return !!youtubeId(field);});
  if(!urlField){var parts=line.split(/\s+\|\s+/);urlField=parts.find(function(field){return !!youtubeId(field);});if(parts.length>1)fields=parts;}
  if(!urlField)return;
  var title=fields.find(function(field){return field!==urlField&&!/^(video|short|shorts)$/i.test(field)&&!/^https?:\/\//i.test(field);})||'';
  var type=fields.find(function(field){return /^(video|short|shorts)$/i.test(field);})||'';
  var category=fields[fields.length-1]===urlField?'':(fields.length>2?fields[fields.length-1]:'');
  var record=makeRecord(urlField,title,type,category,'');
  if(record)out.push(record);
 });
 var unique={};out.forEach(function(item){unique[item.id]=item;});
 return Object.keys(unique).map(function(id){return unique[id];});
}
function ytSearchUrl(query,type){
 var q=String(query||'').trim();
 if(type==='shorts')q+=' shorts';
 else if(type==='videos')q+=' full video';
 return 'https://www.youtube.com/results?search_query='+encodeURIComponent(q);
}
function el(tag,className,text){
 var node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;
}
function createCard(item,root,mode){
 var card=el('article','vault-item'+(item.type==='shorts'?' is-short':''));
 var thumb=el('div','vault-thumb');
 var img=el('img','');img.src='https://i.ytimg.com/vi/'+item.id+'/hqdefault.jpg';img.alt='';img.loading='lazy';img.referrerPolicy='strict-origin-when-cross-origin';
 img.onerror=function(){img.style.display='none';thumb.classList.add('thumb-fallback');};
 thumb.appendChild(img);
 var play=el('button','vault-play','▶');play.type='button';play.setAttribute('aria-label','Play '+item.title);play.dataset.watch=item.id;thumb.appendChild(play);
 var body=el('div','vault-item-body');
 var meta=el('div','vault-item-meta');
 meta.appendChild(el('span','vault-type',item.type==='shorts'?'SHORT':'VIDEO'));
 meta.appendChild(el('span','vault-category',item.category||'Imported'));
 body.appendChild(meta);
 body.appendChild(el('h4','',item.title));
 if(item.creator)body.appendChild(el('p','vault-creator',item.creator));
 var actions=el('div','vault-item-actions');
 var watch=el('button','vault-watch','WATCH HERE');watch.type='button';watch.dataset.watch=item.id;
 var save=el('button','vault-save'+(item.saved?' active':''),item.saved?'★ SAVED':'☆ SAVE');save.type='button';save.dataset.save=item.id;
 var open=el('a','vault-open','YOUTUBE ↗');open.href=item.url;open.target='_blank';open.rel='noopener noreferrer';
 var remove=el('button','vault-remove','REMOVE');remove.type='button';remove.dataset.remove=item.id;remove.setAttribute('aria-label','Remove '+item.title);
 actions.appendChild(watch);actions.appendChild(save);actions.appendChild(open);actions.appendChild(remove);
 body.appendChild(actions);card.appendChild(thumb);card.appendChild(body);return card;
}
function createVault(root,mode){
 var suffix=mode==='shorts'?'shorts':'videos';
 var startFilter=mode==='shorts'?'shorts':'videos';
 var state={filter:startFilter,query:'',page:1};
 var filterList=mode==='shorts'?[['shorts','SHORTS'],['saved','SAVED']]:[['all','ALL'],['videos','VIDEOS'],['shorts','SHORTS'],['saved','SAVED']];
 root.innerHTML=[
  '<section class="vault-shell">',
  '<div class="vault-heading"><div><span class="vault-kicker">THE LAST MILE · MEDIA VAULT</span><h2>'+(mode==='shorts'?'The Shorts <em>library.</em>':'The Video <em>vault.</em>')+'</h2><p>'+(mode==='shorts'?'Quick inspiration, bite-sized lessons and real student moments.':'One searchable home for NEET lessons, AIIMS campus stories, revision and student life.')+'</p></div><div class="vault-count-mark">10K<small>+ READY</small></div></div>',
  '<div class="vault-stat-row"><div><strong data-stat="total">0</strong><small>IN YOUR LIBRARY</small></div><div><strong data-stat="videos">0</strong><small>VIDEOS</small></div><div><strong data-stat="shorts">0</strong><small>SHORTS</small></div><div><strong data-stat="saved">0</strong><small>SAVED</small></div></div>',
  '<div class="vault-search-row"><label class="vault-search"><span>⌕</span><input type="search" data-search placeholder="Search your imported titles, creators or topics…"></label><button class="vault-search-action" type="button" data-search-youtube>SEARCH YOUTUBE ↗</button></div>',
  '<div class="vault-filter-row" role="group" aria-label="Filter media">'+filterList.map(function(f){return '<button type="button" data-filter="'+f[0]+'" class="'+(f[0]===startFilter?'active':'')+'">'+f[1]+'</button>';}).join('')+'</div>',
  '<div class="vault-subhead"><div><span>DISCOVERY SHELVES</span><small>LIVE YOUTUBE SEARCHES · NO RE-UPLOADS</small></div></div>',
  '<div class="vault-topic-grid" data-topics></div>',
  mode==='videos'?'<details class="vault-import"><summary><span>＋ BULK IMPORT YOUR OWN VIDEO BANK</span><small>Paste 10,000+ YouTube links, JSON or CSV</small></summary><div class="vault-import-inner"><p>Use one YouTube URL per line, or CSV rows in this order: <b>Title, URL, Type, Category</b>. JSON arrays are also supported. Your list is saved privately in this browser using IndexedDB.</p><textarea data-import placeholder="https://www.youtube.com/watch?v=VIDEO_ID&#10;A biology lecture, https://www.youtube.com/watch?v=VIDEO_ID, video, Biology&#10;A quick revision short, https://www.youtube.com/shorts/VIDEO_ID, shorts, Revision"></textarea><div class="vault-import-actions"><button type="button" data-import-button>IMPORT LINKS</button><span data-import-status>Up to 50,000 entries supported by the library interface.</span></div></div></details>':'',
  '<div class="vault-library-heading"><div><span>YOUR COLLECTION</span><small data-result-count>0 ITEMS</small></div><span class="vault-local-label">SAVED ON THIS DEVICE</span></div>',
  '<div class="vault-player" data-player hidden><div class="vault-player-head"><span>NOW PLAYING</span><button type="button" data-close-player>✕ CLOSE</button></div><div class="vault-player-frame" data-player-frame></div></div>',
  '<div class="vault-items-grid" data-items></div>',
  '<div class="vault-pagination" data-pagination></div>',
  '<p class="vault-footnote">Discovery opens current search results on YouTube. Imported videos remain on their original channels; this website stores links and your saved list, not copyrighted video files.</p>',
  '</section>'
 ].join('');
 var search=root.querySelector('[data-search]');
 var topicsNode=root.querySelector('[data-topics]');
 var itemsNode=root.querySelector('[data-items]');
 var pagination=root.querySelector('[data-pagination]');
 var countNode=root.querySelector('[data-result-count]');
 var player=root.querySelector('[data-player]');
 var playerFrame=root.querySelector('[data-player-frame]');
 function updateStats(){
  root.querySelector('[data-stat="total"]').textContent=records.length.toLocaleString('en-IN');
  root.querySelector('[data-stat="videos"]').textContent=records.filter(function(x){return x.type==='video';}).length.toLocaleString('en-IN');
  root.querySelector('[data-stat="shorts"]').textContent=records.filter(function(x){return x.type==='shorts';}).length.toLocaleString('en-IN');
  root.querySelector('[data-stat="saved"]').textContent=records.filter(function(x){return x.saved;}).length.toLocaleString('en-IN');
 }
 function renderTopics(){
  var query=state.query.toLowerCase();
  topicsNode.innerHTML='';
  var filtered=topics.filter(function(topic){return !query||(topic.title+' '+topic.sub+' '+topic.q).toLowerCase().indexOf(query)!==-1;});
  filtered.slice(0,24).forEach(function(topic){
   var card=el('a','vault-topic');
   card.href=ytSearchUrl(topic.q,mode);
   card.target='_blank';card.rel='noopener noreferrer';
   card.appendChild(el('span','vault-topic-icon',topic.icon));
   card.appendChild(el('strong','',topic.title));
   card.appendChild(el('small','',topic.sub));
   card.appendChild(el('span','vault-topic-link',mode==='shorts'?'FIND SHORTS ↗':'EXPLORE VIDEOS ↗'));
   topicsNode.appendChild(card);
  });
  if(!filtered.length)topicsNode.appendChild(el('p','vault-empty','No shelf matches that search. Use Search YouTube to search any topic.'));
 }
 function visibleItems(){
  var query=state.query.toLowerCase();
  return records.filter(function(item){
   if(mode==='shorts'&&item.type!=='shorts')return false;
   if(state.filter==='videos'&&item.type!=='video')return false;
   if(state.filter==='shorts'&&item.type!=='shorts')return false;
   if(state.filter==='saved'&&!item.saved)return false;
   if(query&&(item.title+' '+item.creator+' '+item.category).toLowerCase().indexOf(query)===-1)return false;
   return true;
  }).sort(function(a,b){return (Number(b.saved)-Number(a.saved))||(b.addedAt||0)-(a.addedAt||0);});
 }
 function renderPagination(total){
  pagination.innerHTML='';
  var pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
  if(state.page>pages)state.page=pages;
  if(pages<=1)return;
  var prev=el('button','', '← PREVIOUS');prev.type='button';prev.disabled=state.page<=1;
  prev.addEventListener('click',function(){state.page--;renderItems();});
  var label=el('span','', 'PAGE '+state.page+' / '+pages);
  var next=el('button','', 'NEXT →');next.type='button';next.disabled=state.page>=pages;
  next.addEventListener('click',function(){state.page++;renderItems();});
  pagination.appendChild(prev);pagination.appendChild(label);pagination.appendChild(next);
 }
 function renderItems(){
  var items=visibleItems(),start=(state.page-1)*PAGE_SIZE;
  countNode.textContent=items.length.toLocaleString('en-IN')+' ITEMS';
  itemsNode.innerHTML='';
  items.slice(start,start+PAGE_SIZE).forEach(function(item){itemsNode.appendChild(createCard(item,root,mode));});
  if(!items.length)itemsNode.appendChild(el('div','vault-empty',records.length?'No matching items. Try another filter or add more links.':'Your personal library is empty. Import YouTube links below, or explore a discovery shelf above.'));
  renderPagination(items.length);
  updateStats();
 }
 root.querySelectorAll('[data-filter]').forEach(function(button){
  button.addEventListener('click',function(){
   state.filter=button.dataset.filter;state.page=1;
   root.querySelectorAll('[data-filter]').forEach(function(x){x.classList.toggle('active',x===button);});
   renderItems();
  });
 });
 search.addEventListener('input',function(){state.query=search.value.trim();state.page=1;renderTopics();renderItems();});
 root.querySelector('[data-search-youtube]').addEventListener('click',function(){
  var q=search.value.trim()||(mode==='shorts'?'NEET motivation and revision':'NEET 2027 study videos');
  window.open(ytSearchUrl(q,mode),'_blank','noopener');
 });
 root.addEventListener('click',function(event){
  var watch=event.target.closest('[data-watch]');
  if(watch){
   var id=watch.dataset.watch;
   playerFrame.innerHTML='';
   var frame=document.createElement('iframe');
   frame.src='https://www.youtube-nocookie.com/embed/'+id+'?rel=0';
   frame.title='YouTube media player';frame.loading='lazy';frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
   playerFrame.appendChild(frame);player.hidden=false;player.scrollIntoView({behavior:'smooth',block:'start'});return;
  }
  var save=event.target.closest('[data-save]');
  if(save){
   var record=records.find(function(x){return x.id===save.dataset.save;});if(!record)return;
   record.saved=!record.saved;writeOne(record).then(function(){renderItems();});
   return;
  }
  var remove=event.target.closest('[data-remove]');
  if(remove){
   var idToDelete=remove.dataset.remove;
   deleteOne(idToDelete).then(function(){records=records.filter(function(x){return x.id!==idToDelete;});renderItems();});
   return;
  }
  if(event.target.closest('[data-close-player]')){playerFrame.innerHTML='';player.hidden=true;}
 });
 if(mode==='videos'){
  var importButton=root.querySelector('[data-import-button]');
  importButton.addEventListener('click',function(){
   var textarea=root.querySelector('[data-import]'),status=root.querySelector('[data-import-status]');
   var imported=parseImport(textarea.value);
   if(!imported.length){status.textContent='No valid YouTube video links found. Paste watch, youtu.be or /shorts/ URLs.';return;}
   var map={};records.forEach(function(item){map[item.id]=item;});
   var added=0;
   imported.forEach(function(item){
    if(map[item.id]){if(!map[item.id].title||map[item.id].title.indexOf('YouTube ')===0)map[item.id].title=item.title;return;}
    map[item.id]=item;added++;
   });
   records=Object.keys(map).map(function(key){return map[key];});
   writeBatch(records).then(function(){
    status.textContent=added.toLocaleString('en-IN')+' new items imported. '+records.length.toLocaleString('en-IN')+' total in your collection.';
    textarea.value='';state.filter='all';state.page=1;
    root.querySelectorAll('[data-filter]').forEach(function(x){x.classList.toggle('active',x.dataset.filter==='all');});
    renderItems();
   }).catch(function(error){status.textContent=error.message||'Import failed. Try a smaller batch.';});
  });
 }
 renderTopics();renderItems();
}
function boot(){
 var videoRoot=document.getElementById('mediaVaultVideos');
 var shortsRoot=document.getElementById('mediaVaultShorts');
 if(!videoRoot&&!shortsRoot)return;
 Promise.resolve(readAll()).then(function(data){
  records=Array.isArray(data)?data:[];
  if(videoRoot)createVault(videoRoot,'videos');
  if(shortsRoot)createVault(shortsRoot,'shorts');
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();