/* StudyMate: assignment analysis, reattempt modes, solution review and home navigation. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[ch]));
  const PROGRESS_KEY = 'studymate_practice_assignment_progress_v1';

  // The brand mark is a global home affordance, including when a quiz replaces the screen body.
  function goHome(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (typeof showScreen === 'function') showScreen('home');
    else document.querySelector('[data-screen="home"]')?.click();
  }
  document.addEventListener('click', event => {
    if (event.target.closest('.brand-wrap,.brand-logo,.brand,.brand-subtitle,[data-home-logo]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      goHome();
    }
  }, true);
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') &&
        event.target.closest('.brand-wrap,.brand-logo,.brand,.brand-subtitle,[data-home-logo]')) {
      goHome(event);
    }
  }, true);

  function latestAttempts(id) {
    const latest = {};
    getPracticeAttempts().filter(x => x.assignmentId === id)
      .sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0))
      .forEach(x => { if (!latest[x.question]) latest[x.question] = x; });
    return latest;
  }
  function countsFor(questions) {
    return {
      correct:questions.filter(q => q.status === 'Correct').length,
      incorrect:questions.filter(q => q.status === 'Incorrect').length,
      skipped:questions.filter(q => q.status === 'Skipped').length,
      answered:questions.filter(q => ['Correct','Incorrect','Answered'].includes(q.status)).length
    };
  }
  function assignmentCard(a) {
    const latest = latestAttempts(a.id);
    const attempted = Object.keys(latest).length;
    const counts = countsFor(a.questions.map(q => ({status:latest[q.number]?.status || 'Unattempted'})));
    return '<article class="practice-pdf-row">' +
      '<div class="practice-pdf-main"><strong>' + esc(a.chapter || a.title) + '</strong>' +
      '<small>' + esc(a.subject || '') + ' · ' + (a.totalQuestions || a.questions.length) +
      ' questions · ' + attempted + ' attempted</small></div>' +
      (attempted
        ? '<button type="button" class="practice-pdf-start" data-assignment-analysis="' + esc(a.id) + '">View Analysis</button>'
        : '<button type="button" class="practice-pdf-start" data-assignment-start="' + esc(a.id) + '">Start →</button>') +
      '</article>';
  }
  practiceAssignmentCard = assignmentCard;

  async function openAssignmentAnalysis(id) {
    const assignment = getPracticeAssignments().find(x => x.id === id);
    if (!assignment) return toast('Saved assignment not found.');
    const latest = latestAttempts(id);
    const questions = assignment.questions.map(q => {
      const attempt = latest[q.number] || null;
      return {
        ...q, number:q.number, pdf:null, questionType:q.info?.questionType || 'mcq', assignmentId:id,
        practicePdfId:assignment.pdfId, chapter:assignment.chapter,
        s:assignment.subject, c:assignment.chapter,
        status:attempt?.status || 'Unattempted',
        userAnswer:attempt?.response ?? null,
        correctAnswer:attempt?.correct ?? q.answerKey ?? null,
        hasKey:attempt?.hasKey ?? (q.answerKey != null),
        responseLabel:attempt?.responseLabel || '',
        correctLabel:attempt?.correctLabel || ''
      };
    });
    const counts = countsFor(questions);
    const scored = questions.filter(q => q.hasKey && q.status !== 'Unattempted').length;
    const marks = questions.reduce((sum,q) =>
      sum + (q.status === 'Correct' ? 4 : q.status === 'Incorrect' ? -1 : 0), 0);
    const attempted = counts.correct + counts.incorrect + counts.skipped + questions.filter(q => q.status === 'Answered').length;
    const accuracy = counts.correct + counts.incorrect
      ? counts.correct / (counts.correct + counts.incorrect) * 100 : 0;
    window.__studyMateAssignmentReview = {assignment,questions,counts,marks,scored,attempted,accuracy};
    const panel = $('practiceScreen');
    panel.innerHTML =
      '<div class="dpp-shell dpp-analysis-overview">' +
        '<div class="dpp-top"><div><span class="eyebrow">PRACTICE TEST ANALYSIS</span><h2>' + esc(assignment.title) + '</h2>' +
        '<small>' + esc(assignment.subject) + ' · ' + esc(assignment.chapter) + ' · ' + questions.length + ' questions</small></div>' +
        '<button type="button" class="secondary" id="assignmentAnalysisBack">Back</button></div>' +
        '<div class="dpp-analysis-score"><span>SCORE</span><strong>' + (scored ? marks : '—') + '<small>' + (scored ? ' / ' + (questions.length * 4) : 'not scored') + '</small></strong></div>' +
        '<h3>Your Progress</h3><div class="dpp-analysis-kpis">' +
          '<div><b>' + counts.correct + '</b><small>Correct</small></div>' +
          '<div><b>' + counts.incorrect + '</b><small>Incorrect</small></div>' +
          '<div><b>' + counts.skipped + '</b><small>Skipped</small></div>' +
          '<div><b>' + accuracy.toFixed(1) + '%</b><small>Accuracy</small></div>' +
          '<div><b>' + attempted + '/' + questions.length + '</b><small>Completed</small></div>' +
        '</div>' +
        '<div class="dpp-analysis-actions"><button type="button" class="secondary" id="assignmentReattempt">Reattempt</button>' +
        '<button type="button" class="primary" id="assignmentViewSolutions">View Solutions</button></div>' +
      '</div>';
    $('assignmentAnalysisBack').onclick = () => renderPracticeLanding();
    $('assignmentReattempt').onclick = () => showModeSheet(id);
    $('assignmentViewSolutions').onclick = () => openAssignmentSolutions();
  }
  viewAssignmentAnalysis = openAssignmentAnalysis;

  function closeModeSheet() { $('assignmentModeSheet')?.remove(); }
  function showModeSheet(id) {
    closeModeSheet();
    const sheet = document.createElement('div');
    sheet.id = 'assignmentModeSheet';
    sheet.className = 'assignment-mode-overlay';
    sheet.innerHTML =
      '<div class="assignment-mode-panel" role="dialog" aria-modal="true" aria-labelledby="assignmentModeTitle">' +
        '<div class="assignment-mode-grabber"></div><button type="button" class="assignment-mode-close" aria-label="Close">×</button>' +
        '<h2 id="assignmentModeTitle">Select a Mode</h2>' +
        '<button type="button" class="assignment-mode-choice practice-choice" data-mode-choice="practice">' +
          '<span><b>Practice Mode</b><small>Get instant answers and solutions at question level</small></span><i>›</i></button>' +
        '<button type="button" class="assignment-mode-choice test-choice" data-mode-choice="test">' +
          '<span><b>Quiz / Test Mode</b><small>Complete the test first and see answers after submission</small></span><i>›</i></button>' +
      '</div>';
    document.body.appendChild(sheet);
    sheet.addEventListener('click', event => {
      if (event.target === sheet || event.target.closest('.assignment-mode-close')) closeModeSheet();
      const choice = event.target.closest('[data-mode-choice]');
      if (choice) {
        const mode = choice.dataset.modeChoice;
        closeModeSheet();
        launchAssignment(id, mode);
      }
    });
  }

  async function launchAssignment(id, mode) {
    try {
      const assignment = getPracticeAssignments().find(x => x.id === id);
      if (!assignment) return toast('Saved assignment not found.');
      const blob = await getPracticePdfBlob(assignment.pdfId);
      if (!blob) return alert('The original PDF is missing from this device. Please upload it again.');
      if (!pdfjsLib) return alert('PDF engine unavailable. Reload StudyMate and try again.');
      const pdf = await pdfjsLib.getDocument({data:await blob.arrayBuffer()}).promise;
      const previous = latestAttempts(id);
      const questions = assignment.questions.map(q => ({
        ...q, pdf, assignmentId:id, chapter:assignment.chapter,
        brand:assignment.subject, previous:previous[q.number] || null
      }));
      state.practiceQuiz = {
        title:assignment.title, questions, index:0, answers:{}, checkedAnswers:{},
        startedAt:Date.now(), mode:mode || assignment.mode || 'test', assignmentMode:true, assignmentId:id,
        assignment, answersStatus:{}, bookmarks:new Set()
      };
      localStorage.removeItem(PROGRESS_KEY);
      showScreen('practice');
      await renderAssignmentQuiz();
    } catch (error) {
      console.error('Reattempt could not start:', error);
      alert('StudyMate could not reopen this assignment. ' + (error.message || 'Please try again.'));
    }
  }
  startAssignmentQuiz = launchAssignment;

  async function openAssignmentSolutions() {
    const review = window.__studyMateAssignmentReview;
    if (!review) return;
    let pdf = null, solutionPdf = null;
    try {
      const blob = await getPracticePdfBlob(review.assignment.pdfId);
      if (blob && pdfjsLib) pdf = await pdfjsLib.getDocument({data:await blob.arrayBuffer()}).promise;
    } catch (error) { console.warn('Could not reopen assignment PDF', error); }
    if (review.assignment.solutionPdfId) {
      try {
        const solutionBlob = await getPracticePdfBlob(review.assignment.solutionPdfId);
        if (solutionBlob && pdfjsLib) solutionPdf = await pdfjsLib.getDocument({data:await solutionBlob.arrayBuffer()}).promise;
      } catch (error) { console.warn('Could not reopen separate solution PDF', error); }
    }
    review.questions.forEach(q => { q.pdf = pdf; q.solutionPdf = solutionPdf; });
    drawSolutions('All', review.questions[0]?.number);
  }

  function drawSolutions(filter, currentNumber) {
    const review = window.__studyMateAssignmentReview;
    if (!review) return;
    const qs = review.questions;
    const getVisible = () => qs.filter(q => filter === 'All' || q.status === filter);
    let visible = getVisible();
    if (!visible.some(q => q.number === currentNumber)) currentNumber = visible[0]?.number;
    const q = qs.find(item => item.number === currentNumber) || visible[0] || qs[0];
    if (!q) return;
    const counts = {
      All:qs.length,
      Correct:qs.filter(x => x.status === 'Correct').length,
      Incorrect:qs.filter(x => x.status === 'Incorrect').length,
      Skipped:qs.filter(x => x.status === 'Skipped').length
    };
    const tabs = ['All','Correct','Incorrect','Skipped'].map(tab =>
      '<button type="button" class="dpp-tab ' + (filter === tab ? 'active' : '') + '" data-review-filter="' + tab + '"><span>' + tab + '</span><b>' + counts[tab] + '</b></button>'
    ).join('');
    const numbers = visible.map(item =>
      '<button type="button" class="dpp-number ' + esc((item.status || 'unattempted').toLowerCase()) + ' ' +
      (item.number === currentNumber ? 'current' : '') + '" data-review-number="' + item.number + '">' + item.number + '</button>'
    ).join('');
    const user = q.userAnswer == null ? '—' : q.info.questionType === 'numeric'
      ? String(q.userAnswer) : String.fromCharCode(65 + Number(q.userAnswer));
    const correct = q.correctAnswer == null ? 'Not available' : q.info.questionType === 'numeric'
      ? String(q.correctAnswer) : String.fromCharCode(65 + Number(q.correctAnswer));
    $('practiceScreen').innerHTML =
      '<div class="dpp-shell dpp-solutions">' +
        '<div class="dpp-top"><div><span class="eyebrow">SOLUTIONS</span><h2>' + esc(review.assignment.title) + '</h2>' +
        '<small>' + counts.All + ' questions · ' + counts.Correct + ' correct · ' + counts.Incorrect + ' incorrect · ' + counts.Skipped + ' skipped</small></div>' +
        '<button type="button" class="secondary" id="reviewBack">Back</button></div>' +
        '<div class="dpp-tabs">' + tabs + '</div>' +
        '<div class="dpp-number-strip">' + (numbers || '<span class="small-muted">No questions in this category.</span>') + '</div>' +
        '<div class="dpp-question-meta"><span>QUESTION ' + q.number + ' · ' + esc(q.s || q.c || '') + '</span></div>' +
        '<div class="quiz-question dpp-question" id="reviewQuestionPdf"><div class="viewer-placeholder">Loading question…</div></div>' +
        '<div class="dpp-result-facts"><span><small>Status</small><b>' + esc(q.status) + '</b></span>' +
        '<span><small>Your answer</small><b>' + esc(user) + '</b></span><span><small>Correct answer</small><b>' + esc(correct) + '</b></span></div>' +
        '<section class="dpp-source-solution"><h3>Solution</h3><div id="reviewSolutionPdf"><div class="viewer-placeholder">Loading source solution…</div></div></section>' +
        ((q.status === 'Incorrect' || q.status === 'Skipped')
          ? '<section class="dpp-my-explanation"><h3>My Explanation</h3><button type="button" class="secondary" id="addReviewMistake">＋ Add to Mistake Notebook</button><textarea id="reviewMyExplanation" rows="4" placeholder="Write your own explanation or reminder for this question…"></textarea><button type="button" class="primary" id="saveReviewExplanation">Save My Explanation</button></section>'
          : '') +
        '<div class="dpp-bottom"><button type="button" class="secondary" id="reviewPrev">← Previous</button>' +
        '<button type="button" class="primary" id="reviewNext">Next →</button></div></div>';

    document.querySelectorAll('[data-review-filter]').forEach(button => button.onclick = () => drawSolutions(button.dataset.reviewFilter, getVisible()[0]?.number));
    document.querySelectorAll('[data-review-number]').forEach(button => button.onclick = () => drawSolutions(filter, Number(button.dataset.reviewNumber)));
    $('reviewBack').onclick = () => openAssignmentAnalysis(review.assignment.id);
    $('reviewPrev').onclick = () => {
      const index = visible.findIndex(x => x.number === q.number);
      if (index > 0) drawSolutions(filter, visible[index - 1].number);
    };
    $('reviewNext').onclick = () => {
      const index = visible.findIndex(x => x.number === q.number);
      if (index < visible.length - 1) drawSolutions(filter, visible[index + 1].number);
    };
    $('addReviewMistake')?.addEventListener('click', () => {
      try {
        const entry = addMistakeNotebookEntry({
          question:{...q, pdf:null, practicePdfId:review.assignment.pdfId, reason:q.status === 'Skipped' ? 'Skipped question' : 'Incorrect answer'},
          record:{id:review.assignment.id,name:review.assignment.title,hasPdf:true,solutionPdfId:review.assignment.solutionPdfId||''},
          source:'Practice PDF Review'
        });
        const button = $('addReviewMistake');
        button.disabled = true;
        button.textContent = '✓ Added to Mistake Notebook';
        toast('Question added to Mistake Notebook.');
      } catch (error) { console.error(error); alert('Could not add this question to Mistake Notebook.'); }
    });
    $('saveReviewExplanation')?.addEventListener('click', () => {
      const explanation = $('reviewMyExplanation').value.trim();
      if (!explanation) return alert('Write your explanation first.');
      try {
        const entry = addMistakeNotebookEntry({
          question:{...q, reason:q.status === 'Skipped' ? 'Skipped question' : 'Incorrect answer'},
          record:{id:review.assignment.id,name:review.assignment.title,solutionPdfId:review.assignment.solutionPdfId||''},
          source:'Practice PDF Review'
        });
        entry.myExplanation = explanation;
        entry.practicePdfId = review.assignment.pdfId;
        saveMistakeNotebook(getMistakeNotebook());
        $('saveReviewExplanation').disabled = true;
        $('saveReviewExplanation').textContent = '✓ Saved to Mistake Notebook';
        toast('Your explanation was saved.');
      } catch (error) { console.error(error); alert('Could not save your explanation.'); }
    });
    if (q.pdf && q.info) renderPdfInfoToElement(q.pdf, q.info, $('reviewQuestionPdf'), 1.25)
      .catch(error => { console.warn(error); $('reviewQuestionPdf').textContent = 'Could not load this question.'; });
    else $('reviewQuestionPdf').textContent = 'Question preview is unavailable.';
    if ((q.solutionPdf || q.pdf) && q.solutionInfo) renderPdfInfoToElement(q.solutionPdf || q.pdf, q.solutionInfo, $('reviewSolutionPdf'), 1.2)
      .catch(error => { console.warn(error); $('reviewSolutionPdf').textContent = 'Could not load the source solution.'; });
    else $('reviewSolutionPdf').innerHTML = '<div class="viewer-placeholder">No separate solution was detected in the uploaded PDF.</div>';
  }


  // After a submission, persist the attempt and land on the analysis dashboard (never the last question).
  finishAssignmentQuiz = async function () {
    const d = state.practiceQuiz;
    if (!d?.assignmentMode) return;
    const unanswered = d.questions.filter(q => d.answers[q.number] === undefined).length;
    if (unanswered && !confirm(unanswered + ' question(s) are still unanswered. Submit this test anyway?')) return;
    const attempts = getPracticeAttempts();
    d.questions.forEach(q => {
      const user = d.answers[q.number] === undefined ? null : d.answers[q.number];
      const hasKey = q.answerKey !== undefined && q.answerKey !== null;
      const status = user === null ? 'Skipped' : !hasKey ? 'Answered' :
        (q.info.questionType === 'numeric' ? numericEqual(user,q.answerKey) : Number(user) === Number(q.answerKey)) ? 'Correct' : 'Incorrect';
      attempts.unshift({
        id:uid(), assignmentId:d.assignmentId, question:q.number, status,
        response:user, hasKey, correct:hasKey ? q.answerKey : null,
        responseLabel:user == null ? '—' : q.info.questionType === 'numeric' ? String(user) : String.fromCharCode(65+Number(user)),
        correctLabel:hasKey ? (q.info.questionType === 'numeric' ? String(q.answerKey) : String.fromCharCode(65+Number(q.answerKey))) : '',
        date:new Date().toISOString()
      });
    });
    savePracticeAttempts(attempts);
    localStorage.removeItem(PROGRESS_KEY);
    state.practiceQuiz = null;
    await openAssignmentAnalysis(d.assignmentId);
  };

  // Small mobile-first styles for the summary and mode picker, without disturbing the app theme.
  const style = document.createElement('style');
  style.textContent = `
    .brand-wrap,.brand-logo,.brand,.brand-subtitle{cursor:pointer}
    .dpp-analysis-overview{padding-bottom:24px}
    .dpp-analysis-score{margin:16px 0;padding:20px;border:1px solid var(--border);border-radius:16px;background:var(--card)}
    .dpp-analysis-score>span{display:block;color:var(--muted);font-size:12px;font-weight:700}
    .dpp-analysis-score>strong{display:block;margin-top:8px;font-size:38px}
    .dpp-analysis-score>strong small{font-size:16px;color:var(--muted)}
    .dpp-analysis-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0 20px}
    .dpp-analysis-kpis>div{padding:14px;border:1px solid var(--border);border-radius:13px;background:var(--card)}
    .dpp-analysis-kpis b,.dpp-analysis-kpis small{display:block}
    .dpp-analysis-kpis b{font-size:22px}.dpp-analysis-kpis small{font-size:12px;color:var(--muted);margin-top:3px}
    .dpp-analysis-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .dpp-source-solution,.dpp-my-explanation{margin-top:18px;padding:14px;border:1px solid var(--border);border-radius:14px;background:var(--card)}
    .dpp-source-solution h3,.dpp-my-explanation h3{margin:0 0 12px}
    .dpp-source-solution canvas{display:block;max-width:100%;height:auto;margin:auto}
    .dpp-my-explanation textarea{width:100%;min-height:90px;display:block;margin:8px 0}
    .dpp-my-explanation button{width:100%}
    .assignment-mode-overlay{position:fixed;inset:0;z-index:10050;background:#000a;display:flex;align-items:flex-end;justify-content:center}
    .assignment-mode-panel{width:100%;max-width:640px;padding:12px 16px calc(22px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;background:var(--bg,#08090d);color:var(--text);box-shadow:0 -16px 50px #0007}
    .assignment-mode-grabber{width:38px;height:5px;border-radius:9px;background:var(--muted);margin:0 auto 18px}
    .assignment-mode-close{float:right;border:0;border-radius:50%;width:38px;height:38px;background:var(--surface);color:var(--text);font-size:24px}
    .assignment-mode-panel h2{text-align:center;margin:16px 0 24px}
    .assignment-mode-choice{width:100%;display:flex;align-items:center;justify-content:space-between;text-align:left;padding:18px 16px;border:1px solid transparent;border-radius:18px;margin:12px 0;color:#fff}
    .assignment-mode-choice span,.assignment-mode-choice b,.assignment-mode-choice small{display:block}
    .assignment-mode-choice b{font-size:18px}.assignment-mode-choice small{font-size:14px;line-height:1.45;margin-top:8px;max-width:260px;color:#f2f2f2}
    .assignment-mode-choice i{font-style:normal;font-size:28px;width:38px;height:38px;display:grid;place-items:center;border-radius:50%;background:#ffffffd9;color:#222}
    .practice-choice{background:#96510b;border-color:#d99018}.test-choice{background:#174eae;border-color:#2477ed}
    @media(min-width:600px){.assignment-mode-overlay{align-items:center;padding:20px}.assignment-mode-panel{border-radius:24px}}
  `;
  document.head.appendChild(style);
})();