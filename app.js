/* StudyMate Final — local-first NEET analysis app. */
const pdfjsLib = window.pdfjsLib || null;
const $ = id => document.getElementById(id);
const SCREENS = ['home','practice','reports','history','about','analysis','summary','result','settings','planner','todo','daySummary','mistakeNotebook','nextTest','ncert','goals','comparison','revision','weakness','studymate'];
const SUBJECTS = ['Physics','Chemistry','Botany','Zoology'];
const SYLLABUS = {
 Physics:['Physical World and Measurement','Motion in a Straight Line','Motion in a Plane','Laws of Motion','Work, Energy, and Power','System of Particles and Rotational Motion','Gravitation','Mechanical Properties of Solids','Mechanical Properties of Fluids','Thermal Properties of Matter','Thermodynamics','Kinetic Theory of Gases','Oscillations','Waves','Electric Charges and Fields','Electrostatic Potential and Capacitance','Current Electricity','Moving Charges and Magnetism','Magnetism and Matter','Electromagnetic Induction','Alternating Current','Electromagnetic Waves','Ray Optics and Optical Instruments','Wave Optics','Dual Nature of Radiation and Matter','Atoms','Nuclei','Semiconductor Electronics: Materials, Devices, and Simple Circuits','Experimental Skills'],
 Chemistry:['Some Basic Concepts of Chemistry','Structure of Atom','Classification of Elements and Periodicity in Properties','Chemical Bonding and Molecular Structure','Chemical Thermodynamics','Equilibrium','Redox Reactions','Solutions','Electrochemistry','Chemical Kinetics','d- and f-Block Elements','Coordination Compounds','Purification and Characterization of Organic Compounds','Some Basic Principles of Organic Chemistry (GOC)','Hydrocarbons','Haloalkanes and Haloarenes','Alcohols, Phenols, and Ethers','Aldehydes, Ketones, and Carboxylic Acids','Organic Compounds Containing Nitrogen (Amines)','Biomolecules','Principles Related to Practical Chemistry'],
 Botany:['The Living World','Biological Classification','Plant Kingdom','Morphology of Flowering Plants','Anatomy of Flowering Plants','Cell: The Unit of Life','Cell Cycle and Cell Division','Photosynthesis in Higher Plants','Respiration in Plants','Plant Growth and Development','Sexual Reproduction in Flowering Plants','Principles of Inheritance and Variation','Molecular Basis of Inheritance','Microbes in Human Welfare','Biotechnology: Principles and Processes','Biotechnology and its Applications','Organisms and Populations','Ecosystem','Biodiversity and Conservation'],
 Zoology:['Animal Kingdom','Structural Organisation in Animals (Animal Tissues & Cockroach/Frog)','Biomolecules','Breathing and Exchange of Gases','Body Fluids and Circulation','Excretory Products and their Elimination','Locomotion and Movement','Neural Control and Coordination','Chemical Coordination and Integration','Human Reproduction','Reproductive Health','Evolution','Human Health and Disease']
};
const state={test:null,pdf:null,pdfFile:null,current:0,questions:[],questionMap:new Map(),selectedSubject:'Physics',resultRecord:null,practiceQuiz:null,mockConfig:null};
const LS={history:'studymate_history_final',security:'studymate_security_v1',practice:'studymate_practice_v1'};
localStorage.setItem('studymate_prep_mode','Yakeen NEET 2.0 2027');
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2200)}
function showScreen(name){SCREENS.forEach(s=>$(s+'Screen')?.classList.toggle('active',s===name));document.querySelectorAll('.nav-btn,[data-screen]').forEach(b=>b.classList.toggle('active',b.dataset.screen===name));if(name==='home')refreshHome();if(name==='history')renderHistory();if(name==='reports')renderReports();if(name==='settings')renderSettings();if(name==='daySummary')renderDaySummary();if(name==='mistakeNotebook')renderMistakeNotebook();if(name==='planner')renderSuccessPlanner();if(name==='nextTest')renderNextTest();if(name==='ncert')renderNcert?.();if(name==='goals')renderDailyGoals();if(name==='comparison')renderTestComparison();if(name==='revision')renderIntelligentRevision();if(name==='weakness')renderSmartWeakness();if(name==='studymate')renderPersonalStudyMate();}
document.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.screen)));
$('settingsBtn')?.addEventListener('click',()=>showScreen('settings'));$('settingsBtnMobile')?.addEventListener('click',()=>showScreen('settings'));$('mobileMenuBtn')?.addEventListener('click',()=>openModal('moreModal'));
$('.brand-wrap')?.addEventListener('click',()=>{if(state.test&&state.questions?.length&&document.getElementById('analysisScreen')?.classList.contains('active'))saveAnalysisDraft();showScreen('home')});
$('startBtn').onclick=()=>{
  const draft=getAnalysisDraft();
  if(draft){
    if(!confirm('An unfinished test is saved. Start a new test and replace that draft?'))return;
    clearAnalysisDraft();
  }
  resetTest();showScreen('about');
};
$('historyNewBtn').onclick=()=>{
  const draft=getAnalysisDraft();
  if(draft&&!confirm('An unfinished test is saved. Start a new test and replace that draft?'))return;
  clearAnalysisDraft();resetTest();showScreen('about');
};
$('generateMock')?.addEventListener('click',()=>openModal('mockModal',renderMockBuilder));$('uploadQuiz')?.addEventListener('click',()=>openModal('pdfQuizModal',renderPdfQuizBuilder));
$('mistakeNotebookHome')?.addEventListener('click',()=>showScreen('mistakeNotebook'));
$('nextTestHome')?.addEventListener('click',()=>showScreen('nextTest'));
$('mobileBottomNav')?.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.screen)));


document.querySelectorAll('#moreModal [data-screen]').forEach(b=>b.addEventListener('click',()=>{closeModal('moreModal');showScreen(b.dataset.screen)}));
function resetTest(){state.test=null;state.pdf=null;state.pdfFile=null;state.current=0;state.questions=[];state.questionMap=new Map();$('aboutForm').reset();$('syllabusArea').innerHTML='';$('pdfChoiceArea').innerHTML=''}
const ANALYSIS_DRAFT_KEY='studymate_analysis_draft_v1';
function getAnalysisDraft(){try{return JSON.parse(localStorage.getItem(ANALYSIS_DRAFT_KEY)||'null')}catch{return null}}
function clearAnalysisDraft(){localStorage.removeItem(ANALYSIS_DRAFT_KEY);renderResumeDraftCard?.()}
let draftSaveTimer=null;
function saveAnalysisDraft(){
  if(!state.test||!state.questions?.length)return;
  const draft={test:state.test,current:state.current,questions:state.questions,savedAt:new Date().toISOString()};
  localStorage.setItem(ANALYSIS_DRAFT_KEY,JSON.stringify(draft));
  renderResumeDraftCard?.();
}
function scheduleDraftSave(){clearTimeout(draftSaveTimer);draftSaveTimer=setTimeout(saveAnalysisDraft,180)}
async function resumeAnalysisDraft(){
  const draft=getAnalysisDraft();
  if(!draft?.test||!Array.isArray(draft.questions)||!draft.questions.length){clearAnalysisDraft();return toast('No valid unfinished test was found.')}
  state.test=draft.test;state.questions=draft.questions;state.current=Math.min(Math.max(0,Number(draft.current)||0),state.questions.length-1);state.pdf=null;state.pdfFile=null;state.questionMap=new Map();
  try{
    if(state.test.hasPdf){
      const blob=await getPdfBlob(state.test.id);
      if(!blob)throw new Error('Saved PDF not found');
      if(!pdfjsLib)throw new Error('PDF engine unavailable');
      state.pdf=await pdfjsLib.getDocument({data:await blob.arrayBuffer()}).promise;
      await buildQuestionMap();
    }
    await renderQuestion();showScreen('analysis');toast('Unfinished test resumed ✓');
  }catch(e){console.error(e);toast('The saved test was found, but its PDF could not be reopened. You can continue without the PDF.');await renderQuestion();showScreen('analysis')}
}
function renderResumeDraftCard(){
  const card=$('resumeTestCard');if(!card)return;
  const d=getAnalysisDraft();
  if(!d?.test){card.classList.add('hidden');return}
  const done=(d.questions||[]).filter(q=>q.status).length,total=(d.questions||[]).length;
  card.classList.remove('hidden');
  card.innerHTML=`<div><span class="eyebrow">UNFINISHED TEST</span><strong>↩️ ${escapeHtml(d.test.name||'Test')}</strong><small>${done}/${total} questions analysed • Saved ${new Date(d.savedAt||Date.now()).toLocaleString()}</small></div><button class="primary" id="resumeTestBtn">Resume →</button>`;
  $('resumeTestBtn').onclick=resumeAnalysisDraft;
}
window.addEventListener('beforeunload',()=>{if(state.test&&state.questions?.length)saveAnalysisDraft()});
$('testType').addEventListener('change',renderSyllabusUI);
function chapterCheckboxes(subject){return SYLLABUS[subject].map((c,i)=>`<label class="chapter-item"><input type="checkbox" value="${escapeHtml(c)}" data-subject="${subject}" data-index="${i}"><span>${escapeHtml(c)}</span></label>`).join('')}
function renderSyllabusUI(){const type=$('testType').value,area=$('syllabusArea');area.innerHTML='';if(!type)return;
 if(type==='Full Syllabus'){area.innerHTML='<div class="field"><label>Syllabus</label><div class="syllabus-box">Complete NEET 2027 syllabus — Physics + Chemistry + Botany + Zoology</div></div>';return}
 if(type==='Mock Test'){area.innerHTML='<div class="field"><label>Enter Syllabus Manually</label><textarea id="manualSyllabus" required placeholder="Type the syllabus covered in this mock test..."></textarea></div>';return}
 if(type==='Subject-wise'){area.innerHTML=`<div class="field"><label>Select Subject</label><div class="subject-tabs">${SUBJECTS.map(s=>`<button type="button" data-sub="${s}" class="${s==='Physics'?'active':''}">${s}</button>`).join('')}</div></div><div class="field"><label>Select Chapters <span class="small-muted">(multiple)</span></label><div id="subjectChapters" class="chapter-picker"></div></div>`;state.selectedSubject='Physics';renderSubjectChapters();area.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>{state.selectedSubject=b.dataset.sub;area.querySelectorAll('[data-sub]').forEach(x=>x.classList.toggle('active',x===b));renderSubjectChapters()});return}
 area.innerHTML=`<div class="field"><label>Select Chapters <span class="small-muted">(multiple)</span></label><div id="allChapters" class="chapter-picker">${SUBJECTS.map(s=>`<div style="margin-bottom:14px"><strong>${s}</strong><div class="chapter-list" style="margin-top:7px">${chapterCheckboxes(s)}</div></div>`).join('')}</div></div>`;
}
function renderSubjectChapters(){const box=$('subjectChapters');if(box)box.innerHTML=chapterCheckboxes(state.selectedSubject)}
$('aboutForm').addEventListener('change',e=>{if(e.target.name==='usePdf')renderPdfChoice(e.target.value)});
function renderPdfChoice(choice){const a=$('pdfChoiceArea');a.innerHTML='';if(choice==='Yes'){a.innerHTML='<div class="field"><label>Upload Test Paper PDF</label><input id="pdfInput" type="file" accept="application/pdf" required><div id="pdfInfo" class="small-muted"></div></div>';$('pdfInput').onchange=e=>{const f=e.target.files[0];$('pdfInfo').textContent=f?`${f.name} • ${(f.size/1048576).toFixed(2)} MB`:''}}
 else if(choice==='No')a.innerHTML='<div class="field"><label>Number of Questions</label><input id="questionCount" type="number" min="1" max="500" required placeholder="e.g. 180"></div>'}
$('aboutForm').onsubmit=async e=>{e.preventDefault();const type=$('testType').value;let syllabus='';
 if(type==='Mock Test')syllabus=$('manualSyllabus').value.trim();
 else if(type==='Full Syllabus')syllabus='Complete NEET 2027 syllabus — Physics + Chemistry + Botany + Zoology';
 else if(type==='Subject-wise'){const c=[...document.querySelectorAll('#subjectChapters input:checked')].map(x=>x.value);if(!c.length)return alert('Select at least one chapter.');syllabus=`${state.selectedSubject}: ${c.join(', ')}`}
 else {const checked=[...document.querySelectorAll('#allChapters input:checked')];if(!checked.length)return alert('Select at least one chapter.');const groups={};checked.forEach(x=>(groups[x.dataset.subject]??=[]).push(x.value));syllabus=Object.entries(groups).map(([s,c])=>`${s}: ${c.join(', ')}`).join('\n')}
 if(!syllabus)return alert('Please enter/select the syllabus.');const usePdf=document.querySelector('input[name="usePdf"]:checked')?.value;if(!usePdf)return alert('Choose whether to upload the PDF.');const revised=document.querySelector('input[name="revised"]:checked')?.value;
 state.test={id:uid(),name:$('testName').value.trim(),type,syllabus,revised,date:new Date().toISOString(),fileName:'',hasPdf:usePdf==='Yes'};
 if(usePdf==='Yes'){const file=$('pdfInput')?.files?.[0];if(!file)return alert('Please upload the PDF.');state.pdfFile=file;try{if(!pdfjsLib)throw new Error('PDF engine unavailable');await savePdfBlob(state.test.id,file);state.pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;await buildQuestionMap();const count=Math.max(1,state.detectedCount||180);state.questions=Array.from({length:count},(_,i)=>blankQuestion(i+1));state.test.fileName=file.name;saveAnalysisDraft();toast(`Detected ${count} questions from the PDF.`)}catch(err){console.error(err);return alert('Could not read this PDF. Make sure it is a valid PDF and the PDF.js library can load.')}}
 else {const count=Number($('questionCount')?.value);if(!Number.isInteger(count)||count<1)return alert('Enter a valid number of questions.');state.questions=Array.from({length:count},(_,i)=>blankQuestion(i+1))}
 saveAnalysisDraft();
 state.current=0;await renderQuestion();showScreen('analysis');};
