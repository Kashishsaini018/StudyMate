/* Stable StudyMate quiz experience and answer-based Test Analysis. */
(function(){
'use strict';
const byId=id=>document.getElementById(id);
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let analysisKey=null;

/* Compact PDF library rows: title/chapter, tiny metadata, one Start/Continue action. */
practiceAssignmentCard=function(a){
 const attempts=getPracticeAttempts().filter(x=>x.assignmentId===a.id),done=new Set(attempts.map(x=>x.question)).size;
 return '<article class="practice-pdf-row"><button type="button" class="practice-pdf-main" data-assignment-start="'+esc(a.id)+'"><strong>'+esc(a.chapter||a.title)+'</strong><small>'+esc(a.subject||'')+' · '+(a.totalQuestions||a.questions.length)+' questions'+(done?' · '+done+' attempted':'')+'</small></button><button type="button" class="practice-pdf-start" data-assignment-start="'+esc(a.id)+'">'+(done?'Continue':'Start')+' →</button></article>';
};

/* Option selection updates only the selected state; it does not rebuild the page or PDF canvas. */
function renderStableQuiz(assignment){
 const d=state.practiceQuiz;if(!d||!d.questions||!d.questions.length)return;
 const q=d.questions[assignment?d.index:d.index],num=q.number,old=d.answers[num],practice=d.mode==='practice',numeric=assignment?q.info.questionType==='numeric':q.questionType==='numeric';
 const viewerId=assignment?'assignmentQuizViewer':'practicePdfViewer';
 let html='<div class="page-head quiz-head"><div><span class="eyebrow">'+(practice?'PRACTICE MODE':'TEST MODE')+' · '+esc(d.title||d.brand)+'</span><h2>Question '+(d.index+1)+' / '+d.questions.length+'</h2><small>'+esc(q.s||d.chapter||'')+'</small></div><button type="button" class="secondary" id="stableExit">Exit</button></div>';
 html+='<div class="quiz-question" id="'+viewerId+'"><div class="viewer-placeholder">Loading question…</div></div>';
 if(numeric)html+='<div class="response-box"><label>Numerical answer</label><input id="stableNumeric" type="number" inputmode="decimal" step="any" value="'+(old==null?'':esc(old))+'" placeholder="Enter answer">'+(practice?'<button type="button" id="stableCheck" class="secondary">Check answer</button>':'')+'</div>';
 else{
  html+='<div class="quiz-options" id="stableOptions">';
  for(let i=0;i<4;i++)html+='<button type="button" data-stable-opt="'+i+'" class="'+(Number(old)===i?'selected':'')+'">'+String.fromCharCode(65+i)+'</button>';
  html+='</div>';
 }
 html+='<div id="stableFeedback" aria-live="polite"></div><div class="actions between"><button type="button" class="secondary" id="stablePrev" '+(d.index===0?'disabled':'')+'>← Previous</button><div class="inline-actions"><button type="button" class="secondary" id="stableSkip">'+(old==null?'Skip':'Clear')+'</button><button type="button" class="primary" id="stableNext">'+(d.index===d.questions.length-1?(practice?'Finish Practice':'Submit Test'):'Next →')+'</button></div></div>';
 $('practiceScreen').innerHTML=html;
 const answerKey=q.answerKey,hasKey=answerKey!==null&&answerKey!==undefined;
 const feedback=function(){
  const value=d.answers[num],checked=numeric?!!d.checkedAnswers[num]:value!==null&&value!==undefined;
  const box=byId('stableFeedback');if(!practice||!checked||value==null){box.innerHTML='';return;}
  if(!hasKey){box.innerHTML='<p class="quiz-feedback">Answer saved. No answer key was supplied.</p>';return;}
  const ok=numeric?numericEqual(value,answerKey):Number(value)===Number(answerKey);
  box.innerHTML='<p class="quiz-feedback '+(ok?'is-correct':'is-wrong')+'"><b>'+(ok?'✓ Correct':'✕ Incorrect')+'</b> · Correct answer: '+(numeric?esc(answerKey):String.fromCharCode(65+Number(answerKey)))+'</p>';
 };
 if(numeric){
  byId('stableNumeric').oninput=e=>{d.answers[num]=e.target.value===''?null:Number(e.target.value);delete d.checkedAnswers[num];};
  byId('stableCheck')?.addEventListener('click',()=>{const v=byId('stableNumeric').value;if(v===''||!Number.isFinite(Number(v)))return alert('Enter a valid numerical answer.');d.answers[num]=Number(v);d.checkedAnswers[num]=true;feedback();});
 }else{
  document.querySelectorAll('[data-stable-opt]').forEach(b=>b.addEventListener('click',()=>{
   d.answers[num]=Number(b.dataset.stableOpt);
   document.querySelectorAll('[data-stable-opt]').forEach(x=>x.classList.toggle('selected',x===b));
   feedback();
  }));
 }
 byId('stablePrev').onclick=async()=>{if(d.index>0){d.index--;if(assignment)await renderAssignmentQuiz();else await renderPracticeQuiz();}};
 byId('stableSkip').onclick=async()=>{
  if(d.answers[num]!==null&&d.answers[num]!==undefined){d.answers[num]=null;delete d.checkedAnswers[num];byId('stableFeedback').innerHTML='';byId('stableSkip').textContent='Skip';document.querySelectorAll('[data-stable-opt]').forEach(x=>x.classList.remove('selected'));return;}
  d.answers[num]=null;
  if(d.index<d.questions.length-1){d.index++;if(assignment)await renderAssignmentQuiz();else await renderPracticeQuiz();}
  else if(assignment)finishAssignmentQuiz();else finishPracticeQuiz(true);
 };
 byId('stableNext').onclick=async()=>{
  if(numeric){const v=byId('stableNumeric').value;if(v===''||!Number.isFinite(Number(v)))return alert('Enter a valid numerical answer or choose Skip.');d.answers[num]=Number(v);}
  if(d.index<d.questions.length-1){d.index++;if(assignment)await renderAssignmentQuiz();else await renderPracticeQuiz();}
  else if(assignment)finishAssignmentQuiz();else finishPracticeQuiz(false);
 };
 byId('stableExit').onclick=()=>{if(confirm('Leave this quiz?')){state.practiceQuiz=null;renderPracticeLanding();showScreen('practice');}};
 if(assignment)renderAssignmentPdfQuestion(q);else if(d.pdf)renderPracticePdfQuestion(q);
}
renderPracticeQuiz=async function(){renderStableQuiz(false);};
renderAssignmentQuiz=async function(){renderStableQuiz(true);};

/* Test Analysis asks for a companion answer key PDF or .txt and grades the user's selected options. */
const originalPdfChoice=renderPdfChoice;
renderPdfChoice=function(choice){
 originalPdfChoice(choice);
 if(choice==='Yes'&&byId('pdfChoiceArea')&&!byId('analysisAnswerKeyFile')){
  byId('pdfChoiceArea').insertAdjacentHTML('beforeend','<div class="field"><label>Answer key / hints & solutions PDF (or .txt)</label><input id="analysisAnswerKeyFile" type="file" accept="application/pdf,.txt,text/plain" required><small class="small-muted">Required for automatic marking. Upload the matching key for this paper.</small></div>');
 }
};
const form=byId('aboutForm');
if(form&&typeof form.onsubmit==='function'){
 const oldSubmit=form.onsubmit;
 form.onsubmit=async function(e){
  e.preventDefault();
  const questionFile=byId('pdfInput')?.files?.[0],keyFile=byId('analysisAnswerKeyFile')?.files?.[0];
  if(!questionFile)return alert('Upload the question paper PDF for answer-based Test Analysis.');
  if(!keyFile)return alert('Upload the matching answer key / solutions PDF or .txt file.');
  let key={};
  try{
   if(/\.txt$/i.test(keyFile.name)||keyFile.type==='text/plain')key=parseAnswerKey(await keyFile.text());
   else{
    const pdf=await pdfjsLib.getDocument({data:await keyFile.arrayBuffer()}).promise;
    const parsed=await extractPairedSolutionData(pdf);key=parsed.answerKey||{};
    if(!Object.keys(key).length){
     let all='';for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p),tc=await page.getTextContent();all+=' '+tc.items.map(x=>x.str||'').join(' ');}
     key=parseAnswerKey(all);
    }
   }
   if(!Object.keys(key).length)throw new Error('No answer-key entries detected. Use a selectable-text PDF or .txt such as 1A 2C 3B.');
  }catch(err){console.error(err);return alert('Could not read the answer key. '+(err.message||''));}
  analysisKey=key;
  await oldSubmit.call(this,e);
  if(!state.pdf||!state.questions?.length)return;
  const missing=state.questions.filter(q=>!analysisKey[q.number]);
  if(missing.length){
   alert('The answer key is missing '+missing.length+' question(s): '+missing.slice(0,12).map(q=>'Q'+q.number).join(', ')+'. Please use the matching complete key.');
   state.questions=[];state.test=null;state.pdf=null;showScreen('about');return;
  }
  state.questions.forEach(q=>{q.answerKey=analysisKey[q.number].value;q.answerKeyType=analysisKey[q.number].kind||'letter';q.userAnswer=undefined;q.status='';});
  saveAnalysisDraft();await renderQuestion();
 };
}
renderQuestion=async function(){
 if(!state.questions?.length)return;
 const q=state.questions[state.current],total=state.questions.length;
 if(analysisKey&&analysisKey[q.number]&&!Object.prototype.hasOwnProperty.call(q,'answerKey')){q.answerKey=analysisKey[q.number].value;q.answerKeyType=analysisKey[q.number].kind||'letter';}
 $('questionTitle').textContent='Question '+q.number+' / '+total;
 $('sectionLabel').textContent=sectionFor(q.number,total);
 $('progressText').textContent=(state.current+1)+' / '+total;
 $('progressFill').style.width=((state.current+1)/total*100)+'%';
 document.querySelector('.status-options')?.classList.add('answer-mode-hidden');
 let html='<div class="analysis-answer-panel"><span class="dock-label">SELECT YOUR ANSWER</span>';
 if(q.answerKeyType==='numeric')html+='<input id="analysisNumeric" type="number" step="any" inputmode="decimal" value="'+(q.userAnswer==null?'':esc(q.userAnswer))+'" placeholder="Numerical answer">';
 else{
  html+='<div class="analysis-answer-grid">';
  for(let i=0;i<4;i++)html+='<button type="button" data-analysis-answer="'+i+'" class="'+(Number(q.userAnswer)===i?'selected':'')+'">'+String.fromCharCode(65+i)+'</button>';
  html+='</div>';
 }
 html+='<button type="button" class="secondary analysis-skip" id="analysisSkip">'+(q.userAnswer===null?'Skipped':'Skip question')+'</button></div>';
 $('questionExtra').innerHTML=html;
 if(state.pdf)await renderExactQuestion(q.number);else renderNoPdfQuestion(q.number);
 document.querySelectorAll('[data-analysis-answer]').forEach(b=>b.addEventListener('click',()=>{
  q.userAnswer=Number(b.dataset.analysisAnswer);
  document.querySelectorAll('[data-analysis-answer]').forEach(x=>x.classList.toggle('selected',x===b));
  $('analysisSkip').textContent='Skip question';scheduleDraftSave();
 }));
 if(q.answerKeyType==='numeric')$('analysisNumeric').oninput=e=>{q.userAnswer=e.target.value===''?undefined:Number(e.target.value);scheduleDraftSave();};
 $('analysisSkip').onclick=()=>{
  q.userAnswer=null;document.querySelectorAll('[data-analysis-answer]').forEach(x=>x.classList.remove('selected'));
  $('analysisSkip').textContent='Skipped';scheduleDraftSave();
 };
 updateNavButtons();
};
$('prevBtn').onclick=async()=>{if(state.current>0){state.current--;scheduleDraftSave();await renderQuestion();}};
$('nextBtn').onclick=async()=>{
 const q=state.questions[state.current];if(q.userAnswer===undefined)q.userAnswer=null;
 if(state.current<state.questions.length-1){state.current++;await renderQuestion();}
 else{saveAnalysisDraft();renderSummary();showScreen('summary');}
};
buildNavigator=function(){
 $('questionGrid').innerHTML=state.questions.map((q,i)=>'<button class="qnav '+(q.userAnswer===undefined?'':q.userAnswer===null?'skipped':'answered')+' '+(i===state.current?'current':'')+'" data-i="'+i+'">'+q.number+'</button>').join('');
 $('questionGrid').querySelectorAll('.qnav').forEach(b=>b.onclick=async()=>{state.current=Number(b.dataset.i);closeModal('navigatorModal');await renderQuestion();});
};
renderSummary=function(){
 const qs=state.questions,answered=qs.filter(q=>q.userAnswer!==undefined&&q.userAnswer!==null).length;
 $('summaryContent').innerHTML='<div class="panel"><div class="result-kpis"><div class="kpi"><strong>'+qs.length+'</strong><small>Questions</small></div><div class="kpi"><strong>'+answered+'</strong><small>Answered</small></div><div class="kpi"><strong>'+(qs.length-answered)+'</strong><small>Skipped</small></div></div><p class="small-muted">StudyMate will compare your selected answers with the uploaded answer key after submission.</p><div class="actions"><button id="editAnalysis" class="secondary">← Continue answering</button><button id="finalSubmit" class="primary">Submit Test & Analyse 🎉</button></div></div>';
 $('editAnalysis').onclick=()=>showScreen('analysis');$('finalSubmit').onclick=saveAndShowResult;
};
calculateResult=function(){
 const qs=state.questions,subjects={};SUBJECTS.forEach(s=>subjects[s]={correct:0,incorrect:0,skipped:0,score:0,attempted:0});
 let correct=0,incorrect=0,skipped=0,silly=0;
 qs.forEach(q=>{
  if(q.userAnswer===undefined||q.userAnswer===null)q.status='Skipped';
  else q.status=(q.answerKeyType==='numeric'?numericEqual(q.userAnswer,q.answerKey):Number(q.userAnswer)===Number(q.answerKey))?'Correct':'Incorrect';
  if(q.status==='Correct')correct++;else if(q.status==='Incorrect')incorrect++;else skipped++;
  const subject=subjectFor(q.number,qs.length);if(subjects[subject]){subjects[subject][q.status.toLowerCase()]++;if(q.status!=='Skipped')subjects[subject].attempted++;subjects[subject].score+=q.status==='Correct'?4:q.status==='Incorrect'?-1:0;}
 });
 Object.values(subjects).forEach(v=>v.accuracy=v.correct+v.incorrect?v.correct/(v.correct+v.incorrect)*100:0);
 return{correct,incorrect,skipped,silly,total:correct*4-incorrect,accuracy:correct+incorrect?correct/(correct+incorrect)*100:0,subjects};
};

