const pdfjsLib = window.pdfjsLib || null;
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

const SYLLABUS = {
  Physics: ["Physics and Measurement","Kinematics","Laws of Motion","Work, Energy, and Power","Rotational Motion","Gravitation","Properties of Solids and Liquids","Thermodynamics","Kinetic Theory of Gases","Oscillations and Waves","Electrostatics","Current Electricity","Magnetic Effects of Current and Magnetism","Electromagnetic Induction and Alternating Currents","Electromagnetic Waves","Optics","Dual Nature of Matter and Radiation","Atoms and Nuclei","Electronic Devices","Experimental Skills"],
  Chemistry: ["Some Basic Concepts in Chemistry","Atomic Structure","Chemical Bonding and Molecular Structure","Chemical Thermodynamics","Solutions","Equilibrium","Redox Reactions and Electrochemistry","Chemical Kinetics","Classification of Elements and Periodicity in Properties","P-Block Elements","d- and f-Block Elements","Coordination Compounds","Purification and Characterisation of Organic Compounds","Some Basic Principles of Organic Chemistry","Hydrocarbons","Organic Compounds Containing Halogens","Organic Compounds Containing Oxygen","Organic Compounds Containing Nitrogen","Biomolecules","Principles Related to Practical Chemistry"],
  Biology: ["Diversity in Living World","Structural Organisation in Animals and Plants","Cell Structure and Function","Plant Physiology","Human Physiology","Reproduction","Genetics and Evolution","Biology and Human Welfare","Biotechnology and Its Applications","Ecology and Environment"]
};

const state = { test:null, pdf:null, pdfUrl:null, current:0, questions:[], selectedSubject:"Physics", questionMap:new Map() };
const $ = id => document.getElementById(id);
const screens = ["home","history","about","analysis","summary","result"];

function showScreen(name){
  screens.forEach(s=>{const el=$(s+"Screen");if(el)el.classList.toggle("active",s===name)});
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.screen===name));
  if(name==="home")refreshHome(); if(name==="history")renderHistory();
}
document.querySelectorAll("[data-screen]").forEach(btn=>btn.addEventListener("click",()=>showScreen(btn.dataset.screen)));
$("startBtn").onclick=()=>{resetTest();showScreen("about")};
$("historyNewBtn").onclick=()=>{resetTest();showScreen("about")};

function resetTest(){
  state.test=null;state.pdf=null;state.pdfUrl=null;state.current=0;state.questions=[];state.questionMap=new Map();
  $("aboutForm").reset();$("syllabusArea").innerHTML="";$("pdfChoiceArea").innerHTML="";
}
$("testType").addEventListener("change",renderSyllabusUI);

function renderSyllabusUI(){
  const type=$("testType").value, area=$("syllabusArea"); area.innerHTML="";
  if(!type)return;
  if(type==="Full Syllabus"){area.innerHTML=`<div class="field"><label>Syllabus</label><div class="syllabus-box">Complete NEET syllabus (Physics + Chemistry + Biology)</div></div>`;return;}
  if(type==="Mock Test"){area.innerHTML=`<div class="field"><label>Enter Syllabus Manually</label><textarea id="manualSyllabus" required placeholder="Type the syllabus covered in this mock test..."></textarea></div>`;return;}
  if(type==="Subject-wise"){
    area.innerHTML=`<div class="field"><label>Subject</label><div class="subject-tabs">${Object.keys(SYLLABUS).map(s=>`<button type="button" data-sub="${s}" class="${s==="Physics"?"active":""}">${s}</button>`).join("")}</div></div><div class="field"><label>Select Chapters <span class="muted small">(multiple selection)</span></label><div id="subjectChapters" class="chapter-picker"></div></div>`;
    area.querySelectorAll("[data-sub]").forEach(b=>b.onclick=()=>{state.selectedSubject=b.dataset.sub;area.querySelectorAll("[data-sub]").forEach(x=>x.classList.toggle("active",x===b));renderChapterList($("subjectChapters"),state.selectedSubject)});
    renderChapterList($("subjectChapters"),"Physics");return;
  }
  area.innerHTML=`<div class="field"><label>Select Chapters <span class="muted small">(multiple selection)</span></label><div id="allChapters" class="chapter-picker"></div></div>`;
  renderAllChapters($("allChapters"));
}
function renderChapterList(container,subject){container.innerHTML=SYLLABUS[subject].map((c,i)=>`<label class="chapter-item"><input type="checkbox" value="${escapeHtml(c)}" data-chapter="${i}"><span>${escapeHtml(c)}</span></label>`).join("")}
function renderAllChapters(container){container.innerHTML=Object.entries(SYLLABUS).map(([sub,arr])=>`<div style="margin-bottom:14px"><strong>${sub}</strong><div class="chapter-list" style="margin-top:7px">${arr.map((c,i)=>`<label class="chapter-item"><input type="checkbox" value="${escapeHtml(c)}" data-subject="${sub}" data-chapter="${i}"><span>${escapeHtml(c)}</span></label>`).join("")}</div></div>`).join("")}