function blankQuestion(number){return{number,status:'',guessed:false,silly:false,reason:'',topic:''}}
function getItemRect(item,viewport){const x=item.transform[4],y=item.transform[5],w=item.width||20,h=item.height||Math.abs(item.transform[3])||10;const p1=viewport.convertToViewportPoint(x,y),p2=viewport.convertToViewportPoint(x+w,y+h);return{x:Math.min(p1[0],p2[0]),top:Math.min(p1[1],p2[1]),bottom:Math.max(p1[1],p2[1]),right:Math.max(p1[0],p2[0])}}
function findQuestionLabels(items,viewport,pageNo){
 const out=[];
 for(const item of items){
   const raw=(item.str||'').replace(/\u00a0/g,' ').trim(); if(!raw)continue;
   const candidates=[];
   // Common printed labels: Q1, Q 1, Q.1, Q. 1, Question 1
   for(const re of [/^Q\s*\.?\s*(\d{1,3})(?=\s|$|[.)\]:-])/i,/^Question\s*(?:No\.?\s*)?(\d{1,3})(?=\s|$|[.)\]:-])/i]){
     const m=raw.match(re); if(m)candidates.push(Number(m[1]));
   }
   // Many coaching sheets use a plain numeric label: 1. / 1) / 1:
   const nm=raw.match(/^(\d{1,3})\s*[.)](?=\s|$)/);
   if(nm)candidates.push(Number(nm[1]));
   const seen=new Set();
   for(const number of candidates){
     if(number<1||number>500||seen.has(number))continue; seen.add(number);
     const r=getItemRect(item,viewport);out.push({number,...r,pageNo});
   }
 }
 return out;
}
async function buildQuestionMap(){
  state.questionMap=new Map();
  let maxQ=0;
  for(let pageNo=1;pageNo<=state.pdf.numPages;pageNo++){
    const page=await state.pdf.getPage(pageNo);
    const viewport=page.getViewport({scale:1});
    const text=await page.getTextContent();
    const labels=findQuestionLabels(text.items,viewport,pageNo);
    const unique=[];const seen=new Set();
    for(const x of labels){if(!seen.has(x.number)){seen.add(x.number);unique.push(x);maxQ=Math.max(maxQ,x.number)}}
    if(!unique.length)continue;
    const split=viewport.width/2;
    const left=unique.filter(x=>x.x<split),right=unique.filter(x=>x.x>=split);
    const cols=(left.length&&right.length)?[left,right]:[unique];
    for(const col of cols){
      col.sort((a,b)=>a.top-b.top);
      for(let i=0;i<col.length;i++){
        const q=col[i],next=col[i+1];
        const isLeft=cols.length===2&&q.x<split;
        const x0=isLeft?Math.max(0,Math.min(q.x-14,split-18)):(cols.length===2?Math.max(split+8,q.x-14):18);
        const x1=isLeft?split-8:viewport.width-18;
        const top=Math.max(0,q.top-12);
        const bottom=next?Math.max(top+50,next.top-8):viewport.height-15;
        state.questionMap.set(q.number,{pageNo,x0,x1,top,bottom});
      }
    }
  }
  state.detectedCount=maxQ;
}
function sectionFor(n,total){if(total===180){if(n<=45)return'PHYSICS';if(n<=90)return'CHEMISTRY';if(n<=135)return'BOTANY';return'ZOOLOGY'}return state.test?.type==='Subject-wise'?state.selectedSubject.toUpperCase():'TEST ANALYSIS'}
async function renderQuestion(){const q=state.questions[state.current],total=state.questions.length;$('questionTitle').textContent=`Question ${q.number} / ${total}`;$('sectionLabel').textContent=sectionFor(q.number,total);$('progressText').textContent=`${q.number} / ${total}`;$('progressFill').style.width=`${(state.current+1)/total*100}%`;document.querySelectorAll('input[name="status"]').forEach(x=>x.checked=x.value===q.status);renderExtraFields();if(state.pdf)await renderExactQuestion(q.number);else renderNoPdfQuestion(q.number);updateNavButtons()}
async function renderExactQuestion(num){const info=state.questionMap.get(num);if(!info){$('questionViewer').innerHTML=`<div class="viewer-placeholder"><strong>⚠️ Question ${num} could not be located automatically.</strong><div class="viewer-note">The app will not display a guessed/wrong question. You can still record the status below.</div></div>`;return}try{const page=await state.pdf.getPage(info.pageNo),scale=1.55,viewport=page.getViewport({scale}),x0=info.x0*scale,x1=info.x1*scale,top=info.top*scale,bottom=info.bottom*scale,w=Math.max(120,x1-x0),h=Math.max(90,bottom-top),canvas=document.createElement('canvas');canvas.width=Math.ceil(w);canvas.height=Math.ceil(h);await page.render({canvasContext:canvas.getContext('2d'),viewport,transform:[1,0,0,1,-x0,-top]}).promise;$('questionViewer').innerHTML='';const wrap=document.createElement('div');wrap.className='pdf-page-wrap';wrap.appendChild(canvas);$('questionViewer').appendChild(wrap)}catch(e){console.error(e);$('questionViewer').innerHTML='<div class="viewer-placeholder"><strong>⚠️ Could not render this question.</strong><div class="viewer-note">You can still record the status below.</div></div>'}}
function renderNoPdfQuestion(num){$('questionViewer').innerHTML=`<div class="viewer-placeholder"><strong>Question ${num}</strong><div>No test paper uploaded.</div><div class="viewer-note">Record your answer status below.</div></div>`}
function renderExtraFields(){const q=state.questions[state.current],box=$('questionExtra');if(!q.status){box.innerHTML='';return}if(q.status==='Correct'){box.innerHTML=`<div class="extra-panel"><label class="checkline"><input id="guessed" type="checkbox" ${q.guessed?'checked':''}> I Guessed the Answer</label></div>`;$('guessed').onchange=e=>{q.guessed=e.target.checked;scheduleDraftSave()};return}
 if(q.status==='Incorrect'){box.innerHTML=`<div class="extra-panel"><div class="field"><label>Was this a silly mistake?</label><div class="choice-row"><button type="button" class="choice-chip ${q.silly?'active':''}" id="sillyYes">Yes</button><button type="button" class="choice-chip ${!q.silly?'active':''}" id="sillyNo">No</button></div></div><div class="field"><label>Why did you get it wrong? ${q.silly?'':'<span class="required">*</span>'}</label><textarea id="reason" placeholder="Concept not clear, calculation error, misread question...">${escapeHtml(q.reason)}</textarea></div><div class="field" style="margin-bottom:0"><label>Topic <span class="small-muted">(optional)</span></label><input id="topic" value="${escapeHtml(q.topic)}" placeholder="e.g. Kinematics"></div></div>`;$('sillyYes').onclick=()=>{q.silly=true;renderExtraFields();scheduleDraftSave()};$('sillyNo').onclick=()=>{q.silly=false;renderExtraFields();scheduleDraftSave()};$('reason').oninput=e=>{q.reason=e.target.value;scheduleDraftSave()};$('topic').oninput=e=>{q.topic=e.target.value;scheduleDraftSave()};return}
 box.innerHTML=`<div class="extra-panel"><div class="field"><label>Why did you skip it? <span class="required">*</span></label><textarea id="reason" placeholder="Why did you skip this question?">${escapeHtml(q.reason)}</textarea></div><div class="field" style="margin-bottom:0"><label>Topic <span class="small-muted">(optional)</span></label><input id="topic" value="${escapeHtml(q.topic)}" placeholder="e.g. Genetics"></div></div>`;$('reason').oninput=e=>{q.reason=e.target.value;scheduleDraftSave()};$('topic').oninput=e=>{q.topic=e.target.value;scheduleDraftSave()}}
