# StudyMate V5 — Final Local-First Build

## Included
- Final clean Home page
- Start New Test Analysis
- History / Reports / Success Planner / Day Summary
- Large Mistake Notebook with exact original PDF question cutouts
- Practice My Mistakes / Redo My Mistakes using locally saved PDFs
- IndexedDB PDF persistence
- Backup & Restore of local app data + original PDFs
- App Lock + recovery questions
- Light / Dark / System theme
- Configurable NEET 2027 countdown
- Existing PDF interactive quiz and mock practice flows

## Important storage behavior
StudyMate stores normal app data in localStorage and uploaded PDFs in IndexedDB. Updating the app files on the same browser origin does not normally delete those stores. However, clearing browser/site data, changing origin/domain, using a different browser/profile/device, or intentionally clearing app storage can remove local data.

Use Settings → Backup & Restore → Create Backup before a major update or moving devices.

## NEET 2027 countdown
The NTA notice archive currently does not publish a NEET UG 2027 exam date, so the countdown target is configurable in Settings. The included target is only a placeholder and is not presented as an official NTA date.
