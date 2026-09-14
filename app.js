/* StudyMate Final — local-first NEET analysis app. */
const pdfjsLib = window.pdfjsLib || null;
const $ = id => document.getElementById(id);
const SCREENS = ['home','practice','reports','history','about','analysis','summary','result','settings','planner','todo'];
const SUBJECTS = ['Physics','Chemistry','Botany','Zoology'];
const SYLLABUS = {
 Physics:['Physical World and Measurement','Motion in a Straight Line','Motion in a Plane','Laws of Motion','Work, Energy, and Power','System of Particles and Rotational Motion','Gravitation','Mechanical Properties of Solids','Mechanical Properties of Fluids','Thermal Properties of Matter','Thermodynamics','Kinetic Theory of Gases','Oscillations','Waves','Electric Charges and Fields','Electrostatic Potential and Capacitance','Current Electricity','Moving Charges and Magnetism','Magnetism and Matter','Electromagnetic Induction','Alternating Current','Electromagnetic Waves','Ray Optics and Optical Instruments','Wave Optics','Dual Nature of Radiation and Matter','Atoms','Nuclei','Semiconductor Electronics: Materials, Devices, and Simple Circuits','Experimental Skills'],
 Chemistry:['Some Basic Concepts of Chemistry','Structure of Atom','Classification of Elements and Periodicity in Properties','Chemical Bonding and Molecular Structure','Chemical Thermodynamics','Equilibrium','Redox Reactions','Solutions','Electrochemistry','Chemical Kinetics','d- and f-Block Elements','Coordination Compounds','Purification and Characterization of Organic Compounds','Some Basic Principles of Organic Chemistry (GOC)','Hydrocarbons','Haloalkanes and Haloarenes','Alcohols, Phenols, and Ethers','Aldehydes, Ketones, and Carboxylic Acids','Organic Compounds Containing Nitrogen (Amines)','Biomolecules','Principles Related to Practical Chemistry'],
 Botany:['The Living World','Biological Classification','Plant Kingdom','Morphology of Flowering Plants','Anatomy of Flowering Plants','Cell: The Unit of Life','Cell Cycle and Cell Division','Photosynthesis in Higher Plants','Respiration in Plants','Plant Growth and Development','Sexual Reproduction in Flowering Plants','Principles of Inheritance and Variation','Molecular Basis of Inheritance','Microbes in Human Welfare','Biotechnology: Principles and Processes','Biotechnology and its Applications','Organisms and Populations','Ecosystem','Biodiversity and Conservation'],
 Zoology:['Animal Kingdom','Structural Organisation in Animals (Animal Tissues & Cockroach/Frog)','Biomolecules','Breathing and Exchange of Gases','Body Fluids and Circulation','Excretory Products and their Elimination','Locomotion and Movement','Neural Control and Coordination','Chemical Coordination and Integration','Human Reproduction','Reproductive Health','Evolution','Human Health and Disease']
};
const state={test:null,pdf:null,pdfFile:null,current:0,questions:[],questionMap:new Map(),selectedSubject:'Physics',resultRecord:null,practiceQuiz:null,mockConfig:null};
const LS={history:'studymate_history_final',security:'studymate_security_v1',practice:'studymate_practice_v1'};
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2200)}
function showScreen(name){SCREENS.forEach(s=>$(s+'Screen')?.classList.toggle('active',s===name));document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.screen===name));if(name==='home')refreshHome();if(name==='history')renderHistory();if(name==='reports')renderReports();if(name==='settings')renderSettings()}
document.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.screen)));
$('settingsBtn').onclick=()=>showScreen('settings');$('settingsBtnMobile').onclick=()=>showScreen('settings');$('mobileMenuBtn').onclick=()=>showScreen('settings');
$('startBtn').onclick=()=>{resetTest();showScreen('about')};$('historyNewBtn').onclick=()=>{resetTest();showScreen('about')};
$('quickPractice').onclick=()=>openModal('mockModal',renderMockBuilder);
$('quickUpload').onclick=()=>openModal('pdfQuizModal',renderPdfQuizBuilder);
$('quickMyTests').onclick=()=>openModal('practiceMyModal',renderPracticeMyBuilder);
$('homePlanner')?.addEventListener('click',e=>{e.preventDefault();showScreen('planner')});
$('generateMock').onclick=()=>openModal('mockModal',renderMockBuilder);$('uploadQuiz').onclick=()=>openModal('pdfQuizModal',renderPdfQuizBuilder);$('practiceMyTests').onclick=()=>openModal('practiceMyModal',renderPracticeMyBuilder);
function resetTest(){state.test=null;state.pdf=null;state.pdfFile=null;state.current=0;state.questions=[];state.questionMap=new Map();$('aboutForm').reset();$('syllabusArea').innerHTML='';$('pdfChoiceArea').innerHTML=''}
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
 if(usePdf==='Yes'){const file=$('pdfInput')?.files?.[0];if(!file)return alert('Please upload the PDF.');state.pdfFile=file;try{if(!pdfjsLib)throw new Error('PDF engine unavailable');await savePdfBlob(state.test.id,file);state.pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;await buildQuestionMap();const count=Math.max(1,state.detectedCount||180);state.questions=Array.from({length:count},(_,i)=>blankQuestion(i+1));state.test.fileName=file.name;toast(`Detected ${count} questions from the PDF.`)}catch(err){console.error(err);return alert('Could not read this PDF. Make sure it is a valid PDF and the PDF.js library can load.')}}
 else {const count=Number($('questionCount')?.value);if(!Number.isInteger(count)||count<1)return alert('Enter a valid number of questions.');state.questions=Array.from({length:count},(_,i)=>blankQuestion(i+1))}
 state.current=0;await renderQuestion();showScreen('analysis');};
