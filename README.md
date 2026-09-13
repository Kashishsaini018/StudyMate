# StudyMate V1.4

Mobile/PWA stability update.

- Uses explicit GitHub Pages paths (`/StudyMate/`) for manifest, icons, start URL and scope.
- Removes the app-shell service worker from normal startup to avoid stale-cache/standalone launch problems.
- Keeps the existing StudyMate test-analysis functionality.
- PDF.js remains loaded from the existing CDN when a PDF test paper is used.
