#!/usr/bin/env python3
"""Gov24 public-benefit open API -> static public JSON snapshot. Python stdlib only.
Never sends end-user profile; API key only read at build time.
"""
import argparse, datetime as dt, json, os, pathlib, re, sys, time, urllib.parse, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE='https://api.odcloud.kr/api/gov24/v3/serviceList'
OFFICIAL='https://www.data.go.kr/data/15113968/openapi.do'

def normalized(row):
    if not isinstance(row,dict): return None
    ident=str(row.get('서비스ID','')).strip(); name=str(row.get('서비스명','')).strip()
    if not ident or not name: return None
    def s(key): return str(row.get(key) or '').strip()[:3000]
    url=s('상세조회URL')
    if not url.startswith(('https://','http://')): url=''
    return {'id':'gov24:'+ident,'name':name,'provider':s('소관기관명'),
        'providerType':s('소관기관유형'),'category':s('서비스분야'),
        'audience':s('지원대상'),'criteria':s('선정기준'),
        'benefit':s('지원내용'),'apply':s('신청방법'),
        'deadline':s('신청기한'),'type':s('지원유형'),
        'modifiedAt':s('수정일시'),'sourceUrl':url or OFFICIAL,
        'source':'행정안전부 공공서비스(혜택) 정보','eligibilityStatus':'unverified'}

def extract(payload):
    if not isinstance(payload,dict): raise ValueError('JSON object required')
    rows=payload.get('data')
    if not isinstance(rows,list): raise ValueError('API payload needs data array')
    return rows, int(payload.get('totalCount',len(rows)))

def fetch_page(key,page,per_page):
    qs=urllib.parse.urlencode({'page':page,'perPage':per_page,'returnType':'JSON','serviceKey':key})
    req=urllib.request.Request(BASE+'?'+qs,headers={'User-Agent':'BokjiCompassCatalog/0.3','Accept':'application/json'})
    with urllib.request.urlopen(req,timeout=25) as res:
        if res.status != 200: raise RuntimeError('Unexpected HTTP '+str(res.status))
        raw=res.read(12_000_000)
    return extract(json.loads(raw))

def build_from_rows(rows,scope,expected_total=None):
    unique={}
    for r in rows:
        x=normalized(r)
        if x: unique[x['id']]=x
    if not unique: raise ValueError('No valid items; keeping previous snapshot')
    items=sorted(unique.values(), key=lambda x:x['id'])
    return {'schemaVersion':'0.3','generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),
        'status':'official_snapshot' if scope=='api' else 'demo_fixture',
        'coverage':'정부24 공공서비스 API 조회 결과 (실제 전체 포괄성 미검증)' if scope=='api' else '테스트용 가상 항목, 실제 복지제도 아님',
        'expectedTotal':expected_total,'count':len(items),'sourceUrl':OFFICIAL,'items':items}

def atomic_write(path,content):
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(content,ensure_ascii=False,indent=2),encoding='utf-8');tmp.replace(path)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--fixture',help='local API-style JSON fixture file');ap.add_argument('--max-pages',type=int,default=200);ap.add_argument('--per-page',type=int,default=100);args=ap.parse_args()
    if args.fixture:
        rows,total=extract(json.loads(pathlib.Path(args.fixture).read_text(encoding='utf-8')))
        snapshot=build_from_rows(rows,'fixture',total)
    else:
        key=os.getenv('GOV24_API_KEY','').strip()
        if not key: print('GOV24_API_KEY missing. Previous catalog unchanged.',file=sys.stderr);return 2
        if not (1<=args.per_page<=1000 and 1<=args.max_pages<=1000):raise ValueError('Invalid pagination bounds')
        rows=[];total=None;pages=0
        for page in range(1,args.max_pages+1):
            page_rows,page_total=fetch_page(key,page,args.per_page)
            if total is None: total=page_total
            if page_total!=total: raise ValueError('Total count changed during sync; retry later')
            if not page_rows: break
            rows.extend(page_rows);pages+=1
            if len(rows)>=total:break
            time.sleep(.25)
        if len(rows)<total:raise ValueError(f'Incomplete fetch {len(rows)}/{total}; previous snapshot preserved')
        snapshot=build_from_rows(rows,'api',total)
        if snapshot['count']<max(1,int(total*.80)):raise ValueError('Too many items missing IDs; previous snapshot preserved')
    target=ROOT/'public/data/catalog.json';atomic_write(target,snapshot)
    print(f"Saved {snapshot['count']} records ({snapshot['status']}) into {target}")
    return 0
if __name__=='__main__':sys.exit(main())