function blankQuestion(number){return{number,status:'',guessed:false,silly:false,reason:'',topic:''}}
function getItemRect(item,viewport){const x=item.transform[4],y=item.transform[5],w=item.width||20,h=item.height||Math.abs(item.transform[3])||10;const p1=viewport.convertToViewportPoint(x,y),p2=viewport.convertToViewportPoint(x+w,y+h);return{x:Math.min(p1[0],p2[0]),top:Math.min(p1[1],p2[1]),bottom:Math.max(p1[1],p2[1]),right:Math.max(p1[0],p2[0])}}
function findQuestionLabels(items,viewport,pageNo){const out=[];for(const item of items){const raw=(item.str||'').trim();if(!raw)continue;const re=/(?:^|\s)Q\s*([0-9]{1,3})(?=\s|$|[.)\]:])/gi;let m;while((m=re.exec(raw))){const r=getItemRect(item,viewport);out.push({number:Number(m[1]),...r,pageNo})}}return out}
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
function renderExtraFields(){const q=state.questions[state.current],box=$('questionExtra');if(!q.status){box.innerHTML='';return}if(q.status==='Correct'){box.innerHTML=`<div class="extra-panel"><label class="checkline"><input id="guessed" type="checkbox" ${q.guessed?'checked':''}> I Guessed the Answer</label></div>`;$('guessed').onchange=e=>q.guessed=e.target.checked;return}
 if(q.status==='Incorrect'){box.innerHTML=`<div class="extra-panel"><div class="field"><label>Was this a silly mistake?</label><div class="choice-row"><button type="button" class="choice-chip ${q.silly?'active':''}" id="sillyYes">Yes</button><button type="button" class="choice-chip ${!q.silly?'active':''}" id="sillyNo">No</button></div></div><div class="field"><label>Why did you get it wrong? ${q.silly?'':'<span class="required">*</span>'}</label><textarea id="reason" placeholder="Concept not clear, calculation error, misread question...">${escapeHtml(q.reason)}</textarea></div><div class="field" style="margin-bottom:0"><label>Topic <span class="small-muted">(optional)</span></label><input id="topic" value="${escapeHtml(q.topic)}" placeholder="e.g. Kinematics"></div></div>`;$('sillyYes').onclick=()=>{q.silly=true;renderExtraFields()};$('sillyNo').onclick=()=>{q.silly=false;renderExtraFields()};$('reason').oninput=e=>q.reason=e.target.value;$('topic').oninput=e=>q.topic=e.target.value;return}
 box.innerHTML=`<div class="extra-panel"><div class="field"><label>Why did you skip it? <span class="required">*</span></label><textarea id="reason" placeholder="Why did you skip this question?">${escapeHtml(q.reason)}</textarea></div><div class="field" style="margin-bottom:0"><label>Topic <span class="small-muted">(optional)</span></label><input id="topic" value="${escapeHtml(q.topic)}" placeholder="e.g. Genetics"></div></div>`;$('reason').oninput=e=>q.reason=e.target.value;$('topic').oninput=e=>q.topic=e.target.value}