/* Merge a second coordinate pass to recover numbered questions missed by the initial PDF map. */
const oldBuildMap=buildQuestionMap;
buildQuestionMap=async function(){
 await oldBuildMap();
 for(let p=1;p<=state.pdf.numPages;p++){
  const page=await state.pdf.getPage(p),vp=page.getViewport({scale:1}),tc=await page.getTextContent(),split=vp.width/2;
  const items=tc.items.map(item=>({text:String(item.str||'').replace(/\u00a0/g,' ').trim(),r:getItemRect(item,vp)})).filter(x=>x.text);
  const cols=items.some(x=>x.r.x<split)&&items.some(x=>x.r.x>=split)?[items.filter(x=>x.r.x<split),items.filter(x=>x.r.x>=split)]:[items];
  for(const col of cols){
   col.sort((a,b)=>a.r.top-b.r.top||a.r.x-b.r.x);let lines=[],line=[],y=null;
   const flush=()=>{if(line.length){line.sort((a,b)=>a.r.x-b.r.x);lines.push({text:line.map(x=>x.text).join(' ').replace(/\s+/g,' ').trim(),top:Math.min(...line.map(x=>x.r.top)),x:line[0].r.x});}line=[];y=null;};
   for(const it of col){if(y===null||Math.abs(it.r.top-y)<=4){line.push(it);if(y===null)y=it.r.top;}else{flush();line=[it];y=it.r.top;}}flush();
   for(let i=0;i<lines.length;i++){
    const ln=lines[i],m=ln.text.match(/^(?:Q(?:uestion)?\s*)?(\d{1,3})(?:\s*[.)\]:-])?(?=\s|$)/i);if(!m)continue;
    const n=Number(m[1]);if(n<1||n>500||state.questionMap.has(n))continue;
    const next=lines.slice(i+1).find(x=>x.top>ln.top+5),two=cols.length===2,left=two&&ln.x<split;
    const x0=two?(left?Math.max(0,Math.min(ln.x-14,split-18)):Math.max(split+8,ln.x-14)):Math.max(8,ln.x-14);
    const x1=two?(left?split-8:vp.width-8):vp.width-8,top=Math.max(0,ln.top-12),bottom=next?Math.max(top+45,next.top-8):vp.height-12;
    state.questionMap.set(n,{pageNo:p,x0,x1,top,bottom});
   }
  }
 }
 state.detectedCount=Math.max(state.detectedCount||0,...state.questionMap.keys());
};

