#!/usr/bin/env python3
"""Fetch AIIMS institute logo marks and build the homepage marquee."""
from __future__ import annotations
import io, json, re, time
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parents[2]
APP=ROOT/"assets/app.js"
HTML=ROOT/"index.html"
SW=ROOT/"sw.js"
OUT=ROOT/"assets/aiims-logos"
OUT.mkdir(parents=True,exist_ok=True)
HEADERS={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36",
         "Accept":"image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8"}
SESSION=requests.Session()
SESSION.headers.update(HEADERS)
SEEDS={
 "AIIMS New Delhi":["https://upload.wikimedia.org/wikipedia/commons/e/ee/AIIMS_New_Delhi.png"],
 "AIIMS Bhopal":["https://cdn.shopify.com/s/files/1/0880/1560/1965/files/AIIMS_Bhopal.webp?v=1753707695"],
 "AIIMS Jodhpur":["https://cdn.theorg.com/c79af230-94db-4eb3-b25b-902d482b7ade_medium.jpg"],
 "AIIMS Patna":["https://image.preptive.in/aiims-patna-logo.webp"],
 "AIIMS Raipur":["https://website.aiimsraipur.edu.in/web_image/lg1.png"],
 "AIIMS Guwahati":["https://www.aiimsguwahati.ac.in/uploads/department/1720163384aiimslogo_1080p.png"],
 "AIIMS Deoghar":["https://pub-3bd144a409f940998afd367af1dcde44.r2.dev/migrated/colleges/1765988535078-02072f1a-xhonq0frnc50hu8d68nl.jpg"],
 "AIIMS Kalyani":["https://cdn.brandfetch.io/domain/aiimskalyani.edu.in/fallback/lettermark/theme/dark/h/400/w/400/icon?c=1bfwsmEH20zzEfSNTed"],
 "AIIMS Rajkot":["https://pbs.twimg.com/media/E6q4qrpVEAEw-l1.jpg"],
 "AIIMS Mangalagiri":["https://d107tomoq7qta0.cloudfront.net/images/universities-logos/3i6HX2TOgMOicsFKArT9d4Omm5MWS2CN0qDXTdXw.jpg"],
}
EXTRA_SITES={
 "AIIMS Bhubaneswar":["https://aiimsbhubaneswar.nic.in/"],
 "AIIMS Guwahati":["https://aaimsguat.unitrackonline.com/page/institute_logo"],
 "AIIMS Patna":["https://aiimspatna.edu.in/logo"],
 "AIIMS Vijaypur (Jammu)":["https://exams.aiimsjammu.edu.in/"],
}

def slug(name):
    return re.sub(r"[^a-z0-9]+","-",name.lower()).strip("-")

def read_campuses():
    text=APP.read_text(encoding="utf-8")
    start=text.index("var campuses=[")
    end=text.index("\n];",start)
    block=text[start:end]
    pattern=re.compile(r"\{name:'([^']+)'[^}]*?url:'([^']+)'")
    rows=pattern.findall(block)
    if len(rows)!=23:
        raise RuntimeError(f"Expected 23 AIIMS entries; found {len(rows)}")
    return rows

def get_bytes(url):
    try:
        r=SESSION.get(url,timeout=(4,8),allow_redirects=True)
        r.raise_for_status()
        if not r.headers.get("Content-Type","").lower().startswith("image/"):
            return None
        Image.open(io.BytesIO(r.content)).verify()
        return r.content
    except Exception as e:
        print(f"  skip {url}: {e}")
        return None
def store_image(data,path):
    try:
        im=ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGBA")
        if im.width<48 or im.height<48:return False
        im.thumbnail((520,520),Image.Resampling.LANCZOS)
        path.parent.mkdir(parents=True,exist_ok=True)
        im.save(path,"WEBP",quality=91,method=6)
        return path.stat().st_size>1500
    except Exception:return False
