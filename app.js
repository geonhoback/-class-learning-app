/* ---------- 카테고리 정의 ---------- */
const CATS = {
  task:     {label:'수행평가', short:'수',  color:'var(--blue)',   cls:'cat-task',   emoji:'🔵'},
  exam:     {label:'지필고사', short:'지',  color:'var(--red)',    cls:'cat-exam',   emoji:'🔴'},
  homework: {label:'숙제',     short:'숙',  color:'var(--green)',  cls:'cat-homework', emoji:'🟢'},
  notice:   {label:'공지',     short:'공지', cls:'cat-notice', emoji:'🟠'},
  school:   {label:'학사일정', short:'학사', cls:'cat-school', emoji:'🟣'},
  etc:      {label:'기타',     short:'기타', cls:'cat-etc', emoji:'🟡'}
};

/* ---------- 테스트 데이터 (Supabase 미설정 시 자동으로 보여줄 샘플) ---------- */
function iso(offsetDays){
  const d = new Date();
  d.setDate(d.getDate()+offsetDays);
  return d.toISOString().slice(0,10);
}
const SAMPLE_SCHEDULES = [
  {id:'s1', category:'task', subject:'과학', title:'과학 수행평가', date:iso(4), detail:{내용:'교과서 78~95쪽 범위, 실험 보고서 형식으로 정리'}},
  {id:'s2', category:'exam', subject:'수학', title:'수학 지필고사', date:iso(5), detail:{내용:'1~3단원 전체, 서술형 3문항 포함'}},
  {id:'s3', category:'homework', subject:'영어', title:'영어 숙제', date:iso(1), detail:{내용:'workbook 34~36쪽 풀어오기'}},
  {id:'s4', category:'notice', subject:'', title:'준비물 안내', date:iso(2), detail:{내용:'체육 시간에 체육복을 꼭 챙겨오세요.'}},
  {id:'s5', category:'school', subject:'', title:'체험학습', date:iso(9), detail:{내용:'과학관 체험학습, 도시락 지참'}},
  {id:'s6', category:'task', subject:'국어', title:'국어 수행평가', date:iso(7), detail:{내용:'자작시 1편 제출 및 낭독 발표'}},
  {id:'s7', category:'homework', subject:'역사', title:'역사 유인물 제출', date:iso(3), detail:{내용:'근현대사 정리 유인물 작성 후 제출'}},
  {id:'s8', category:'etc', subject:'', title:'학급 사진 촬영', date:iso(12), detail:{내용:'단체 사진 촬영이 있으니 교복 단정하게 착용'}},
  {id:'s9', category:'exam', subject:'영어', title:'영어 지필고사', date:iso(-2), detail:{내용:'지난 시험, 결과는 다음 주 공지'}},
];
const SAMPLE_NOTICES = [
  {id:'n1', title:'2학기 중간고사 안내', content:'2학기 중간고사는 10월 셋째 주에 진행됩니다. 시험 범위는 각 과목 선생님께서 순차적으로 안내해 주실 예정이니 학급 게시판을 꼭 확인하세요.', author:'담임 선생님', date:iso(-1), important:true},
  {id:'n2', title:'체험학습 사전 안내', content:'다음 주 체험학습 관련 가정통신문을 배부했습니다. 동의서는 이번 주 금요일까지 제출해 주세요.', author:'회장', date:iso(-2), important:true},
  {id:'n3', title:'분리수거 당번 교체', content:'이번 주 분리수거 당번이 2분단으로 변경되었습니다.', author:'회장', date:iso(-3), important:false},
  {id:'n4', title:'교실 청소 구역 안내', content:'이번 달 청소 구역표를 게시판에 붙여두었습니다. 확인 후 각자 구역을 지켜주세요.', author:'담임 선생님', date:iso(-5), important:false},
];
const SAMPLE_MATERIALS = [
  {id:'m1', category:'note', subject:'과학', title:'3단원 화학 반응 정리 노트', desc:'화학 반응식과 예시 문제를 깔끔하게 정리한 필기 사진입니다.', author:'김서연', date:iso(-2), icon:'📝'},
  {id:'m2', category:'worksheet', subject:'역사', title:'근현대사 정리 유인물', desc:'선생님이 나눠주신 근현대사 흐름 정리 프린트입니다.', author:'담임 선생님', date:iso(-4), icon:'📄'},
  {id:'m3', category:'study', subject:'수학', title:'지필고사 시험범위 정리', desc:'1~3단원 핵심 공식과 자주 나오는 문제 유형 정리.', author:'박도윤', date:iso(-1), icon:'📚'},
  {id:'m4', category:'study', subject:'영어', title:'단어 암기 리스트', desc:'이번 단원 필수 영단어 암기 자료입니다.', author:'이하은', date:iso(-6), icon:'📚'},
  {id:'m5', category:'note', subject:'국어', title:'시 단원 필기', desc:'수행평가 관련 시 단원 핵심 필기 사진 자료.', author:'최민준', date:iso(-3), icon:'📝'},
];