function validateQuestion(q){if(!q.status)return'Select Correct, Incorrect or Skipped.';if(q.status==='Incorrect'&&!q.silly&&!q.reason.trim())return'Reason is required unless Silly Mistake is checked.';if(q.status==='Skipped'&&!q.reason.trim())return'Reason is required for a skipped question.';return''}
document.addEventListener('change',e=>{if(e.target.name==='status'){const q=state.questions[state.current];q.status=e.target.value;renderExtraFields();}});
$('prevBtn').onclick=async()=>{if(state.current>0){state.current--;await renderQuestion()}};$('nextBtn').onclick=async()=>{const err=validateQuestion(state.questions[state.current]);if(err)return alert(err);if(state.current<state.questions.length-1){state.current++;await renderQuestion()}else{const missing=state.questions.find(q=>validateQuestion(q));if(missing){state.current=state.questions.indexOf(missing);await renderQuestion();return alert(`Question ${missing.number} still needs analysis.`)}renderSummary();showScreen('summary')}};
$('navigatorBtn').onclick=()=>{openModal('navigatorModal',buildNavigator)};$('closeNavigator').onclick=()=>closeModal('navigatorModal');
function buildNavigator(){$('questionGrid').innerHTML=state.questions.map((q,i)=>`<button class="qnav ${q.status.toLowerCase()} ${i===state.current?'current':''}" data-i="${i}">${q.number}</button>`).join('');$('questionGrid').querySelectorAll('.qnav').forEach(b=>b.onclick=async()=>{state.current=Number(b.dataset.i);closeModal('navigatorModal');await renderQuestion()})}
function updateNavButtons(){$('prevBtn').disabled=state.current===0;$('nextBtn').textContent=state.current===state.questions.length-1?'Review & Submit →':'Next →'}
function renderSummary(){const q=state.questions,c=q.filter(x=>x.status==='Correct').length,i=q.filter(x=>x.status==='Incorrect').length,s=q.filter(x=>x.status==='Skipped').length,si=q.filter(x=>x.silly).length;$('summaryContent').innerHTML=`<div class="panel"><div class="result-kpis"><div class="kpi"><strong>${q.length}</strong><small>Questions</small></div><div class="kpi"><strong>${c}</strong><small>Correct</small></div><div class="kpi"><strong>${i}</strong><small>Incorrect</small></div></div><div class="result-kpis" style="margin-top:10px"><div class="kpi"><strong>${s}</strong><small>Skipped</small></div><div class="kpi"><strong>${si}</strong><small>Silly Mistakes</small></div><div class="kpi"><strong>${c*4-i}</strong><small>Marks</small></div></div><div class="actions"><button id="editAnalysis" class="secondary">← Continue Editing</button><button id="finalSubmit" class="primary">Submit Analysis 🎉</button></div></div>`;$('editAnalysis').onclick=()=>showScreen('analysis');$('finalSubmit').onclick=saveAndShowResult}
function subjectFor(n,total){if(total!==180)return state.test?.type==='Subject-wise'?state.selectedSubject:null;if(n<=45)return'Physics';if(n<=90)return'Chemistry';if(n<=135)return'Botany';return'Zoology'}
function calculateResult(){const qs=state.questions,correct=qs.filter(q=>q.status==='Correct').length,incorrect=qs.filter(q=>q.status==='Incorrect').length,skipped=qs.filter(q=>q.status==='Skipped').length,silly=qs.filter(q=>q.silly).length,total=correct*4-incorrect,accuracy=(correct+incorrect?correct/(correct+incorrect)*100:0);const subjects={};SUBJECTS.forEach(s=>subjects[s]={correct:0,incorrect:0,skipped:0,score:0,attempted:0});qs.forEach(q=>{const s=subjectFor(q.number,qs.length);if(subjects[s]){subjects[s][q.status.toLowerCase()]++;if(q.status!=='Skipped')subjects[s].attempted++;subjects[s].score+=q.status==='Correct'?4:q.status==='Incorrect'?-1:0}});Object.values(subjects).forEach(v=>v.accuracy=v.correct+v.incorrect?v.correct/(v.correct+v.incorrect)*100:0);return{correct,incorrect,skipped,silly,total,accuracy,subjects}}
function getHistory(){try{return JSON.parse(localStorage.getItem(LS.history)||'[]')}catch{return[]}}
function saveAndShowResult(){const result=calculateResult(),record={...state.test,result,questions:state.questions,syllabus:state.test.syllabus};const h=getHistory();h.unshift(record);localStorage.setItem(LS.history,JSON.stringify(h.slice(0,100)));state.resultRecord=record;renderResult(record);showScreen('result')}
function previousComparison(record){const h=getHistory().filter(x=>x.id!==record.id);return h.length?h[0]:null}
function resultNav(){return`<div class="result-nav">${['Overview','Subjects','Mistakes','Topics','Questions','Trend'].map((x,i)=>`<button class="result-tab ${i===0?'active':''}" data-result-tab="${x.toLowerCase()}">${x}</button>`).join('')}</div>`}
function renderResult(record){const r=record.result,prev=previousComparison(record),delta=prev?r.total-prev.result.total:null;const scoreMax=record.questions.length===180?720:record.questions.length*4;const quote=r.total<500?'A low score is not a final result. It is feedback telling you exactly what to improve next.':'Consistency today creates success tomorrow.';const trend=getHistory().slice(0,8).reverse();
 $('resultContent').innerHTML=`<div class="result-hero"><span class="eyebrow">TEST COMPLETE 🎉</span><h2>${escapeHtml(record.name)}</h2><p class="small-muted">${escapeHtml(record.type)} • ${new Date(record.date).toLocaleDateString()} • Revised: ${escapeHtml(record.revised)}</p><div class="result-score"><div class="big">${r.total}</div><small>/ ${scoreMax}</small></div><div class="result-kpis"><div class="kpi"><strong>${r.correct}</strong><small>✓ Correct</small></div><div class="kpi"><strong>${r.incorrect}</strong><small>✕ Incorrect</small></div><div class="kpi"><strong>${r.skipped}</strong><small>− Skipped</small></div></div><div class="result-kpis" style="margin-top:10px"><div class="kpi"><strong>${r.accuracy.toFixed(1)}%</strong><small>Accuracy</small></div><div class="kpi"><strong>${r.silly}</strong><small>😵 Silly Mistakes</small></div><div class="kpi"><strong>${delta===null?'—':(delta>=0?'+':'')+delta}</strong><small>vs previous</small></div></div></div>${resultNav()}<div id="resultPanels"></div>`;
 const panels=$('resultPanels');panels.innerHTML=resultPanelOverview(record,quote)+resultPanelSubjects(r)+resultPanelMistakes(record)+resultPanelTopics(record)+resultPanelQuestions(record)+resultPanelTrend(trend);
 document.querySelectorAll('[data-result-tab]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-result-tab]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const id=btn.dataset.resultTab;document.querySelectorAll('.result-section').forEach(s=>s.style.display=s.dataset.section===id?'block':'none');document.querySelector(`.result-section[data-section="${id}"]`)?.scrollIntoView({behavior:'smooth',block:'start'})});
 document.querySelectorAll('.result-section').forEach((s,i)=>{if(i) s.style.display='none'});}
function resultPanelOverview(record,quote){return`<section class="report-card result-section" data-section="overview"><h3>Your Performance</h3><div class="two-col"><div><div class="small-muted">Syllabus Covered</div><div class="syllabus-box" style="margin-top:6px">${escapeHtml(record.syllabus)}</div></div><div><div class="small-muted">Test Details</div><p><b>${record.questions.length}</b> questions</p><p><b>${escapeHtml(record.revised)}</b> revised before test</p></div></div><div class="quote-card" style="margin-top:14px">💡 “${escapeHtml(quote)}”</div><div class="actions"><button class="primary" onclick="showScreen('history')">View History</button><button class="secondary" onclick="showScreen('practice')">Practice Mistakes →</button></div></section>`}
function resultPanelSubjects(r){return`<section class="report-card result-section" data-section="subjects"><h3>📚 Subject Performance</h3><div class="subject-grid">${SUBJECTS.map(s=>{const v=r.subjects[s];return`<div class="subject-card"><span class="small-muted">${s}</span><strong>${v.score}</strong><div class="small-muted">${v.correct} correct • ${v.incorrect} incorrect • ${v.skipped} skipped</div><div class="barline"><i style="width:${Math.min(100,v.accuracy)}%"></i></div><small>${v.accuracy.toFixed(1)}% accuracy</small></div>`}).join('')}</div></section>`}
function resultPanelMistakes(record){const cats={silly:record.questions.filter(q=>q.silly).length,other:record.questions.filter(q=>q.status==='Incorrect'&&!q.silly).length,skipped:record.questions.filter(q=>q.status==='Skipped').length};const total=Math.max(1,cats.silly+cats.other+cats.skipped);const p1=cats.silly/total*100,p2=(cats.silly+cats.other)/total*100;return`<section class="report-card result-section" data-section="mistakes"><h3>😵 Where did you lose marks?</h3><div class="donut-wrap"><div style="position:relative"><div class="donut" style="background:conic-gradient(var(--green) 0 ${p1}%,var(--red) ${p1}% ${p2}%,#b9b0ff ${p2}% 100%)"></div><div class="donut-center">${record.result.incorrect}<br><span class="small-muted">Incorrect</span></div></div><div class="legend"><span><i class="dot" style="background:var(--green)"></i>${cats.silly} Silly Mistakes</span><span><i class="dot" style="background:var(--red)"></i>${cats.other} Other Incorrect</span><span><i class="dot" style="background:#b9b0ff"></i>${cats.skipped} Skipped</span></div></div></section>`}

function resultPanelTopics(record){const map={};record.questions.forEach(q=>{if(q.topic?.trim()){map[q.topic.trim()]??={wrong:0,total:0};map[q.topic.trim()].total++;if(q.status!=='Correct')map[q.topic.trim()].wrong++}});const rows=Object.entries(map).sort((a,b)=>b[1].wrong-a[1].wrong).slice(0,10);return`<section class="report-card result-section" data-section="topics"><h3>🎯 Weak Topics</h3>${rows.length?rows.map(([t,v],i)=>`<div class="topic-row"><div><span class="topic-name">${i+1}. ${escapeHtml(t)}</span><div class="barline"><i style="width:${Math.min(100,v.wrong/Math.max(1,v.total)*100)}%"></i></div></div><strong>${v.wrong}</strong></div>`).join(''):'<div class="empty">No topics were recorded. Topic is optional, so weak-topic analysis grows as you add topics.</div>'}<h3 style="margin-top:22px">🌟 Strong Topics</h3><div class="small-muted">Strong topics are shown when enough topic-tagged correct answers exist.</div></section>`}
function resultPanelQuestions(record){const qs=record.questions.filter(q=>q.status!=='Correct'||q.silly);return`<section class="report-card result-section" data-section="questions"><h3>📝 Question Review</h3><div class="question-list">${qs.slice(0,60).map(q=>`<div class="question-item"><div><b>Q${q.number}</b><small>${escapeHtml(q.reason||'Correct but marked as guessed')}</small>${q.topic?`<small>Topic: ${escapeHtml(q.topic)}</small>`:''}</div><span class="badge ${q.status.toLowerCase()}">${q.silly?'Silly Mistake':q.status}</span></div>`).join('')||'<div class="empty">No mistakes to review.</div>'}</div>${qs.length>60?`<p class="small-muted">Showing first 60 review items.</p>`:''}</section>`}
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
async function renderPdfQuizBuilder(){const b=$('pdfQuizBuilder');b.innerHTML='<div class="field"><label>Question PDF</label><input id="quizPdfInput" type="file" accept="application/pdf"><div id="quizPdfInfo" class="small-muted"></div></div><div class="field"><label>Optional Answer Key</label><input id="quizAnswerKey" placeholder="Example: 1A 2C 3B 4D"><div class="small-muted">If no answer key is supplied, the quiz still runs but cannot calculate a score automatically.</div></div><div class="actions"><button class="primary" id="startPdfQuiz">Create Interactive Quiz</button></div>';$('quizPdfInput').onchange=e=>{const f=e.target.files[0];$('quizPdfInfo').textContent=f?f.name:''};$('startPdfQuiz').onclick=startPdfQuiz}
async function startPdfQuiz(){const file=$('quizPdfInput').files[0];if(!file)return alert('Choose a PDF.');if(!pdfjsLib)return alert('PDF engine unavailable.');try{const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;const map=await extractPdfMap(pdf);const nums=[...map.keys()].sort((a,b)=>a-b);if(!nums.length)return alert('No question labels were detected in this PDF.');const qs=nums.map(n=>({number:n,pdf,info:map.get(n),answer:null}));const key=parseAnswerKey($('quizAnswerKey').value);qs.forEach(q=>q.answerKey=key[q.number]??null);closeModal('pdfQuizModal');openPracticeQuiz({title:file.name,questions:qs,pdf:true})}catch(e){console.error(e);alert('Could not parse the PDF.')}}
async function extractPdfMap(pdf){const map=new Map();for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p),vp=page.getViewport({scale:1}),text=await page.getTextContent(),labels=findQuestionLabels(text.items,vp,p),unique=[];const seen=new Set();for(const x of labels){if(!seen.has(x.number)){seen.add(x.number);unique.push(x)}}if(!unique.length)continue;const split=vp.width/2,cols=[unique.filter(x=>x.x<split),unique.filter(x=>x.x>=split)];const useCols=cols[0].length&&cols[1].length?cols:[unique];for(const col of useCols){col.sort((a,b)=>a.top-b.top);for(let i=0;i<col.length;i++){const q=col[i],next=col[i+1],left=useCols.length===2&&q.x<split;map.set(q.number,{pageNo:p,x0:left?Math.max(0,q.x-14):useCols.length===2?Math.max(split+8,q.x-14):18,x1:left?split-8:vp.width-18,top:Math.max(0,q.top-12),bottom:next?next.top-8:vp.height-15})}}}return map}
function parseAnswerKey(text){const out={};for(const m of String(text||'').toUpperCase().matchAll(/(\d+)\s*([ABCD])/g))out[Number(m[1])]=m[2].charCodeAt(0)-65;return out}
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
function renderPracticeMyBuilder(){const h=getHistory(),counts={incorrect:0,silly:0,skipped:0,topics:0};h.forEach(r=>r.questions.forEach(q=>{if(q.status==='Incorrect')counts.incorrect++;if(q.silly)counts.silly++;if(q.status==='Skipped')counts.skipped++;if(q.topic)counts.topics++}));$('practiceMyBuilder').innerHTML=`<div class="field"><label><input id="pmIncorrect" type="checkbox"> Incorrect Questions (${counts.incorrect})</label><label><input id="pmSilly" type="checkbox"> Silly Mistakes (${counts.silly})</label><label><input id="pmSkipped" type="checkbox"> Skipped Questions (${counts.skipped})</label><label><input id="pmTopics" type="checkbox"> Weak Topics (${counts.topics})</label></div><div class="field"><label>Number of questions</label><select id="pmCount"><option>10</option><option>20</option><option>30</option><option>45</option></select></div><div class="small-muted">Practice attempts are kept separate and never change the original test result.</div><div class="actions"><button id="startMyPractice" class="primary">Start Practice →</button></div>`;$('startMyPractice').onclick=startMyPractice}
async function startMyPractice(){
 const h=getHistory(),pool=[];
 const want={i:$('pmIncorrect').checked,s:$('pmSilly').checked,k:$('pmSkipped').checked,t:$('pmTopics').checked};
 if(!Object.values(want).some(Boolean))return alert('Choose at least one category.');
 for(const r of h){
   for(const q of r.questions){
     if((want.i&&q.status==='Incorrect')||(want.s&&q.silly)||(want.k&&q.status==='Skipped')||(want.t&&q.topic))pool.push({record:r,original:q});
   }
 }
 if(!pool.length)return alert('No matching questions found yet.');
 const n=Math.min(Number($('pmCount').value),pool.length),chosen=pool.slice(0,n);
 const withPdfs=[];
 for(const item of chosen){
   let pdf=null,info=null;
   try{const blob=await getPdfBlob(item.record.id);if(blob&&pdfjsLib){pdf=await pdfjsLib.getDocument({data:await blob.arrayBuffer()}).promise;const map=await extractPdfMap(pdf);info=map.get(item.original.number)}}catch(e){console.warn('Could not reopen saved PDF',e)}
   withPdfs.push({number:item.original.number,pdf,info,previous:item.original,status:null,recordId:item.record.id,recordName:item.record.name});
 }
 closeModal('practiceMyModal');
 state.practiceQuiz={title:'Practice from My Tests',questions:withPdfs,index:0,answers:{},historyMode:true};
 renderHistoryPracticeQuiz();
}