/* Add a personal explanation field beside the existing Add to Notebook action in result review. */
const oldResult=renderPracticeResult;
renderPracticeResult=function(result){
 window.__reviewQuestions=result.questions;window.__reviewTitle=result.title;
 oldResult(result);
 document.querySelectorAll('.practice-review-item').forEach(row=>{
  const n=Number((row.querySelector('b')?.textContent||'').replace(/\D/g,'')),q=result.questions.find(x=>Number(x.number)===n);
  if(!q||q.status!=='Incorrect')return;
  const actions=row.querySelector('.inline-actions');if(actions&&!actions.querySelector('[data-my-explanation]')){
   actions.insertAdjacentHTML('beforeend','<button type="button" class="secondary" data-my-explanation="'+n+'">＋ My explanation</button><div class="review-explanation hidden" id="myExplanation_'+n+'"><textarea rows="3" placeholder="Write your own explanation or reminder…"></textarea><button type="button" class="primary" data-save-my-explanation="'+n+'">Save</button></div>');
  }
 });
};
const results=byId('resultContent');
if(results&&!results.dataset.myExplanationBound){
 results.addEventListener('click',e=>{
  const open=e.target.closest('[data-my-explanation]');
  if(open){byId('myExplanation_'+open.dataset.myExplanation)?.classList.toggle('hidden');return;}
  const save=e.target.closest('[data-save-my-explanation]');
  if(save){
   const n=Number(save.dataset.saveMyExplanation),text=byId('myExplanation_'+n)?.querySelector('textarea')?.value.trim();
   if(!text)return alert('Write your explanation first.');
   const q=(window.__reviewQuestions||[]).find(x=>Number(x.number)===n)||{number:n,s:'Practice'};
   const entry=addMistakeNotebookEntry({question:q,record:{name:window.__reviewTitle||'Practice quiz'},source:'Practice Quiz'});
   entry.myExplanation=text;saveMistakeNotebook(getMistakeNotebook());save.disabled=true;save.textContent='✓ Saved';toast('Explanation saved to Mistake Notebook.');
  }
 });
 results.dataset.myExplanationBound='1';
}