/* Supabase에서 불러온 실제 데이터가 들어갈 자리 (없으면 샘플로 대체됨) */
let SCHEDULES = [];
let NOTICES = [];
let MATERIALS = [];
let usingSampleData = false;

/* ---------- Supabase 행 -> 화면 표시용 형태로 변환 ---------- */
const MAT_ICON = {note:'📝', worksheet:'📄', study:'📚'};
function normalizeSchedule(row){
  const detail = {};
  if(row.description) detail['내용'] = row.description;
  if(row.location) detail['장소'] = row.location;
  if(row.start_time) detail['시간'] = row.start_time + (row.end_time ? ' ~ '+row.end_time : '');
  return {id:row.id, category:row.category, subject:row.subject||'', title:row.title, date:row.date, detail, attachment_url:row.attachment_url};
}
function normalizeNotice(row){
  return {id:row.id, title:row.title, content:row.content, author:(row.profiles && row.profiles.name) || '관리자', date:(row.created_at||'').slice(0,10), important:!!row.is_important, attachment_url:row.attachment_url};
}
function normalizeMaterial(row){
  return {id:row.id, category:row.category, subject:row.subject||'', title:row.title, desc:row.description||'', author:(row.profiles && row.profiles.name) || '관리자', date:(row.created_at||'').slice(0,10), icon:MAT_ICON[row.category]||'📚', file_url:row.file_url};
}

/* ---------- 데이터 불러오기 (Supabase 우선, 실패 시 샘플 데이터) ---------- */
async function loadData(){
  const [rawSchedules, rawNotices, rawMaterials] = await Promise.all([
    fetchSchedules(), fetchNotices(), fetchMaterials()
  ]);
  usingSampleData = (rawSchedules===null || rawNotices===null || rawMaterials===null);
  SCHEDULES = rawSchedules ? rawSchedules.map(normalizeSchedule) : SAMPLE_SCHEDULES;
  NOTICES   = rawNotices   ? rawNotices.map(normalizeNotice)     : SAMPLE_NOTICES;
  MATERIALS = rawMaterials ? rawMaterials.map(normalizeMaterial) : SAMPLE_MATERIALS;
}

/* ---------- 상태 ---------- */
let calCursor = new Date();
let weekCursor = new Date();
let activeFilter = 'all';
let activeMatFilter = 'all';

/* ---------- 유틸 ---------- */
function todayStr(){ return new Date().toISOString().slice(0,10); }
function fmtDate(dstr){
  const d = new Date(dstr+'T00:00:00');
  return `${d.getMonth()+1}월 ${d.getDate()}일`;
}
function ddayLabel(dstr){
  const t = new Date(todayStr()+'T00:00:00');
  const d = new Date(dstr+'T00:00:00');
  const diff = Math.round((d-t)/86400000);
  if(diff===0) return {text:'D-DAY', today:true};
  if(diff>0) return {text:'D-'+diff, today:false};
  return null;
}
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ---------- 네비게이션 ---------- */
function goPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.page===name));
  window.scrollTo(0,0);
}