$("aboutForm").addEventListener("change",e=>{if(e.target.name==="usePdf")renderPdfChoice(e.target.value)});
function renderPdfChoice(choice){
  if(choice==="Yes")$("pdfChoiceArea").innerHTML=`<div class="field"><label>Upload Test Paper <span class="muted small">(PDF)</span></label><input id="pdfInput" type="file" accept="application/pdf" required><div id="pdfInfo" class="file-info"></div></div>`;
  else if(choice==="No")$("pdfChoiceArea").innerHTML=`<div class="field"><label>Number of Questions</label><input id="questionCount" type="number" min="1" max="500" placeholder="e.g. 50" required></div>`;
  else $("pdfChoiceArea").innerHTML="";
  const f=$("pdfInput"); if(f)f.addEventListener("change",e=>{const file=e.target.files[0];$("pdfInfo").textContent=file?`${file.name} • ${(file.size/1024/1024).toFixed(2)} MB`:""});
}

$("aboutForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const type=$("testType").value;let syllabus="";
  if(type==="Mock Test"){syllabus=$("manualSyllabus").value.trim();if(!syllabus)return alert("Please enter the mock-test syllabus.")}
  else if(type==="Full Syllabus")syllabus="Complete NEET syllabus (Physics + Chemistry + Biology)";
  else if(type==="Subject-wise"){const checked=[...document.querySelectorAll("#subjectChapters input:checked")].map(x=>x.value);if(!checked.length)return alert("Please select at least one chapter.");syllabus=`${state.selectedSubject}: ${checked.join(", ")}`}
  else {const checked=[...document.querySelectorAll("#allChapters input:checked")];if(!checked.length)return alert("Please select at least one chapter.");const groups={};checked.forEach(x=>(groups[x.dataset.subject]??=[]).push(x.value));syllabus=Object.entries(groups).map(([s,cs])=>`${s}: ${cs.join(", ")}`).join("\n")}

  const usePdf=document.querySelector('input[name="usePdf"]:checked')?.value;
  if(!usePdf)return alert("Please choose whether you want to upload the PDF.");
  const revised=document.querySelector('input[name="revised"]:checked')?.value;
  state.test={id:crypto.randomUUID(),name:$("testName").value.trim(),type,syllabus,revised,date:new Date().toISOString(),fileName:"",hasPdf:usePdf==="Yes"};

  if(usePdf==="Yes"){
    const file=$("pdfInput")?.files?.[0];if(!file)return alert("Please upload the test paper PDF.");
    state.test.fileName=file.name;
    try{if(!pdfjsLib)return alert("The PDF engine could not be loaded. Reload the page and make sure you are connected to the internet.");state.pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;const qCount=detectQuestionCount(state.pdf.numPages);state.questions=Array.from({length:qCount},(_,i)=>blankQuestion(i+1));await buildQuestionMap();}
    catch(err){console.error(err);return alert("Could not read this PDF. Please check that it is a valid PDF.")}
  }else{
    const count=Number($("questionCount")?.value);if(!Number.isInteger(count)||count<1)return alert("Please enter a valid number of questions.");
    state.questions=Array.from({length:count},(_,i)=>blankQuestion(i+1));
  }
  state.current=0;await renderQuestion();buildNavigator();showScreen("analysis");
});
function blankQuestion(number){return{number,status:"",guessed:false,silly:false,reason:"",topic:""}}

