#!/usr/bin/env python3
"""Find, license-check, download and index up to ten local photos per AIIMS."""
from __future__ import annotations
import hashlib, html, io, json, re, time
from pathlib import Path
import requests
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parents[2]
APP=ROOT/"assets/app.js"
OUT=ROOT/"assets/campuses"
OUT.mkdir(parents=True,exist_ok=True)
API="https://commons.wikimedia.org/w/api.php"
S=requests.Session()
S.headers.update({"User-Agent":"TheLastMileNEET/1.0 (campus photo gallery; contact via GitHub repository)","Accept":"application/json"})
def slug(s):
    return re.sub(r"[^a-z0-9]+","-",s.lower()).strip("-")
def plain(v):
    return re.sub("<[^>]+>","",html.unescape(v or "")).strip()
def commons_search(query):
    params={"action":"query","format":"json","generator":"search","gsrnamespace":6,"gsrlimit":40,
            "gsrsearch":query,"prop":"imageinfo","iiprop":"url|size|mime|extmetadata","iiurlwidth":1800}
    try:
        data=S.get(API,params=params,timeout=40).json()
        pages=list((data.get("query",{}).get("pages",{})).values())
        return pages
    except Exception as e:
        print("Commons search issue:",query,str(e))
        return []
def download(page,dest):
    info=(page.get("imageinfo") or [{}])[0]
    meta=info.get("extmetadata",{})
    license_name=plain(meta.get("LicenseShortName",{}).get("value",""))
    usage=plain(meta.get("UsageTerms",{}).get("value",""))
    artist=plain(meta.get("Artist",{}).get("value",""))
    credit=plain(meta.get("Credit",{}).get("value",""))
    # Only Commons public-domain or Creative Commons licensed files.
    lic=(license_name+" "+usage).lower()
    if not any(x in lic for x in ("cc0","cc by","cc-by","cc by-sa","cc-by-sa","public domain","pd")):
        return None
    url=info.get("thumburl") or info.get("url")
    if not url or not info.get("mime","").startswith("image/"):
        return None
    try:
        resp=S.get(url,timeout=50); resp.raise_for_status()
        im=ImageOps.exif_transpose(Image.open(io.BytesIO(resp.content))).convert("RGB")
        if im.width<600 or im.height<350: return None
        im.thumbnail((1800,1200),Image.Resampling.LANCZOS)
        im.save(dest,"WEBP",quality=84,method=6)
        if dest.stat().st_size<5000:
            dest.unlink(missing_ok=True); return None
        return {"file":dest.relative_to(ROOT).as_posix(),"source":info.get("descriptionurl",""),
                "license":license_name or usage,"artist":artist or credit,
                "title":plain(page.get("title",""))}
    except Exception as e:
        print("Image download failed:",page.get("title"),str(e))
        return None

def main():
    source=APP.read_text(encoding="utf-8")
    start=source.index("var campuses=["); end=source.index("\n];",start)
    block=source[start:end]
    pattern=re.compile(r"\{name:'([^']+)'([^}]*)\}")
    records=list(pattern.finditer(block))
    if len(records)!=23: raise SystemExit(f"Expected 23 AIIMS, found {len(records)}")
    changes=[]
    full_manifest=[]
    shortfalls=[]
    for m in records:
        name,fields=m.group(1),m.group(2)
        photo=re.search(r"photo:'([^']+)'",fields)
        if not photo: continue
        first=photo.group(1)
        slugname=slug(name)
        photos=[]
        # Keep the already-vetted local lead image as slot 1.
        if (ROOT/first).exists():
            photos.append({"file":first,"source":"","license":"Existing site image","artist":"","title":name+" (existing lead image)"})
        city=name.replace("AIIMS ","").replace(" (Jammu)"," Jammu")
        queries=[f'"{name}"',f'"All India Institute of Medical Sciences" "{city}"',f'{city} AIIMS campus hospital India']
        seen=set()
        for query in queries:
            if len(photos)>=10: break
            for page in commons_search(query):
                if len(photos)>=10: break
                info=(page.get("imageinfo") or [{}])[0]
                key=info.get("url") or page.get("title")
                if not key or key in seen: continue
                seen.add(key)
                idx=len(photos)+1
                dest=OUT/f"{slugname}-{idx:02d}.webp"
                item=download(page,dest)
                if item:
                    photos.append(item)
                    print(f"OK {name}: {len(photos)}/10 — {item['title']} [{item['license']}]")
            time.sleep(0.15)
        if len(photos)<10:
            shortfalls.append((name,len(photos)))
            print(f"SHORTFALL {name}: {len(photos)}/10")
        full_manifest.append({"campus":name,"photos":photos})
        if photos:
            encoded=json.dumps([p["file"] for p in photos],ensure_ascii=False)
            obj=m.group(0)
            if re.search(r",photos:\[[^]]*\]",obj):
                obj=re.sub(r",photos:\[[^]]*\]",",photos:"+encoded,obj,count=1)
            else:
                obj=obj[:-1]+",photos:"+encoded+"}"
            changes.append((start+m.start(),start+m.end(),obj))
    for a,b,val in sorted(changes,reverse=True):
        source=source[:a]+val+source[b:]
    APP.write_text(source,encoding="utf-8")
    manifest_path=OUT/"photo-manifest.json"
    manifest_path.write_text(json.dumps(full_manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    # Update all local photo paths in service-worker precache.
    sw=ROOT/"sw.js"
    if sw.exists():
        s=sw.read_text(encoding="utf-8")
        match=re.search(r"const CORE=\[(.*?)\];",s,re.S)
        if match:
            existing=re.findall(r"""["']([^"']+)["']""",match.group(1))
            allfiles={p["file"] for c in full_manifest for p in c["photos"]}
            for f in sorted(allfiles):
                token="./"+f
                if token not in existing: existing.append(token)
            s=s[:match.start()]+"const CORE=["+",".join(json.dumps(x) for x in existing)+"];"+s[match.end():]
            s=re.sub(r"the-last-mile-v\d+","the-last-mile-v15",s,count=1)
            sw.write_text(s,encoding="utf-8")
    index=ROOT/"index.html"
    if index.exists():
        s=index.read_text(encoding="utf-8")
        s=re.sub(r"(styles\.css\?v=)\d+",r"\g<1>15",s)
        s=re.sub(r"(app\.js\?v=)\d+",r"\g<1>15",s)
        index.write_text(s,encoding="utf-8")
    print(f"\nAIIMS with exactly 10 photos: {sum(len(c['photos'])==10 for c in full_manifest)}/23")
    print(f"Total local photos: {sum(len(c['photos']) for c in full_manifest)}")
    if shortfalls:
        print("CAMPUS PHOTO SHORTFALLS:")
        for name,count in shortfalls: print(f"- {name}: {count}/10")
if __name__=="__main__": main()
