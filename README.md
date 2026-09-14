# StudyMate Final

StudyMate is a local-first, mobile-first NEET test analysis and practice PWA.

## Final features
- Minimal + illustration home dashboard based on the approved Dashboard + Dark-mode feature combination.
- Time-aware greeting and first-launch name setup; 5 consecutive 600+ analyzed tests unlock the Dr. achievement.
- Test analysis with PDF/no-PDF flow, Correct/Incorrect/Skipped states, silly-mistake tracking, optional topics, and required reasons.
- Coordinate/layout-aware PDF question map designed for multi-column papers; original question crops are rendered instead of trusting raw PDF text order.
- Detailed individual test result report with overview, subjects, mistakes, weak topics, question review, score trend, and data-driven insights.
- Practice: generated mock tests, PDF interactive quiz, and Practice from My Tests.
- Practice attempts are separate from original test history.
- Long-term Reports and History.
- NEET Success Planner for Physics, Chemistry, Botany, Zoology with NCERT/DPP/Module-PYQ/Test and revision milestones; no reset control.
- Daily To-Do list.
- Rotating NEET 2027 motivational/emotional messages.
- Local passcode app lock with three recovery questions and secure SHA-256 hashes.
- IndexedDB storage for uploaded test PDFs.

## Syllabus source
The built-in chapter list follows the user-provided `Neet-2027_syllabus.html` source used for the final build.

## Run
Upload the extracted files to the root of the GitHub Pages `StudyMate` site. Do not upload the ZIP itself.

PDF.js 3.11.174 is loaded from cdnjs in `index.html`; PDF functionality therefore needs network access unless the library is bundled locally later.