function detectQuestionCount(pageCount){
  // Standard NEET-style papers use 180 questions; otherwise use detected labels where possible.
  return pageCount>=24?180:Math.max(1,Math.round(pageCount*180/24));
}

async function buildQuestionMap(){
  state.questionMap=new Map();
  for(let pageNo=1;pageNo<=state.pdf.numPages;pageNo++){
    const page=await state.pdf.getPage(pageNo), viewport=page.getViewport({scale:1});
    const text=await page.getTextContent();
    const found=[];
    for(const item of text.items){
      const m=item.str.trim().match(/^Q\s*(\d{1,3})\b/); if(!m)continue;
      const x=item.transform[4], y=item.transform[5], h=item.height||Math.abs(item.transform[3])||10;
      const rect=viewport.convertToViewportRectangle([x,y,x+(item.width||20),y+h]);
      found.push({number:Number(m[1]),x:Math.min(rect[0],rect[2]),top:Math.min(rect[1],rect[3]),bottom:Math.max(rect[1],rect[3]),pageNo,width:viewport.width,height:viewport.height});
    }
    const unique=[];const seen=new Set();for(const f of found){if(!seen.has(f.number)){seen.add(f.number);unique.push(f)}}
    const midpoint=viewport.width/2;
    const columns=[unique.filter(x=>x.x<midpoint),unique.filter(x=>x.x>=midpoint)];
    for(const col of columns){
      col.sort((a,b)=>a.top-b.top);
      for(let i=0;i<col.length;i++){
        const q=col[i], next=col[i+1];
        const x0=q.x<midpoint?18:midpoint+8, x1=q.x<midpoint?midpoint-8:viewport.width-18;
        const top=Math.max(0,q.top-9), bottom=next?Math.min(viewport.height,next.top-7):viewport.height-18;
        state.questionMap.set(q.number,{pageNo,x0,x1,top,bottom});
      }
    }
  }
}

async function renderQuestion(){
  const q=state.questions[state.current],total=state.questions.length;
  $("questionTitle").textContent=`QUESTION ${q.number} / ${total}`;$("progressText").textContent=`${q.number} / ${total}`;$("progressFill").style.width=`${q.number/total*100}%`;
  const section=getSection(q.number,total);$("sectionLabel").textContent=section;
  document.querySelectorAll('input[name="status"]').forEach(x=>x.checked=x.value===q.status);renderExtraFields();
  if(state.pdf)await renderExactQuestion(q.number);else renderNoPdfQuestion(q.number);
  updateNavButtons();updateNavigatorState();
}

function getSection(num,total){
  if(total===180){if(num<=45)return "PHYSICS";if(num<=90)return "CHEMISTRY";if(num<=135)return "BOTANY";return "ZOOLOGY"}
  if(state.test?.type==="Subject-wise")return state.selectedSubject.toUpperCase();
  return "ANALYSIS";
}