function validateQuestion(q){if(!q.status)return'Select Correct, Incorrect or Skipped.';if(q.status==='Incorrect'&&!q.silly&&!q.reason.trim())return'Reason is required unless Silly Mistake is checked.';if(q.status==='Skipped'&&!q.reason.trim())return'Reason is required for a skipped question.';return''}
document.addEventListener('change',e=>{if(e.target.name==='status'){const q=state.questions[state.current];q.status=e.target.value;renderExtraFields();scheduleDraftSave();}});
async function leaveAnalysisTest(){
  if(!state.test||!state.questions?.length)return;
  saveAnalysisDraft();
  if(state.pdf)state.pdf=null;
  state.pdfFile=null;
  showScreen('home');
  toast('Test saved. You can resume it anytime.');
}
$('leaveTestBtn')?.addEventListener('click',leaveAnalysisTest);
$('prevBtn').onclick=async()=>{if(state.current>0){state.current--;scheduleDraftSave();await renderQuestion()}};$('nextBtn').onclick=async()=>{const err=validateQuestion(state.questions[state.current]);if(err)return alert(err);if(state.current<state.questions.length-1){state.current++;await renderQuestion()}else{const missing=state.questions.find(q=>validateQuestion(q));if(missing){state.current=state.questions.indexOf(missing);await renderQuestion();return alert(`Question ${missing.number} still needs analysis.`)}saveAnalysisDraft();renderSummary();showScreen('summary')}};
$('navigatorBtn').onclick=()=>{openModal('navigatorModal',buildNavigator)};$('closeNavigator').onclick=()=>closeModal('navigatorModal');
function buildNavigator(){$('questionGrid').innerHTML=state.questions.map((q,i)=>`<button class="qnav ${q.status.toLowerCase()} ${i===state.current?'current':''}" data-i="${i}">${q.number}</button>`).join('');$('questionGrid').querySelectorAll('.qnav').forEach(b=>b.onclick=async()=>{state.current=Number(b.dataset.i);closeModal('navigatorModal');await renderQuestion()})}
function updateNavButtons(){$('prevBtn').disabled=state.current===0;$('nextBtn').textContent=state.current===state.questions.length-1?'Review & Submit →':'Next →'}
function renderSummary(){const q=state.questions,c=q.filter(x=>x.status==='Correct').length,i=q.filter(x=>x.status==='Incorrect').length,s=q.filter(x=>x.status==='Skipped').length,si=q.filter(x=>x.silly).length;$('summaryContent').innerHTML=`<div class="panel"><div class="result-kpis"><div class="kpi"><strong>${q.length}</strong><small>Questions</small></div><div class="kpi"><strong>${c}</strong><small>Correct</small></div><div class="kpi"><strong>${i}</strong><small>Incorrect</small></div></div><div class="result-kpis" style="margin-top:10px"><div class="kpi"><strong>${s}</strong><small>Skipped</small></div><div class="kpi"><strong>${si}</strong><small>Silly Mistakes</small></div><div class="kpi"><strong>${c*4-i}</strong><small>Marks</small></div></div><div class="actions"><button id="editAnalysis" class="secondary">← Continue Editing</button><button id="finalSubmit" class="primary">Submit Analysis 🎉</button></div></div>`;$('editAnalysis').onclick=()=>showScreen('analysis');$('finalSubmit').onclick=saveAndShowResult}
function subjectFor(n,total){if(total!==180)return state.test?.type==='Subject-wise'?state.selectedSubject:null;if(n<=45)return'Physics';if(n<=90)return'Chemistry';if(n<=135)return'Botany';return'Zoology'}
function calculateResult(){const qs=state.questions,correct=qs.filter(q=>q.status==='Correct').length,incorrect=qs.filter(q=>q.status==='Incorrect').length,skipped=qs.filter(q=>q.status==='Skipped').length,silly=qs.filter(q=>q.silly).length,total=correct*4-incorrect,accuracy=(correct+incorrect?correct/(correct+incorrect)*100:0);const subjects={};SUBJECTS.forEach(s=>subjects[s]={correct:0,incorrect:0,skipped:0,score:0,attempted:0});qs.forEach(q=>{const s=subjectFor(q.number,qs.length);if(subjects[s]){subjects[s][q.status.toLowerCase()]++;if(q.status!=='Skipped')subjects[s].attempted++;subjects[s].score+=q.status==='Correct'?4:q.status==='Incorrect'?-1:0}});Object.values(subjects).forEach(v=>v.accuracy=v.correct+v.incorrect?v.correct/(v.correct+v.incorrect)*100:0);return{correct,incorrect,skipped,silly,total,accuracy,subjects}}
function getHistory(){try{return JSON.parse(localStorage.getItem(LS.history)||'[]')}catch{return[]}}
function saveAndShowResult(){clearAnalysisDraft();const result=calculateResult(),record={...state.test,result,questions:state.questions,syllabus:state.test.syllabus};const h=getHistory();h.unshift(record);localStorage.setItem(LS.history,JSON.stringify(h.slice(0,100)));state.resultRecord=record;renderResult(record);showScreen('result')}
function previousComparison(record){const h=getHistory().filter(x=>x.id!==record.id);return h.length?h[0]:null}
function resultNav(){return`<div class="result-nav">${['Overview','Subjects','Mistakes','Why I Lost Marks','Topics','Questions','Trend'].map((x,i)=>`<button class="result-tab ${i===0?'active':''}" data-result-tab="${x.toLowerCase()}">${x}</button>`).join('')}</div>`}
function renderResult(record){const r=record.result,prev=previousComparison(record),delta=prev?r.total-prev.result.total:null;const scoreMax=record.questions.length===180?720:record.questions.length*4;const quote=r.total<500?'A low score is not a final result. It is feedback telling you exactly what to improve next.':'Consistency today creates success tomorrow.';const trend=getHistory().slice(0,8).reverse();
 $('resultContent').innerHTML=`<div class="result-hero"><span class="eyebrow">TEST COMPLETE 🎉</span><h2>${escapeHtml(record.name)}</h2><p class="small-muted">${escapeHtml(record.type)} • ${new Date(record.date).toLocaleDateString()} • Revised: ${escapeHtml(record.revised)}</p><div class="result-score"><div class="big">${r.total}</div><small>/ ${scoreMax}</small></div><div class="result-kpis"><div class="kpi"><strong>${r.correct}</strong><small>✓ Correct</small></div><div class="kpi"><strong>${r.incorrect}</strong><small>✕ Incorrect</small></div><div class="kpi"><strong>${r.skipped}</strong><small>− Skipped</small></div></div><div class="result-kpis" style="margin-top:10px"><div class="kpi"><strong>${r.accuracy.toFixed(1)}%</strong><small>Accuracy</small></div><div class="kpi"><strong>${r.silly}</strong><small>😵 Silly Mistakes</small></div><div class="kpi"><strong>${delta===null?'—':(delta>=0?'+':'')+delta}</strong><small>vs previous</small></div></div></div>${resultNav()}<div id="resultPanels"></div>`;
 const panels=$('resultPanels');panels.innerHTML=resultPanelOverview(record,quote)+resultPanelSubjects(r)+resultPanelMistakes(record)+resultPanelWhyLostMarks(record)+resultPanelTopics(record)+resultPanelQuestions(record)+resultPanelTrend(trend);
 document.querySelectorAll('[data-result-tab]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-result-tab]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const id=btn.dataset.resultTab;document.querySelectorAll('.result-section').forEach(s=>s.style.display=s.dataset.section===id?'block':'none');document.querySelector(`.result-section[data-section="${id}"]`)?.scrollIntoView({behavior:'smooth',block:'start'})});
 document.querySelectorAll('.result-section').forEach((s,i)=>{if(i) s.style.display='none'}); renderResultPdfQuestions(record);bindMistakeSaveChecks(record);}
function resultPanelOverview(record,quote){return`<section class="report-card result-section" data-section="overview"><h3>Your Performance</h3><div class="two-col"><div><div class="small-muted">Syllabus Covered</div><div class="syllabus-box" style="margin-top:6px">${escapeHtml(record.syllabus)}</div></div><div><div class="small-muted">Test Details</div><p><b>${record.questions.length}</b> questions</p><p><b>${escapeHtml(record.revised)}</b> revised before test</p></div></div><div class="quote-card" style="margin-top:14px">💡 “${escapeHtml(quote)}”</div><div class="actions"><button class="primary" onclick="showScreen('history')">View History</button><button class="secondary" onclick="showScreen('mistakeNotebook')">Open Mistake Notebook →</button></div></section>`}
function resultPanelSubjects(r){return`<section class="report-card result-section" data-section="subjects"><h3>📚 Subject Performance</h3><div class="subject-grid">${SUBJECTS.map(s=>{const v=r.subjects[s];return`<div class="subject-card"><span class="small-muted">${s}</span><strong>${v.score}</strong><div class="small-muted">${v.correct} correct • ${v.incorrect} incorrect • ${v.skipped} skipped</div><div class="barline"><i style="width:${Math.min(100,v.accuracy)}%"></i></div><small>${v.accuracy.toFixed(1)}% accuracy</small></div>`}).join('')}</div></section>`}
function resultPanelMistakes(record){const cats={silly:record.questions.filter(q=>q.silly).length,other:record.questions.filter(q=>q.status==='Incorrect'&&!q.silly).length,skipped:record.questions.filter(q=>q.status==='Skipped').length};const total=Math.max(1,cats.silly+cats.other+cats.skipped);const p1=cats.silly/total*100,p2=(cats.silly+cats.other)/total*100;return`<section class="report-card result-section" data-section="mistakes"><h3>😵 Where did you lose marks?</h3><div class="donut-wrap"><div style="position:relative"><div class="donut" style="background:conic-gradient(var(--green) 0 ${p1}%,var(--red) ${p1}% ${p2}%,#b9b0ff ${p2}% 100%)"></div><div class="donut-center">${record.result.incorrect}<br><span class="small-muted">Incorrect</span></div></div><div class="legend"><span><i class="dot" style="background:var(--green)"></i>${cats.silly} Silly Mistakes</span><span><i class="dot" style="background:var(--red)"></i>${cats.other} Other Incorrect</span><span><i class="dot" style="background:#b9b0ff"></i>${cats.skipped} Skipped</span></div></div></section>`}

function resultPanelWhyLostMarks(record){const qs=record.questions||[],incorrect=qs.filter(q=>q.status==='Incorrect'),skipped=qs.filter(q=>q.status==='Skipped'),silly=incorrect.filter(q=>q.silly),reasonMap={};incorrect.forEach(q=>{const r=(q.silly?'Silly mistake':(q.reason||'Reason not recorded')).trim();reasonMap[r]=(reasonMap[r]||0)+1});const reasons=Object.entries(reasonMap).sort((a,b)=>b[1]-a[1]);return `<section class="report-card result-section" data-section="why i lost marks"><h3>🔍 Why I Lost Marks</h3><div class="result-kpis"><div class="kpi"><strong>${silly.length*1}</strong><small>Marks from silly mistakes</small></div><div class="kpi"><strong>${(incorrect.length-silly.length)}</strong><small>Other incorrect</small></div><div class="kpi"><strong>${skipped.length}</strong><small>Skipped</small></div></div><div class="why-lost-list">${reasons.map(([r,n])=>`<div class="focus-row"><div><b>${escapeHtml(r)}</b><small>${n} question${n===1?'':'s'}</small></div><strong>-${n}</strong></div>`).join('')||'<div class="empty">No marks lost from incorrect/skipped questions. 🎉</div>'}</div><p class="small-muted">Each incorrect answer costs 1 mark under the current scoring rule; skipped questions score 0. This section explains the recorded reasons, not unrecorded causes.</p></section>`}
function resultPanelTopics(record){const map={};record.questions.forEach(q=>{if(q.topic?.trim()){map[q.topic.trim()]??={wrong:0,total:0};map[q.topic.trim()].total++;if(q.status!=='Correct')map[q.topic.trim()].wrong++}});const rows=Object.entries(map).sort((a,b)=>b[1].wrong-a[1].wrong).slice(0,10);return`<section class="report-card result-section" data-section="topics"><h3>🎯 Weak Topics</h3>${rows.length?rows.map(([t,v],i)=>`<div class="topic-row"><div><span class="topic-name">${i+1}. ${escapeHtml(t)}</span><div class="barline"><i style="width:${Math.min(100,v.wrong/Math.max(1,v.total)*100)}%"></i></div></div><strong>${v.wrong}</strong></div>`).join(''):'<div class="empty">No topics were recorded. Topic is optional, so weak-topic analysis grows as you add topics.</div>'}<h3 style="margin-top:22px">🌟 Strong Topics</h3><div class="small-muted">Strong topics are shown when enough topic-tagged correct answers exist.</div></section>`}
function bindMistakeSaveChecks(record){document.querySelectorAll('[data-save-mistake]').forEach(cb=>cb.onchange=e=>{const [rid,num]=e.target.dataset.saveMistake.split('::');const h=getHistory(),r=h.find(x=>x.id===rid);const q=r?.questions?.find(x=>Number(x.number)===Number(num));if(!q)return;q.mistakeSaved=e.target.checked;localStorage.setItem(LS.history,JSON.stringify(h));if(state.resultRecord?.id===rid)state.resultRecord=r;toast(e.target.checked?'Added to Mistake Notebook ✓':'Removed from Mistake Notebook');});}

function resultPanelQuestions(record){
 const incorrect=record.questions.filter(q=>q.status==='Incorrect'),other=record.questions.filter(q=>q.status==='Skipped');
 return `<section class="report-card result-section" data-section="questions"><h3>❌ Incorrect Questions</h3><p class="small-muted">Exact question cutouts are loaded from the original saved PDF when this test was analysed with a PDF.</p><div class="result-pdf-question-list">${incorrect.slice(0,60).map((q,i)=>`<article class="result-question-card"><div class="result-question-head"><b>Question ${q.number}</b><span class="badge ${q.silly?'incorrect':'incorrect'}">${q.silly?'Silly Mistake':'Incorrect'}</span></div><div class="result-question-viewer" id="resultPdfViewer_${escapeHtml(record.id)}_${i}"><div class="viewer-placeholder">Loading exact PDF question…</div></div><div class="result-question-meta">${q.topic?`<span>🎯 ${escapeHtml(q.topic)}</span>`:''}${q.reason?`<span>💭 ${escapeHtml(q.reason)}</span>`:''}<label class="mistake-save-check"><input type="checkbox" data-save-mistake="${escapeHtml(record.id)}::${q.number}" ${q.mistakeSaved?'checked':''}> 📓 Add to Mistake Notebook</label></div></article>`).join('')||'<div class="empty">No incorrect questions in this test. 🎉</div>'}</div>${incorrect.length>60?`<p class="small-muted">Showing first 60 incorrect questions.</p>`:''}<div style="margin-top:18px"><h3>⏭️ Other Review Items</h3>${other.map(q=>`<div class="question-item"><div><b>Q${q.number}</b><small>${escapeHtml(q.reason||'Skipped')}</small>${q.topic?`<small>Topic: ${escapeHtml(q.topic)}</small>`:''}</div><span class="badge skipped">Skipped</span></div>`).join('')||'<div class="small-muted">No skipped questions.</div>'}</div></section>`;
}
async function renderResultPdfQuestions(record){
 if(!record.hasPdf||!pdfjsLib)return;
 let blob;try{blob=await getPdfBlob(record.id);if(!blob)throw new Error('missing PDF');const pdf=await pdfjsLib.getDocument({data:await blob.arrayBuffer()}).promise;const map=await extractPdfMap(pdf);const qs=record.questions.filter(q=>q.status==='Incorrect').slice(0,60);for(let i=0;i<qs.length;i++){const el=$(`resultPdfViewer_${record.id}_${i}`);if(!el)continue;const info=map.get(Number(qs[i].number));if(!info){el.innerHTML='<div class="viewer-placeholder">Exact question could not be located in the saved PDF.</div>';continue}await renderPdfInfoToElement(pdf,info,el,1.25)}}catch(e){console.warn(e);document.querySelectorAll('[id^="resultPdfViewer_"]').forEach(el=>{el.innerHTML='<div class="viewer-placeholder">The original PDF is not available on this device.</div>'})}
}
async function renderPdfInfoToElement(pdf,info,el,scale=1.25){const page=await pdf.getPage(info.pageNo),vp=page.getViewport({scale}),x0=info.x0*scale,x1=info.x1*scale,top=info.top*scale,bottom=info.bottom*scale,canvas=document.createElement('canvas');canvas.width=Math.max(120,Math.ceil(x1-x0));canvas.height=Math.max(90,Math.ceil(bottom-top));await page.render({canvasContext:canvas.getContext('2d'),viewport:vp,transform:[1,0,0,1,-x0,-top]}).promise;el.innerHTML='';el.appendChild(canvas)}
function resultPanelTrend(history){const max=Math.max(720,...history.map(x=>x.result.total),1);const pts=history.map((x,i)=>{const xPos=20+i*(560/Math.max(1,history.length-1));const y=185-(x.result.total/max)*150;return `${xPos},${y}`}).join(' ');return`<section class="report-card result-section" data-section="trend"><h3>📈 Score Trend</h3>${history.length>1?`<div class="chart-box"><svg class="trend-svg" viewBox="0 0 600 220" preserveAspectRatio="none"><polyline fill="none" stroke="#5b55e8" stroke-width="4" points="${pts}"/>${history.map((x,i)=>{const xp=20+i*(560/Math.max(1,history.length-1)),yp=185-(x.result.total/max)*150;return`<circle cx="${xp}" cy="${yp}" r="6" fill="#5b55e8"/><text x="${xp}" y="${yp-10}" text-anchor="middle" font-size="12">${x.result.total}</text>`}).join('')}</svg></div>`:'<div class="empty">Analyse more tests to unlock your score trend.</div>'}</section>`}
function renderHistory(){const h=getHistory();if(!h.length){$('historyList').innerHTML='<div class="empty">No tests analysed yet.<br><br>Start your first test to build your report.</div>';return}$('historyList').innerHTML=h.map((r,i)=>`<div class="history-item"><div><strong>${escapeHtml(r.name)}</strong><div class="history-meta">${escapeHtml(r.type)} • ${new Date(r.date).toLocaleDateString()} • ${r.questions.length} questions</div></div><div><strong>${r.result.total}</strong> <button class="secondary" data-open-history="${i}">Open</button></div></div>`).join('');$('historyList').querySelectorAll('[data-open-history]').forEach(b=>b.onclick=()=>{const r=h[Number(b.dataset.openHistory)];renderResult(r);showScreen('result')})}
$('clearHistoryBtn').onclick=()=>{const h=getHistory();if(!h.length)return toast('History is already empty.');if(confirm(`Delete all ${h.length} test records? This cannot be undone.`)){localStorage.removeItem(LS.history);renderHistory();refreshHome();toast('History cleared.')}};
function getUserName(){return (localStorage.getItem('studymate_user_name')||'').trim()}
function shouldShowDoctor(h){return h.length>=5&&h.slice(0,5).every(x=>Number(x.result?.total||0)>=600)}
function timeGreeting(){const hour=new Date().getHours();if(hour<5)return['Good Night','Rest well and come back stronger. 🌙'];if(hour<12)return['Good Morning','Discipline today, Doctor tomorrow. 💙'];if(hour<17)return['Good Afternoon','Stay focused. You are getting closer. ☀️'];if(hour<22)return['Good Evening','Still one step closer to your dream. ✨'];return['Good Night','Rest well. Tomorrow is another step forward. 🌙']}
function ensureName(){if(getUserName())return;const m=$('nameModal');if(!m)return;m.classList.remove('hidden');$('nameInput').focus()}
function refreshHome(){const h=getHistory(),name=getUserName(),doctor=shouldShowDoctor(h),g=timeGreeting();$('homeTests').textContent=h.length;$('homeBest').textContent=h.length?Math.max(...h.map(x=>x.result.total)):'—';$('homeLatest').textContent=h.length?h[0].result.total:'—';$('greetingTitle').innerHTML=escapeHtml(g[0])+ (name?`, <span class="home-name">${doctor?'Dr. ':''}${escapeHtml(name)}</span>`:'!');$('greetingSub').textContent=doctor?'Five consecutive 600+ tests. Keep going, Doctor! 🩺':g[1];const latest=h[0]?.result?.total||0;const pct=Math.min(100,Math.round(latest/7.2));$('homeProgressPct').textContent=h.length?`${pct}%`:'0%';$('progressLine1').textContent=h.length?(doctor?'600+ streak achieved.':'Your latest score is '+latest+'.'):'Start your first test.';$('progressLine2').textContent=h.length?'Analyse. Revise. Improve. Repeat.':'Every analysed test brings you closer.';const ach=$('achievementCard');if(doctor){ach.classList.remove('hidden');ach.innerHTML=`<div class="achievement-title">🏆 ACHIEVEMENT UNLOCKED</div><strong>🩺 Dr. ${escapeHtml(name)} — 600+ Excellence Streak</strong><p>600+ in each of your last 5 tests. “Consistency turns preparation into success.”</p>`}else ach.classList.add('hidden');document.querySelectorAll('.mobile-bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.screen===document.querySelector('.screen.active')?.id?.replace('Screen','')))}
function renderReports(){const h=getHistory();if(!h.length){$('reportsContent').innerHTML='<div class="empty">Analyse your first test to unlock Reports.</div>';return}const best=Math.max(...h.map(x=>x.result.total)),avg=h.reduce((a,x)=>a+x.result.total,0)/h.length,acc=h.reduce((a,x)=>a+x.result.accuracy,0)/h.length;const agg={};SUBJECTS.forEach(s=>agg[s]={c:0,i:0});let silly=0,incorrect=0,skipped=0;h.forEach(r=>{silly+=r.result.silly;incorrect+=r.result.incorrect;skipped+=r.result.skipped;SUBJECTS.forEach(s=>{if(r.result.subjects[s]){agg[s].c+=r.result.subjects[s].correct;agg[s].i+=r.result.subjects[s].incorrect}})});$('reportsContent').innerHTML=`<div class="report-card"><h3>Overall Performance</h3><div class="result-kpis"><div class="kpi"><strong>${best}</strong><small>Best Score</small></div><div class="kpi"><strong>${avg.toFixed(0)}</strong><small>Average Score</small></div><div class="kpi"><strong>${h.length}</strong><small>Tests Analysed</small></div></div><div class="kpi" style="margin-top:10px"><strong>${acc.toFixed(1)}%</strong><small>Total Accuracy</small></div></div><div class="report-card"><h3>📈 Score Trend</h3>${resultPanelTrend(h)}</div><div class="report-card"><h3>📚 Subject Performance</h3><div class="subject-grid">${SUBJECTS.map(s=>{const v=agg[s],a=v.c+v.i?v.c/(v.c+v.i)*100:0;return`<div class="subject-card"><span class="small-muted">${s}</span><strong>${a.toFixed(1)}%</strong><div class="barline"><i style="width:${a}%"></i></div></div>`}).join('')}</div></div><div class="report-card"><h3>🎯 Marks Lost</h3><div class="result-kpis"><div class="kpi"><strong>${silly}</strong><small>Silly Mistakes</small></div><div class="kpi"><strong>${incorrect}</strong><small>Incorrect</small></div><div class="kpi"><strong>${skipped}</strong><small>Skipped</small></div></div></div><div class="report-card"><h3>🎯 Focus Areas</h3><p class="small-muted">Focus is based on recorded weak-topic data and mistake patterns from your tests.</p></div>`}
function openModal(id,renderer){$(id).classList.remove('hidden');if(renderer)renderer()}function closeModal(id){$(id).classList.add('hidden')}document.querySelectorAll('.close-modal').forEach(b=>b.onclick=()=>b.closest('.modal').classList.add('hidden'));document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.add('hidden')}));
/* Practice: local starter bank. The app intentionally does not claim that generated questions are official NEET questions. */
const QUESTION_BANK=[
 {s:'Physics',c:'Motion in a Straight Line',q:'A body changes velocity from 10 m/s to 20 m/s in 5 s. Its average acceleration is:',o:['1 m/s²','2 m/s²','5 m/s²','10 m/s²'],a:1},
 {s:'Physics',c:'Laws of Motion',q:'The SI unit of impulse is equivalent to:',o:['N s','N/m','J/s','kg/m'],a:0},
 {s:'Physics',c:'Work, Energy, and Power',q:'If the net work done on a particle is zero, its kinetic energy:',o:['doubles','becomes zero','remains constant','must decrease'],a:2},
 {s:'Physics',c:'Current Electricity',q:'For an ohmic conductor at constant temperature, V/I is:',o:['zero','constant','infinite','variable'],a:1},
 {s:'Physics',c:'Electrostatic Potential and Capacitance',q:'The capacitance of an isolated conductor depends primarily on its:',o:['charge only','potential only','geometry and medium','current'],a:2},
 {s:'Chemistry',c:'Some Basic Concepts of Chemistry',q:'One mole of a substance contains approximately:',o:['6.022×10²³ entities','3.011×10²³ entities','9.8×10²³ entities','1.66×10⁻²⁷ entities'],a:0},
 {s:'Chemistry',c:'Structure of Atom',q:'The maximum number of electrons in the n=2 shell is:',o:['2','8','18','32'],a:1},
 {s:'Chemistry',c:'Chemical Bonding and Molecular Structure',q:'The shape of methane molecule is:',o:['linear','trigonal planar','tetrahedral','bent'],a:2},
 {s:'Chemistry',c:'Equilibrium',q:'At equilibrium in a reversible reaction, the forward and reverse reaction rates are:',o:['zero','equal','unrelated','maximum only forward'],a:1},
 {s:'Chemistry',c:'Chemical Kinetics',q:'The unit of a first-order rate constant is:',o:['mol L⁻¹ s⁻¹','s⁻¹','L mol⁻¹ s⁻¹','mol² L⁻² s⁻¹'],a:1},
 {s:'Botany',c:'The Living World',q:'The basic unit of classification is:',o:['genus','family','species','order'],a:2},
 {s:'Botany',c:'Cell: The Unit of Life',q:'The site of aerobic respiration in eukaryotic cells is mainly the:',o:['ribosome','mitochondrion','Golgi body','lysosome'],a:1},
 {s:'Botany',c:'Photosynthesis in Higher Plants',q:'The oxygen released during photosynthesis comes primarily from:',o:['CO₂','glucose','water','chlorophyll'],a:2},
 {s:'Botany',c:'Plant Growth and Development',q:'Auxin is strongly associated with:',o:['cell elongation','blood clotting','muscle contraction','DNA translation'],a:0},
 {s:'Zoology',c:'Animal Kingdom',q:'Animals with a water vascular system belong to:',o:['Mollusca','Arthropoda','Echinodermata','Annelida'],a:2},
 {s:'Zoology',c:'Breathing and Exchange of Gases',q:'The primary site of gaseous exchange in human lungs is:',o:['trachea','bronchi','alveoli','larynx'],a:2},
 {s:'Zoology',c:'Body Fluids and Circulation',q:'The universal donor blood group for red-cell transfusion is commonly considered:',o:['AB+','O−','A+','B−'],a:1},
 {s:'Zoology',c:'Neural Control and Coordination',q:'The functional unit of the nervous system is the:',o:['nephron','neuron','sarcomere','alveolus'],a:1}
];
function renderMockBuilder(){const b=$('mockBuilder');b.innerHTML=`<div class="field"><label>Practice Type</label><select id="mockType"><option>Chapter-wise Practice</option><option>Subject-wise Practice</option><option>Full Syllabus Test Practice</option></select></div><div id="mockScope"></div><div class="two-col"><div class="field"><label>Number of Questions</label><select id="mockCount">${[10,20,30,45,60,90,180].map(n=>`<option>${n}</option>`).join('')}<option>Custom</option></select><input id="mockCustom" type="number" min="1" max="180" placeholder="Custom count" style="display:none;margin-top:7px"></div><div class="field"><label>Question Level / Source</label><select id="mockLevel"><option>NEET Level</option><option>NEET Level — Hard</option><option>NEET + Advanced — Mixed</option><option>JEE Main Level</option></select></div></div><div class="small-muted">The included offline starter bank contains sample questions. For larger real mock tests, add a question bank or use Upload PDF → Quiz.</div><div class="actions"><button class="primary" id="buildMock">Generate</button></div>`;renderMockScope();$('mockType').onchange=renderMockScope;$('mockCount').onchange=()=>{$('mockCustom').style.display=$('mockCount').value==='Custom'?'block':'none'};$('buildMock').onclick=generateMock}
function renderMockScope(){const type=$('mockType').value,box=$('mockScope');if(type==='Full Syllabus Test Practice'){box.innerHTML='<div class="syllabus-box" style="margin-bottom:15px">Complete NEET 2027 syllabus</div>';return}if(type==='Chapter-wise Practice'){box.innerHTML=`<div class="field"><label>Subject</label><select id="mockSubject">${SUBJECTS.map(s=>`<option>${s}</option>`).join('')}</select></div><div class="field"><label>Chapters</label><div id="mockChapters" class="chapter-picker"></div></div>`;renderMockChapters();$('mockSubject').onchange=renderMockChapters}else{box.innerHTML=`<div class="field"><label>Select exactly 2 subjects</label><div class="subject-tabs">${SUBJECTS.map(s=>`<button type="button" data-mock-sub="${s}">${s}</button>`).join('')}</div></div><div id="mockSubjectScopes"></div>`;document.querySelectorAll('[data-mock-sub]').forEach(b=>b.onclick=()=>{const selected=[...document.querySelectorAll('[data-mock-sub].active')];b.classList.toggle('active');if(document.querySelectorAll('[data-mock-sub].active').length>2)b.classList.remove('active');renderMockSubjectScopes()})}}
function renderMockChapters(){const s=$('mockSubject')?.value;if($('mockChapters'))$('mockChapters').innerHTML=chapterCheckboxes(s)}
function renderMockSubjectScopes(){const active=[...document.querySelectorAll('[data-mock-sub].active')].map(b=>b.dataset.mockSub);$('mockSubjectScopes').innerHTML=active.map(s=>`<div class="field"><label>${s} syllabus</label><div class="chapter-picker">${chapterCheckboxes(s)}</div></div>`).join('');document.querySelectorAll('[data-mock-sub]').forEach(b=>b.classList.toggle('active',active.includes(b.dataset.mockSub)))}
function generateMock(){
 const type=$('mockType').value,countSel=$('mockCount').value,count=countSel==='Custom'?Number($('mockCustom').value):Number(countSel),level=$('mockLevel').value;
 if(!Number.isInteger(count)||count<1||count>180)return alert('Choose a valid question count (1–180).');
 let pool=QUESTION_BANK.slice();
 if(type==='Chapter-wise Practice'){
  const s=$('mockSubject').value,cs=[...document.querySelectorAll('#mockChapters input:checked')].map(x=>x.value);
  if(!cs.length)return alert('Select at least one chapter.');
  pool=pool.filter(q=>q.s===s&&cs.includes(q.c));
 }else if(type==='Subject-wise Practice'){
  const subs=[...document.querySelectorAll('[data-mock-sub].active')].map(b=>b.dataset.mockSub);
  if(subs.length!==2)return alert('Select exactly 2 subjects.');
  pool=pool.filter(q=>subs.includes(q.s));
 }
 if(!pool.length)return alert('The current offline starter bank has no questions matching that selection. Use Upload PDF → Quiz or add questions to the local bank.');
 // Clone questions and give every generated question its own stable id/position.
 if(count>pool.length)return alert(`Only ${pool.length} matching offline questions are available for this selection. Choose a smaller count or use Upload PDF → Quiz for a larger real paper.`); const questions=pool.slice(0,count).map((base,i)=>({...base,number:i+1,sourceNumber:QUESTION_BANK.indexOf(base)+1}));
 closeModal('mockModal');
 openPracticeQuiz({title:`Generated Mock — ${level}`,questions,level,practiceType:type});
}
async function renderPdfQuizBuilder(){const b=$('pdfQuizBuilder');b.innerHTML='<div class="field"><label>Question PDF</label><input id="quizPdfInput" type="file" accept="application/pdf"><div id="quizPdfInfo" class="small-muted"></div></div><div class="field"><label>Answer Key</label><div class="segmented"><label><input type="radio" name="quizKeyMode" value="manual" checked> Enter manually</label><label><input type="radio" name="quizKeyMode" value="file"> Upload .txt</label></div><div id="quizKeyArea"></div></div><div class="actions"><button class="primary" id="startPdfQuiz">Create Interactive Quiz</button></div>';$('quizPdfInput').onchange=e=>{const f=e.target.files[0];$('quizPdfInfo').textContent=f?`${f.name} • ${(f.size/1048576).toFixed(2)} MB`:''};const renderKey=()=>{const mode=document.querySelector('input[name=quizKeyMode]:checked')?.value;if(mode==='file'){$('quizKeyArea').innerHTML='<input id="quizAnswerKeyFile" type="file" accept=".txt,text/plain"><div id="quizKeyInfo" class="small-muted">Example: 1A 2B 3C 4D</div>';$('quizAnswerKeyFile').onchange=e=>{const f=e.target.files[0];$('quizKeyInfo').textContent=f?`${f.name} selected`:''}}else{$('quizKeyArea').innerHTML='<input id="quizAnswerKey" placeholder="Example: 1A 2C 3B 4D"><div class="small-muted">Example formats: 1A 2B 3C… or one answer per line.</div>'}};document.querySelectorAll('input[name=quizKeyMode]').forEach(r=>r.onchange=renderKey);renderKey();$('startPdfQuiz').onclick=startPdfQuiz}
async function startPdfQuiz(){const file=$('quizPdfInput')?.files?.[0];if(!file)return alert('Choose a PDF.');if(!pdfjsLib)return alert('PDF engine unavailable.');try{const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;const map=await extractPdfMap(pdf);const nums=[...map.keys()].sort((a,b)=>a-b);if(!nums.length)return alert('No question labels were detected in this PDF.');const mode=document.querySelector('input[name=quizKeyMode]:checked')?.value||'manual';let key={};if(mode==='file'){const kf=$('quizAnswerKeyFile')?.files?.[0];if(kf){key=parseAnswerKey(await kf.text());}else return alert('Choose a .txt answer key or select Enter manually.');}else key=parseAnswerKey($('quizAnswerKey')?.value||'');const qs=nums.map(n=>({number:n,pdf,info:map.get(n),answer:null}));qs.forEach(q=>q.answerKey=key[q.number]??null);closeModal('pdfQuizModal');openPracticeQuiz({title:file.name,questions:qs,pdf:true})}catch(e){console.error(e);alert('Could not parse the PDF or answer key.')}}
async function extractPdfMap(pdf){
 const map=new Map();
 for(let p=1;p<=pdf.numPages;p++){
   const page=await pdf.getPage(p),vp=page.getViewport({scale:1}),text=await page.getTextContent();
   const labels=findQuestionLabels(text.items,vp,p);
   if(!labels.length)continue;
   // Keep the first label per number on this page; coordinate sorting, not PDF stream order, controls layout.
   const byNum=new Map(); for(const x of labels){if(!byNum.has(x.number))byNum.set(x.number,x)}
   const unique=[...byNum.values()];
   const split=vp.width*0.5, left=unique.filter(x=>x.x<split), right=unique.filter(x=>x.x>=split);
   const useCols=(left.length>=2&&right.length>=2)?[left,right]:[unique];
   for(const col of useCols){
     col.sort((a,b)=>a.top-b.top||a.x-b.x);
     for(let i=0;i<col.length;i++){
       const q=col[i],next=col[i+1],isTwo=useCols.length===2,isLeft=isTwo&&q.x<split;
       let x0=isTwo?(isLeft?Math.max(0,Math.min(q.x-14,split-20)):Math.max(split+6,q.x-14)):Math.max(8,q.x-14);
       let x1=isTwo?(isLeft?split-8:vp.width-8):vp.width-8;
       const top=Math.max(0,q.top-12);
       const bottom=next?Math.max(top+45,next.top-8):vp.height-12;
       const info={pageNo:p,x0,x1,top,bottom};
       // If a number already exists, prefer the earliest page/region that looks like the real question.
       if(!map.has(q.number))map.set(q.number,info);
     }
   }
 }
 return map;
}
function parseAnswerKey(text){const out={};const raw=String(text||'').toUpperCase().replace(/[\r\n,;|]+/g,' ');for(const m of raw.matchAll(/(?:Q\s*)?(\d+)\s*[-.:)]?\s*([ABCD])/g))out[Number(m[1])]=m[2].charCodeAt(0)-65;return out}
async function openPracticeQuiz(data){
 state.practiceQuiz={...data,index:0,answers:{},startedAt:Date.now()};
 $('pdfQuizModal').classList.add('hidden');$('mockModal').classList.add('hidden');
 showScreen('practice');
 await renderPracticeQuiz();
}
async function renderPracticeQuiz(){
 const d=state.practiceQuiz;if(!d||!d.questions?.length)return;
 const q=d.questions[d.index],selected=d.answers[q.number];
 let body='';
 if(d.pdf)body=`<div class="quiz-question" id="practicePdfViewer"><div class="viewer-placeholder">Loading question…</div></div>`;
 else body=`<div class="quiz-question"><span class="eyebrow">${escapeHtml(q.s||'')} • ${escapeHtml(q.c||'')}</span><h3 style="margin:8px 0">${escapeHtml(q.q||'')}</h3></div>`;
 const options=d.pdf?['A','B','C','D'].map((x,i)=>`<button type="button" data-opt="${i}" class="${selected===i?'selected':''}">${x}</button>`).join(''):(q.o||[]).map((x,i)=>`<button type="button" data-opt="${i}" class="${selected===i?'selected':''}">${String.fromCharCode(65+i)}. ${escapeHtml(x)}</button>`).join('');
 const answered=Object.prototype.hasOwnProperty.call(d.answers,q.number)&&d.answers[q.number]!==null;
 $('practiceScreen').innerHTML=`<div class="page-head"><div><span class="eyebrow">PRACTICE QUIZ</span><h2>${escapeHtml(d.title)}</h2><div class="small-muted">Question ${d.index+1} / ${d.questions.length}${d.level?` • ${escapeHtml(d.level)}`:''}</div></div><button id="exitPractice" class="secondary" type="button">Exit</button></div>${body}<div class="quiz-options">${options}</div><div class="actions between"><button id="pqPrev" class="secondary" type="button">← Previous</button><div class="inline-actions"><button id="pqSkip" class="secondary" type="button">${answered?'Clear Answer':'Skip'}</button><button id="pqNext" class="primary" type="button">${d.index===d.questions.length-1?'Submit Test ✓':'Next →'}</button></div></div>`;
 document.querySelectorAll('[data-opt]').forEach(b=>b.onclick=async()=>{d.answers[q.number]=Number(b.dataset.opt);await renderPracticeQuiz()});
 $('exitPractice').onclick=()=>{if(confirm('Exit this practice test? Your unfinished attempt will be discarded.')){state.practiceQuiz=null;showScreen('practice')}};
 $('pqPrev').onclick=async()=>{if(d.index>0){d.index--;await renderPracticeQuiz()}};
 $('pqSkip').onclick=async()=>{if(answered)d.answers[q.number]=null;else d.answers[q.number]=null;if(d.index<d.questions.length-1){d.index++;await renderPracticeQuiz()}else await finishPracticeQuiz(true)};
 $('pqNext').onclick=async()=>{if(d.index<d.questions.length-1){d.index++;await renderPracticeQuiz()}else await finishPracticeQuiz(false)};
 if(d.pdf)await renderPracticePdfQuestion(q);
}
async function renderPracticePdfQuestion(q){const el=$('practicePdfViewer');try{const page=await q.pdf.getPage(q.info.pageNo),scale=1.3,vp=page.getViewport({scale}),x0=q.info.x0*scale,x1=q.info.x1*scale,top=q.info.top*scale,bottom=q.info.bottom*scale,canvas=document.createElement('canvas');canvas.width=Math.ceil(x1-x0);canvas.height=Math.ceil(bottom-top);await page.render({canvasContext:canvas.getContext('2d'),viewport:vp,transform:[1,0,0,1,-x0,-top]}).promise;el.innerHTML='';el.appendChild(canvas)}catch(e){el.innerHTML='<div class="viewer-placeholder">Could not render this question.</div>'}}
async function finishPracticeQuiz(fromSkip=false){
 const d=state.practiceQuiz;if(!d||!d.questions?.length)return;
 const unanswered=d.questions.filter(q=>!Object.prototype.hasOwnProperty.call(d.answers,q.number)||d.answers[q.number]===null).length;
 if(!fromSkip&&unanswered>0){
  const ok=confirm(`${unanswered} question${unanswered===1?' is':'s are'} unanswered. Submit anyway?`);
  if(!ok)return;
 }
 const items=d.questions.map(q=>{
  const user=d.answers[q.number];
  const key=q.answerKey??q.a;
  const hasKey=key!==null&&key!==undefined;
  const status=user===null||user===undefined?'Skipped':(hasKey?(user===key?'Correct':'Incorrect'):'Answered');
  return {...q,userAnswer:user,correctAnswer:key,status,hasKey};
 });
 const correct=items.filter(x=>x.status==='Correct').length;
 const incorrect=items.filter(x=>x.status==='Incorrect').length;
 const skipped=items.filter(x=>x.status==='Skipped').length;
 const scored=items.filter(x=>x.hasKey).length;
 const marks=items.filter(x=>x.hasKey).reduce((sum,x)=>sum+(x.status==='Correct'?4:x.status==='Incorrect'?-1:0),0);
 const accuracy=scored?correct/scored*100:0;
 const elapsed=Math.max(0,Date.now()-(d.startedAt||Date.now()));
 const result={title:d.title,level:d.level||'',practiceType:d.practiceType||'Practice',questions:items,correct,incorrect,skipped,scored,marks,accuracy,elapsed,hasAnswerKey:items.some(x=>x.hasKey),date:new Date().toISOString()};
 state.practiceQuiz=null;
 renderPracticeResult(result);
 showScreen('result');
}
function formatDuration(ms){const sec=Math.round(ms/1000),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return h?`${h}h ${m}m`:m?`${m}m ${s}s`:`${s}s`}
function renderPracticeResult(result){
 const max=result.questions.length*4;
 const answered=result.questions.length-result.skipped;
 const review=result.questions.filter(q=>q.status==='Incorrect'||q.status==='Skipped');
 const subjectMap={};
 result.questions.forEach(q=>{const subject=q.s||'Practice';subjectMap[subject]??={correct:0,incorrect:0,skipped:0,total:0};subjectMap[subject].total++;subjectMap[subject][q.status.toLowerCase()]++});
 const subjectCards=Object.entries(subjectMap).map(([s,v])=>{const acc=(v.correct+v.incorrect)?v.correct/(v.correct+v.incorrect)*100:0;return `<div class="subject-card"><span class="small-muted">${escapeHtml(s)}</span><strong>${v.correct*4-v.incorrect}</strong><div class="small-muted">${v.correct} correct • ${v.incorrect} incorrect • ${v.skipped} skipped</div><div class="barline"><i style="width:${acc.toFixed(1)}%"></i></div><small>${acc.toFixed(1)}% accuracy</small></div>`}).join('');
 const reviewRows=review.map(q=>`<div class="question-item"><div><b>Q${q.number}</b><small>${escapeHtml(q.s||'Practice')} • ${escapeHtml(q.c||'')}</small><small>${q.status==='Skipped'?'Skipped':`Your answer: ${q.userAnswer==null?'—':String.fromCharCode(65+q.userAnswer)}${q.hasKey?` • Correct: ${String.fromCharCode(65+q.correctAnswer)}`:''}`}</small></div><span class="badge ${q.status==='Incorrect'?'incorrect':'skipped'}">${q.status}</span></div>`).join('');
 const keyNote=result.hasAnswerKey?`<div class="quote-card">💡 Score is calculated from the available answer key using +4 for Correct, −1 for Incorrect and 0 for Skipped.</div>`:`<div class="quote-card">ℹ️ No answer key was supplied, so answers were recorded but a marks-based score could not be calculated.</div>`;
 $('resultContent').innerHTML=`<div class="result-hero"><span class="eyebrow">PRACTICE TEST COMPLETE 🎉</span><h2>${escapeHtml(result.title)}</h2><p class="small-muted">${escapeHtml(result.practiceType)}${result.level?` • ${escapeHtml(result.level)}`:''} • ${new Date(result.date).toLocaleString()}</p><div class="result-score"><div class="big">${result.hasAnswerKey?result.marks:'—'}</div><small>${result.hasAnswerKey?`/ ${max}`:'score unavailable'}</small></div><div class="result-kpis"><div class="kpi"><strong>${result.correct}</strong><small>✓ Correct</small></div><div class="kpi"><strong>${result.incorrect}</strong><small>✕ Incorrect</small></div><div class="kpi"><strong>${result.skipped}</strong><small>− Skipped</small></div></div><div class="result-kpis" style="margin-top:10px"><div class="kpi"><strong>${result.hasAnswerKey?result.accuracy.toFixed(1)+'%':'—'}</strong><small>Accuracy</small></div><div class="kpi"><strong>${answered}</strong><small>Answered</small></div><div class="kpi"><strong>${formatDuration(result.elapsed)}</strong><small>Time Taken</small></div></div></div><div class="result-nav"><button class="result-tab active" data-practice-tab="overview">Overview</button><button class="result-tab" data-practice-tab="subjects">Subjects</button><button class="result-tab" data-practice-tab="review">Question Review</button></div><section class="report-card practice-result-section" data-practice-section="overview"><h3>📊 Detailed Analysis</h3>${keyNote}<div class="two-col"><div><p><b>${result.questions.length}</b> total questions</p><p><b>${answered}</b> answered</p><p><b>${result.skipped}</b> skipped</p></div><div><p><b>${result.correct}</b> correct</p><p><b>${result.incorrect}</b> incorrect</p><p><b>${result.scored}</b> questions with answer key</p></div></div><div class="quote-card">🎯 ${result.hasAnswerKey?(result.marks>=600?'Excellent work. Keep this consistency going!':result.marks>=500?'Strong attempt. Review the mistakes and push the next score higher.':'Use this result as feedback: revise the weak areas and reattempt the mistakes.'):'Your attempt is saved on this result screen. Add an answer key next time to unlock marks and accuracy.'}</div></section><section class="report-card practice-result-section" data-practice-section="subjects" style="display:none"><h3>📚 Subject Analysis</h3><div class="subject-grid">${subjectCards||'<div class="empty">No subject metadata available.</div>'}</div></section><section class="report-card practice-result-section" data-practice-section="review" style="display:none"><h3>📝 Detailed Question Review</h3><div class="question-list">${reviewRows||'<div class="empty">🎉 No incorrect or skipped questions. Excellent!</div>'}</div></section><div class="actions"><button id="practiceAgainBtn" class="primary">Practice Again →</button><button id="backPracticeBtn" class="secondary">Back to Practice</button></div>`;
 document.querySelectorAll('[data-practice-tab]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-practice-tab]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const id=btn.dataset.practiceTab;document.querySelectorAll('[data-practice-section]').forEach(x=>x.style.display=x.dataset.practiceSection===id?'block':'none')});
 $('practiceAgainBtn').onclick=()=>{showScreen('practice');openPracticeQuiz({title:result.title,questions:result.questions.map(q=>{const {userAnswer,correctAnswer,status,hasKey,...base}=q;return base}),level:result.level,practiceType:result.practiceType})};
 $('backPracticeBtn').onclick=()=>showScreen('practice');
}
/* PDF persistence: uploaded test papers are stored locally in IndexedDB.
   IndexedDB is the correct browser-local storage for large PDF Blobs; localStorage is too small.
   Every test gets its own PDF record, so Redo My Mistakes can reopen the exact source PDF later. */
const PDF_DB='StudyMatePDFs',PDF_STORE='papers',PDF_DB_VERSION=2;
function openPdfDb(){return new Promise((resolve,reject)=>{
  const r=indexedDB.open(PDF_DB,PDF_DB_VERSION);
  r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(PDF_STORE))db.createObjectStore(PDF_STORE)};
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('IndexedDB unavailable'));
})}
async function savePdfBlob(id,file){
  const db=await openPdfDb();
  await new Promise((res,rej)=>{const tx=db.transaction(PDF_STORE,'readwrite');tx.objectStore(PDF_STORE).put({blob:file,name:file.name,size:file.size,type:file.type,savedAt:Date.now()},id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error||new Error('PDF save failed'));tx.onabort=()=>rej(tx.error||new Error('PDF save aborted'))});
  const saved=await new Promise((res,rej)=>{const tx=db.transaction(PDF_STORE,'readonly');const req=tx.objectStore(PDF_STORE).get(id);req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)});
  db.close();
  if(!saved?.blob)throw new Error('PDF could not be verified after local save');
  return true;
}
async function getPdfBlob(id){
  const db=await openPdfDb();
  const out=await new Promise((res,rej)=>{const tx=db.transaction(PDF_STORE,'readonly');const req=tx.objectStore(PDF_STORE).get(id);req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)});
  db.close();
  return out?.blob||out||null;
}

