# StudyMate V1.3 — Installable PWA

StudyMate is a private, local-first NEET test-analysis web app.

## V1.3 changes
- Installable PWA manifest and standalone app mode.
- App icon for Android home screen/app launcher.
- Service worker for app-shell caching and offline reopening.
- Mobile layout improvements.
- Optional in-app **Install App** button when Chrome exposes the install prompt.
- Test history remains stored locally in the browser.

## Important
The PDF engine is loaded from the PDF.js CDN. The service worker attempts to cache PDF.js after the first online visit. For the most reliable PDF analysis, open StudyMate once while connected to the internet before going offline.

## Install on Android
1. Host the folder on an HTTPS site (for example GitHub Pages).
2. Open the site in Chrome on Android.
3. Use Chrome's menu and choose **Install** / **Install and create shortcut**.
4. StudyMate will open as a standalone app.

Google's current Chrome help documents the Android web-app installation flow.
