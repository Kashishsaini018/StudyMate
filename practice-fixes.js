/* StudyMate practice navigation hardening. Loaded after app.js so the same local-first data layer is reused. */
(function () {
  'use strict';
  const SUBJECTS = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
  let activeSubject = 'Physics';

  function byId(id) { return document.getElementById(id); }
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[ch]));
  }

  // Keep all subject controls in one predictable place. The old quick-action
  // footer is intentionally not rendered; each subject owns its Add PDF action.
  window.renderPracticeLanding = function (subject) {
    const screen = byId('practiceScreen');
    if (!screen) return;
    if (SUBJECTS.includes(subject)) activeSubject = subject;
    if (!SUBJECTS.includes(activeSubject)) activeSubject = 'Physics';

    if (!screen.dataset.practiceFixBound) {
      screen.addEventListener('click', async event => {
        const tab = event.target.closest('[data-practice-subject]');
        if (tab) {
          event.preventDefault();
          window.renderPracticeLanding(tab.dataset.practiceSubject);
          return;
        }
        if (event.target.closest('#openNeetPairImport')) {
          event.preventDefault();
          window.openModal('pdfQuizModal', window.renderPairedNeetTestBuilder);
          return;
        }
        if (event.target.closest('#uploadAssignmentBtn')) {
          event.preventDefault();
          window.openModal('assignmentUploadModal', window.renderAssignmentUpload);
          return;
        }
        const start = event.target.closest('[data-assignment-start]');
        if (start) {
          event.preventDefault();
          if (start.disabled) return;
          start.disabled = true;
          start.textContent = 'Opening quiz…';
          try {
            await window.startAssignmentQuiz(start.dataset.assignmentStart);
          } catch (error) {
            console.error('Practice quiz navigation failed:', error);
            alert('StudyMate could not open this quiz. ' + (error?.message || 'Please try again.'));
          } finally {
            if (start.isConnected) {
              start.disabled = false;
              start.textContent = '▶ Open / Continue';
            }
          }
          return;
        }
        const view = event.target.closest('[data-assignment-view]');
        if (view) {
          event.preventDefault();
          window.viewAssignmentQuestions(view.dataset.assignmentView);
          return;
        }
        const analysis = event.target.closest('[data-assignment-analysis]');
        if (analysis) {
          event.preventDefault();
          window.viewAssignmentAnalysis(analysis.dataset.assignmentAnalysis);
        }
      });
      screen.dataset.practiceFixBound = '1';
    }

    const assignments = window.getPracticeAssignments().filter(item => item.subject === activeSubject);
    screen.innerHTML = `
      <div class="page-head">
        <div>
          <span class="eyebrow">PRACTICE</span>
          <h2>Practice by subject.</h2>
          <div class="small-muted">Choose a subject, add its PDF, then open or continue your quiz.</div>
          <div class="actions" style="margin-top:12px">
            <button type="button" class="primary" id="openNeetPairImport">＋ Import 180-question NEET test</button>
          </div>
        </div>
      </div>
      <div class="practice-subject-tabs">
        ${SUBJECTS.map(name => `<button type="button" class="planner-tab ${name === activeSubject ? 'active' : ''}" data-practice-subject="${name}">${name}</button>`).join('')}
      </div>
      <div id="practiceSubjectPanel">
        <div class="actions" style="justify-content:flex-start">
          <button type="button" class="primary" id="uploadAssignmentBtn">＋ Add ${activeSubject} PDF</button>
        </div>
        ${assignments.length
          ? assignments.map(item => window.practiceAssignmentCard(item)).join('')
          : `<div class="empty">No PDFs added to ${esc(activeSubject)} yet. Add a question PDF to create a quiz.</div>`}
      </div>
      <p class="small-muted practice-footer-note">Completed quizzes and test analyses are saved in History.</p>`;
  };

  // The editor button is handled in capture phase so an older inline handler
  // cannot swallow the navigation or leave the editor screen blank.
  document.addEventListener('click', event => {
    const trigger = event.target.closest('#openMistakeNotebookEditor');
    if (!trigger) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.showScreen('mistakeNotebookEditor');
    window.renderMistakeAnalysis();
    const screen = byId('mistakeNotebookEditorScreen');
    if (screen) screen.scrollTop = 0;
  }, true);

  // Supplement the strict PDF.js label pass with the second, already-used
  // practice-label detector. This recovers numbered questions whose PDF text
  // runs are grouped differently, while retaining original PDF coordinates.
  const originalExtractPdfMap = window.extractPdfMap;
  if (typeof originalExtractPdfMap === 'function' && typeof window.findPracticeLabels === 'function') {
    window.extractPdfMap = async function (pdf) {
      const map = await originalExtractPdfMap(pdf);
      if (map.size >= 180) return map;
      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
        const page = await pdf.getPage(pageNo);
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();
        const labels = window.findPracticeLabels(content.items, viewport);
        if (!labels.length) continue;
        const split = viewport.width / 2;
        const left = labels.filter(label => label.x < split);
        const right = labels.filter(label => label.x >= split);
        const columns = left.length >= 2 && right.length >= 2 ? [left, right] : [labels];
        for (const column of columns) {
          column.sort((a, b) => a.top - b.top || a.x - b.x);
          for (let index = 0; index < column.length; index++) {
            const label = column[index];
            const number = Number(label.number);
            if (!Number.isInteger(number) || number < 1 || number > 180 || map.has(number)) continue;
            const next = column[index + 1];
            const twoColumns = columns.length === 2;
            const isLeft = twoColumns && label.x < split;
            const x0 = twoColumns
              ? (isLeft ? Math.max(0, Math.min(label.x - 14, split - 18)) : Math.max(split + 8, label.x - 14))
              : Math.max(8, label.x - 14);
            const x1 = twoColumns ? (isLeft ? split - 8 : viewport.width - 8) : viewport.width - 8;
            const top = Math.max(0, label.top - 12);
            const bottom = next ? Math.max(top + 45, next.top - 8) : viewport.height - 12;
            map.set(number, { pageNo, x0, x1, top, bottom, questionType: 'mcq' });
          }
        }
      }
      return map;
    };
  }

  // Remove any legacy quick-action/footer controls if an older markup version
  // is still present; the current screen has only the subject-level upload
  // control and the dedicated 180-question paired-PDF importer.
  const removeLegacyPracticeFooter = () => {
    const screen = byId('practiceScreen');
    if (!screen) return;
    screen.querySelectorAll(
      '#practiceQuickActions, #practiceBottomActions, #practiceFooterActions, ' +
      '.practice-standard-tools, .practice-bottom-actions, [data-practice-bottom-actions]'
    ).forEach(node => node.remove());
  };
  document.addEventListener('click', event => {
    if (event.target.closest('[data-screen="practice"]')) {
      setTimeout(removeLegacyPracticeFooter, 0);
    }
  });
})();