/* Never preselect a mode on a fresh PDF upload. */
const oldAssignmentUpload=renderAssignmentUpload;
renderAssignmentUpload=function(){oldAssignmentUpload();document.querySelectorAll('input[name="assignmentQuizMode"]').forEach(x=>x.checked=false);};
})();

/* The paired 180-question paper belongs to Test Analysis, not Practice Quiz. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const originalLanding=renderPracticeLanding;
renderPracticeLanding=function(subject){
 originalLanding(subject);
 $('openNeetPairImport')?.remove();
};
function addFullTestAnalysisButton(){
 const head=document.querySelector('#aboutScreen .page-head');
 if(!head||$('openFullTestAnalysisImport'))return;
 const btn=document.createElement('button');
 btn.type='button';btn.id='openFullTestAnalysisImport';btn.className='secondary';
 btn.textContent='＋ Import 180-question NEET test';
 btn.addEventListener('click',()=>openModal('pdfQuizModal',renderPairedNeetTestBuilder));
 head.appendChild(btn);
}
addFullTestAnalysisButton();
new MutationObserver(()=>addFullTestAnalysisButton()).observe($('aboutScreen'),{childList:true,subtree:true});

renderPairedNeetTestBuilder=function(){
 const b=$('pdfQuizBuilder');if(!b)return;
 b.innerHTML='<div class="eyebrow">NEET FULL TEST · TEST ANALYSIS</div>'+
 '<p class="small-muted">Upload the question paper and matching hints / solutions PDF. StudyMate will check the answer key and open the 180-question paper in Test Analysis. You will select your own answers; the app grades them after submission.</p>'+
 '<div class="field"><label>Question paper PDF</label><input id="neetQuestionPdf" type="file" accept="application/pdf"></div>'+
 '<div class="field"><label>Hints and solutions / answer key PDF</label><input id="neetSolutionPdf" type="file" accept="application/pdf"></div>'+
 '<div class="field"><label>Test name</label><input id="neetTestName" value="NEET Full Test (180 Questions)" maxlength="100"></div>'+
 '<div class="actions"><button class="primary" type="button" id="startPairedNeetTest">Analyze PDFs & Start Test Analysis →</button></div>'+
 '<p class="small-muted">NEET marking: +4 correct, −1 incorrect, 0 unanswered. Subject ranges: Physics 1–45, Chemistry 46–90, Botany 91–135, Zoology 136–180.</p>';
 $('startPairedNeetTest').onclick=startPairedNeetTest;
};
startPairedNeetTest=async function(){
 const qFile=$('neetQuestionPdf')?.files?.[0],sFile=$('neetSolutionPdf')?.files?.[0];
 if(!qFile||!sFile)return alert('Choose both the question paper and matching solutions PDF.');
 if(!pdfjsLib)return alert('PDF engine unavailable. Reload StudyMate and try again.');
 const btn=$('startPairedNeetTest');btn.disabled=true;btn.textContent='Analyzing both PDFs…';
 try{
  const qPdf=await pdfjsLib.getDocument({data:await qFile.arrayBuffer()}).promise;
  const sPdf=await pdfjsLib.getDocument({data:await sFile.arrayBuffer()}).promise;
  const qMap=await extractPdfMap(qPdf),nums=Array.from({length:180},(_,i)=>i+1);
  const missing=nums.filter(n=>!qMap.has(n));
  if(missing.length)throw new Error('Question paper check failed. Missing question labels: '+missing.slice(0,15).map(n=>'Q'+n).join(', ')+'.');
  const parsed=await extractPairedSolutionData(sPdf);
  const missingKey=nums.filter(n=>!parsed.answerKey[n]||parsed.answerKey[n].value==null);
  if(missingKey.length)throw new Error('Answer key is incomplete. Missing: '+missingKey.slice(0,15).map(n=>'Q'+n).join(', ')+'.');
  const missingSolutions=nums.filter(n=>!parsed.solutionMap.has(n));
  if(missingSolutions.length)throw new Error('Solution matching is incomplete. Missing: '+missingSolutions.slice(0,15).map(n=>'Q'+n).join(', ')+'.');
  const qId=uid(),sId=uid();await savePdfBlob(qId,qFile);await savePdfBlob(sId,sFile);
  state.test={id:uid(),name:$('neetTestName')?.value.trim()||qFile.name.replace(/\.pdf$/i,''),type:'Full Syllabus',syllabus:'Complete NEET syllabus · Physics, Chemistry, Botany and Zoology',revised:'Not specified',date:new Date().toISOString(),fileName:qFile.name,hasPdf:true,solutionPdfId:sId};
  state.pdfFile=qFile;state.pdf=qPdf;state.questionMap=qMap;state.detectedCount=180;state.current=0;
  state.questions=nums.map(n=>{
   const subject=n<=45?'Physics':n<=90?'Chemistry':n<=135?'Botany':'Zoology';
   return Object.assign(blankQuestion(n),{answerKey:parsed.answerKey[n].value,answerKeyType:parsed.answerKey[n].kind||'letter',userAnswer:undefined,subject,s:subject,c:'Chapter not classified',solutionInfo:parsed.solutionMap.get(n),solutionPdfId:sId,sourcePdfId:qId});
  });
  closeModal('pdfQuizModal');saveAnalysisDraft();await renderQuestion();showScreen('analysis');
 }catch(error){console.error('NEET Test Analysis import failed:',error);alert('StudyMate could not safely start Test Analysis. '+(error.message||'Please check both PDFs.'));}
 finally{const current=$('startPairedNeetTest');if(current){current.disabled=false;current.textContent='Analyze PDFs & Start Test Analysis →';}}
};
})();