def homepage_candidates(url):
    try:
        r=SESSION.get(url,timeout=(4,8),allow_redirects=True)
        r.raise_for_status()
        soup=BeautifulSoup(r.text,"html.parser")
        candidates=[]
        for img in soup.find_all("img"):
            src=img.get("src") or img.get("data-src") or img.get("data-lazy-src")
            if not src: continue
            alt=(img.get("alt") or "").lower()
            attrs=" ".join([str(img.get("class") or ""),str(img.get("id") or ""),src]).lower()
            parent=img.parent
            parent_attrs=" ".join([str(parent.get("class") or ""),str(parent.get("id") or "")]).lower() if parent else ""
            score=0
            if "logo" in attrs:score+=10
            if "logo" in alt:score+=10
            if any(k in attrs for k in ["emblem","brand","header","site-logo"]):score+=5
            if any(k in parent_attrs for k in ["logo","brand","header"]):score+=5
            if any(k in attrs for k in ["facebook","twitter","instagram","youtube","whatsapp","google"]):score-=20
            if score>0:candidates.append((score,urljoin(r.url,src)))
        for link in soup.find_all("link",rel=True):
            rel=" ".join(link.get("rel",[])).lower()
            href=link.get("href","")
            if href and ("icon" in rel or "apple-touch-icon" in rel):
                candidates.append((1,urljoin(r.url,href)))
        # Highest-confidence candidates first, preserve uniqueness.
        unique={}
        for score,url in candidates:
            if url not in unique or score>unique[url]:unique[url]=score
        return [u for u,_ in sorted(unique.items(),key=lambda p:p[1],reverse=True)]
    except Exception as e:
        print(f"  homepage scan failed: {url}: {e}")
        return []
def commons_candidates(name):
    q=[f'"{name}" logo']
    found=[]
    for query in q:
        try:
            params={"action":"query","format":"json","generator":"search","gsrnamespace":6,"gsrlimit":12,
                    "gsrsearch":query,"prop":"imageinfo","iiprop":"url|mime|extmetadata"}
            data=SESSION.get("https://commons.wikimedia.org/w/api.php",params=params,timeout=30).json()
            pages=list(data.get("query",{}).get("pages",{}).values())
            pages.sort(key=lambda p:0 if "logo" in p.get("title","").lower() else 1)
            for page in pages:
                title=page.get("title","").lower()
                if "logo" not in title and "seal" not in title and "emblem" not in title:continue
                info=(page.get("imageinfo") or [{}])[0]
                if not info.get("mime","").startswith("image/"):continue
                ext=info.get("extmetadata",{})
                license_text=(ext.get("LicenseShortName",{}).get("value","")+" "+ext.get("UsageTerms",{}).get("value","")).lower()
                if not any(k in license_text for k in ["cc0","cc by","cc-by","public domain","pd"]):continue
                found.append((info.get("thumburl") or info.get("url"),info.get("descriptionurl","")))
        except Exception as e:print(f"  Commons lookup issue {name}: {e}")
        time.sleep(.08)
    return found[:2]
