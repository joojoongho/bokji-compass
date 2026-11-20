/* 복지나침반 v0.4 — client-only threshold comparison, NOT eligibility adjudication */
'use strict';
(function () {
  const $ = id => document.getElementById(id);
  const fmt = n => Math.round(n).toLocaleString('ko-KR') + '원';
  // Exact 2026 MOHW published figures for households of 1-6.
  const thresholds = {
    median: [2564238,4199292,5359036,6494738,7556719,8555952],
    livelihood: [820556,1343773,1714892,2078316,2418150,2737905],
    medical: [1025695,1679717,2143614,2597895,3022688,3422381],
    housing: [1230834,2015660,2572337,3117474,3627225,4106857],
    education: [1282119,2099646,2679518,3247369,3778360,4277976]
  };
  const basicProperty = { seoul: 99000000, gyeonggi: 80000000, metro: 77000000, other: 53000000 };
  const fields = ['aEarn','aBusiness','aOther','aHome','aProperty','aDeposit','aStocks','aInsurance','aCar','aDebt','aRecognized','aAge','aChildren'];
  const monetary = fields.filter(x => !['aAge','aChildren'].includes(x));
  const value = id => { const s = $(id).value.trim(); return s === '' ? null : Number(s); };
  const add = ids => ids.reduce((sum,id)=>sum+(value(id) || 0),0);
  const el = (tag, content, cls) => {const node=document.createElement(tag);if(cls)node.className=cls;if(content!==undefined)node.textContent=content;return node;};
  const append = (parent,tag,content,cls) => {let n=el(tag,content,cls);parent.append(n);return n;};
  const clearInput = () => { for (const id of fields) $(id).value=''; $('aHousehold').value='1';$('aRegion').value='';$('aOutput').replaceChildren( el('p','입력값을 지웠어. 이 페이지는 입력값을 별도 저장하지 않아.','help') ); };
  function renderAssessment(){
    for (const id of monetary){const n=value(id);if(n!==null&&(!Number.isSafeInteger(n)||n<0)){alert('금액은 0 이상의 정수로 입력해 줘: '+$(id).previousElementSibling.textContent);$(id).focus();return;}}
    for(const id of ['aAge','aChildren']){const n=value(id);if(n!==null&&(!Number.isSafeInteger(n)||n<0||(id==='aAge'&&n>120)||(id==='aChildren'&&n>20))){alert('나이와 자녀 수를 올바르게 입력해 줘.');$(id).focus();return;}}
    const household=Number($('aHousehold').value);const index=household-1;
    const income=add(['aEarn','aBusiness','aOther']);
    const assets=add(['aHome','aProperty','aDeposit','aStocks','aInsurance','aCar']);
    const debt=add(['aDebt']); const official=value('aRecognized');
    const out=$('aOutput');out.replaceChildren();
    append(out,'h3','입력정보 요약');
    const sums=append(out,'div',undefined,'totals');
    [['월 입력 소득 합계',fmt(income)],['입력 자산 합계',fmt(assets)],['입력 부채',fmt(debt)]].forEach(([label,amount])=>{const d=append(sums,'div');append(d,'span',label,'help');append(d,'strong',amount)});
    append(out,'p','자산과 부채의 단순 차액: '+fmt(assets-debt)+' · 이것은 소득인정액이 아니며, 부채 전액이 법적으로 인정되는 것도 아니야.','help');
    const region=$('aRegion').value;
    if(region)append(out,'p','참고: 이 지역의 기초생활보장 기본재산액 기준 '+fmt(basicProperty[region])+' (개별 재산 적용·공제순서 및 인정 여부 미반영)','help');
    const mid=thresholds.median[index];
    append(out,'h3','2026년 기초생활보장 선정기준');
    append(out,'p',household+'인 가구 기준 중위소득: '+fmt(mid)+' / 월. 아래 금액은 최종 수급 판정액이 아니라 공식 선정기준이야.','help');
    const data=[['생계급여 (32%)','livelihood'],['의료급여 (40%)','medical'],['주거급여 (48%)','housing'],['교육급여 (50%)','education']];
    for(const [name,key] of data){
      const limit=thresholds[key][index]; const card=append(out,'div',undefined,'criterion');
      append(card,'strong',name+' · '+fmt(limit)+' 이하');
      let status,cls,reason;
      if(official!==null){
        const pass=official<=limit;
        status=pass?'소득인정액 금액 기준 충족':'소득인정액 금액 기준 초과';cls=pass?'status ok':'status no';
        reason='입력한 공식 소득인정액 '+fmt(official)+'과 비교했어. '+(pass?'다른 요건 및 최신 행정자료 검증이 반드시 필요해.':'행정기관이 재산정한 소득인정액이나 특례가 있는 경우 결과가 달라질 수 있어.');
      }else{
        status='소득인정액 미산정 · 자격 확인 필요';cls='status';
        reason='입력 월소득 단순 합계 '+fmt(income)+' / 기준 '+fmt(limit)+'. 근로소득 공제·재산환산 등이 반영되지 않아 소득 합계만으로 판정할 수 없어.';
      }
      append(card,'div',status,cls);append(card,'p',reason);
    }
    const foot=append(out,'div',undefined,'notice');
    append(foot,'strong','최종 자격 판정이 아니야.');
    append(foot,'p','보장가구 범위, 근로소득 공제, 재산별 환산·공제, 자동차 특례, 교육급여의 학생 여부, 의료급여의 추가 조건 등은 별도 확인해야 해. 129 보건복지상담센터 또는 거주지 읍·면·동 행정복지센터에서 정확하게 상담받아 줘.');
    const link=append(out,'p',undefined,'help');const a=append(link,'a','보건복지부 공식 선정기준 확인 ↗');a.href='https://www.mohw.go.kr/menu.es?mid=a10708010300';a.target='_blank';a.rel='noopener noreferrer';
  }
  $('aCalc').addEventListener('click',renderAssessment);
  $('aClear').addEventListener('click',clearInput);
  // No localStorage, cookies, analytics or network requests are introduced by this module.
})();