/* PDF persistence: keep uploaded papers in IndexedDB so History/Practice can reopen them without putting large blobs in localStorage. */
const PDF_DB='StudyMatePDFs',PDF_STORE='papers';
function openPdfDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(PDF_DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(PDF_STORE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function savePdfBlob(id,file){try{const db=await openPdfDb();await new Promise((res,rej)=>{const tx=db.transaction(PDF_STORE,'readwrite');tx.objectStore(PDF_STORE).put(file,id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});db.close()}catch(e){console.warn('PDF persistence unavailable',e)}}
async function getPdfBlob(id){const db=await openPdfDb();const out=await new Promise((res,rej)=>{const tx=db.transaction(PDF_STORE,'readonly');const r=tx.objectStore(PDF_STORE).get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});db.close();return out}

async function renderHistoryPracticeQuiz(){
 const d=state.practiceQuiz;if(!d)return;const q=d.questions[d.index];
 let body='';
 if(q.pdf&&q.info)body='<div class="quiz-question" id="practiceHistoryViewer"><div class="viewer-placeholder">Loading original question…</div></div>';
 else body='<div class="quiz-question"><div class="viewer-placeholder">Original question PDF is not available on this device. You can still record the reattempt status.</div></div>';
 const current=d.answers[q.number]||'';
 $('practiceScreen').innerHTML=`<div class="page-head"><div><span class="eyebrow">PRACTICE FROM MY TESTS</span><h2>Q${q.number}</h2><div class="small-muted">${escapeHtml(q.recordName)} • Previous: ${escapeHtml(q.previous.status)}${q.previous.silly?' • Silly mistake':''}</div></div><button id="exitHistoryPractice" class="secondary">Exit</button></div>${body}<div class="report-card"><h3>How did your reattempt go?</h3><div class="status-options"><label><input type="radio" name="practiceStatus" value="Correct" ${current==='Correct'?'checked':''}><span class="correct">✓<b>Correct</b></span></label><label><input type="radio" name="practiceStatus" value="Incorrect" ${current==='Incorrect'?'checked':''}><span class="incorrect">×<b>Incorrect</b></span></label><label><input type="radio" name="practiceStatus" value="Skipped" ${current==='Skipped'?'checked':''}><span class="skipped">−<b>Skipped</b></span></label></div></div><div class="actions between"><button id="hpPrev" class="secondary">← Previous</button><button id="hpNext" class="primary">${d.index===d.questions.length-1?'Finish':'Next →'}</button></div>`;
 document.querySelectorAll('input[name="practiceStatus"]').forEach(b=>b.onchange=()=>{d.answers[q.number]=b.value});
 $('exitHistoryPractice').onclick=()=>{state.practiceQuiz=null;showScreen('practice')};
 $('hpPrev').onclick=()=>{if(d.index>0){d.index--;renderHistoryPracticeQuiz()}};
 $('hpNext').onclick=()=>{if(d.index<d.questions.length-1){d.index++;renderHistoryPracticeQuiz()}else finishHistoryPractice()};
 if(q.pdf&&q.info)await renderHistoryPdfQuestion(q);
}
async function renderHistoryPdfQuestion(q){const el=$('practiceHistoryViewer');try{const page=await q.pdf.getPage(q.info.pageNo),scale=1.25,vp=page.getViewport({scale}),x0=q.info.x0*scale,x1=q.info.x1*scale,top=q.info.top*scale,bottom=q.info.bottom*scale,canvas=document.createElement('canvas');canvas.width=Math.ceil(x1-x0);canvas.height=Math.ceil(bottom-top);await page.render({canvasContext:canvas.getContext('2d'),viewport:vp,transform:[1,0,0,1,-x0,-top]}).promise;el.innerHTML='';el.appendChild(canvas)}catch(e){el.innerHTML='<div class="viewer-placeholder">Could not render this question.</div>'}}
function finishHistoryPractice(){const d=state.practiceQuiz;const attempts=[];d.questions.forEach(q=>{if(d.answers[q.number])attempts.push({testId:q.recordId,question:q.number,previousStatus:q.previous.status,currentStatus:d.answers[q.number],date:new Date().toISOString()})});const all=JSON.parse(localStorage.getItem(LS.practice)||'[]');localStorage.setItem(LS.practice,JSON.stringify([...attempts,...all].slice(0,500)));const improved=attempts.filter(x=>x.previousStatus!=='Correct'&&x.currentStatus==='Correct').length;state.practiceQuiz=null;showScreen('practice');toast(improved?`Practice complete — ${improved} question${improved===1?'':'s'} improved to Correct.`:'Practice complete. Your reattempts were saved.')}
/* Security */
async function hash(text){const data=new TextEncoder().encode(text);const buf=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function getSecurity(){try{return JSON.parse(localStorage.getItem(LS.security)||'null')}catch{return null}}
async function saveSecurity(pin,questions){const payload={enabled:true,pinHash:await hash(pin),questions:await Promise.all(questions.map(async x=>({q:x.q,a:await hash(x.a.trim().toLowerCase())}))),failed:0,lockUntil:0,auto:'immediately'};localStorage.setItem(LS.security,JSON.stringify(payload));}
function renderSettings(){const s=getSecurity();$('settingsContent').innerHTML=`<div class="settings-row"><div><b>🔐 App Lock</b><div class="small-muted">Protect StudyMate with your own passcode.</div></div><label class="switch"><input id="securityToggle" type="checkbox" ${s?.enabled?'checked':''}><span></span></label></div>${s?.enabled?`<div class="settings-row"><div><b>Change Passcode</b><div class="small-muted">Use recovery or current passcode.</div></div><button class="secondary" id="changePinBtn">Change</button></div><div class="settings-row"><div><b>Recovery Questions</b><div class="small-muted">Three answers are required to reset a forgotten passcode.</div></div><button class="secondary" id="changeRecoveryBtn">Change</button></div><div class="settings-row"><div><b>Auto Lock</b><div class="small-muted">Choose when the app locks.</div></div><select id="autoLock" style="width:140px"><option value="immediately">Immediately</option><option value="1m">After 1 minute</option><option value="5m">After 5 minutes</option><option value="15m">After 15 minutes</option><option value="never">Never</option></select></div>`:''}`;$('securityToggle').onchange=async e=>{if(e.target.checked)setupSecurity();else if(confirm('Disable App Lock?')){localStorage.removeItem(LS.security);toast('App Lock disabled.')}else{e.target.checked=true}};if(s?.enabled){$('autoLock').value=s.auto||'immediately';$('autoLock').onchange=e=>{const x=getSecurity();x.auto=e.target.value;localStorage.setItem(LS.security,JSON.stringify(x))};$('changePinBtn').onclick=()=>changePinFlow();$('changeRecoveryBtn').onclick=()=>setupRecovery(true)}}
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
refreshHome();renderReports();lockIfNeeded();setInterval(refreshHome,60000);setTimeout(ensureName,250);

/* ===== FINAL UX: animations, Success Planner, daily to-do, NEET motivation ===== */
const EXTRA_SCREENS = ['home','practice','reports','history','about','analysis','summary','result','settings','planner','todo'];
function showScreen(name){
  EXTRA_SCREENS.forEach(s=>$(s+'Screen')?.classList.toggle('active',s===name));
  document.querySelectorAll('.nav-btn,[data-screen]').forEach(b=>b.classList.toggle('active',b.dataset.screen===name));
  if(name==='home') refreshHome();
  if(name==='history') renderHistory();
  if(name==='reports') renderReports();
  if(name==='settings') renderSettings();
  if(name==='planner') renderSuccessPlanner();
  if(name==='todo') renderTodo();
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
  {key:'ncert',label:'NCERT Reading'},
  {key:'dpp',label:'DPP'},
  {key:'module',label:'Module / PYQs'},
  {key:'test',label:'Test'},
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
  const checked=PLANNER_STEPS.slice(0,-1).filter(st=>!!x[st.key]).length;
  return {...x,checked,complete:!!x.mastered};
}
function renderSuccessPlanner(){
  const data=getPlanner();
  let total=0,completed=0,mastered=0,needs=0,notStarted=0;
  SUBJECTS.forEach(s=>SYLLABUS[s].forEach(c=>{
    total++;const st=plannerChapterStatus(data,s,c);
    if(st.mastered) mastered++;
    else if(st.checked>=5) completed++;
    else if(st.checked>0) needs++;
    else notStarted++;
  }));
  const progress=total?Math.round((completed+mastered)/total*100):0;
  $('plannerContent').innerHTML=`
    <div class="planner-hero report-card">
      <div class="planner-hero-copy"><span class="eyebrow">FOCUS • PLAN • STUDY • ACHIEVE</span><h3>Build your NEET 2027 success, one chapter at a time.</h3><p>Tick each milestone as you complete it. Your plan stays saved on this device.</p></div>
      <div class="planner-progress" style="--planner-pct:${progress}%"><strong>${progress}%</strong><span>overall</span></div>
    </div>
    <div class="planner-stats report-card">
      <div><strong>${total}</strong><small>Total Chapters</small></div><div><strong>${completed+mastered}</strong><small>On Track</small></div><div><strong>${needs}</strong><small>Needs Work</small></div><div><strong>${notStarted}</strong><small>Not Started</small></div><div><strong>${mastered}</strong><small>Mastered</small></div>
    </div>
    <div class="planner-tabs">${SUBJECTS.map((s,i)=>`<button type="button" class="planner-tab ${i===0?'active':''}" data-planner-sub="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}</div>
    <div id="plannerPanel"></div>
    <div class="planner-note report-card"><strong>🌱 Small, consistent actions compound.</strong><span>Use the revision columns to keep chapters alive instead of studying them once and forgetting them.</span></div>`;
  const renderSubject=(subject)=>{
    const rows=SYLLABUS[subject].map((chapter,i)=>{
      const key=`${subject}::${chapter}`, x=data[key]||{}, st=plannerChapterStatus(data,subject,chapter);
      const cls=st.mastered?'mastered':st.checked>=5?'ontrack':st.checked?'needswork':'notstarted';
      const checks=PLANNER_STEPS.map(step=>`<label class="planner-check ${x[step.key]?'checked':''}" title="${escapeHtml(step.label)}"><input type="checkbox" data-planner-key="${escapeHtml(key)}" data-planner-step="${step.key}" ${x[step.key]?'checked':''}><span>${x[step.key]?'✓':''}</span></label>`).join('');
      return `<div class="planner-row ${cls}"><div class="planner-number">${i+1}</div><div class="planner-chapter"><strong>${escapeHtml(chapter)}</strong><small>${st.mastered?'Mastered':st.checked>=5?'On Track':st.checked?'Needs Work':'Not Started'}</small></div>${checks}<div class="planner-status">${st.mastered?'🏆 Mastered':st.checked>=5?'🟢 On Track':st.checked?'🟡 Needs Work':'🔴 Not Started'}</div></div>`;
    }).join('');
    $('plannerPanel').innerHTML=`<div class="report-card planner-table-card"><div class="planner-table-head"><div><h3>${escapeHtml(subject)}</h3><span class="small-muted">Complete each column when you genuinely finish that milestone.</span></div><span class="planner-legend">✓ completed • 🏆 mastered</span></div><div class="planner-table-wrap"><div class="planner-header"><div>No.</div><div>Chapter</div>${PLANNER_STEPS.map(st=>`<div>${escapeHtml(st.label)}${st.sub?`<small>${escapeHtml(st.sub)}</small>`:''}</div>`).join('')}<div>Status</div></div>${rows}</div></div>`;
    $('plannerPanel').querySelectorAll('[data-planner-key]').forEach(cb=>cb.onchange=()=>{
      const all=getPlanner();const item=all[cb.dataset.plannerKey]||{};item[cb.dataset.plannerStep]=cb.checked;all[cb.dataset.plannerKey]=item;savePlanner(all);renderSuccessPlanner();setTimeout(()=>document.querySelector(`[data-planner-sub="${CSS.escape(subject)}"]`)?.click(),0);toast(cb.checked?'Milestone completed ✓':'Milestone unchecked');
    });
  };
  renderSubject('Physics');
  document.querySelectorAll('[data-planner-sub]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-planner-sub]').forEach(x=>x.classList.toggle('active',x===btn));renderSubject(btn.dataset.plannerSub);document.querySelectorAll('[data-planner-sub]').forEach(x=>x.classList.toggle('active',x===btn))});
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
function refreshHome(){
  const h=getHistory(),name=getUserName(),doctor=shouldShowDoctor(h),g=timeGreeting();
  $('homeTests').textContent=h.length;$('homeBest').textContent=h.length?Math.max(...h.map(x=>x.result.total)):'—';$('homeLatest').textContent=h.length?h[0].result.total:'—';
  $('greetingTitle').innerHTML=`${escapeHtml(g[0])}${name?`, <span class="home-name">${doctor?'Dr. ':''}${escapeHtml(name)}</span>`:'!'}`;
  $('greetingSub').textContent=doctor?'Five consecutive 600+ tests. Keep going, Doctor! 🩺':g[1];
  const latest=h[0]?.result?.total||0,pct=Math.min(100,Math.round(latest/7.2));$('homeProgressPct').textContent=h.length?`${pct}%`:'0%';
  $('progressLine1').textContent=h.length?(doctor?'600+ streak achieved.':'Your latest score is '+latest+'.'):'Start your first test.';$('progressLine2').textContent=h.length?'Analyse. Revise. Improve. Repeat.':'Every analysed test brings you closer.';
  const ach=$('achievementCard');if(doctor){ach.classList.remove('hidden');ach.innerHTML=`<div class="achievement-title">🏆 ACHIEVEMENT UNLOCKED</div><strong>🩺 Dr. ${escapeHtml(name)} — 600+ Excellence Streak</strong><p>600+ in each of your last 5 tests. “Consistency turns preparation into success.”</p>`}else ach.classList.add('hidden');
  const pctStyle=$('homeProgressPct')?.parentElement;if(pctStyle)pctStyle.style.background=`conic-gradient(#42dfb4 0 ${h.length?pct:0}%,#dce5f2 ${h.length?pct:0}% 100%)`;
}

// Ensure new screens are recognized by keyboard/back-style navigation.
document.querySelectorAll('[data-screen]').forEach(b=>{b.addEventListener('click',()=>showScreen(b.dataset.screen))});
