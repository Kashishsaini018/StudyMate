/* StudyMate DPP-style practice, answer reflection, and per-record history controls. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[ch]));
  const PROGRESS_KEY = 'studymate_practice_assignment_progress_v1';

  /* ---------------- Test Analysis: grade on Next, then collect reflection ---------------- */
  function hasAnalysisKey(q) {
    return q.answerKey !== undefined && q.answerKey !== null;
  }
  function answerText(q, value) {
    if (value === undefined || value === null || value === '') return 'Skipped';
    if (q.answerKeyType === 'numeric') return String(value);
    return String.fromCharCode(65 + Number(value));
  }
  function analysisGrade(q) {
    if (q.userAnswer === undefined || q.userAnswer === null || q.userAnswer === '') return 'Skipped';
    if (!hasAnalysisKey(q)) return 'Answered';
    const correct = q.answerKeyType === 'numeric'
      ? numericEqual(q.userAnswer, q.answerKey)
      : Number(q.userAnswer) === Number(q.answerKey);
    return correct ? 'Correct' : 'Incorrect';
  }
  function reflectionComplete(q) {
    if (!q.reviewed) return false;
    if (q.status === 'Incorrect' || q.status === 'Skipped') return !!String(q.reason || '').trim();
    return true;
  }
  function analysisReflectionHtml(q) {
    const correctAnswer = hasAnalysisKey(q) ? answerText(q, q.answerKey) : 'Not available';
    let html = '<section class="analysis-review-step" id="analysisReviewStep">';
    html += '<div class="analysis-verdict ' + (q.status === 'Correct' ? 'is-correct' : q.status === 'Incorrect' ? 'is-wrong' : q.status === 'Skipped' ? 'is-skipped' : 'is-neutral') + '">';
    html += '<strong>' + (q.status === 'Correct' ? '✓ Correct' : q.status === 'Incorrect' ? '✕ Incorrect' : q.status === 'Skipped' ? '↷ Skipped' : 'Response saved') + '</strong>';
    html += '<span>Correct answer: ' + esc(correctAnswer) + '</span>';
    if (q.status === 'Answered') html += '<small>No answer key was available for this question, so it cannot be auto-graded.</small>';
    html += '</div>';
    if (q.status === 'Correct') {
      html += '<label class="analysis-guess-check"><input id="analysisGuessed" type="checkbox" ' + (q.guessed ? 'checked' : '') + '> I guessed this answer</label>';
    } else if (q.status === 'Incorrect') {
      html += '<div class="field"><label>Was this a silly mistake?</label><div class="choice-row"><button type="button" class="choice-chip ' + (q.silly ? 'active' : '') + '" id="analysisSillyYes">Yes</button><button type="button" class="choice-chip ' + (!q.silly ? 'active' : '') + '" id="analysisSillyNo">No</button></div></div>';
      html += '<div class="field"><label>Why did you get it wrong? <span class="required">*</span></label><textarea id="analysisReason" rows="3" placeholder="Concept not clear, calculation error, misread question...">' + esc(q.reason || '') + '</textarea></div>';
    } else if (q.status === 'Skipped') {
      html += '<div class="field"><label>Why did you skip it? <span class="required">*</span></label><textarea id="analysisReason" rows="3" placeholder="Did you not know the concept, run out of time, or get stuck?">' + esc(q.reason || '') + '</textarea></div>';
    }
    if (q.status === 'Incorrect' || q.status === 'Skipped') {
      html += '<div class="field"><label>Topic <span class="small-muted">(optional)</span></label><input id="analysisTopic" value="' + esc(q.topic || '') + '" placeholder="e.g. Kinematics"></div>';
    }
    html += '</section>';
    return html;
  }
  function bindAnalysisReflection(q) {
    if ($('analysisGuessed')) $('analysisGuessed').onchange = e => {
      q.guessed = e.target.checked;
      scheduleDraftSave();
    };
    if ($('analysisSillyYes')) $('analysisSillyYes').onclick = () => {
      q.silly = true;
      const box = $('analysisReviewStep');
      box.outerHTML = analysisReflectionHtml(q);
      bindAnalysisReflection(q);
      scheduleDraftSave();
    };
    if ($('analysisSillyNo')) $('analysisSillyNo').onclick = () => {
      q.silly = false;
      const box = $('analysisReviewStep');
      box.outerHTML = analysisReflectionHtml(q);
      bindAnalysisReflection(q);
      scheduleDraftSave();
    };
    if ($('analysisReason')) $('analysisReason').oninput = e => {
      q.reason = e.target.value;
      scheduleDraftSave();
    };
    if ($('analysisTopic')) $('analysisTopic').oninput = e => {
      q.topic = e.target.value;
      scheduleDraftSave();
    };
  }
  renderQuestion = async function () {
    if (!state.questions || !state.questions.length) return;
    const q = state.questions[state.current];
    const total = state.questions.length;
    q.reviewed = !!q.reviewed || ['Correct','Incorrect','Skipped','Answered'].includes(q.status);
    $('questionTitle').textContent = 'Question ' + q.number + ' / ' + total;
    $('sectionLabel').textContent = sectionFor(q.number, total);
    $('progressText').textContent = (state.current + 1) + ' / ' + total;
    $('progressFill').style.width = ((state.current + 1) / total * 100) + '%';
    document.querySelector('.status-options')?.classList.add('answer-mode-hidden');

    let html = '<div class="analysis-answer-panel"><span class="dock-label">SELECT YOUR ANSWER</span><div class="analysis-answer-grid">';
    for (let i = 0; i < 4; i++) {
      html += '<button type="button" data-analysis-answer="' + i + '" class="' + (Number(q.userAnswer) === i && q.userAnswer != null ? 'selected' : '') + '">' + String.fromCharCode(65 + i) + '</button>';
    }
    html += '</div><button type="button" class="secondary analysis-skip" id="analysisSkip">' + (q.userAnswer === null ? 'Skipped' : 'Skip question') + '</button></div>';
    if (q.reviewed) html += analysisReflectionHtml(q);
    $('questionExtra').innerHTML = html;

    if (state.pdf) await renderExactQuestion(q.number);
    else renderNoPdfQuestion(q.number);

    document.querySelectorAll('[data-analysis-answer]').forEach(button => {
      button.onclick = () => {
        q.userAnswer = Number(button.dataset.analysisAnswer);
        q.reviewed = false;
        q.status = '';
        document.querySelectorAll('[data-analysis-answer]').forEach(x => x.classList.toggle('selected', x === button));
        $('analysisReviewStep')?.remove();
        const skip = $('analysisSkip');
        if (skip) skip.textContent = 'Clear answer';
        scheduleDraftSave();
      };
    });
    $('analysisSkip').onclick = () => {
      if (q.userAnswer === null) q.userAnswer = undefined;
      else q.userAnswer = null;
      q.reviewed = false;
      q.status = '';
      document.querySelectorAll('[data-analysis-answer]').forEach(x => x.classList.remove('selected'));
      $('analysisReviewStep')?.remove();
      $('analysisSkip').textContent = q.userAnswer === null ? 'Skipped' : 'Skip question';
      scheduleDraftSave();
    };
    bindAnalysisReflection(q);
    updateNavButtons();
    $('nextBtn').textContent = q.reviewed ? (state.current === total - 1 ? 'Review & Submit →' : 'Next Question →') : 'Next →';
    $('prevBtn').disabled = state.current === 0;
  };
  async function proceedAnalysis() {
    const q = state.questions[state.current];
    if (!q.reviewed) {
      if (q.userAnswer === undefined) q.userAnswer = null;
      q.status = analysisGrade(q);
      q.reviewed = true;
      saveAnalysisDraft();
      await renderQuestion();
      return;
    }
    if (!reflectionComplete(q)) {
      $('analysisReason')?.focus();
      return alert('Please add a reason before moving to the next question.');
    }
    if (state.current < state.questions.length - 1) {
      state.current++;
      saveAnalysisDraft();
      await renderQuestion();
      return;
    }
    const pending = state.questions.findIndex(x => !x.reviewed || !reflectionComplete(x));
    if (pending >= 0) {
      state.current = pending;
      saveAnalysisDraft();
      await renderQuestion();
      return alert('Please review every question and complete the required reflections before submitting.');
    }
    saveAnalysisDraft();
    renderSummary();
    showScreen('summary');
  }
  $('nextBtn').onclick = proceedAnalysis;
  $('prevBtn').onclick = async () => {
    const current = state.questions[state.current];
    if (current?.reviewed && !reflectionComplete(current)) {
      $('analysisReason')?.focus();
      return alert('Please add a reason before leaving this question.');
    }
    if (state.current > 0) {
      state.current--;
      saveAnalysisDraft();
      await renderQuestion();
    }
  };
  buildNavigator = function () {
    $('questionGrid').innerHTML = state.questions.map((q, i) => {
      const status = q.status === 'Correct' ? 'correct' : q.status === 'Incorrect' ? 'incorrect' : q.status === 'Skipped' ? 'skipped' : q.userAnswer !== undefined ? 'answered' : '';
      return '<button class="qnav ' + status + ' ' + (i === state.current ? 'current' : '') + '" data-i="' + i + '">' + q.number + '</button>';
    }).join('');
    $('questionGrid').querySelectorAll('.qnav').forEach(button => button.onclick = async () => {
      const current = state.questions[state.current];
      if (current?.reviewed && !reflectionComplete(current)) {
        $('analysisReason')?.focus();
        return alert('Please add a reason before moving to another question.');
      }
      state.current = Number(button.dataset.i);
      closeModal('navigatorModal');
      await renderQuestion();
    });
  };
  renderSummary = function () {
    const qs = state.questions || [];
    const count = status => qs.filter(q => q.status === status).length;
    const reviewed = qs.filter(q => q.reviewed && reflectionComplete(q)).length;
    $('summaryContent').innerHTML = '<div class="panel"><div class="result-kpis">' +
      '<div class="kpi"><strong>' + qs.length + '</strong><small>Questions</small></div>' +
      '<div class="kpi"><strong>' + count('Correct') + '</strong><small>Correct</small></div>' +
      '<div class="kpi"><strong>' + count('Incorrect') + '</strong><small>Incorrect</small></div></div>' +
      '<div class="result-kpis" style="margin-top:10px"><div class="kpi"><strong>' + count('Skipped') + '</strong><small>Skipped</small></div>' +
      '<div class="kpi"><strong>' + count('Answered') + '</strong><small>Unverified</small></div>' +
      '<div class="kpi"><strong>' + reviewed + '/' + qs.length + '</strong><small>Reviewed</small></div></div>' +
      '<p class="small-muted">Correct answers, guessed responses, and reasons for incorrect or skipped questions are saved in your analysis.</p>' +
      '<div class="actions"><button id="editAnalysis" class="secondary">← Continue answering</button><button id="finalSubmit" class="primary">Submit Test & Analyse 🎉</button></div></div>';
    $('editAnalysis').onclick = () => showScreen('analysis');
    $('finalSubmit').onclick = () => {
      const pending = qs.findIndex(q => !q.reviewed || !reflectionComplete(q));
      if (pending >= 0) {
        state.current = pending;
        showScreen('analysis');
        renderQuestion();
        return alert('Finish the remaining question reflections before submitting.');
      }
      saveAndShowResult();
    };
  };
  calculateResult = function () {
    const qs = state.questions || [];
    const subjects = {};
    SUBJECTS.forEach(s => subjects[s] = {correct:0,incorrect:0,skipped:0,score:0,attempted:0});
    let correct = 0, incorrect = 0, skipped = 0, silly = 0, unverified = 0;
    qs.forEach(q => {
      if (!q.reviewed) q.status = analysisGrade(q);
      if (q.status === 'Correct') correct++;
      else if (q.status === 'Incorrect') incorrect++;
      else if (q.status === 'Skipped') skipped++;
      else if (q.status === 'Answered') unverified++;
      if (q.silly) silly++;
      const subject = q.subject || subjectFor(q.number, qs.length);
      if (subject && subjects[subject]) {
        if (q.status === 'Correct') subjects[subject].correct++;
        if (q.status === 'Incorrect') subjects[subject].incorrect++;
        if (q.status === 'Skipped') subjects[subject].skipped++;
        if (q.status !== 'Skipped') subjects[subject].attempted++;
        subjects[subject].score += q.status === 'Correct' ? 4 : q.status === 'Incorrect' ? -1 : 0;
      }
    });
    Object.values(subjects).forEach(v => {
      v.accuracy = v.correct + v.incorrect ? v.correct / (v.correct + v.incorrect) * 100 : 0;
    });
    return {
      correct, incorrect, skipped, silly, unverified,
      total: correct * 4 - incorrect,
      accuracy: correct + incorrect ? correct / (correct + incorrect) * 100 : 0,
      subjects
    };
  };

  /* ---------------- Practice: DPP-style attempt and reliable resume ---------------- */
  function saveAssignmentProgress(d) {
    const answers = {};
    Object.keys(d.answers || {}).forEach(key => answers[key] = d.answers[key]);
    const progress = {
      assignmentId: d.assignmentId,
      index: d.index,
      answers,
      bookmarks: Array.from(d.bookmarks || []),
      startedAt: d.startedAt || Date.now(),
      updatedAt: Date.now()
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }
  function latestAssignmentAttempts(id) {
    const latest = {};
    getPracticeAttempts().filter(x => x.assignmentId === id).forEach(x => {
      if (!latest[x.question]) latest[x.question] = x;
    });
    return latest;
  }
  function attemptStatus(d, q) {
    const value = d.answers[q.number];
    if (value === undefined) return q.previous?.status || 'Unanswered';
    if (value === null || value === '') return 'Skipped';
    if (d.mode !== 'practice' || q.answerKey === undefined || q.answerKey === null) return 'Answered';
    const ok = q.info.questionType === 'numeric' ? numericEqual(value, q.answerKey) : Number(value) === Number(q.answerKey);
    return ok ? 'Correct' : 'Incorrect';
  }
  practiceAssignmentCard = function (a) {
    const latest = latestAssignmentAttempts(a.id);
    const attempted = Object.keys(latest).length;
    const correct = Object.values(latest).filter(x => x.status === 'Correct').length;
    const incorrect = Object.values(latest).filter(x => x.status === 'Incorrect').length;
    const mode = a.mode === 'practice' ? 'Practice Mode' : 'Test Mode';
    return '<article class="practice-pdf-row">' +
      '<button type="button" class="practice-pdf-main" data-assignment-start="' + esc(a.id) + '">' +
      '<strong>' + esc(a.chapter || a.title) + '</strong>' +
      '<small>' + esc(a.subject || '') + ' · ' + (a.totalQuestions || a.questions.length) + ' questions · ' + attempted + ' attempted · ' + mode + '</small></button>' +
      '<button type="button" class="practice-pdf-start" data-assignment-start="' + esc(a.id) + '">' + (attempted ? 'Continue' : 'Start') + ' →</button></article>';
  };
  startAssignmentQuiz = async function (id) {
    try {
      const a = getPracticeAssignments().find(x => x.id === id);
      if (!a) return toast('This assignment is no longer available.');
      if (!a.pdfId || !Array.isArray(a.questions) || !a.questions.length) return alert('This saved assignment is incomplete. Please upload its PDF again.');
      const blob = await getPracticePdfBlob(a.pdfId);
      if (!blob) return alert('Saved practice PDF is missing from this device. Please upload it again.');
      if (!pdfjsLib) return alert('PDF engine unavailable. Reload StudyMate and try again.');
      const pdf = await pdfjsLib.getDocument({data: await blob.arrayBuffer()}).promise;
      const latest = latestAssignmentAttempts(id);
      const questions = a.questions.map(q => ({
        ...q, pdf, assignmentId:id, chapter:a.chapter, brand:a.subject,
        previous:latest[q.number] || null
      }));
      if (!questions.length) return alert('No readable questions were saved for this PDF.');
      const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null');
      const sameProgress = saved && saved.assignmentId === id;
      const answers = sameProgress ? (saved.answers || {}) : {};
      if (!sameProgress) {
        Object.keys(latest).forEach(number => {
          answers[number] = latest[number].response == null ? null : latest[number].response;
        });
      }
      const firstUnattempted = questions.findIndex(q => !latest[q.number]);
      const index = sameProgress
        ? Math.max(0, Math.min(questions.length - 1, Number(saved.index) || 0))
        : firstUnattempted >= 0 ? firstUnattempted : Math.max(0, questions.length - 1);
      state.practiceQuiz = {
        title:a.title, questions, index, answers, checkedAnswers:{},
        startedAt:sameProgress ? saved.startedAt : Date.now(),
        mode:a.mode || 'test', assignmentMode:true, assignmentId:id, assignment:a,
        answersStatus:{}, bookmarks:new Set(sameProgress ? saved.bookmarks || [] : [])
      };
      if (state.practiceQuiz.mode === 'practice') {
        questions.forEach(q => {
          if (answers[q.number] !== undefined && answers[q.number] !== null && q.info.questionType === 'numeric') {
            state.practiceQuiz.checkedAnswers[q.number] = true;
          }
        });
      }
      showScreen('practice');
      await renderAssignmentQuiz();
    } catch (error) {
      console.error('Could not open assignment quiz:', error);
      state.practiceQuiz = null;
      alert('StudyMate could not open this quiz. Your saved assignment is still available; reload the page or upload the PDF again.');
    }
  };
  renderAssignmentQuiz = async function () {
    const d = state.practiceQuiz;
    if (!d?.assignmentMode || !d.questions?.length) return renderPracticeLanding();
    d.index = Math.min(Math.max(0, Number(d.index) || 0), d.questions.length - 1);
    const q = d.questions[d.index];
    const mode = d.mode === 'practice' ? 'PRACTICE MODE' : 'TEST MODE';
    const selected = d.answers[q.number];
    const qType = q.info.questionType || 'mcq';
    const answered = selected !== undefined && selected !== null && selected !== '';
    const statuses = d.questions.map(item => attemptStatus(d, item));
    const counts = {
      All:d.questions.length,
      Answered:statuses.filter(x => ['Answered','Correct','Incorrect'].includes(x)).length,
      Unanswered:statuses.filter(x => x === 'Unanswered').length,
      Marked:d.questions.filter(item => d.bookmarks.has(item.number)).length,
      Correct:statuses.filter(x => x === 'Correct').length,
      Incorrect:statuses.filter(x => x === 'Incorrect').length,
      Skipped:statuses.filter(x => x === 'Skipped').length
    };
    const tabs = d.mode === 'practice'
      ? ['All','Correct','Incorrect','Skipped']
      : ['All','Answered','Unanswered','Marked'];
    d.filter = tabs.includes(d.filter) ? d.filter : 'All';
    let visible = d.questions.map((item, index) => ({item,index})).filter(x => {
      if (d.filter === 'All') return true;
      if (d.filter === 'Marked') return d.bookmarks.has(x.item.number);
      if (d.filter === 'Answered') return ['Answered','Correct','Incorrect'].includes(attemptStatus(d,x.item));
      if (d.filter === 'Unanswered') return attemptStatus(d,x.item) === 'Unanswered';
      return attemptStatus(d,x.item) === d.filter;
    });
    const tabHtml = tabs.map(tab => '<button type="button" class="dpp-tab ' + (d.filter === tab ? 'active' : '') + '" data-dpp-filter="' + tab + '"><span>' + tab + '</span><b>' + counts[tab] + '</b></button>').join('');
    const navHtml = visible.map(x => {
      const st = attemptStatus(d,x.item).toLowerCase();
      return '<button type="button" class="dpp-number ' + st + ' ' + (x.index === d.index ? 'current' : '') + '" data-dpp-question="' + x.index + '">' + x.item.number + '</button>';
    }).join('');
    let options = '';
    if (qType === 'numeric') {
      options = '<div class="dpp-numeric"><label for="dppNumeric">Your numerical answer</label><input id="dppNumeric" type="number" step="any" inputmode="decimal" value="' + (selected == null ? '' : esc(selected)) + '" placeholder="Enter answer">' +
        (d.mode === 'practice' ? '<button type="button" id="dppCheckNumeric" class="secondary">Check answer</button>' : '') + '</div>';
    } else {
      options = '<div class="dpp-options">' + ['A','B','C','D'].map((label,index) =>
        '<button type="button" class="dpp-option ' + (Number(selected) === index && selected != null ? 'selected' : '') + '" data-dpp-option="' + index + '"><span>' + label + '</span></button>'
      ).join('') + '</div>';
    }
    let feedback = '';
    if (d.mode === 'practice' && answered && (qType !== 'numeric' || d.checkedAnswers[q.number])) {
      if (q.answerKey === undefined || q.answerKey === null) feedback = '<div class="dpp-feedback">Your response is saved. No answer key is available for this question.</div>';
      else {
        const ok = qType === 'numeric' ? numericEqual(selected,q.answerKey) : Number(selected) === Number(q.answerKey);
        feedback = '<div class="dpp-feedback ' + (ok ? 'is-correct' : 'is-wrong') + '"><b>' + (ok ? '✓ Correct' : '✕ Incorrect') + '</b><span>Correct answer: ' + (qType === 'numeric' ? esc(q.answerKey) : String.fromCharCode(65+Number(q.answerKey))) + '</span></div>';
      }
    } else if (d.mode === 'test' && answered) {
      feedback = '<div class="dpp-feedback is-neutral">Answer saved. Correct answers will be shown after submission.</div>';
    }
    $('practiceScreen').innerHTML =
      '<div class="dpp-shell">' +
        '<div class="dpp-top"><div><span class="eyebrow">' + mode + ' · ' + esc(d.title) + '</span><h2>Question ' + (d.index+1) + ' / ' + d.questions.length + '</h2><small>' + esc(d.chapter || q.s || '') + ' · Q' + q.number + '</small></div><button type="button" class="secondary" id="dppExit">Exit</button></div>' +
        '<div class="dpp-progress"><div><i style="width:' + ((d.questions.filter(x => d.answers[x.number] !== undefined).length / d.questions.length) * 100) + '%"></i></div><small>' + d.questions.filter(x => d.answers[x.number] !== undefined).length + ' / ' + d.questions.length + ' answered</small></div>' +
        '<div class="dpp-tabs">' + tabHtml + '</div>' +
        '<div class="dpp-number-strip">' + (navHtml || '<span class="small-muted">No questions in this filter.</span>') + '</div>' +
        '<div class="dpp-question-meta"><span>QUESTION ' + q.number + '</span><button type="button" class="dpp-bookmark ' + (d.bookmarks.has(q.number) ? 'active' : '') + '" id="dppBookmark">' + (d.bookmarks.has(q.number) ? '★ Marked' : '☆ Mark for review') + '</button></div>' +
        '<div class="quiz-question dpp-question" id="assignmentQuizViewer"><div class="viewer-placeholder">Loading original question…</div></div>' +
        options + feedback +
        '<div class="dpp-bottom"><button type="button" class="secondary" id="dppPrev" ' + (d.index === 0 ? 'disabled' : '') + '>← Previous</button><button type="button" class="secondary" id="dppSkip">' + (selected === null ? 'Skipped' : 'Skip') + '</button><button type="button" class="primary" id="dppNext">' + (d.index === d.questions.length - 1 ? (answered ? 'Submit DPP' : 'Finish DPP') : 'Next →') + '</button></div>' +
      '</div>';

    document.querySelectorAll('[data-dpp-filter]').forEach(button => button.onclick = () => {
      d.filter = button.dataset.dppFilter;
      renderAssignmentQuiz();
    });
    document.querySelectorAll('[data-dpp-question]').forEach(button => button.onclick = () => {
      d.index = Number(button.dataset.dppQuestion);
      saveAssignmentProgress(d);
      renderAssignmentQuiz();
    });
    document.querySelectorAll('[data-dpp-option]').forEach(button => button.onclick = () => {
      d.answers[q.number] = Number(button.dataset.dppOption);
      document.querySelectorAll('[data-dpp-option]').forEach(x => x.classList.toggle('selected', x === button));
      saveAssignmentProgress(d);
      const selectedNow = d.answers[q.number];
      const box = document.querySelector('.dpp-feedback');
      if (d.mode === 'practice' && q.answerKey != null) {
        const ok = Number(selectedNow) === Number(q.answerKey);
        if (box) box.className = 'dpp-feedback ' + (ok ? 'is-correct' : 'is-wrong');
        if (box) box.innerHTML = '<b>' + (ok ? '✓ Correct' : '✕ Incorrect') + '</b><span>Correct answer: ' + String.fromCharCode(65+Number(q.answerKey)) + '</span>';
        else $('practiceScreen').querySelector('.dpp-options').insertAdjacentHTML('afterend','<div class="dpp-feedback ' + (ok ? 'is-correct' : 'is-wrong') + '"><b>' + (ok ? '✓ Correct' : '✕ Incorrect') + '</b><span>Correct answer: ' + String.fromCharCode(65+Number(q.answerKey)) + '</span></div>');
      } else if (d.mode === 'test' && box) {
        box.className = 'dpp-feedback is-neutral';
        box.textContent = 'Answer saved. Correct answers will be shown after submission.';
      }
    });
    if (qType === 'numeric') {
      $('dppNumeric').oninput = e => {
        d.answers[q.number] = e.target.value === '' ? undefined : Number(e.target.value);
        delete d.checkedAnswers[q.number];
        saveAssignmentProgress(d);
      };
      $('dppCheckNumeric')?.addEventListener('click', () => {
        const val = $('dppNumeric').value;
        if (val === '' || !Number.isFinite(Number(val))) return alert('Enter a valid numerical answer.');
        d.answers[q.number] = Number(val);
        d.checkedAnswers[q.number] = true;
        saveAssignmentProgress(d);
        renderAssignmentQuiz();
      });
    }
    $('dppBookmark').onclick = () => {
      if (d.bookmarks.has(q.number)) d.bookmarks.delete(q.number);
      else d.bookmarks.add(q.number);
      saveAssignmentProgress(d);
      renderAssignmentQuiz();
    };
    $('dppPrev').onclick = () => {
      if (d.index > 0) {
        d.index--;
        saveAssignmentProgress(d);
        renderAssignmentQuiz();
      }
    };
    $('dppSkip').onclick = () => {
      d.answers[q.number] = null;
      saveAssignmentProgress(d);
      if (d.index < d.questions.length - 1) {
        d.index++;
        renderAssignmentQuiz();
      } else finishAssignmentQuiz();
    };
    $('dppNext').onclick = () => {
      if (d.index < d.questions.length - 1) {
        if (d.answers[q.number] === undefined) d.answers[q.number] = null;
        d.index++;
        saveAssignmentProgress(d);
        renderAssignmentQuiz();
      } else finishAssignmentQuiz();
    };
    $('dppExit').onclick = () => {
      saveAssignmentProgress(d);
      if (confirm('Exit this DPP? Your answers and current question are saved. You can continue later.')) {
        state.practiceQuiz = null;
        showScreen('practice');
      }
    };
    await renderAssignmentPdfQuestion(q);
  };
  finishAssignmentQuiz = async function () {
    const d = state.practiceQuiz;
    if (!d?.assignmentMode) return;
    const unanswered = d.questions.filter(q => d.answers[q.number] === undefined).length;
    if (unanswered && !confirm(unanswered + ' question(s) are still unanswered. Submit this DPP anyway?')) return;
    const attempts = getPracticeAttempts();
    const items = d.questions.map(q => {
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
      return {...q, userAnswer:user, correctAnswer:hasKey ? q.answerKey : null, hasKey, status};
    });
    savePracticeAttempts(attempts);
    localStorage.removeItem(PROGRESS_KEY);
    const correct = items.filter(q => q.status === 'Correct').length;
    const incorrect = items.filter(q => q.status === 'Incorrect').length;
    const skipped = items.filter(q => q.status === 'Skipped').length;
    const scored = items.filter(q => q.hasKey).length;
    const attempted = correct + incorrect;
    const result = {
      title:d.title, practiceType:d.assignment.subject + ' · ' + d.assignment.chapter,
      questions:items, correct, incorrect, skipped, scored, attempted,
      marks:items.reduce((sum,q) => sum + (q.status === 'Correct' ? 4 : q.status === 'Incorrect' ? -1 : 0),0),
      accuracy:attempted ? correct/attempted*100 : 0,
      elapsed:Date.now()-(d.startedAt || Date.now()), mode:d.mode || 'practice',
      hasAnswerKey:items.some(q => q.hasKey), date:new Date().toISOString(),
      assignmentMode:true, assignmentId:d.assignmentId
    };
    state.practiceQuiz = null;
    renderPracticeResult(result);
    showScreen('practice');
  };

  /* PW-inspired solution review: All / Correct / Incorrect / Skipped and question strip. */
  const baseRenderPracticeResult = renderPracticeResult;
  function renderDppSolutions(result) {
    let filter = 'All';
    let currentNumber = result.questions[0]?.number;
    const qs = result.questions || [];
    const getVisible = () => qs.filter(q => filter === 'All' || q.status === filter);
    function draw() {
      const visible = getVisible();
      if (!visible.some(q => q.number === currentNumber)) currentNumber = visible[0]?.number ?? qs[0]?.number;
      const q = qs.find(item => item.number === currentNumber) || qs[0];
      if (!q) return;
      const counts = {
        All:qs.length,
        Correct:qs.filter(x => x.status === 'Correct').length,
        Incorrect:qs.filter(x => x.status === 'Incorrect').length,
        Skipped:qs.filter(x => x.status === 'Skipped').length
      };
      const tabs = ['All','Correct','Incorrect','Skipped'].map(tab =>
        '<button type="button" class="dpp-tab ' + (filter === tab ? 'active' : '') + '" data-sol-filter="' + tab + '"><span>' + tab + '</span><b>' + counts[tab] + '</b></button>'
      ).join('');
      const nums = visible.map(item => '<button type="button" class="dpp-number ' + item.status.toLowerCase() + ' ' + (item.number === currentNumber ? 'current' : '') + '" data-sol-number="' + item.number + '">' + item.number + '</button>').join('');
      const your = q.userAnswer == null ? '—' : q.questionType === 'numeric' ? String(q.userAnswer) : String.fromCharCode(65+Number(q.userAnswer));
      const correct = q.correctAnswer == null ? 'Not available' : q.questionType === 'numeric' ? String(q.correctAnswer) : String.fromCharCode(65+Number(q.correctAnswer));
      const answerTiles = q.questionType === 'numeric' ? '' : '<div class="dpp-options dpp-solution-options">' + ['A','B','C','D'].map((letter,i) => {
        const klass = i === Number(q.correctAnswer) ? 'is-answer' : i === Number(q.userAnswer) && q.status === 'Incorrect' ? 'is-user-wrong' : '';
        return '<div class="dpp-option solution-option ' + klass + '"><span>' + letter + '</span></div>';
      }).join('') + '</div>';
      $('practiceScreen').innerHTML =
        '<div class="dpp-shell dpp-solutions">' +
          '<div class="dpp-top"><div><span class="eyebrow">DPP SOLUTIONS</span><h2>' + esc(result.title) + '</h2><small>' + qs.length + ' questions · ' + result.correct + ' correct · ' + result.incorrect + ' incorrect · ' + result.skipped + ' skipped</small></div><button type="button" class="secondary" id="dppSolutionsBack">Back</button></div>' +
          '<div class="dpp-tabs">' + tabs + '</div><div class="dpp-number-strip">' + (nums || '<span class="small-muted">No questions in this category.</span>') + '</div>' +
          '<div class="dpp-question-meta"><span>QUESTION ' + q.number + ' · ' + esc(q.s || q.c || '') + '</span></div>' +
          '<div class="quiz-question dpp-question" id="dppSolutionPdf"><div class="viewer-placeholder">Loading question…</div></div>' +
          '<div class="dpp-result-facts"><span><small>Status</small><b>' + esc(q.status) + '</b></span><span><small>Your answer</small><b>' + esc(your) + '</b></span><span><small>Correct answer</small><b>' + esc(correct) + '</b></span></div>' +
          answerTiles +
          '<div class="dpp-bottom"><button type="button" class="secondary" id="dppSolPrev">← Previous</button>' +
          (q.status === 'Incorrect' ? '<button type="button" class="secondary" id="dppSaveMistake">＋ Mistake Notebook</button>' : '') +
          '<button type="button" class="primary" id="dppSolNext">Next →</button></div>' +
        '</div>';
      document.querySelectorAll('[data-sol-filter]').forEach(button => button.onclick = () => { filter = button.dataset.solFilter; currentNumber = getVisible()[0]?.number; draw(); });
      document.querySelectorAll('[data-sol-number]').forEach(button => button.onclick = () => { currentNumber = Number(button.dataset.solNumber); draw(); });
      $('dppSolPrev').onclick = () => { const i = visible.findIndex(x => x.number === currentNumber); currentNumber = visible[Math.max(0,i-1)]?.number || currentNumber; draw(); };
      $('dppSolNext').onclick = () => { const i = visible.findIndex(x => x.number === currentNumber); currentNumber = visible[Math.min(visible.length-1,i+1)]?.number || currentNumber; draw(); };
      $('dppSolutionsBack').onclick = () => renderPracticeLanding();
      $('dppSaveMistake')?.addEventListener('click', () => {
        try {
          addMistakeNotebookEntry({question:q,record:{name:result.title},source:'Practice DPP'});
          toast('Added to Mistake Notebook ✓');
          $('dppSaveMistake').disabled = true;
          $('dppSaveMistake').textContent = '✓ Saved';
        } catch (error) { console.error(error); alert('Could not save this mistake.'); }
      });
      if (q.pdf && q.info) renderPdfInfoToElement(q.pdf,q.info,$('dppSolutionPdf'),1.3).catch(error => console.warn(error));
      else if ($('dppSolutionPdf')) $('dppSolutionPdf').innerHTML = '<div class="viewer-placeholder">The original question preview is unavailable.</div>';
    }
    draw();
  }
  renderPracticeResult = function (result) {
    if (result?.assignmentMode) return renderDppSolutions(result);
    return baseRenderPracticeResult(result);
  };

  /* ---------------- History: remove one record without clearing the rest ---------------- */
  renderHistory = function () {
    const tests = getHistory();
    const quizzes = getPracticeQuizHistory();
    const testsHtml = tests.map(r =>
      '<div class="history-item"><div><strong>' + esc(r.name || 'Test analysis') + '</strong><div class="history-meta">' +
      esc(r.type || 'Test Analysis') + ' · ' + new Date(r.date).toLocaleDateString() + ' · ' + (r.questions?.length || 0) + ' questions</div></div>' +
      '<div class="history-actions"><strong>' + esc(r.result?.total ?? '—') + '</strong><button class="secondary" data-open-history="' + esc(r.id) + '">Open</button><button type="button" class="danger history-remove" data-delete-history="' + esc(r.id) + '">Remove</button></div></div>'
    ).join('');
    const quizzesHtml = quizzes.map(q =>
      '<div class="history-item"><div><strong>' + esc(q.title || 'PDF Quiz') + '</strong><div class="history-meta">' +
      (q.neetFullTest ? 'NEET Full Test' : 'PDF Quiz') + ' · ' + (q.mode === 'test' ? 'Test Mode' : 'Practice Mode') + ' · ' +
      new Date(q.date).toLocaleDateString() + ' · ' + (q.questions?.length || 0) + ' questions</div></div>' +
      '<div class="history-actions"><strong>' + esc(q.marks ?? '—') + (q.neetFullTest ? ' / 720' : '') + '</strong>' +
      '<button class="secondary" data-open-practice-history="' + esc(q.id) + '">Open</button>' +
      '<button type="button" class="danger history-remove" data-delete-quiz-history="' + esc(q.id) + '">Remove</button></div></div>'
    ).join('');
    $('historyList').innerHTML =
      (testsHtml ? '<h3>Test Analysis</h3>' + testsHtml : '') +
      (quizzesHtml ? '<h3 style="margin-top:22px">PDF Quiz History</h3>' + quizzesHtml : '') ||
      '<div class="empty">No tests or PDF quizzes saved yet. Start your first test to build your history.</div>';

    $('historyList').querySelectorAll('[data-open-history]').forEach(button => button.onclick = () => {
      const record = getHistory().find(x => x.id === button.dataset.openHistory);
      if (record) { renderResult(record); showScreen('result'); }
    });
    $('historyList').querySelectorAll('[data-open-practice-history]').forEach(button => button.onclick = () => openPracticeHistoryRecord(button.dataset.openPracticeHistory));
    $('historyList').querySelectorAll('[data-delete-history]').forEach(button => button.onclick = () => {
      const id = button.dataset.deleteHistory;
      const record = getHistory().find(x => x.id === id);
      if (!record || !confirm('Remove "' + (record.name || 'this test') + '" from History?')) return;
      localStorage.setItem(LS.history, JSON.stringify(getHistory().filter(x => x.id !== id)));
      if (state.resultRecord?.id === id) state.resultRecord = null;
      if (localStorage.getItem('studymate_revision_test') === id) localStorage.removeItem('studymate_revision_test');
      renderHistory();
      refreshHome();
      toast('Test removed from History.');
    });
    $('historyList').querySelectorAll('[data-delete-quiz-history]').forEach(button => button.onclick = () => {
      const id = button.dataset.deleteQuizHistory;
      const record = getPracticeQuizHistory().find(x => x.id === id);
      if (!record || !confirm('Remove "' + (record.title || 'this quiz') + '" from History?')) return;
      savePracticeQuizHistory(getPracticeQuizHistory().filter(x => x.id !== id));
      renderHistory();
      toast('Quiz removed from History.');
    });
  };
})();