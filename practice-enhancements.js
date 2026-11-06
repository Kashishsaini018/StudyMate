/* StudyMate PR #11: removable practice PDFs, optional separate solutions PDF, silly-mistake reason skip. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const ASSIGNMENTS_KEY = 'studymate_practice_assignments_v2';
  const ATTEMPTS_KEY = 'studymate_practice_assignment_attempts_v2';
  const PROGRESS_KEY = 'studymate_practice_assignment_progress_v1';

  async function deleteStoredPracticePdf(id) {
    if (!id) return;
    const db = await openPdfDb();
    await new Promise((resolve,reject) => {
      const tx = db.transaction('practicePapers','readwrite');
      tx.objectStore('practicePapers').delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Could not remove stored PDF'));
      tx.onabort = () => reject(tx.error || new Error('PDF removal aborted'));
    });
    db.close();
  }

  async function removeAssignment(id) {
    const assignment = getPracticeAssignments().find(x => x.id === id);
    if (!assignment) return toast('Practice PDF not found.');
    if (!confirm('Remove "' + (assignment.title || assignment.fileName || 'this PDF') +
      '" from Practice? Its saved question PDF, optional solution PDF, and attempts for this assignment will also be removed.')) return;
    try {
      await deleteStoredPracticePdf(assignment.pdfId);
      if (assignment.solutionPdfId) await deleteStoredPracticePdf(assignment.solutionPdfId);
      savePracticeAssignments(getPracticeAssignments().filter(x => x.id !== id));
      savePracticeAttempts(getPracticeAttempts().filter(x => x.assignmentId !== id));
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
      if (progress?.assignmentId === id) localStorage.removeItem(PROGRESS_KEY);
      if (state.practiceQuiz?.assignmentId === id) state.practiceQuiz = null;
      renderPracticeLanding();
      toast('Practice PDF and its saved data removed.');
    } catch (error) {
      console.error('Could not remove practice assignment:', error);
      alert('StudyMate could not remove this PDF from this device. Please try again.');
    }
  }

  const baseAssignmentCard = practiceAssignmentCard;
  practiceAssignmentCard = function (assignment) {
    const html = baseAssignmentCard(assignment);
    return html.replace('</article>',
      '<button type="button" class="secondary practice-remove-pdf" data-assignment-remove="' +
      String(assignment.id).replace(/&/g,'&amp;').replace(/"/g,'&quot;') +
      '">Remove PDF</button></article>');
  };

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-assignment-remove]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    removeAssignment(button.dataset.assignmentRemove);
  }, true);

  function buildSeparateSolutionMap(pdf) {
    return (async () => {
      const found = new Map();
      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
        const page = await pdf.getPage(pageNo);
        const viewport = page.getViewport({scale:1});
        const text = await page.getTextContent();
        const labels = findPracticeLabels(text.items, viewport);
        if (!labels.length) continue;
        const split = viewport.width / 2;
        const left = labels.filter(x => x.x < split);
        const right = labels.filter(x => x.x >= split);
        const columns = left.length >= 2 && right.length >= 2 ? [left,right] : [labels];
        for (const column of columns) {
          column.sort((a,b) => a.top - b.top);
          for (let i=0;i<column.length;i++) {
            const item = column[i], next = column[i+1];
            const isLeft = columns.length === 2 && item.x < split;
            const x0 = columns.length === 2
              ? (isLeft ? Math.max(0,Math.min(item.x-14,split-18)) : Math.max(split+8,item.x-14))
              : 18;
            const x1 = columns.length === 2 ? (isLeft ? split-8 : viewport.width-18) : viewport.width-18;
            const top = Math.max(0,item.top-8);
            const bottom = next ? Math.max(top+40,next.top-8) : viewport.height-10;
            if (!found.has(item.number)) found.set(item.number,{pageNo,x0,x1,top,bottom});
          }
        }
      }
      return found;
    })();
  }

  renderAssignmentUpload = function () {
    const box = $('assignmentUploadBuilder');
    if (!box) return;
    const active = document.querySelector('[data-practice-subject].active')?.dataset.practiceSubject || 'Physics';
    box.innerHTML =
      '<div class="field"><label>Question PDF</label><input id="assignmentPdfInput" type="file" accept="application/pdf"><div id="assignmentPdfInfo" class="small-muted"></div></div>' +
      '<div class="field"><label>Solution PDF <span class="small-muted">(optional, separate file)</span></label><input id="assignmentSolutionPdfInput" type="file" accept="application/pdf"><div id="assignmentSolutionPdfInfo" class="small-muted">Upload a separate numbered solutions PDF to show solutions in review.</div></div>' +
      '<div class="field"><label>Subject</label><select id="assignmentSubject">' + SUBJECTS.map(x => '<option ' + (x===active?'selected':'') + '>' + x + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Chapter</label><input id="assignmentChapter" placeholder="e.g. Work, Energy and Power"></div>' +
      '<div class="field"><label>Quiz mode for this upload</label><div class="segmented"><label><input type="radio" name="assignmentQuizMode" value="practice"> Practice Mode</label><label><input type="radio" name="assignmentQuizMode" value="test"> Test Mode</label></div></div>' +
      '<div class="field"><label>Optional separate Answer Key (.txt)</label><input id="assignmentKeyInput" type="file" accept=".txt,text/plain"><div class="small-muted">An answer key inside the question PDF is detected automatically. A .txt key can override or complete it.</div></div>' +
      '<div class="actions"><button class="primary" id="saveAssignmentBtn">Analyze & Save Assignment</button></div>';
    $('assignmentPdfInput').onchange = e => {
      const file=e.target.files[0];
      $('assignmentPdfInfo').textContent=file ? file.name+' • '+(file.size/1048576).toFixed(2)+' MB' : '';
    };
    $('assignmentSolutionPdfInput').onchange = e => {
      const file=e.target.files[0];
      $('assignmentSolutionPdfInfo').textContent=file ? file.name+' • '+(file.size/1048576).toFixed(2)+' MB • Optional solution file selected' : 'Upload a separate numbered solutions PDF to show solutions in review.';
    };
    $('saveAssignmentBtn').onclick = saveAssignmentWithOptionalSolutions;
  };

  async function saveAssignmentWithOptionalSolutions() {
    const file=$('assignmentPdfInput')?.files?.[0];
    const solutionFile=$('assignmentSolutionPdfInput')?.files?.[0] || null;
    const mode=document.querySelector('input[name=assignmentQuizMode]:checked')?.value;
    if(!file)return alert('Choose the question PDF.');
    if(!mode)return alert('Choose Practice Mode or Test Mode for this upload.');
    if(!pdfjsLib)return alert('PDF engine unavailable.');
    const subject=$('assignmentSubject').value;
    const chapter=$('assignmentChapter').value.trim() || inferPracticeChapter(file.name,file.name);
    const saveButton=$('saveAssignmentBtn');
    saveButton.disabled=true; saveButton.textContent='Analyzing PDFs…';
    let id=null, solutionId=null;
    try {
      const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
      const parsed=await extractPracticeAssignment(pdf);
      if(!parsed.questions.length)throw new Error('No questions were detected in the question PDF.');
      const keyFile=$('assignmentKeyInput')?.files?.[0];
      const keyOverride=keyFile ? parseAnswerKey(await keyFile.text()) : {};
      parsed.questions.forEach(q => {
        if(Object.prototype.hasOwnProperty.call(keyOverride,q.number)){
          const key=keyOverride[q.number];
          q.answerKey=q.info.questionType==='numeric' ? Number(key.value) :
            key.kind==='letter' ? key.value : Number(key.value)-1;
        }
      });
      id=uid();
      await savePracticePdfBlob(id,file);
      let solutionCount=0;
      if(solutionFile){
        const solutionPdf=await pdfjsLib.getDocument({data:await solutionFile.arrayBuffer()}).promise;
        const solutionMap=await buildSeparateSolutionMap(solutionPdf);
        parsed.questions.forEach(q => {
          const info=solutionMap.get(q.number);
          if(info){q.solutionInfo=info;solutionCount++;}
          else q.solutionInfo=null;
        });
        solutionId=id+'_solutions';
        await savePracticePdfBlob(solutionId,solutionFile);
      }
      const assignment={
        id,subject,chapter,title:file.name.replace(/\.pdf$/i,''),
        brand:subject==='Physics'?'Sangharsh Assignment':subject==='Chemistry'?'Chemistry Practice Sheet':subject==='Botany'?'Botany Practice Sheet':'Zoology Practice Sheet',
        fileName:file.name,pdfId:id,solutionPdfId:solutionId,
        solutionFileName:solutionFile?.name || '',solutionCount,
        mode,createdAt:new Date().toISOString(),...parsed
      };
      const list=getPracticeAssignments();list.unshift(assignment);savePracticeAssignments(list.slice(0,100));
      closeModal('assignmentUploadModal');renderPracticeLanding();
      toast(assignment.title+' saved with '+assignment.totalQuestions+' questions'+(solutionFile?' and '+solutionCount+' mapped solutions':'')+' ✓');
    } catch(error) {
      console.error('Could not save practice PDFs:',error);
      if(id)try{await deleteStoredPracticePdf(id)}catch(_){}
      if(solutionId)try{await deleteStoredPracticePdf(solutionId)}catch(_){}
      alert(error.message || 'Could not read the selected PDF files. Please check that they are valid PDFs.');
      saveButton.disabled=false;saveButton.textContent='Analyze & Save Assignment';
    }
  }

  // When "Silly mistake" is selected, keep the optional topic field but remove the reason prompt.
  const originalRenderExtraFields = renderExtraFields;
  renderExtraFields = function () {
    originalRenderExtraFields();
    const q=state.questions?.[state.current];
    if(!q || q.status!=='Incorrect' || !q.silly) return;
    const reason=$('reason');
    if(reason){
      const field=reason.closest('.field');
      if(field) field.innerHTML='<div class="small-muted">Marked as a silly mistake — no reason is required.</div>';
    }
  };
  const originalValidateQuestion = validateQuestion;
  validateQuestion = function (q) {
    if(q?.status==='Incorrect' && q.silly){
      if(!q.status)return 'Select Correct, Incorrect or Skipped.';
      return '';
    }
    return originalValidateQuestion(q);
  };

  const style=document.createElement('style');
  style.textContent='.practice-remove-pdf{margin:8px 0 4px;width:100%;border-color:var(--red,#b44);color:var(--red,#d66)}';
  document.head.appendChild(style);
})();