/* ---------- 헤더 ---------- */
function renderHeader(){
  const d = new Date();
  const days = ['일','월','화','수','목','금','토'];
  document.getElementById('todayPill').textContent = `${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

/* ---------- 오늘 카드 ---------- */
function renderTodayCard(){
  const today = todayStr();
  const todays = SCHEDULES.filter(s=>s.date===today);
  const box = document.getElementById('todayCard');
  const d = new Date();
  const days = ['일','월','화','수','목','금','토'];
  let html = `<div class="today-card-label">오늘 · ${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]})</div>`;
  if(todays.length===0){
    html += `<div class="today-card-title">오늘은 등록된 일정이 없어요 🙌</div><div class="today-empty">편하게 하루를 보내세요.</div>`;
  } else {
    html += `<div class="today-card-title">오늘 챙겨야 할 일이 ${todays.length}개 있어요</div><div class="today-chip-row">`;
    todays.forEach(s=>{
      html += `<span class="today-chip">${CATS[s.category].emoji} ${s.title}</span>`;
    });
    html += `</div>`;
  }
  box.innerHTML = html;
}

/* ---------- 월간 달력 ---------- */
function shiftMonth(n){ calCursor.setMonth(calCursor.getMonth()+n); renderCalendar(); }
function renderCalendar(){
  const y = calCursor.getFullYear(), m = calCursor.getMonth();
  document.getElementById('calMonthLabel').textContent = `${y}년 ${m+1}월`;
  const first = new Date(y,m,1);
  const startDow = first.getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();
  const grid = document.getElementById('calDays');
  grid.innerHTML = '';
  for(let i=0;i<startDow;i++){
    const c = document.createElement('div');
    c.className='cal-cell empty';
    grid.appendChild(c);
  }
  const today = todayStr();
  for(let day=1; day<=daysInMonth; day++){
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const events = SCHEDULES.filter(s=>s.date===dateStr);
    const cell = document.createElement('div');
    cell.className = 'cal-cell' + (dateStr===today?' today':'') + (events.length?' has-events':'');
    let inner = `<div class="dnum">${day}</div>`;
    events.slice(0,2).forEach(ev=>{
      inner += `<div class="cal-tag ${CATS[ev.category].cls}">${CATS[ev.category].emoji}${CATS[ev.category].short}</div>`;
    });
    if(events.length>2) inner += `<div class="cal-more">+${events.length-2}</div>`;
    cell.innerHTML = inner;
    if(events.length){
      cell.onclick = ()=>openDaySheet(dateStr, events);
    } else {
      cell.onclick = ()=>openDaySheet(dateStr, []);
    }
    grid.appendChild(cell);
  }
}

/* ---------- 날짜 클릭 -> 상세 시트 ---------- */
function openDaySheet(dateStr, events){
  const sheet = document.getElementById('sheet');
  let html = `<button class="sheet-close" onclick="closeSheet()">✕</button><div class="sheet-handle"></div>`;
  html += `<h3>${fmtDate(dateStr)}</h3><div class="sheet-date">${new Date(dateStr+'T00:00:00').getFullYear()}년</div>`;
  if(events.length===0){
    html += `<div class="empty-state" style="padding:30px 10px;"><div class="es-icon">🗓️</div><div class="es-text">이 날은 등록된 일정이 없어요</div></div>`;
  } else if(events.length===1){
    html += renderEventDetail(events[0]);
  } else {
    html += `<div class="day-events-list">`;
    events.forEach(ev=>{
      html += `<div class="day-event-row" onclick='openEventSheet(${ev.id})'>
        <span class="dot" style="background:${CATS[ev.category].color}"></span>
        <span class="txt">${CATS[ev.category].emoji} ${ev.title}</span>
        <span style="color:var(--ink-faint)">›</span>
      </div>`;
    });
    html += `</div>`;
  }
  sheet.innerHTML = html;
  document.getElementById('overlay').classList.add('show');
}
function openEventSheet(id){
  const ev = SCHEDULES.find(s=>s.id===id);
  const sheet = document.getElementById('sheet');
  let html = `<button class="sheet-close" onclick="closeSheet()">✕</button><div class="sheet-handle"></div>`;
  html += `<h3>${fmtDate(ev.date)}</h3><div class="sheet-date">${ev.subject?ev.subject+' · ':''}${CATS[ev.category].label}</div>`;
  html += renderEventDetail(ev);
  sheet.innerHTML = html;
}
function renderEventDetail(ev){
  const c = CATS[ev.category];
  let html = `<div class="sheet-cat-badge" style="background:var(--${{task:'blue',exam:'red',homework:'green',notice:'orange',school:'purple',etc:'yellow'}[ev.category]}-bg); color:${c.color}">${c.emoji} ${c.label}${ev.subject?' · '+ev.subject:''}</div>`;
  html += `<div class="sheet-field"><div class="f-value" style="font-weight:700; font-size:15.5px;">${ev.title}</div></div>`;
  for(const [k,v] of Object.entries(ev.detail||{})){
    html += `<div class="sheet-field"><div class="f-label">${k}</div><div class="f-value">${v}</div></div>`;
  }
  html += `<div class="sheet-actions">
    <button onclick="showToast('첨부된 유인물이 없어요')">📎 유인물 보기</button>
    <button onclick="goPage('study'); closeSheet();">📝 관련 학습자료 보기</button>
  </div>`;
  return html;
}
function closeSheet(){ document.getElementById('overlay').classList.remove('show'); }

/* ---------- 주간 플래너 ---------- */
function getWeekStart(d){
  const nd = new Date(d);
  nd.setDate(nd.getDate() - nd.getDay());
  nd.setHours(0,0,0,0);
  return nd;
}
function shiftWeek(n){ weekCursor.setDate(weekCursor.getDate()+7*n); renderWeek(); }
function renderWeek(){
  const start = getWeekStart(weekCursor);
  const end = new Date(start); end.setDate(end.getDate()+6);
  document.getElementById('weekRangeLabel').textContent =
    `${start.getMonth()+1}/${start.getDate()} ~ ${end.getMonth()+1}/${end.getDate()}`;
  const days = ['일','월','화','수','목','금','토'];
  const today = todayStr();
  const list = document.getElementById('weekList');
  list.innerHTML = '';
  for(let i=0;i<7;i++){
    const d = new Date(start); d.setDate(d.getDate()+i);
    const dstr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const events = SCHEDULES.filter(s=>s.date===dstr);
    const row = document.createElement('div');
    row.className = 'week-day' + (dstr===today?' today':'');
    let inner = `<div class="wd-date"><div class="wd-dow">${days[d.getDay()]}</div><div class="wd-num">${d.getDate()}</div></div><div class="week-day-events">`;
    if(events.length===0){
      inner += `<div class="we-empty">일정 없음</div>`;
    } else {
      events.forEach(ev=>{
        inner += `<div class="we-item"><span class="we-dot" style="background:${CATS[ev.category].color}"></span>${ev.title}</div>`;
      });
    }
    inner += `</div>`;
    row.innerHTML = inner;
    row.onclick = ()=>openDaySheet(dstr, events);
    list.appendChild(row);
  }
}

/* ---------- 전체 일정 목록 + 필터 ---------- */
function renderFilterRow(){
  const row = document.getElementById('filterRow');
  const opts = [['all','전체'],['task','수행'],['exam','지필'],['homework','숙제'],['notice','공지'],['school','학사']];
  row.innerHTML = opts.map(([k,label])=>
    `<button class="chip ${activeFilter===k?'active':''}" onclick="setFilter('${k}')">${label}</button>`
  ).join('');
}
function setFilter(k){ activeFilter=k; renderFilterRow(); renderScheduleList(); }
function renderScheduleList(){
  const listEl = document.getElementById('scheduleList');
  let items = [...SCHEDULES].sort((a,b)=>a.date.localeCompare(b.date));
  if(activeFilter!=='all') items = items.filter(s=>s.category===activeFilter);
  if(items.length===0){
    listEl.innerHTML = `<div class="empty-state"><div class="es-icon">🔍</div><div class="es-text">해당하는 일정이 없어요</div></div>`;
    return;
  }
  listEl.innerHTML = items.map(ev=>{
    const dd = ddayLabel(ev.date);
    const c = CATS[ev.category];
    return `<div class="list-card" onclick="openDaySheet('${ev.date}', SCHEDULES.filter(s=>s.date==='${ev.date}'))">
      <div class="lc-top">
        <span class="lc-badge" style="background:var(--${{task:'blue',exam:'red',homework:'green',notice:'orange',school:'purple',etc:'yellow'}[ev.category]}-bg); color:${c.color}">${c.emoji} ${c.label}</span>
        ${dd? `<span class="dday ${dd.today?'today':''}">${dd.text}</span>` : ''}
      </div>
      <div class="lc-title">${ev.title}${ev.subject?' · '+ev.subject:''}</div>
      <div class="lc-meta">${fmtDate(ev.date)}</div>
    </div>`;
  }).join('');
}

/* ---------- 공지사항 ---------- */
function renderNotices(){
  const el = document.getElementById('noticeList');
  const sorted = [...NOTICES].sort((a,b)=> (b.important-a.important) || b.date.localeCompare(a.date));
  if(sorted.length===0){
    el.innerHTML = `<div class="empty-state"><div class="es-icon">📢</div><div class="es-text">등록된 공지가 없어요</div></div>`;
    return;
  }
  el.innerHTML = sorted.map(n=>{
    const typeBadge = n.type==='teacher' ? `<span class="lc-badge b-teacher">📢 담임 선생님</span>`
      : n.type==='class' ? `<span class="lc-badge b-class">📌 학급 공지</span>`
      : `<span class="lc-badge b-important">⚠️ 중요 공지</span>`;
    return `<div class="list-card ${n.important?'pinned':''}" onclick="openNoticeSheet(${n.id})">
      <div class="lc-top">${n.important?'<span class="lc-pin">📌</span>':''}${typeBadge}</div>
      <div class="lc-title">${n.title}</div>
      <div class="lc-desc">${n.content}</div>
      <div class="lc-meta">${n.author} · ${fmtDate(n.date)}</div>
    </div>`;
  }).join('');
}
function openNoticeSheet(id){
  const n = NOTICES.find(x=>x.id===id);
  const sheet = document.getElementById('sheet');
  sheet.innerHTML = `<button class="sheet-close" onclick="closeSheet()">✕</button><div class="sheet-handle"></div>
    <h3>${n.title}</h3>
    <div class="sheet-date">${n.author} · ${fmtDate(n.date)}</div>
    <div class="sheet-field"><div class="f-value">${n.content}</div></div>
    <div class="sheet-actions"><button onclick="showToast('첨부파일이 없어요')">📎 첨부파일 보기</button></div>`;
  document.getElementById('overlay').classList.add('show');
}

/* ---------- 학습도우미 ---------- */
function renderMaterialFilterRow(){
  const row = document.getElementById('materialFilterRow');
  const opts = [['all','전체'],['note','노트필기'],['worksheet','유인물'],['study','학습자료']];
  row.innerHTML = opts.map(([k,label])=>
    `<button class="chip ${activeMatFilter===k?'active':''}" onclick="setMatFilter('${k}')">${label}</button>`
  ).join('');
}
function setMatFilter(k){ activeMatFilter=k; renderMaterialFilterRow(); renderMaterials(); }
function renderMaterials(){
  const q = document.getElementById('materialSearch').value.trim().toLowerCase();
  let items = [...MATERIALS];
  if(activeMatFilter!=='all') items = items.filter(m=>m.category===activeMatFilter);
  if(q) items = items.filter(m => (m.subject+m.title+m.desc).toLowerCase().includes(q));
  const el = document.getElementById('materialList');
  if(items.length===0){
    el.innerHTML = `<div class="empty-state"><div class="es-icon">🔍</div><div class="es-text">검색 결과가 없어요</div></div>`;
    return;
  }
  el.innerHTML = items.map(m=>`
    <div class="list-card mat-card" onclick="openLightbox('${m.title}')">
      <div class="mat-thumb">${m.icon}</div>
      <div class="mat-body">
        <div class="lc-top"><span class="lc-badge b-class">${m.subject}</span></div>
        <div class="lc-title">${m.title}</div>
        <div class="lc-desc">${m.desc}</div>
        <div class="lc-meta">${m.author} · ${fmtDate(m.date)}</div>
      </div>
    </div>`).join('');
}
function openLightbox(title){
  // 데모 버전이라 실제 이미지 대신 안내만 표시
  showToast(`'${title}' 이미지를 확대해서 보여줘요 (Storage 연동 후 실제 이미지 표시)`);
}
function closeLightbox(){ document.getElementById('lightbox').classList.remove('show'); }

/* ---------- 초기화 ---------- */
async function init(){
  renderHeader();
  await loadData();
  renderTodayCard();
  renderCalendar();
  renderFilterRow();
  renderScheduleList();
  renderWeek();
  renderNotices();
  renderMaterialFilterRow();
  renderMaterials();
  const badge = document.getElementById('testDataBadge');
  if(badge) badge.style.display = usingSampleData ? '' : 'none';
  if(usingSampleData){
    showToast('Supabase 미설정 - 테스트 데이터로 표시 중이에요');
  }
}
window.addEventListener('scroll', ()=>{
  document.getElementById('header').classList.toggle('scrolled', window.scrollY>4);
});
init();