async function renderExactQuestion(num){
  const info=state.questionMap.get(num);
  if(!info){
    $("questionViewer").innerHTML=`<div class="viewer-placeholder"><strong>Question ${num} could not be located automatically.</strong><div class="viewer-note">Use the navigator to continue; the PDF page will be shown as a fallback.</div></div>`;
    return;
  }
  const page=await state.pdf.getPage(info.pageNo), scale=1.65, viewport=page.getViewport({scale});
  const x0=info.x0*scale,x1=info.x1*scale,top=info.top*scale,bottom=info.bottom*scale;
  const cropW=Math.max(100,x1-x0),cropH=Math.max(80,bottom-top);
  const canvas=document.createElement("canvas");canvas.width=Math.ceil(cropW);canvas.height=Math.ceil(cropH);
  const ctx=canvas.getContext("2d");
  await page.render({canvasContext:ctx,viewport,transform:[1,0,0,1,-x0,-top]}).promise;
  $("questionViewer").innerHTML="";const wrap=document.createElement("div");wrap.className="pdf-page-wrap";wrap.appendChild(canvas);$("questionViewer").appendChild(wrap);
  const note=document.createElement("div");note.className="viewer-note";note.textContent=`Original PDF • Question ${num}`;$("questionViewer").appendChild(note);
}
function renderNoPdfQuestion(num){$("questionViewer").innerHTML=`<div class="viewer-placeholder" style="text-align:center"><strong>Question ${num}</strong><div class="viewer-note">No PDF uploaded for this test. Record your analysis using the options below.</div></div>`}