def main():
    rows=read_campuses()
    results=[]
    generic=None
    # A common AIIMS emblem is kept as an honest visual fallback, not relabelled as a campus-specific logo.
    for url in ["https://aiimsexams.ac.in/images/logo.png","https://upload.wikimedia.org/wikipedia/commons/7/7e/AIIMS_New_Delhi.png"]:
        data=get_bytes(url)
        if data:
            fallback=OUT/"aiims-common-emblem.webp"
            if store_image(data,fallback):
                generic={"file":fallback.relative_to(ROOT).as_posix(),"source":url}
                break
    for name,site in rows:
        print(f"\n{name}")
        dest=OUT/(slug(name)+".webp")
        sources=[]
        if name in SEEDS:
            sources.extend((u,"seeded logo source") for u in SEEDS[name])
        for site_url in [site]+EXTRA_SITES.get(name,[]):
            sources.extend((u,"official institute homepage") for u in homepage_candidates(site_url)[:3])
        commons=[]
        sources.extend((u,src or "Wikimedia Commons file page") for u,src in [])
        chosen=None
        seen=set()
        for url,source in sources:
            if not url or url in seen:continue
            seen.add(url)
            data=get_bytes(url)
            if data and store_image(data,dest):
                chosen={"name":name,"file":dest.relative_to(ROOT).as_posix(),"source":source,"official_or_commons":source}
                break
        if chosen:
            print("  SAVED",chosen["file"])
            results.append(chosen)
        else:
            print("  NO campus-specific logo located; using common AIIMS emblem with name label")
            results.append({"name":name,"file":generic["file"] if generic else "","source":generic["source"] if generic else "",
                            "fallback":True})
    # Add the scrolling strip below the quote, inside the homepage hero.
    h=HTML.read_text(encoding="utf-8")
    marker='        <div class="hero-note"><span>✳</span><p id="homeMotivation">Not just a dream college.<br><em>A future you are building, one study session at a time.</em></p></div>'
    strip='''        <div class="aiims-logo-strip" aria-label="AIIMS institutes across India">
          <div class="logo-strip-heading"><span>THE AIIMS NETWORK</span><span>23 INSTITUTES · ONE DREAM</span></div>
          <div class="aiims-logo-viewport"><div class="aiims-logo-track" id="aiimsLogoTrack"></div></div>
        </div>'''
    if 'id="aiimsLogoTrack"' not in h:
        if marker not in h:raise RuntimeError("Homepage quote location not found")
        h=h.replace(marker,marker+"\n"+strip,1)
    # Use one local manifest-generated JS array and render a seamless duplicated marquee.
    a=APP.read_text(encoding="utf-8")
    if "var aiimsLogoItems=" in a:
        a=a[:a.index("var aiimsLogoItems=")]
    array_text="var aiimsLogoItems="+json.dumps(results,ensure_ascii=False)+";\n"
    render='''function renderAiimsLogoStrip(){
 var track=$('aiimsLogoTrack');if(!track)return;
 var items=aiimsLogoItems.filter(function(item){return !!item.file;});
 function makeLogo(item){
  var node=document.createElement('div');node.className='aiims-logo-item'+(item.fallback?' generic-logo':'');
  var img=document.createElement('img');img.src=item.file;img.alt=item.name+' logo';img.loading='eager';img.decoding='async';
  img.onerror=function(){node.classList.add('logo-missing');img.remove();};
  var name=document.createElement('span');name.textContent=item.name.replace('AIIMS ','');
  node.appendChild(img);node.appendChild(name);return node;
 }
 items.concat(items).forEach(function(item){track.appendChild(makeLogo(item));});
 track.setAttribute('aria-label',items.map(function(x){return x.name;}).join(', '));
}
renderAiimsLogoStrip();
'''
    a=a.rsplit("})();",1)[0]+ "\n"+array_text+render+"\n})();"
    APP.write_text(a,encoding="utf-8")
    (OUT/"logo-manifest.json").write_text(json.dumps(results,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    # Make all logos part of the service-worker cache and bump page asset versions.
    s=SW.read_text(encoding="utf-8")
    match=re.search(r"const CORE=\[(.*?)\];",s,re.S)
    if match:
        core=re.findall(r"""["']([^"']+)["']""",match.group(1))
        for item in results:
            if item.get("file"):
                token="./"+item["file"]
                if token not in core:core.append(token)
        s=s[:match.start()]+"const CORE=["+",".join(json.dumps(x) for x in core)+"];"+s[match.end():]
        s=re.sub(r"the-last-mile-v\d+","the-last-mile-v22",s,count=1)
        SW.write_text(s,encoding="utf-8")
    h=h.replace('assets/styles.css?v=20','assets/styles.css?v=22').replace('assets/app.js?v=20','assets/app.js?v=22')
    HTML.write_text(h,encoding="utf-8")
    print(f"\nAIIMS institutes in strip: {len(results)}")
    print(f"Campus-specific logo files: {sum(not x.get('fallback') for x in results)}")
    print(f"Common emblem fallbacks: {sum(bool(x.get('fallback')) for x in results)}")
if __name__=="__main__":main()