async function renderHistoryPracticeQuiz(){
 const d=state.practiceQuiz;if(!d)return;const q=d.questions[d.index];
 let body='';
 if(q.pdf&&q.info)body='<div class="quiz-question" id="practiceHistoryViewer"><div class="viewer-placeholder">Loading original question…</div></div>';
 else body='<div class="quiz-question"><div class="viewer-placeholder">Original question PDF is not available on this device. You can still record the reattempt status.</div></div>';
 const current=d.answers[q.key]||'';
 $('practiceScreen').innerHTML=`<div class="page-head"><div><span class="eyebrow">PRACTICE FROM MY TESTS</span><h2>Q${q.number}</h2><div class="small-muted">${escapeHtml(q.recordName)} • Previous: ${escapeHtml(q.previous.status)}${q.previous.silly?' • Silly mistake':''}</div></div><button id="exitHistoryPractice" class="secondary">Exit</button></div>${body}<div class="report-card"><h3>How did your reattempt go?</h3><div class="status-options"><label><input type="radio" name="practiceStatus" value="Correct" ${current==='Correct'?'checked':''}><span class="correct">✓<b>Correct</b></span></label><label><input type="radio" name="practiceStatus" value="Incorrect" ${current==='Incorrect'?'checked':''}><span class="incorrect">×<b>Incorrect</b></span></label><label><input type="radio" name="practiceStatus" value="Skipped" ${current==='Skipped'?'checked':''}><span class="skipped">−<b>Skipped</b></span></label></div></div><div class="actions between"><button id="hpPrev" class="secondary">← Previous</button><button id="hpNext" class="primary">${d.index===d.questions.length-1?'Finish':'Next →'}</button></div>`;
 document.querySelectorAll('input[name="practiceStatus"]').forEach(b=>b.onchange=()=>{d.answers[q.key]=b.value});
 $('exitHistoryPractice').onclick=()=>{state.practiceQuiz=null;showScreen('practice')};
 $('hpPrev').onclick=()=>{if(d.index>0){d.index--;renderHistoryPracticeQuiz()}};
 $('hpNext').onclick=()=>{if(d.index<d.questions.length-1){d.index++;renderHistoryPracticeQuiz()}else finishHistoryPractice()};
 if(q.pdf&&q.info)await renderHistoryPdfQuestion(q);
}
async function renderHistoryPdfQuestion(q){const el=$('practiceHistoryViewer');try{const page=await q.pdf.getPage(q.info.pageNo),scale=1.25,vp=page.getViewport({scale}),x0=q.info.x0*scale,x1=q.info.x1*scale,top=q.info.top*scale,bottom=q.info.bottom*scale,canvas=document.createElement('canvas');canvas.width=Math.ceil(x1-x0);canvas.height=Math.ceil(bottom-top);await page.render({canvasContext:canvas.getContext('2d'),viewport:vp,transform:[1,0,0,1,-x0,-top]}).promise;el.innerHTML='';el.appendChild(canvas)}catch(e){el.innerHTML='<div class="viewer-placeholder">Could not render this question.</div>'}}
function finishHistoryPractice(){
 const d=state.practiceQuiz,attempts=[];
 d.questions.forEach(q=>{const current=d.answers[q.key];if(current)attempts.push({key:q.key,testId:q.recordId,question:q.number,previousStatus:q.previous.status,currentStatus:current,date:new Date().toISOString()})});
 const all=JSON.parse(localStorage.getItem(LS.practice)||'[]');
 localStorage.setItem(LS.practice,JSON.stringify([...attempts,...all].slice(0,500)));
 const improved=attempts.filter(x=>x.previousStatus!=='Correct'&&x.currentStatus==='Correct').length;
 state.practiceQuiz=null;showScreen('practice');
 toast(improved?`Practice complete — ${improved} question${improved===1?'':'s'} improved to Correct.`:'Practice complete. Your reattempts were saved.');
}
/* ===== Day Summary ===== */
const DAY_SUMMARY_KEY='studymate_day_summaries_v1';
function getDaySummaries(){try{return JSON.parse(localStorage.getItem(DAY_SUMMARY_KEY)||'{}')}catch{return{}}}
function saveDaySummaries(x){localStorage.setItem(DAY_SUMMARY_KEY,JSON.stringify(x))}
function renderDaySummary(){const all=getDaySummaries(),today=new Date().toISOString().slice(0,10),d=all[today]||{study:'',questions:'',time:'',reflection:''};$('daySummaryContent').innerHTML=`<form id="daySummaryForm" class="panel day-summary-form"><div class="field"><label>📚 What did you study?</label><textarea id="dsStudy" rows="4" placeholder="e.g. Physics — Kinematics; Chemistry — Chemical Bonding; Biology — Cell">${escapeHtml(d.study)}</textarea></div><div class="two-col"><div class="field"><label>❓ Questions practiced</label><input id="dsQuestions" type="number" min="0" value="${escapeHtml(d.questions)}" placeholder="e.g. 260"></div><div class="field"><label>⏱️ Effective study time</label><input id="dsTime" value="${escapeHtml(d.time)}" placeholder="e.g. 6h 25m"></div></div><div class="field"><label>💭 How was your day? <span class="small-muted">(optional)</span></label><textarea id="dsReflection" rows="3" placeholder="A short reflection…">${escapeHtml(d.reflection)}</textarea></div><div class="actions"><button class="primary">Save Today's Summary ✓</button></div></form><div class="report-card"><div class="tracker-head"><div><h3>Recent Days</h3><span class="small-muted">Your self-recorded study history.</span></div></div><div class="day-summary-history">${Object.entries(all).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,14).map(([date,x])=>`<div class="day-summary-row"><strong>${new Date(date+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}</strong><span>${escapeHtml(x.study||'—')}</span><b>${escapeHtml(x.questions||'0')} Q</b><b>${escapeHtml(x.time||'—')}</b></div>`).join('')||'<div class="empty">Save your first day summary.</div>'}</div></div>`;$('daySummaryForm').onsubmit=e=>{e.preventDefault();all[today]={study:$('dsStudy').value.trim(),questions:Number($('dsQuestions').value||0),time:$('dsTime').value.trim(),reflection:$('dsReflection').value.trim(),savedAt:new Date().toISOString()};saveDaySummaries(all);renderDaySummary();toast('Day summary saved ✓')}}

/* ===== Mistake Notebook ===== */
async function renderMistakeNotebook(){
  const h=getHistory(),groups={Physics:[],Chemistry:[],Botany:[],Zoology:[]};
  h.forEach(r=>(r.questions||[]).forEach(q=>{if(!q.mistakeSaved)return;const s=q.s||subjectFor(q.number,r.questions.length)||'Other';if(groups[s])groups[s].push({record:r,q});}));
  Object.values(groups).forEach(a=>a.sort((x,y)=>Number(x.q.number)-Number(y.q.number)));
  const total=Object.values(groups).reduce((n,a)=>n+a.length,0),box=$('mistakeNotebookContent');
  if(!total){box.innerHTML='<div class="empty">Your Mistake Notebook is empty.<br><br>After a test, open the Incorrect Questions section and tick <b>“Add to Mistake Notebook”</b> for the questions you want to keep.</div>';return}
  const sections=Object.entries(groups).map(([subject,items])=>`<section class="mistake-subject-section"><div class="mistake-subject-head"><div><span class="eyebrow">${subject.toUpperCase()}</span><h3>${subject}</h3></div><span class="badge incorrect">${items.length} saved</span></div>${items.length?`<div class="mistake-list">${items.map((it,i)=>`<article class="mistake-entry"><div class="mistake-entry-head"><div><strong>Q${it.q.number}</strong><span>${escapeHtml(it.record.name)}</span></div><div class="mistake-tags"><span class="badge incorrect">${it.q.silly?'Silly Mistake':escapeHtml(it.q.status)}</span>${it.q.topic?`<span class="topic-pill">${escapeHtml(it.q.topic)}</span>`:'<span class="topic-pill">Topic not recorded</span>'}</div></div><div class="mistake-question-viewer" id="mistakeViewer_${escapeHtml(it.record.id)}_${it.q.number}"><div class="viewer-placeholder">Loading exact PDF question…</div></div></article>`).join('')}</div>`:'<div class="small-muted">No saved mistakes from this subject.</div>'}</section>`).join('');
  box.innerHTML=`<div class="mistake-notebook-summary report-card"><h3>📓 Mistake Notebook</h3><p>${total} question${total===1?'':'s'} saved for focused practice. Questions are separated by subject and ordered by question number.</p></div>${sections}<div class="mistake-practice-cta"><h3>Ready to fix your mistakes?</h3><p>Reattempt the exact original PDF questions you deliberately saved.</p><button class="primary" id="notebookRedoBtn">🔄 Redo My Mistakes</button></div>`;
  $('notebookRedoBtn').onclick=()=>startRedoFromNotebook(groups);
  for(const [subject,items] of Object.entries(groups))for(const it of items){const el=$(`mistakeViewer_${it.record.id}_${it.q.number}`);if(el)await renderMistakeEntryPdf(it,el);}
}
async function startRedoFromNotebook(groups){
 const items=Object.values(groups).flat();
 if(!items.length){toast('No saved mistakes to redo.');return;}
 const questions=[];
 for(const item of items.slice(0,30)){let pdf=null,info=null;try{const blob=await getPdfBlob(item.record.id);if(blob&&pdfjsLib){pdf=await pdfjsLib.getDocument({data:await blob.arrayBuffer()}).promise;const map=await extractPdfMap(pdf);info=map.get(Number(item.q.number));}}catch(e){console.warn('Redo PDF load failed',e)} questions.push({key:`${item.record.id}:${item.q.number}`,number:item.q.number,pdf,info,recordName:item.record.name,previous:item.q,status:null,recordId:item.record.id});}
 state.practiceQuiz={title:'Redo My Mistakes',questions,index:0,answers:{},historyMode:true};showScreen('practice');await renderHistoryPracticeQuiz();
}
async function renderMistakeEntryPdf(item,el){if(!el)return;if(!item.record.hasPdf){el.innerHTML='<div class="viewer-placeholder">This test was analysed without a saved PDF.</div>';return}try{const blob=await getPdfBlob(item.record.id);if(!blob)throw new Error('missing');const pdf=await pdfjsLib.getDocument({data:await blob.arrayBuffer()}).promise;const map=await extractPdfMap(pdf),info=map.get(Number(item.q.number));if(!info)throw new Error('question not found');await renderPdfInfoToElement(pdf,info,el,1.25)}catch(e){console.warn(e);el.innerHTML='<div class="viewer-placeholder">Could not load the exact PDF cutout. The original PDF may have been removed from this browser.</div>'}}

/* ===== Backup & Restore: local data + original PDF blobs ===== */
async function readAllPdfRecords(){const db=await openPdfDb();const out=await new Promise((res,rej)=>{const tx=db.transaction(PDF_STORE,'readonly'),req=tx.objectStore(PDF_STORE).getAll();req.onsuccess=()=>res(req.result||[]);req.onerror=()=>rej(req.error)});db.close();return out}
function blobToDataURL(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(blob)})}
function dataURLToBlob(data){const [head,b64]=data.split(',');const mime=(head.match(/data:(.*?);/)||[])[1]||'application/octet-stream';const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type:mime})}
async function makeBackup(){
 const btn=$('backupBtn'); if(btn){btn.disabled=true;btn.textContent='Creating Backup…';}
 try{
  const pdfs=await readAllPdfRecords(),pdfData=[];
  for(const x of pdfs){if(!x?.blob)continue;pdfData.push({...x,blob:await blobToDataURL(x.blob)});}
  const payload={format:'StudyMate Backup',version:2,createdAt:new Date().toISOString(),localStorage:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])),pdfs:pdfData};
  const blob=new Blob([JSON.stringify(payload)],{type:'application/octet-stream'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`StudyMate_Backup_${new Date().toISOString().slice(0,10)}.smbackup`;a.textContent='Download Backup';a.className='primary';a.style.display='inline-block';a.style.marginTop='10px';const card=document.querySelector('#backupBtn')?.closest('.report-card');if(card){card.querySelector('.backup-download')?.remove();const wrap=document.createElement('div');wrap.className='backup-download';wrap.appendChild(a);card.appendChild(wrap)}document.body.appendChild(a);a.click();setTimeout(()=>{document.body.contains(a)&&a.remove();},1000);setTimeout(()=>URL.revokeObjectURL(url),60000);
  localStorage.setItem('studymate_last_backup',new Date().toISOString());toast(`Backup created ✓ ${pdfData.length} PDF${pdfData.length===1?'':'s'} included`);
 }catch(e){console.error('Backup failed',e);alert('Backup could not be created. Please try again. If this continues, check that browser storage is available and try clearing no StudyMate data.');}
 finally{if(btn){btn.disabled=false;btn.textContent='Create Backup';}}
}
async function restoreBackup(file){if(!file)return;try{const payload=JSON.parse(await file.text());if(payload.format!=='StudyMate Backup')throw new Error('Invalid backup file');if(!confirm('Restore this backup? Current StudyMate data will be replaced.'))return;localStorage.clear();Object.entries(payload.localStorage||{}).forEach(([k,v])=>localStorage.setItem(k,v));const db=await openPdfDb();await new Promise((res,rej)=>{const tx=db.transaction(PDF_STORE,'readwrite');tx.objectStore(PDF_STORE).clear();tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});for(const x of (payload.pdfs||[])){await new Promise((res,rej)=>{const tx=db.transaction(PDF_STORE,'readwrite');tx.objectStore(PDF_STORE).put({blob:dataURLToBlob(x.blob),name:x.name,size:x.size,type:x.type,savedAt:x.savedAt},x.id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});}db.close();toast('Restore complete. Reloading…');setTimeout(()=>location.reload(),700)}catch(e){console.error(e);alert('Could not restore this backup. The file may be damaged or from an incompatible StudyMate version.')}}

/* Security */
async function hash(text){const data=new TextEncoder().encode(text);const buf=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function getSecurity(){try{return JSON.parse(localStorage.getItem(LS.security)||'null')}catch{return null}}
async function saveSecurity(pin,questions){const payload={enabled:true,pinHash:await hash(pin),questions:await Promise.all(questions.map(async x=>({q:x.q,a:await hash(x.a.trim().toLowerCase())}))),failed:0,lockUntil:0,auto:'immediately'};localStorage.setItem(LS.security,JSON.stringify(payload));}
function applyTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem('studymate_theme',theme)}
function toLocalDateTimeInput(ms){const d=new Date(ms);const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`}
function renderSettings(){const s=getSecurity(),theme=localStorage.getItem('studymate_theme')||'system';$('settingsContent').innerHTML=`<div class="settings-stack"><div class="report-card"><h3>🔐 Security</h3><div class="settings-row"><div><b>App Lock</b><div class="small-muted">Protect StudyMate with your passcode.</div></div><label class="switch"><input id="securityToggle" type="checkbox" ${s?.enabled?'checked':''}><span></span></label></div>${s?.enabled?`<div class="settings-row"><div><b>Change Passcode</b></div><button class="secondary" id="changePinBtn">Change</button></div><div class="settings-row"><div><b>Security Questions</b><div class="small-muted">Three recovery answers.</div></div><button class="secondary" id="changeRecoveryBtn">Change</button></div><div class="settings-row"><div><b>Auto Lock</b></div><select id="autoLock" style="width:150px"><option value="immediately">Immediately</option><option value="1m">1 minute</option><option value="5m">5 minutes</option><option value="15m">15 minutes</option><option value="never">Never</option></select></div>`:''}</div><div class="report-card"><h3>💾 Backup & Restore</h3><p class="small-muted">Backup your StudyMate data and the original PDFs used for exact mistake-question cutouts.</p><p class="small-muted">Last backup: ${localStorage.getItem('studymate_last_backup')?new Date(localStorage.getItem('studymate_last_backup')).toLocaleString():'Not created yet'}</p><div class="actions"><button class="primary" id="backupBtn">Create Backup</button><button class="secondary" id="restoreBtn">Restore Backup</button></div></div><div class="report-card"><h3>🎨 Appearance</h3><div class="theme-options"><button class="${theme==='light'?'active':''}" data-theme-choice="light">☀️ Light</button><button class="${theme==='dark'?'active':''}" data-theme-choice="dark">🌙 Dark</button><button class="${theme==='system'?'active':''}" data-theme-choice="system">⚙️ System</button></div></div><div class="report-card"><h3>🩺 NEET 2027 Countdown</h3><p class="small-muted">NTA has not published the NEET UG 2027 date in its current notice archive. You can set your target date here.</p><input id="neetTargetInput" type="datetime-local" value="${toLocalDateTimeInput(getNeetTarget())}"><button class="primary" id="saveNeetTarget" style="margin-top:10px">Save Target Date</button></div></div>`;$('securityToggle').onchange=async e=>{if(e.target.checked)setupSecurity();else if(confirm('Disable App Lock?')){localStorage.removeItem(LS.security);toast('App Lock disabled.');renderSettings()}else e.target.checked=true};if(s?.enabled){$('autoLock').value=s.auto||'immediately';$('autoLock').onchange=e=>{const x=getSecurity();x.auto=e.target.value;localStorage.setItem(LS.security,JSON.stringify(x))};$('changePinBtn').onclick=()=>changePinFlow();$('changeRecoveryBtn').onclick=()=>setupRecovery(true)}$('backupBtn').onclick=makeBackup;$('restoreBtn').onclick=()=>{$('restoreFileInput').value='';$('restoreFileInput').click()};$('restoreFileInput').onchange=e=>restoreBackup(e.target.files[0]);document.querySelectorAll('[data-theme-choice]').forEach(b=>b.onclick=()=>{applyTheme(b.dataset.themeChoice);renderSettings()});$('saveNeetTarget').onclick=()=>{const v=$('neetTargetInput').value;if(!v)return;localStorage.setItem('studymate_neet_target',new Date(v).toISOString());renderCountdown();toast('Countdown target updated ✓')}}

async function setupSecurity(){const pin=prompt('Create a 4–6 digit passcode:');if(!/^\d{4,6}$/.test(pin||'')){toast('Passcode must be 4–6 digits.');renderSettings();return}const confirmPin=prompt('Confirm passcode:');if(pin!==confirmPin){toast('Passcodes do not match.');renderSettings();return}const qs=[];for(let i=1;i<=3;i++){const q=prompt(`Recovery question ${i}:`);if(!q){toast('All 3 questions are required.');renderSettings();return}const a=prompt(`Answer for question ${i}:`);if(!a){toast('All 3 answers are required.');renderSettings();return}qs.push({q,a})}await saveSecurity(pin,qs);toast('App Lock enabled.');renderSettings()}
async function setupRecovery(replace=false){const s=getSecurity();if(!s)return;const qs=[];for(let i=1;i<=3;i++){const q=prompt(`New recovery question ${i}:`);const a=prompt(`Answer for question ${i}:`);if(!q||!a)return toast('Recovery setup cancelled.');qs.push({q,a})}s.questions=await Promise.all(qs.map(async x=>({q:x.q,a:await hash(x.a.trim().toLowerCase())})));localStorage.setItem(LS.security,JSON.stringify(s));toast('Recovery questions updated.');renderSettings()}
async function changePinFlow(){const s=getSecurity();if(!s)return;const old=prompt('Enter current passcode:');if(!old||await hash(old)!==s.pinHash)return toast('Incorrect passcode.');const p=prompt('New 4–6 digit passcode:');const c=prompt('Confirm new passcode:');if(!/^\d{4,6}$/.test(p)||p!==c)return toast('Invalid or mismatched passcode.');s.pinHash=await hash(p);localStorage.setItem(LS.security,JSON.stringify(s));toast('Passcode changed.')}
async function lockIfNeeded(){const s=getSecurity();if(!s?.enabled)return;showLock()}
function showLock(){$('lockScreen').classList.remove('hidden');renderLockBody()}
function hideLock(){$('lockScreen').classList.add('hidden');const s=getSecurity();if(s){s.failed=0;s.lockUntil=0;localStorage.setItem(LS.security,JSON.stringify(s))}}
function renderLockBody(){const s=getSecurity();if(s?.lockUntil>Date.now()){$('lockBody').innerHTML=`<p>Please wait before trying again.</p>`;setTimeout(renderLockBody,Math.min(5000,s.lockUntil-Date.now()+20));return}$('lockBody').innerHTML='<input id="lockPin" class="pin" type="password" inputmode="numeric" maxlength="6" placeholder="••••••"><div class="actions"><button class="primary" id="unlockBtn">Unlock</button></div><button class="secondary" id="forgotBtn" style="width:100%;margin-top:8px">Forgot Passcode?</button>';$('unlockBtn').onclick=unlock;$('forgotBtn').onclick=recoverPasscode;$('lockPin').focus()}
async function unlock(){const s=getSecurity(),p=$('lockPin').value;if(await hash(p)===s.pinHash){hideLock();return}s.failed=(s.failed||0)+1;const delay=Math.min(30000,1000*2**Math.min(5,s.failed));s.lockUntil=Date.now()+delay;localStorage.setItem(LS.security,JSON.stringify(s));toast('Incorrect passcode.');renderLockBody()}
async function recoverPasscode(){const s=getSecurity();if(!s?.questions?.length)return;const answers=[];for(const item of s.questions){const a=prompt(item.q);if(a===null)return;answers.push(await hash(a.trim().toLowerCase()))}if(answers.some((a,i)=>a!==s.questions[i].a))return toast('Recovery answers did not match.');const p=prompt('Verified. Create a new 4–6 digit passcode:');const c=prompt('Confirm new passcode:');if(!/^\d{4,6}$/.test(p)||p!==c)return toast('Invalid or mismatched passcode.');s.pinHash=await hash(p);s.failed=0;s.lockUntil=0;localStorage.setItem(LS.security,JSON.stringify(s));hideLock();toast('Passcode reset successfully.')}
let lastHidden=0;document.addEventListener('visibilitychange',()=>{if(document.hidden){lastHidden=Date.now();return}const s=getSecurity();if(!s?.enabled)return;const auto=s.auto||'immediately';if(auto==='immediately'||(auto!=='never'&&Date.now()-lastHidden>({ '1m':60000,'5m':300000,'15m':900000}[auto]||0)))showLock()});
$('saveNameBtn').onclick=()=>{const n=$('nameInput').value.trim().replace(/\s+/g,' ');if(!n)return toast('Please enter your name.');localStorage.setItem('studymate_user_name',n);$('nameModal').classList.add('hidden');refreshHome();toast(`Welcome to StudyMate, ${n}!`)};
$('nameInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('saveNameBtn').click()});
refreshHome();renderReports();renderCountdown();lockIfNeeded();setInterval(refreshHome,60000);setInterval(renderCountdown,1000);setTimeout(ensureName,250);

/* ===== FINAL UX: animations, Success Planner, daily to-do, NEET motivation ===== */
const EXTRA_SCREENS = ['home','practice','reports','history','about','analysis','summary','result','settings','planner','todo','daySummary','mistakeNotebook','ncert','goals','comparison','revision','weakness','studymate','nextTest'];
function showScreen(name){
  EXTRA_SCREENS.forEach(s=>$(s+'Screen')?.classList.toggle('active',s===name));
  document.querySelectorAll('.nav-btn,[data-screen]').forEach(b=>b.classList.toggle('active',b.dataset.screen===name));
  if(name==='home'){if(state.test&&state.questions?.length&&document.getElementById('analysisScreen')?.classList.contains('active'))saveAnalysisDraft();refreshHome();}
  if(name==='history') renderHistory();
  if(name==='reports') renderReports();
  if(name==='settings') renderSettings();
  if(name==='planner') renderSuccessPlanner();
  if(name==='todo') renderTodo();
  if(name==='daySummary') renderDaySummary();
  if(name==='mistakeNotebook') renderMistakeNotebook();
  if(name==='ncert') renderNcertFocus();
  if(name==='goals') renderDailyGoals();
  if(name==='comparison') renderTestComparison();
  if(name==='revision') renderIntelligentRevision();
  if(name==='weakness') renderSmartWeakness();
  if(name==='studymate') renderPersonalStudyMate();
  if(name==='nextTest') renderNextTest();
  window.scrollTo({top:0,behavior:'smooth'});
}

// Correct navigation for the newly interactive home cards.
$('homePlanner')?.addEventListener('click',e=>{e.preventDefault();showScreen('planner')});
$('todoCard')?.addEventListener('click',()=>showScreen('todo'));
$('neetCard')?.addEventListener('click',()=>openMotivation());

// Small appreciation after every answer-status selection.
document.addEventListener('change',e=>{
  if(e.target.name!=='status') return;
  const q=state.questions[state.current];
  const messages={
    Correct:['🎉 Nice one!','Great! Keep that confidence going.'],
    Incorrect:['💡 That’s okay!','Every mistake gives you something to improve.'],
    Skipped:['🧠 No worries!','We’ll come back to this and turn it into a strength.']
  };
  const msg=messages[q.status];
  const box=$('questionExtra');
  if(box && msg){
    let el=box.querySelector('.status-appreciation');
    if(!el){el=document.createElement('div');el.className='status-appreciation';box.prepend(el)}
    el.innerHTML=`<strong>${msg[0]}</strong><span>${msg[1]}</span>`;
    el.classList.remove('appreciation-in'); void el.offsetWidth; el.classList.add('appreciation-in');
  }
  const selected=document.querySelector(`input[name="status"][value="${CSS.escape(q.status)}"]+span`);
  if(selected){selected.classList.remove('selected-pop');void selected.offsetWidth;selected.classList.add('selected-pop')}
});

// Global touch/click feedback so cards and controls never feel static.
document.addEventListener('click',e=>{
  const btn=e.target.closest('button');
  if(!btn || btn.disabled) return;
  btn.classList.remove('tap-animate'); void btn.offsetWidth; btn.classList.add('tap-animate');
  if(navigator.vibrate) try{navigator.vibrate(8)}catch{}
},true);

// ===== NEET Success Planner =====
// Planner is intentionally checklist-based and has NO reset button.
const PLANNER_KEY='studymate_success_planner_v1';
const PLANNER_STEPS=[
  {key:'lectures',label:'Lectures / Recorded'},
  {key:'notes',label:'Class Notes'},
  {key:'dpp',label:'DPP'},
  {key:'module',label:'Module / Practice Sheet'},
  {key:'pyq',label:'PYQs'},
  {key:'ncert',label:'NCERT Reading',bioOnly:true},
  {key:'test',label:'Test / RBT / AITS'},
  {key:'rev1',label:'Rev-1',sub:'1 day'},
  {key:'rev2',label:'Rev-2',sub:'3 days'},
  {key:'rev3',label:'Rev-3',sub:'7 days'},
  {key:'rev4',label:'Rev-4',sub:'21 days'},
  {key:'rev5',label:'Rev-5',sub:'Before full test'},
  {key:'mastered',label:'Mastered'}
];
function getPlanner(){try{return JSON.parse(localStorage.getItem(PLANNER_KEY)||'{}')}catch{return{}}}
function savePlanner(x){localStorage.setItem(PLANNER_KEY,JSON.stringify(x))}
function plannerChapterStatus(data,s,c){
  const x=data[`${s}::${c}`]||{};
  const steps=(s==='Botany'||s==='Zoology')?PLANNER_STEPS:PLANNER_STEPS.filter(st=>!st.bioOnly);
  const total=steps.length;
  const checked=steps.filter(st=>!!x[st.key]).length;
  const pct=Math.round(checked/total*100);
  const complete=!!x.mastered;
  let status='Not Started';
  if(complete || checked===total) status='Mastered';
  else if(pct>=75) status='On Track';
  else if(checked>0) status='Needs Work';
  return {...x,checked,total,pct,complete,status};
}
function renderSuccessPlanner(){
  const data=getPlanner();
  let total=0,completed=0,mastered=0,needs=0,notStarted=0;
  SUBJECTS.forEach(s=>SYLLABUS[s].forEach(c=>{total++;const st=plannerChapterStatus(data,s,c);if(st.mastered)mastered++;else if(st.status==='On Track')completed++;else if(st.checked>0)needs++;else notStarted++;}));
  const progress=total?Math.round((mastered+completed)/total*100):0;
  $('plannerContent').innerHTML=`<div class="planner-hero report-card"><div class="planner-hero-copy"><span class="eyebrow">YAKEEN 2.0 • DROPper WORKFLOW</span><h3>NEET Success Planner</h3><p>Follow the Yakeen-style flow: lectures → notes → DPP → module/practice → PYQs → NCERT for Biology → tests → revision.</p></div><div class="planner-progress" style="--planner-pct:${progress}%"><strong>${progress}%</strong><span>overall</span></div></div><div class="planner-stats report-card"><div><strong>${total}</strong><small>Total Chapters</small></div><div><strong>${completed}</strong><small>On Track</small></div><div><strong>${needs}</strong><small>In Progress</small></div><div><strong>${notStarted}</strong><small>Not Started</small></div><div><strong>${mastered}</strong><small>Mastered</small></div></div><div class="planner-tabs">${SUBJECTS.map((s,i)=>`<button type="button" class="planner-tab ${i===0?'active':''}" data-planner-sub="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}</div><div id="plannerPanel"></div><div class="planner-note report-card"><strong>📚 Yakeen 2.0 workflow</strong><span>Daily classes, DPPs, notes, practice material, PYQs, tests and revision are tracked here. NCERT milestone is shown only for Botany and Zoology.</span></div>`;
  let activeSubject='Physics',activeIndex=0;
  const renderSubject=(subject,chapterIndex=0)=>{
    activeSubject=subject;
    const steps=(subject==='Botany'||subject==='Zoology')?PLANNER_STEPS:PLANNER_STEPS.filter(st=>!st.bioOnly);
    const chapters=SYLLABUS[subject],i=Math.max(0,Math.min(chapterIndex,chapters.length-1));activeIndex=i;const chapter=chapters[i];
    const key=`${subject}::${chapter}`,x=data[key]||{},st=plannerChapterStatus(data,subject,chapter);
    const mobileSteps=steps.map(step=>`<label class="planner-mobile-step ${x[step.key]?'checked':''}"><span><b>${escapeHtml(step.label)}</b>${step.sub?`<small>${escapeHtml(step.sub)}</small>`:''}</span><input type="checkbox" data-planner-key="${escapeHtml(key)}" data-planner-step="${step.key}" ${x[step.key]?'checked':''}><i>${x[step.key]?'✓':''}</i></label>`).join('');
    $('plannerPanel').innerHTML=`<div class="report-card planner-table-card"><div class="planner-table-head"><div><h3>${escapeHtml(subject)}</h3><span class="small-muted">Chapter ${i+1} of ${chapters.length}</span></div><span class="planner-legend">${st.pct}% complete</span></div><article class="planner-mobile-card ${st.status.toLowerCase().replace(' ','')}"><div class="planner-mobile-card-head"><div><span class="planner-number-badge">${i+1}</span><strong>${escapeHtml(chapter)}</strong><small>${st.checked}/${st.total} milestones completed</small></div><span class="planner-mobile-status">${st.mastered?'🏆 Mastered':st.status==='On Track'?'🟢 On Track':st.checked?'🟡 Needs Work':'🔴 Not Started'}</span></div><div class="planner-mobile-progress"><span style="width:${st.pct}%"></span></div><div class="planner-mobile-steps">${mobileSteps}</div></article><div class="planner-chapter-nav"><button class="secondary" id="plannerPrev" ${i===0?'disabled':''}>← Previous Chapter</button><span class="planner-chapter-count">${i+1} / ${chapters.length}</span><button class="secondary" id="plannerNext" ${i===chapters.length-1?'disabled':''}>Next Chapter →</button></div></div>`;
    bindPlannerChecks(subject,i);$('plannerPrev').onclick=()=>renderSubject(subject,i-1);$('plannerNext').onclick=()=>renderSubject(subject,i+1);
  };
  function bindPlannerChecks(subject,chapterIndex){document.querySelectorAll('[data-planner-key]').forEach(cb=>cb.onchange=()=>{const all=getPlanner(),item=all[cb.dataset.plannerKey]||{};item[cb.dataset.plannerStep]=cb.checked;item.lastStudy=new Date().toISOString();all[cb.dataset.plannerKey]=item;savePlanner(all);data[cb.dataset.plannerKey]=item;renderSubject(subject,chapterIndex);toast(cb.checked?'Milestone completed ✓':'Milestone unchecked');});}
  renderSubject('Physics',0);
  document.querySelectorAll('[data-planner-sub]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-planner-sub]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderSubject(b.dataset.plannerSub,0)});
}

// ===== Daily To-Do =====
const TODO_KEY='studymate_todo_v1';
function getTodos(){try{return JSON.parse(localStorage.getItem(TODO_KEY)||'[]')}catch{return[]}}
function saveTodos(x){localStorage.setItem(TODO_KEY,JSON.stringify(x))}
function renderTodo(){
  const todos=getTodos();
  const today=new Date().toISOString().slice(0,10);
  const todays=todos.filter(t=>t.date===today);
  const completed=todays.filter(t=>t.done).length;
  $('todoContent').innerHTML=`<div class="todo-summary report-card"><div><span class="eyebrow">TODAY</span><h3>${completed}/${todays.length} tasks completed</h3><div class="barline"><i style="width:${todays.length?completed/todays.length*100:0}%"></i></div></div><span class="todo-emoji">🎯</span></div><form id="todoForm" class="todo-add report-card"><div><label for="todoInput">Add a task</label><input id="todoInput" type="text" maxlength="100" placeholder="e.g. Revise Kinematics for 45 minutes" required></div><button class="primary" type="submit">＋ Add Task</button></form><div class="report-card"><div class="tracker-head"><div><h3>Today’s Tasks</h3><span class="small-muted">Complete, edit or remove anything you add.</span></div><button type="button" class="secondary" id="clearDoneTodos">Clear completed</button></div><div class="todo-list">${todays.length?todays.map(t=>`<div class="todo-item ${t.done?'done':''}" data-todo-id="${t.id}"><button type="button" class="todo-check" data-todo-toggle="${t.id}">${t.done?'✓':''}</button><span class="todo-text">${escapeHtml(t.text)}</span><button type="button" class="todo-delete" data-todo-delete="${t.id}" aria-label="Delete">×</button></div>`).join(''):'<div class="empty">No tasks yet. Add your first task for today. 🌱</div>'}</div></div>`;
  $('todoForm').onsubmit=e=>{e.preventDefault();const text=$('todoInput').value.trim();if(!text)return;const all=getTodos();all.unshift({id:uid(),text,date:today,done:false,createdAt:Date.now()});saveTodos(all);renderTodo();toast('Task added ✓')};
  document.querySelectorAll('[data-todo-toggle]').forEach(b=>b.onclick=()=>{const all=getTodos(),t=all.find(x=>x.id===b.dataset.todoToggle);if(t)t.done=!t.done;saveTodos(all);renderTodo();toast(t?.done?'Task completed 🎉':'Task reopened')});
  document.querySelectorAll('[data-todo-delete]').forEach(b=>b.onclick=()=>{saveTodos(getTodos().filter(x=>x.id!==b.dataset.todoDelete));renderTodo();toast('Task removed')});
  $('clearDoneTodos').onclick=()=>{saveTodos(getTodos().filter(x=>!(x.date===today&&x.done)));renderTodo();toast('Completed tasks cleared')};
}

// ===== Rotating NEET 2027 motivation =====
const NEET_MESSAGES=[
  ['You can do it. 💙','The dream may feel far away today, but every chapter you finish is one step closer to the white coat. Keep going.'],
  ['One day, you’ll thank yourself. 🌱','There will be a day when the long hours, missed comforts and difficult questions were all worth it. Don’t give up on that future you.'],
  ['Your dream deserves your consistency. 🩺','You do not need a perfect day. You only need to keep showing up, even on the days when motivation is low.'],
  ['For the version of you who is waiting. ❤️','Imagine opening your result and seeing the score you once thought was impossible. Keep studying for that person.'],
  ['A bad test is not a bad future. 🌤️','Marks can fall. Confidence can shake. But neither decides where you finish. Learn, recover, and continue.'],
  ['Keep going, future doctor. 🥹','Some days you will feel tired. Some days you will doubt yourself. That does not mean you are failing—it means you are human.'],
  ['Small progress is still progress. ✨','One question. One revision. One chapter. One better test. These small things quietly build the future you want.'],
  ['Your parents will see the journey. ❤️','Every early morning, every sacrifice and every difficult chapter is part of a story that will one day make you proud.'],
  ['Don’t quit on your hardest day. 🔥','The hardest day is often the day when continuing matters most. Rest if you need to, then come back stronger.'],
  ['NEET 2027 is a destination, not a deadline. 🎯','You are building your preparation one day at a time. Trust the process and keep moving forward.']
];
let motivationIndex=-1;
function openMotivation(){
  motivationIndex=(motivationIndex+1)%NEET_MESSAGES.length;
  const [title,text]=NEET_MESSAGES[motivationIndex];
  $('motivationContent').innerHTML=`<div class="motivation-art">🩺✨</div><h2 class="motivation-title">${escapeHtml(title)}</h2><p class="motivation-text">${escapeHtml(text)}</p><div class="motivation-footer">NEET 2027 • Keep believing in yourself.</div>`;
  openModal('motivationModal');
}
$('anotherMotivation')?.addEventListener('click',openMotivation);

// Home greeting: keep name small and use time-aware copy.
function timeGreeting(){
  const h=new Date().getHours();
  if(h<5)return ['Good Night','Rest well. Tomorrow is another chance to get closer. 🌙'];
  if(h<12)return ['Good Morning','Start strong. One focused session at a time. ☀️'];
  if(h<17)return ['Good Afternoon','Keep your momentum going. You are still one step closer. 💙'];
  if(h<21)return ['Good Evening','Still one step closer to your dream. ✨'];
  return ['Good Night','Be proud of today, then come back stronger tomorrow. 🌙'];
}
function getDailyQuote(){
  const quotes=[
    'Your dream deserves your consistency. 🩺',
    'One day, you will thank yourself for not giving up today. 🌱',
    'A bad test is not a bad future. 🌤️',
    'Small progress is still progress. ✨',
    'Keep going, future doctor. 💙',
    'Don’t quit on your hardest day. 🔥',
    'One focused session at a time. You’ve got this. 💪',
    'Your effort today is building tomorrow’s result. 🩺',
    'You do not need a perfect day. You need a consistent one. 🌱',
    'Trust the process. Keep studying, keep improving. 🎯'
  ];
  const d=new Date();
  const key=Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000;
  return quotes[((Math.floor(key)%quotes.length)+quotes.length)%quotes.length];
}
function refreshHome(){
  const h=getHistory(),name=getUserName(),doctor=shouldShowDoctor(h),g=timeGreeting();
  const title=$('greetingTitle'); if(title) title.innerHTML=`${escapeHtml(g[0])}${name?`, <span class="home-name">${doctor?'Dr. ':''}${escapeHtml(name)}</span>`:'!'}`;
  const quote=$('dailyQuote'); if(quote) quote.textContent=getDailyQuote();
  const sub=$('greetingSub'); if(sub) sub.textContent=doctor?'Five consecutive 600+ tests. Keep going, Doctor! 🩺':g[1];
  const ach=$('achievementCard');
  if(ach){if(doctor){ach.classList.remove('hidden');ach.innerHTML=`<div class="achievement-title">🏆 ACHIEVEMENT UNLOCKED</div><strong>🩺 Dr. ${escapeHtml(name)} — 600+ Excellence Streak</strong><p>600+ in each of your last 5 tests. Consistency turns preparation into success.</p>`}else ach.classList.add('hidden')}
  renderResumeDraftCard();
  const active=document.querySelector('.screen.active')?.id?.replace('Screen','');
  document.querySelectorAll('.mobile-bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.screen===active));
}


// Ensure new screens are recognized by keyboard/back-style navigation.
document.querySelectorAll('[data-screen]').forEach(b=>{b.addEventListener('click',()=>showScreen(b.dataset.screen))});

/* ===== NEET 2027 countdown ===== */
function getNeetTarget(){
  const saved=localStorage.getItem('studymate_neet_target');
  if(saved){const d=new Date(saved);if(!Number.isNaN(d.getTime()))return d.getTime()}
  // Editable default placeholder date; Settings lets the user set the actual target once published.
  return new Date('2027-05-02T14:00:00+05:30').getTime();
}
function renderCountdown(){
  const el=$('neetCountdown'); if(!el)return;
  const target=getNeetTarget(),diff=target-Date.now();
  if(diff<=0){el.textContent='NEET 2027 • Target reached';return}
  const sec=Math.floor(diff/1000),days=Math.floor(sec/86400),hours=Math.floor(sec%86400/3600),mins=Math.floor(sec%3600/60),secs=sec%60;
  el.textContent=`${days} Days • ${String(hours).padStart(2,'0')}h ${String(mins).padStart(2,'0')}m ${String(secs).padStart(2,'0')}s`;
  const note=$('neetCountdownNote');if(note)note.textContent=localStorage.getItem('studymate_neet_target')?'Your saved NEET 2027 target date.':'Set the target date in Settings when the exam date is published.';
}

/* ===== NCERT Focus Mode ===== */
const NCERT_KEY='studymate_ncert_focus_v1';
function getNcert(){try{return JSON.parse(localStorage.getItem(NCERT_KEY)||'{}')}catch{return{}}}
function saveNcert(x){localStorage.setItem(NCERT_KEY,JSON.stringify(x))}
const NCERT_STEPS=[['reading','NCERT Reading'],['lines','Important Lines Reviewed'],['rev1','First Revision'],['rev2','Second Revision'],['pyq','PYQs Practiced']];
function renderNcertFocus(){
  const data=getNcert(),subjects=['Botany','Zoology'],steps=NCERT_STEPS;
  const total=subjects.reduce((n,s)=>n+SYLLABUS[s].length*steps.length,0);
  const done=subjects.reduce((n,s)=>n+SYLLABUS[s].reduce((a,c)=>a+steps.filter(st=>(data[`${s}::${c}`]||{})[st[0]]).length,0),0);
  const pct=total?Math.round(done/total*100):0;
  $('ncertContent').innerHTML=`<div class="ncert-hero report-card"><div><span class="eyebrow">BIOLOGY ONLY • BOTANY + ZOOLOGY</span><h3>NCERT Zone</h3><p>Track NCERT work chapter by chapter.</p></div><div class="ncert-total-progress"><strong>${pct}%</strong><span>complete</span></div></div><div class="ncert-tabs">${subjects.map((s,i)=>`<button class="planner-tab ${i===0?'active':''}" data-ncert-sub="${s}">${s}</button>`).join('')}</div><div id="ncertChapterPanel"></div>`;
  let activeSubject='Botany',activeIndex=0;
  const renderChapter=(subject,index=0)=>{activeSubject=subject;const chapters=SYLLABUS[subject],i=Math.max(0,Math.min(index,chapters.length-1));activeIndex=i;const chapter=chapters[i],key=`${subject}::${chapter}`,x=data[key]||{},cp=Math.round(steps.filter(st=>x[st[0]]).length/steps.length*100);
    $('ncertChapterPanel').innerHTML=`<div class="report-card ncert-chapter-card"><div class="modal-head"><div><span class="eyebrow">${subject.toUpperCase()} • CHAPTER ${i+1}/${chapters.length}</span><h3>${escapeHtml(chapter)}</h3></div><strong>${cp}%</strong></div><div class="barline"><i style="width:${cp}%"></i></div><div class="planner-mobile-steps ncert-inline-steps">${steps.map(([k,l])=>`<label class="planner-mobile-step ${x[k]?'checked':''}"><span><b>${escapeHtml(l)}</b></span><input type="checkbox" data-ncert-step="${k}" ${x[k]?'checked':''}><i>${x[k]?'✓':''}</i></label>`).join('')}</div><div class="planner-chapter-nav"><button class="secondary" id="ncertPrev" ${i===0?'disabled':''}>← Previous Chapter</button><span class="planner-chapter-count">${i+1} / ${chapters.length}</span><button class="secondary" id="ncertNext" ${i===chapters.length-1?'disabled':''}>Next Chapter →</button></div></div>`;
    document.querySelectorAll('[data-ncert-step]').forEach(cb=>cb.onchange=e=>{const d=getNcert(),z=d[key]||{};z[e.target.dataset.ncertStep]=e.target.checked;z.updatedAt=new Date().toISOString();d[key]=z;saveNcert(d);renderNcertFocus();setTimeout(()=>{document.querySelector(`[data-ncert-sub="${CSS.escape(subject)}"]`)?.classList.add('active');renderChapter(subject,i)},0);});
    $('ncertPrev').onclick=()=>renderChapter(subject,i-1);$('ncertNext').onclick=()=>renderChapter(subject,i+1);
  };
  document.querySelectorAll('[data-ncert-sub]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-ncert-sub]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderChapter(b.dataset.ncertSub,0)});
  renderChapter(activeSubject,activeIndex);
}

/* ===== Daily Goals ===== */
const GOALS_KEY='studymate_daily_goals_v1';
function getGoals(){try{return JSON.parse(localStorage.getItem(GOALS_KEY)||'{}')}catch{return{}}}
function saveGoals(x){localStorage.setItem(GOALS_KEY,JSON.stringify(x))}
function goalToday(){const goals=getGoals(),today=new Date().toISOString().slice(0,10);goals[today]??={tasks:[]};return [goals,today,goals[today]]}
function renderDailyGoals(){
  const [goals,today,g]=goalToday();g.tasks??=[];
  const taskRows=g.tasks.map((t,i)=>`<div class="daily-task ${t.done?'done':''}"><label><input type="checkbox" data-goal-done="${i}" ${t.done?'checked':''}><span>${escapeHtml(t.text)}</span></label><button class="task-remove" data-goal-remove="${i}" aria-label="Remove task">−</button></div>`).join('');
  $('goalsContent').innerHTML=`<div class="report-card"><div class="tracker-head"><div><span class="eyebrow">YAKEEN 2.0 DAILY TARGETS</span><h3>Today's Goals</h3><span class="small-muted">Build your day around lectures, DPPs, practice, NCERT and tests.</span></div><strong>${g.tasks.filter(t=>t.done).length}/${g.tasks.length}</strong></div><div class="daily-task-list">${taskRows||'<div class="empty">No tasks yet. Add your first task below.</div>'}</div><div class="actions"><button class="primary" id="addGoalTask">＋ Add Task</button></div></div><div class="report-card"><h3>➕ Add a Yakeen 2.0 task</h3><form id="goalTaskForm"><div class="field"><label>Task type</label><select id="goalTaskType"><option value="study">Study Session</option><option value="ncert">NCERT Chapter</option><option value="questions">Question Practice</option><option value="test">Test Goal</option><option value="custom">Custom Task</option></select></div><div id="goalTaskFields"></div><div class="actions"><button class="primary">Add Task ✓</button></div></form></div>`;
  const renderFields=()=>{const type=$('goalTaskType').value,box=$('goalTaskFields');if(type==='study')box.innerHTML='<div class="two-col"><div class="field"><label>Hours</label><input id="gHours" type="number" min="0" value="0"></div><div class="field"><label>Minutes</label><input id="gMins" type="number" min="0" max="59" value="0"></div></div><div class="field"><label>What will you study?</label><input id="gStudy" placeholder="e.g. Physics — Kinematics"></div>';else if(type==='ncert')box.innerHTML=`<div class="field"><label>NCERT chapter (Botany/Zoology)</label><select id="gNcertChapter">${['Botany','Zoology'].flatMap(s=>SYLLABUS[s].map(c=>`<option value="${escapeHtml(s)}::${escapeHtml(c)}">${s} — ${escapeHtml(c)}</option>`)).join('')}</select></div>`;else if(type==='questions')box.innerHTML=`<div class="field"><label>Subject</label><select id="gQSubject">${SUBJECTS.map(s=>`<option>${s}</option>`).join('')}</select></div><div class="field"><label>Chapter</label><select id="gQChapter"></select></div><div class="field"><label>Number of questions</label><input id="gQCount" type="number" min="1" value="30"></div>`;else if(type==='test')box.innerHTML='<div class="two-col"><div class="field"><label>Day</label><input id="gTestDay" type="date"></div><div class="field"><label>Time</label><input id="gTestTime" type="time"></div></div><div class="field"><label>Test name (optional)</label><input id="gTestName" placeholder="e.g. Weekly Test 04"></div>';else box.innerHTML='<div class="field"><label>Task</label><input id="gCustom" required placeholder="e.g. Revise Electrostatics formulas"></div>';
    if(type==='questions'){const fill=()=>{$('gQChapter').innerHTML=SYLLABUS[$('gQSubject').value].map(c=>`<option>${escapeHtml(c)}</option>`).join('')};$('gQSubject').onchange=fill;fill();}
  };
  renderFields();$('goalTaskType').onchange=renderFields;
  $('goalTaskForm').onsubmit=e=>{e.preventDefault();const type=$('goalTaskType').value;let text='';if(type==='study'){const h=Number($('gHours').value||0),m=Number($('gMins').value||0),s=$('gStudy').value.trim();text=`Study ${h}h ${m}m — ${s||'Focused study session'}`;}else if(type==='ncert'){text=`NCERT: ${$('gNcertChapter').value.replace('::',' — ')}`;}else if(type==='questions'){text=`Practice ${$('gQCount').value} questions — ${$('gQSubject').value} — ${$('gQChapter').value}`;}else if(type==='test'){text=`Test: ${$('gTestName').value.trim()||'Test'} — ${$('gTestDay').value} at ${$('gTestTime').value}`;}else{text=$('gCustom').value.trim();}if(!text)return;g.tasks.push({id:uid(),text,done:false,createdAt:new Date().toISOString()});saveGoals(goals);renderDailyGoals();toast('Task added ✓')};
  $('addGoalTask').onclick=()=>{document.getElementById('goalTaskFields')?.scrollIntoView({behavior:'smooth',block:'center'});$('goalTaskType').focus()};
  document.querySelectorAll('[data-goal-done]').forEach(cb=>cb.onchange=e=>{const i=Number(e.target.dataset.goalDone);g.tasks[i].done=e.target.checked;saveGoals(goals);renderDailyGoals();});
  document.querySelectorAll('[data-goal-remove]').forEach(btn=>btn.onclick=()=>{g.tasks.splice(Number(btn.dataset.goalRemove),1);saveGoals(goals);renderDailyGoals();});
}

/* ===== Test Comparison ===== */
function renderTestComparison(){
  const h=getHistory();if(h.length<2){$('comparisonContent').innerHTML='<div class="empty">Analyse at least two tests to compare them.</div>';return}
  const aId=localStorage.getItem('studymate_compare_a')||h[0].id,bId=localStorage.getItem('studymate_compare_b')||h[1].id,a=h.find(x=>x.id===aId)||h[0],b=h.find(x=>x.id===bId)||h[1];
  const delta=(x,y)=>x-y;
  $('comparisonContent').innerHTML=`<div class="report-card"><div class="two-col"><div class="field"><label>Current test</label><select id="compareA">${h.map(x=>`<option value="${x.id}" ${x.id===a.id?'selected':''}>${escapeHtml(x.name)} — ${x.result.total}</option>`).join('')}</select></div><div class="field"><label>Compare with</label><select id="compareB">${h.map(x=>`<option value="${x.id}" ${x.id===b.id?'selected':''}>${escapeHtml(x.name)} — ${x.result.total}</option>`).join('')}</select></div></div></div><div class="report-card"><h3>⚔️ Comparison</h3><div class="comparison-grid">${[['Score',a.result.total,b.result.total],['Accuracy',a.result.accuracy.toFixed(1)+'%',b.result.accuracy.toFixed(1)+'%'],['Silly Mistakes',a.result.silly,b.result.silly],['Incorrect',a.result.incorrect,b.result.incorrect],['Skipped',a.result.skipped,b.result.skipped]].map(([l,x,y])=>`<div><span>${l}</span><b>${x}</b><small>${y}</small><em>${typeof x==='number'&&typeof y==='number'?(delta(x,y)>=0?'+':'')+delta(x,y):''}</em></div>`).join('')}</div></div>`;
  $('compareA').onchange=e=>{localStorage.setItem('studymate_compare_a',e.target.value);renderTestComparison()};$('compareB').onchange=e=>{localStorage.setItem('studymate_compare_b',e.target.value);renderTestComparison()};
}

/* ===== Next Test Syllabus ===== */
const NEXT_TEST_KEY='studymate_next_test_v1';
function getNextTest(){try{return JSON.parse(localStorage.getItem(NEXT_TEST_KEY)||'null')}catch{return null}}
function saveNextTest(x){localStorage.setItem(NEXT_TEST_KEY,JSON.stringify(x))}
const TREND_WEIGHT={
 Physics:{'Current Electricity':7.95,'Electrostatic Potential and Capacitance':6.28,'Ray Optics and Optical Instruments':5.86,'Gravitation':5.86,'Moving Charges and Magnetism':5.44,'Oscillations':5.44,'Alternating Current':5.02,'Electric Charges and Fields':5.02,'Laws of Motion':4.0,'Thermodynamics':4.0},
 Chemistry:{'Coordination Compounds':6.94,'Hydrocarbons':6.63,'Solutions':6.33,'Chemical Bonding and Molecular Structure':6.12,'Classification of Elements and Periodicity in Properties':5.57,'Purification and Characterization of Organic Compounds':5.44,'Structure of Atom':5.12,'Chemical Thermodynamics':5.15,'Chemical Kinetics':4.73},
 Botany:{'Molecular Basis of Inheritance':8.07,'Biotechnology: Principles and Processes':6.61,'Sexual Reproduction in Flowering Plants':4.77,'Principles of Inheritance and Variation':4.77,'Cell Cycle and Cell Division':4.40,'Ecosystem':3.30,'Plant Kingdom':3.33,'Photosynthesis in Higher Plants':5.0},
 Zoology:{'Animal Kingdom':5.32,'Human Health and Disease':4.59,'Human Reproduction':4.40,'Biomolecules':4.59,'Body Fluids and Circulation':4.0,'Neural Control and Coordination':3.0,'Chemical Coordination and Integration':3.0,'Evolution':4.0}
};
function getNextTestPrepData(d){const h=getHistory(),out={};for(const [sub,chs] of Object.entries(d.chapters||{})){out[sub]=chs.map(ch=>{let wrong=0,silly=0,skipped=0,attempts=0;h.forEach(r=>(r.questions||[]).forEach(q=>{const s=subjectFor(q.number,r.questions.length);if(s===sub&&q.topic?.trim().toLowerCase()===ch.trim().toLowerCase()){attempts++;if(q.status!=='Correct')wrong++;if(q.silly)silly++;if(q.status==='Skipped')skipped++;}}));const weight=TREND_WEIGHT[sub]?.[ch]||0;const score=wrong*4+silly*2+skipped*1+weight;const priority=score>=15?'HIGH':score>=8?'MEDIUM':'NORMAL';return{ch,wrong,silly,skipped,attempts,weight,priority}}).sort((a,b)=>b.score-a.score)}return out}
function renderNextTest(){
 const d=getNextTest();
 if(!d){$('nextTestContent').innerHTML=`<form id="nextTestForm" class="panel"><div class="field"><label>Next Test Date & Time</label><input id="ntDate" type="datetime-local" required></div><div class="field"><label>Test Name (optional)</label><input id="ntName" placeholder="e.g. Yakeen Weekly Test 04"></div><div class="field"><label>Test Syllabus</label><div class="next-test-subjects">${SUBJECTS.map(s=>`<div class="report-card"><h3>${s}</h3><div class="chapter-picker">${chapterCheckboxes(s)}</div></div>`).join('')}</div></div><div class="actions"><button class="primary">Save Next Test ✓</button></div></form>`;
 $('nextTestForm').onsubmit=e=>{e.preventDefault();const chapters={};document.querySelectorAll('#nextTestForm input[type=checkbox]:checked').forEach(x=>(chapters[x.dataset.subject]??=[]).push(x.value));if(!Object.values(chapters).some(a=>a.length))return alert('Select at least one chapter.');saveNextTest({date:$('ntDate').value,name:$('ntName').value.trim(),chapters,savedAt:new Date().toISOString()});renderNextTest();toast('Next test preparation saved ✓')};return;}
 const target=new Date(d.date),remaining=target-Date.now(),time=remaining<=0?'Test time reached':formatRemaining(remaining),prep=getNextTestPrepData(d);
 const subjects=Object.entries(d.chapters||{}).map(([s,chs])=>`<div class="next-test-subject report-card"><h3>${escapeHtml(s)}</h3>${chs.map(c=>{const x=prep[s]?.find(z=>z.ch===c)||{wrong:0,silly:0,skipped:0,weight:0,priority:'NORMAL'};return `<label class="next-test-chapter"><input type="checkbox" data-next-sub="${escapeHtml(s)}" data-next-chapter="${escapeHtml(c)}" ${d.completed?.[`${s}::${c}`]?'checked':''}><span><b>${escapeHtml(c)}</b><small>${x.priority} priority${x.weight?` • trend ${x.weight.toFixed(1)}%`:''} • ${x.wrong} recorded non-correct</small></span></label>`}).join('')}</div>`).join('');
 const tasks=Object.entries(prep).flatMap(([s,arr])=>arr.filter(x=>x.priority==='HIGH'||x.wrong>0).slice(0,5).map(x=>`<div class="focus-row"><div><b>${escapeHtml(s)} — ${escapeHtml(x.ch)}</b><small>${x.wrong} non-correct • ${x.silly} silly • ${x.skipped} skipped • trend weight ${x.weight?x.weight.toFixed(1)+'%':'not mapped'}</small></div><span class="badge ${x.priority==='HIGH'?'incorrect':'skipped'}">${x.priority}</span></div>`)).slice(0,8).join('');
 $('nextTestContent').innerHTML=`<div class="next-test-hero report-card"><span class="eyebrow">${escapeHtml(d.name||'NEXT TEST')}</span><h3>${escapeHtml(time)}</h3><small>${target.toLocaleString()}</small><p class="small-muted">Preparation priorities combine your recorded test mistakes with recent NEET chapter-weightage trends. Weightage is trend-based, not an official NTA prediction. citeturn1search0turn1search1turn1search6</p></div><div class="report-card"><h3>🎯 What to revise before the test</h3>${tasks||'<div class="empty">Your saved syllabus is ready. Complete chapters and analyse another test to make priorities more personalised.</div>'}</div><div class="next-test-grid">${subjects}</div><div class="actions"><button class="secondary" id="editNextTest">Edit Syllabus / Date</button><button class="danger" id="clearNextTest">Clear</button></div>`;
 document.querySelectorAll('[data-next-chapter]').forEach(cb=>cb.onchange=e=>{d.completed??={};d.completed[`${e.target.dataset.nextSub}::${e.target.dataset.nextChapter}`]=e.target.checked;saveNextTest(d)});$('editNextTest').onclick=()=>{localStorage.removeItem(NEXT_TEST_KEY);renderNextTest()};$('clearNextTest').onclick=()=>{if(confirm('Clear the saved next test?')){localStorage.removeItem(NEXT_TEST_KEY);renderNextTest()}};
}
function formatRemaining(ms){let sec=Math.max(0,Math.floor(ms/1000)),d=Math.floor(sec/86400);sec%=86400;let h=Math.floor(sec/3600);sec%=3600;let m=Math.floor(sec/60);let s=sec%60;return `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s left`}
setInterval(()=>{if($('nextTestScreen')?.classList.contains('active'))renderNextTest()},1000);

/* ===== Intelligent Revision ===== */
function renderIntelligentRevision(){
  const h=getHistory();
  if(!h.length){$('revisionContent').innerHTML='<div class="empty">Analyse a test first. Intelligent Revision works test-by-test.</div>';return;}
  const selectedId=localStorage.getItem('studymate_revision_test')||h[0].id;
  const r=h.find(x=>x.id===selectedId)||h[0];
  localStorage.setItem('studymate_revision_test',r.id);
  const map={};(r.questions||[]).forEach(q=>{if(!q.topic?.trim()||q.status==='Correct'&&!q.silly)return;const t=q.topic.trim();map[t]??={topic:t,wrong:0,silly:0,skipped:0,questions:[]};map[t].wrong++;if(q.silly)map[t].silly++;if(q.status==='Skipped')map[t].skipped++;map[t].questions.push(q);});
  const topics=Object.values(map).sort((a,b)=>b.wrong-a.wrong);
  $('revisionContent').innerHTML=`<div class="report-card"><div class="field"><label>Select Test</label><select id="revisionTestSelect">${h.map(x=>`<option value="${x.id}" ${x.id===r.id?'selected':''}>${escapeHtml(x.name)} — ${x.result.total}</option>`).join('')}</select></div><p class="small-muted">Weak topics below are calculated only from this test.</p></div><div class="report-card"><h3>🧠 Weak Topics — ${escapeHtml(r.name)}</h3>${topics.length?topics.map((x,i)=>`<div class="focus-row"><div><b>${i+1}. ${escapeHtml(x.topic)}</b><small>${x.wrong} non-correct • ${x.silly} silly • ${x.skipped} skipped</small></div><button class="secondary" data-revise-topic="${escapeHtml(x.topic)}">▶ Revise</button></div>`).join(''):'<div class="empty">No weak topics with recorded topic names in this test.</div>'}</div>`;
  $('revisionTestSelect').onchange=e=>{localStorage.setItem('studymate_revision_test',e.target.value);renderIntelligentRevision()};
  document.querySelectorAll('[data-revise-topic]').forEach(btn=>btn.onclick=()=>generateRevisionQuestionsForTest(r,btn.dataset.reviseTopic));
}
async function generateRevisionQuestionsForTest(record,topic){
  const items=(record.questions||[]).filter(q=>q.topic?.trim().toLowerCase()===topic.trim().toLowerCase()&&(q.status!=='Correct'||q.silly));
  if(!items.length){toast('No revision questions found for this topic.');return;}
  const questions=[];let pdf=null,map=null;
  if(record.hasPdf){try{const blob=await getPdfBlob(record.id);if(blob&&pdfjsLib){pdf=await pdfjsLib.getDocument({data:await blob.arrayBuffer()}).promise;map=await extractPdfMap(pdf);}}catch(e){console.warn('Revision PDF load failed',e)}}
  for(const q of items.slice(0,20))questions.push({key:`${record.id}:${q.number}`,number:q.number,pdf,info:map?.get(Number(q.number))||null,recordName:record.name,previous:q,status:null,recordId:record.id,revisionTopic:topic});
  state.practiceQuiz={title:`Revision • ${record.name} • ${topic}`,questions,index:0,answers:{},historyMode:true};showScreen('practice');await renderHistoryPracticeQuiz();
}

/* ===== Smart Weakness Engine ===== */
function renderSmartWeakness(){
  const map={};getHistory().forEach(r=>(r.questions||[]).forEach(q=>{if(!q.topic?.trim())return;const t=q.topic.trim();map[t]??={total:0,wrong:0,silly:0,skipped:0,last:r.date};map[t].total++;if(q.status!=='Correct')map[t].wrong++;if(q.silly)map[t].silly++;if(q.status==='Skipped')map[t].skipped++;if(new Date(r.date)>new Date(map[t].last))map[t].last=r.date}));
  const rows=Object.entries(map).map(([topic,v])=>{const acc=(v.total-v.wrong)/v.total*100,days=Math.max(0,Math.floor((Date.now()-new Date(v.last))/86400000));const score=(100-acc)*0.55+v.silly*5+v.skipped*3+Math.min(30,days*1.5);return{topic,...v,acc,days,score}}).filter(x=>x.wrong>=5).sort((a,b)=>b.score-a.score).slice(0,20);
  $('weaknessContent').innerHTML=`<div class="report-card"><h3>🔥 Smart Weakness Ranking</h3>${rows.length?rows.map((x,i)=>`<div class="weakness-row"><div><b>${i+1}. ${escapeHtml(x.topic)}</b><small>Accuracy ${x.acc.toFixed(0)}% • ${x.wrong} incorrect • ${x.silly} silly • ${x.skipped} skipped • ${x.days}d since practice</small></div><strong>${x.score.toFixed(0)}<small> priority</small></strong></div>`).join(''):'<div class="empty">Record topics during test analysis to build your weakness ranking.</div>'}</div>`;
}

/* ===== Personal NEET StudyMate ===== */
function renderPersonalStudyMate(){
 const key='studymate_personal_tasks_v1',today=new Date().toISOString().slice(0,10),store=JSON.parse(localStorage.getItem(key)||'{}');store[today]??=[];
 const h=getHistory(),topicMap={};h.forEach(r=>(r.questions||[]).forEach(q=>{if(!q.topic?.trim())return;const t=q.topic.trim();topicMap[t]??={t,total:0,wrong:0};topicMap[t].total++;if(q.status!=='Correct')topicMap[t].wrong++}));
 const weak=Object.values(topicMap).filter(x=>x.wrong>=5).sort((a,b)=>b.wrong-a.wrong)[0];
 const auto=[];if(weak)auto.push({text:`Revise ${weak.t} — ${weak.wrong} recorded non-correct questions`,reason:'Smart Weakness Engine'});
 const nt=getNextTest();if(nt){const remaining=new Date(nt.date)-Date.now();if(remaining>0)auto.push({text:`Prepare for ${nt.name||'your next test'} — ${formatRemaining(remaining)}`,reason:'Next Test Preparation'});}
 const day=getDaySummaries()[today];if(!day)auto.push({text:'Complete today’s Day Summary',reason:'Daily accountability'});
 const planner=getPlanner();const due=Object.entries(planner).find(([k,x])=>x&&!x.mastered);if(due){const [sub,ch]=due[0].split('::');auto.push({text:`Continue ${ch} (${sub}) and complete the next milestone`,reason:'Success Planner'});}
 for(const a of auto){if(!store[today].some(t=>t.text===a.text))store[today].push({id:uid(),text:a.text,reason:a.reason,done:false,auto:true});}
 localStorage.setItem(key,JSON.stringify(store));const tasks=store[today];
 $('studymateContent').innerHTML=`<div class="study-mate-hero report-card"><div class="motivation-art">🤖🩺</div><h3>Personal NEET StudyMate</h3><p>Your recommendations become real tasks. Complete them and StudyMate will stop showing the completed task.</p></div><div class="report-card"><div class="tracker-head"><div><h3>🎯 Today’s Tasks</h3><span class="small-muted">${tasks.filter(t=>t.done).length}/${tasks.length} completed</span></div><button class="secondary" id="refreshStudyMate">↻ Refresh</button></div><div class="daily-task-list">${tasks.map(t=>`<div class="daily-task ${t.done?'done':''}"><label><input type="checkbox" data-sm-done="${t.id}" ${t.done?'checked':''}><span><b>${escapeHtml(t.text)}</b><small>${escapeHtml(t.reason||'Personal recommendation')}</small></span></label><button class="task-remove" data-sm-remove="${t.id}">−</button></div>`).join('')||'<div class="empty">No tasks yet. Tap Refresh to generate recommendations.</div>'}</div><div class="actions"><button class="primary" id="addStudyMateTask">＋ Add Task</button></div></div>`;
 document.querySelectorAll('[data-sm-done]').forEach(cb=>cb.onchange=e=>{const t=tasks.find(x=>x.id===e.target.dataset.smDone);if(t){t.done=e.target.checked;localStorage.setItem(key,JSON.stringify(store));renderPersonalStudyMate();toast(t.done?'Task completed ✓':'Task reopened ↺')}});
 document.querySelectorAll('[data-sm-remove]').forEach(b=>b.onclick=()=>{store[today]=tasks.filter(t=>t.id!==b.dataset.smRemove);localStorage.setItem(key,JSON.stringify(store));renderPersonalStudyMate()});
 $('refreshStudyMate').onclick=()=>{renderPersonalStudyMate();toast('Recommendations refreshed ✓')};
 $('addStudyMateTask').onclick=()=>{const text=prompt('What task do you want to add?');if(text?.trim()){tasks.push({id:uid(),text:text.trim(),reason:'Added by you',done:false});localStorage.setItem(key,JSON.stringify(store));renderPersonalStudyMate()}};
}

applyTheme(localStorage.getItem('studymate_theme')||'system');