document.querySelectorAll('input[name="status"]').forEach(r=>r.addEventListener("change",e=>{const q=state.questions[state.current];q.status=e.target.value;if(q.status==="Correct"){q.silly=false;q.reason="";q.topic=""}if(q.status!=="Incorrect")q.silly=false;if(q.status==="Skipped")q.guessed=false;renderExtraFields();updateNavigatorState()}));
function renderExtraFields(){
  const q=state.questions[state.current],box=$("questionExtra");if(!q.status){box.innerHTML="";return}
  if(q.status==="Correct"){box.innerHTML=`<label class="checkline"><input id="guessed" type="checkbox" ${q.guessed?"checked":""}> I Guessed the Answer</label>`;$("guessed").onchange=e=>q.guessed=e.target.checked}
  else if(q.status==="Incorrect"){box.innerHTML=`<div class="extra-grid"><label class="checkline"><input id="silly" type="checkbox" ${q.silly?"checked":""}> Silly Mistake</label><div class="field" style="margin:0"><label>Reason <span id="reasonRequired" class="required"></span></label><textarea id="reason" placeholder="Why was the question wrong?">${escapeHtml(q.reason)}</textarea></div><div class="field" style="margin:0"><label>Topic <span class="required">*</span></label><input id="topic" type="text" value="${escapeAttr(q.topic)}" placeholder="Topic to revise"></div></div>`;const silly=$("silly"),reason=$("reason"),topic=$("topic"),rr=$("reasonRequired");rr.textContent=q.silly?"(optional because Silly Mistake is checked)":"*";silly.onchange=e=>{q.silly=e.target.checked;renderExtraFields()};reason.oninput=e=>q.reason=e.target.value;topic.oninput=e=>q.topic=e.target.value}
  else{box.innerHTML=`<div class="extra-grid"><div class="field" style="margin:0"><label>Reason <span class="required">*</span></label><textarea id="reason" placeholder="Why did you skip it?">${escapeHtml(q.reason)}</textarea></div><div class="field" style="margin:0"><label>Topic <span class="required">*</span></label><input id="topic" type="text" value="${escapeAttr(q.topic)}" placeholder="Topic to revise"></div></div>`;$("reason").oninput=e=>q.reason=e.target.value;$("topic").oninput=e=>q.topic=e.target.value}
}
function validateQuestion(q){if(!q.status)return"Select Correct, Incorrect or Skipped.";if(q.status==="Incorrect"&&!q.topic.trim())return"Topic is required for an incorrect question.";if(q.status==="Incorrect"&&!q.silly&&!q.reason.trim())return"Reason is required unless Silly Mistake is checked.";if(q.status==="Skipped"&&!q.reason.trim())return"Reason is required for a skipped question.";if(q.status==="Skipped"&&!q.topic.trim())return"Topic is required for a skipped question.";return""}
$("prevBtn").onclick=async()=>{if(state.current>0){state.current--;await renderQuestion()}};
$("nextBtn").onclick=async()=>{const err=validateQuestion(state.questions[state.current]);if(err)return alert(err);if(state.current<state.questions.length-1){state.current++;await renderQuestion()}else{const missing=state.questions.find(q=>!q.status||validateQuestion(q));if(missing){state.current=missing.number-1;await renderQuestion();return alert(`Question ${missing.number} still needs analysis.`)}renderSummary();showScreen("summary")}};
$("navigatorBtn").onclick=()=>{$("navigatorModal").classList.remove("hidden");buildNavigator()};$("closeNavigator").onclick=()=>$("navigatorModal").classList.add("hidden");$("navigatorModal").addEventListener("click",e=>{if(e.target===$("navigatorModal"))$("navigatorModal").classList.add("hidden")});
function buildNavigator(){$("questionGrid").innerHTML=state.questions.map((q,i)=>`<button class="qnav ${q.status.toLowerCase()} ${i===state.current?"current":""}" data-i="${i}">${q.number}</button>`).join("");$("questionGrid").querySelectorAll(".qnav").forEach(b=>b.onclick=async()=>{state.current=Number(b.dataset.i);$("navigatorModal").classList.add("hidden");await renderQuestion()})}
function updateNavButtons(){$("prevBtn").disabled=state.current===0;$('nextBtn').textContent=state.current===state.questions.length-1?"Review & Submit →":"Next →"}
function updateNavigatorState(){if(!$('navigatorModal').classList.contains('hidden'))buildNavigator()}
function renderSummary(){const c=state.questions.filter(q=>q.status==="Correct").length,i=state.questions.filter(q=>q.status==="Incorrect").length,s=state.questions.filter(q=>q.status==="Skipped").length;$("summaryContent").innerHTML=`<div class="info-grid"><div class="info-box"><span>Total Questions</span><strong>${state.questions.length}</strong></div><div class="info-box"><span>Correct</span><strong>${c}</strong></div><div class="info-box"><span>Incorrect</span><strong>${i}</strong></div><div class="info-box"><span>Skipped</span><strong>${s}</strong></div></div><div class="actions"><button id="finalSubmit" class="primary">Final Submit</button></div>`;$("finalSubmit").onclick=saveAndShowResult}
function scoreQuestion(q){return q.status==="Correct"?4:q.status==="Incorrect"?-1:0}
function subjectForQuestion(n,total){if(total!==180)return"Overall";if(n<=45)return"Physics";if(n<=90)return"Chemistry";if(n<=135)return"Botany";return"Zoology"}
function calculateResult(){const correct=state.questions.filter(q=>q.status==="Correct").length,incorrect=state.questions.filter(q=>q.status==="Incorrect").length,skipped=state.questions.filter(q=>q.status==="Skipped").length,silly=state.questions.filter(q=>q.silly).length,total=correct*4-incorrect,subjects={};["Physics","Chemistry","Botany","Zoology"].forEach(s=>subjects[s]={correct:0,incorrect:0,skipped:0,score:0});state.questions.forEach(q=>{const s=subjectForQuestion(q.number,state.questions.length);if(subjects[s]){subjects[s][q.status.toLowerCase()]++;subjects[s].score+=scoreQuestion(q)}});return{correct,incorrect,skipped,silly,total,subjects}}
function saveAndShowResult(){const result=calculateResult(),record={...state.test,result,questions:state.questions};const history=JSON.parse(localStorage.getItem("studymate_history")||"[]");history.unshift(record);localStorage.setItem("studymate_history",JSON.stringify(history.slice(0,100)));renderResult(record);showScreen("result")}
function renderResult(record){const r=record.result,quote=r.total<500?`<div class="result-panel"><div class="quote">“A low score is not a final result. It is feedback telling you exactly what to improve next.”</div></div>`:"";const subjectCards=Object.entries(r.subjects).map(([s,v])=>`<div class="subject-card"><span class="muted">${s}</span><strong>${v.score}</strong><div class="muted small">${v.correct} C • ${v.incorrect} I • ${v.skipped} S</div></div>`).join("");const rows=record.questions.map(q=>{const extras=[q.guessed?"Guessed":"",q.silly?"Silly Mistake":"",q.reason?`Reason: ${escapeHtml(q.reason)}`:"",q.topic?`Topic: ${escapeHtml(q.topic)}`:""].filter(Boolean).join("<br>");return`<tr><td>${q.number}</td><td><span class="badge ${q.status.toLowerCase()}">${q.status}</span></td><td>${extras||"—"}</td></tr>`}).join("");$("resultContent").innerHTML=`<div class="result-head"><p class="eyebrow">ANALYSIS RESULT</p><h2>${escapeHtml(record.name)}</h2><p class="muted">${escapeHtml(record.type)} • ${new Date(record.date).toLocaleDateString()}</p><div class="score">${r.total} <small>/ ${record.questions.length===180?720:record.questions.length*4}</small></div><div class="info-grid"><div class="info-box"><span>Total Questions</span><strong>${record.questions.length}</strong></div><div class="info-box"><span>Correct</span><strong>${r.correct}</strong></div><div class="info-box"><span>Incorrect</span><strong>${r.incorrect}</strong></div><div class="info-box"><span>Skipped</span><strong>${r.skipped}</strong></div></div></div><div class="result-panel"><h3>Test Information</h3><p><strong>Revised before test:</strong> ${escapeHtml(record.revised)}</p><h4>Syllabus Covered</h4><div class="syllabus-box">${escapeHtml(record.syllabus)}</div></div><div class="result-panel"><h3>Subject Scores</h3><div class="subject-grid">${subjectCards}</div><p style="margin-top:18px"><strong>Silly Mistakes:</strong> ${r.silly}</p><p><strong>Total Marks:</strong> ${r.total}</p></div>${quote}<div class="result-panel"><h3>Detailed Question Analysis</h3><div class="table-wrap"><table class="report-table"><thead><tr><th>Question</th><th>Status</th><th>Analysis</th></tr></thead><tbody>${rows}</tbody></table></div></div><div class="actions"><button id="backHome" class="primary">Back to Home</button><button id="viewHistory" class="secondary">View History</button></div>`;$("backHome").onclick=()=>showScreen("home");$("viewHistory").onclick=()=>showScreen("history")}
function renderHistory(){const history=JSON.parse(localStorage.getItem("studymate_history")||"[]");if(!history.length){$("historyList").innerHTML=`<div class="empty">No tests analysed yet.</div>`;return}$("historyList").innerHTML=history.map((r,i)=>`<div class="history-item"><div><strong>${escapeHtml(r.name)}</strong><div class="history-meta">${escapeHtml(r.type)} • ${new Date(r.date).toLocaleDateString()} • ${r.questions.length} questions</div></div><div style="display:flex;align-items:center;gap:12px"><strong>${r.result.total}</strong><button class="secondary" data-history="${i}">Open</button></div></div>`).join("");$("historyList").querySelectorAll("[data-history]").forEach(b=>b.onclick=()=>{const r=history[Number(b.dataset.history)];renderResult(r);showScreen("result")})}
function refreshHome(){const h=JSON.parse(localStorage.getItem("studymate_history")||"[]");$("homeTests").textContent=h.length;$("homeBest").textContent=h.length?Math.max(...h.map(x=>x.result.total)):"—";$("homeLatest").textContent=h.length?h[0].result.total:"—"}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}function escapeAttr(s){return escapeHtml(s).replace(/`/g,"&#096;")}
refreshHome();

// PWA install prompt
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  const btn = $('installBtn');
  if (btn) btn.style.display = 'inline-block';
});
if ($('installBtn')) $('installBtn').onclick = async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  $('installBtn').style.display = 'none';
};
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  if ($('installBtn')) $('installBtn').style.display = 'none';
});
