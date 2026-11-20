/* Region-scoped discovery only: never infer eligibility from mentions in benefit copy. */
(function(root,factory){ const api=factory(); if(typeof module==='object'&&module.exports) module.exports=api; if(root) root.BokjiGeo=api; })(typeof window!=='undefined'?window:null,function(){
'use strict';
const provinces=['서울특별시','부산광역시','대구광역시','인천광역시','광주광역시','대전광역시','울산광역시','세종특별자치시','경기도','강원특별자치도','충청북도','충청남도','전북특별자치도','전라남도','경상북도','경상남도','제주특별자치도'];
const gyeonggiCities=new Set('수원시 성남시 용인시 고양시 화성시 안산시 안양시 평택시 시흥시 김포시 파주시 의정부시 광주시 광명시 군포시 하남시 오산시 이천시 안성시 구리시 의왕시 양주시 포천시 동두천시 과천시 여주시 남양주시 부천시 양평군 가평군 연천군'.split(' '));
const aliases={'강원도':'강원특별자치도','전라북도':'전북특별자치도','제주특별자치도':'제주특별자치도','세종시':'세종특별자치시'};
const allNames=[...provinces,...Object.keys(aliases)].sort((a,b)=>b.length-a.length);
const clean=x=>String(x||'').normalize('NFKC').replace(/\s+/g,'').trim();
const canonical=x=>aliases[x]||x;
function regionInAuthority(s){for(const a of allNames) if(s.includes(clean(a)))return canonical(a);return '';}
function jurisdiction(item){
 const provider=clean(item.provider),type=clean(item.providerType);
 const province=regionInAuthority(provider);
 // Do not turn an unrelated mention of a city in description into service jurisdiction.
 let tail=provider;
 for(const name of allNames) tail=tail.split(clean(name)).join('');
 // City/county/district authorities: municipal government or municipality-specific provider.
 const matches=[...tail.matchAll(/([가-힣]{2,}(?:시|군|구))(?=$|청|의회|보건소|행정복지센터|주민센터|교육지원청|\d|[\s])/g)].map(x=>x[1]);
 const units=matches.filter(x=>!['광역시','특별시','자치시','특례시'].includes(x));
 if(units.length) return {level:'local',province:province||(units.some(u=>gyeonggiCities.has(u))?'경기도':''),units,provider};
 if(type.includes('중앙부처'))return {level:'national',province:'',units:[],provider};
 // Known nationally administered public services may be enriched by a *verified* scope field in the future.
 if(province){
   const provincial=type.includes('광역')||/^(경기도|서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|강원특별자치도|충청북도|충청남도|전북특별자치도|전라남도|경상북도|경상남도|제주특별자치도)(청|의회)?$/.test(provider);
   return {level:provincial?'province':'unknown',province,units:[],provider};
 }
 // A provider called "경기도청" is province, while an unspecified provider cannot be treated as nationwide.
 return {level:'unknown',province:'',units:[],provider};
}
function classify(item,region,district){
 const r=clean(region),d=clean(district),j=jurisdiction(item);
 if(!r&&!d)return {status:'match',scope:'all'};
 if(!r&&d)return {status:'unknown',scope:'select-province'};
 if(j.level==='national')return {status:'match',scope:'national'};
 if(j.province&&j.province!==r)return {status:'exclude',scope:'another-province'};
 if(j.level==='province')return {status:'match',scope:'province'};
 if(j.level==='local'){
   if(!d)return {status:'exclude',scope:'requires-city'};
   // If province is not stated in the authority, a same-named municipality can be ambiguous.
   if(!j.province)return {status:j.units.includes(d)?'unknown':'exclude',scope:'unverified-local-province'};
   return {status:j.units.includes(d)?'match':'exclude',scope:'city'};
 }
 return {status:'unknown',scope:'unknown-jurisdiction'};
}
return {jurisdiction,classify};
});
