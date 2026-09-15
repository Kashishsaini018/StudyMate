# StudyMate --- NEET 2027 Preparation App

## Overview

StudyMate is a private, local-first NEET preparation web app designed to
combine test analysis, mistake review, targeted practice, syllabus
progress, revision planning, daily productivity, and personal
performance insights in one place.

The app is designed around one core idea:

> **Every test should produce useful information that improves the next
> test.**

StudyMate keeps the important study data on the user's device. Uploaded
test PDFs are stored locally so that the app can later display the
**exact original question cutout** when reviewing mistakes, viewing
results, or practicing mistakes again.

------------------------------------------------------------------------

# 1. Home Dashboard

The Home screen is intentionally clean and focused.

### Greeting

The app displays a time-based greeting using the user's local time:

-   Good Morning
-   Good Afternoon
-   Good Evening
-   Good Night

The user's name can be displayed with the greeting.

### Daily Motivational Quote

A motivational quote is shown on the Home screen.

The quote changes **once per day**, rather than changing every time the
Home screen is opened.

Examples of the intended style:

-   Your dream deserves your consistency. 🩺
-   One day, you'll thank yourself for not giving up today. 🌱
-   A bad test is not a bad future. 🌤️
-   Keep going, future doctor. 💙

### Start New Test

The main Home action opens the complete Test Analysis workflow.

### Test Pattern Buttons

The Home screen provides quick access to:

-   History
-   Reports
-   Success Planner
-   Day Summary

### Mistake Notebook

A large Mistake Notebook card is placed below the Test Pattern section
because reviewing mistakes is one of StudyMate's central purposes.

### NEET 2027 Countdown

A countdown is displayed near the bottom of the app.

It shows the remaining time until the configured NEET 2027 date.

This is a **countdown to the exam**, not a study timer.

### Bottom Navigation

The main navigation is intentionally simple:

-   Home
-   History
-   Reports

Advanced features are accessed from the three-dot menu.

------------------------------------------------------------------------

# 2. Three-Dot Menu

The three-dot menu keeps the Home screen from becoming overcrowded.

Advanced StudyMate features are available from this menu, including:

-   Practice
-   Mistake Notebook
-   NCERT Focus Mode
-   Daily Goals
-   Test Comparison
-   Intelligent Revision
-   Smart Weakness Engine
-   Personal NEET StudyMate
-   Settings

------------------------------------------------------------------------

# 3. Test Analysis

Test Analysis is one of the main StudyMate workflows.

## About the Test

The user first enters information about the test.

### Test Type

Available types:

-   Part Test
-   Mock Test
-   Full Syllabus
-   Chapter-wise
-   Subject-wise

### Test Name / Number

The user can enter a custom test name or number.

### Syllabus

StudyMate uses the configured NEET 2027 chapter structure.

Depending on the test type:

-   Part Test → select multiple chapters
-   Chapter-wise → select multiple chapters
-   Subject-wise → select a subject and its chapters
-   Full Syllabus → automatically use the complete syllabus
-   Mock Test → allow manually entered syllabus information

### Revised Before Test

The user records whether they revised the relevant syllabus before
taking the test:

-   Yes
-   No

### Test Paper PDF

The user can choose whether to upload the test paper PDF.

If a PDF is uploaded, StudyMate saves it locally and uses it as the
source for question cutouts.

If no PDF is uploaded, the user can enter the number of questions.

------------------------------------------------------------------------

# 4. Question-by-Question Analysis

After entering the test information, StudyMate moves through the
questions one by one.

For each question, the interface can display:

-   Question number
-   Total questions
-   Progress
-   Original PDF question cutout when a PDF is available
-   Correct
-   Incorrect
-   Skipped

## Correct

The user can optionally indicate:

-   I Guessed the Answer

## Incorrect

The user records:

-   Silly Mistake
-   Reason
-   Topic

If Silly Mistake is selected, a separate reason is not required.

## Skipped

The user records:

-   Reason
-   Topic (optional)

Required information is validated before moving forward.

------------------------------------------------------------------------

# 5. Test Scoring

For a standard 180-question NEET-style test:

-   Correct = +4
-   Incorrect = -1
-   Skipped = 0
-   Maximum = 720

The standard question grouping is:

-   Q1--45 → Physics
-   Q46--90 → Chemistry
-   Q91--135 → Botany
-   Q136--180 → Zoology

The structure can also support other test sizes and types.

------------------------------------------------------------------------

# 6. Question Feedback and Animations

After selecting a question status, StudyMate can provide a small
appreciation message.

### Correct

> 🎉 Nice one! Great! Keep that confidence going.

### Incorrect

> 💡 That's okay! Every mistake gives you something to improve.

### Skipped

> 🧠 No worries! We'll come back to this and turn it into a strength.

Answer cards also use subtle tap/selection animations.

The goal is to make analysis feel supportive rather than punitive.

------------------------------------------------------------------------

# 7. PDF Question System

The PDF system is critical to StudyMate's mistake-review workflow.

## Local PDF Storage

Uploaded test PDFs are stored in **IndexedDB** rather than ordinary
localStorage.

This is important because PDFs can be much larger than normal text
settings and results.

## Exact Original Question Cutouts

When a PDF is available, StudyMate should display the actual question
region from the original PDF.

This preserves:

-   Figures
-   Graphs
-   Equations
-   Tables
-   Options
-   Original formatting

The app should not recreate the question from extracted text when an
original PDF cutout is available.

## PDF Question Ordering

PDF text streams can contain two-column or visually reordered content.

Therefore, question ordering should be based on the visual PDF layout,
including:

-   Question labels
-   X/Y coordinates
-   Column detection
-   Visual reading order

Raw PDF text order should not be treated as the authoritative question
order.

## Safe Failure

If a question cannot be confidently located in the PDF, the app should
avoid displaying a wrong question as if it were correct.

------------------------------------------------------------------------

# 8. Test Result / Performance Report

After completing a test, StudyMate generates a performance report.

The result should feel like a personal performance report rather than a
spreadsheet.

Main sections include:

1.  Test Complete
2.  Overview
3.  Subjects
4.  Mistakes
5.  Topics
6.  Questions
7.  Trend

## Overview

Possible metrics:

-   Score
-   Maximum score
-   Accuracy
-   Correct
-   Incorrect
-   Skipped
-   Change from previous test

## Subject Performance

Separate performance for:

-   Physics
-   Chemistry
-   Botany
-   Zoology

## Incorrect Question Review

The result contains an Incorrect Questions section.

For each incorrect question, StudyMate can show:

-   Question number
-   **Exact original question cutout from the uploaded PDF**
-   Topic
-   Reason
-   Silly Mistake status

This is directly connected to the locally stored PDF.

------------------------------------------------------------------------

# 9. History

History stores analyzed tests.

Each test can contain:

-   Test name
-   Date
-   Test type
-   Score
-   Syllabus
-   Analysis information
-   Associated PDF information when available

Selecting a test opens its detailed result/analysis.

The user can clear test history after confirmation.

------------------------------------------------------------------------

# 10. Mistake Notebook

The Mistake Notebook is intentionally simple.

It displays the questions that contain mistakes.

For each mistake, the notebook can show:

-   Exact question cutout from the original PDF
-   Topic
-   Mistake status/type

Examples:

-   Incorrect
-   Silly Mistake
-   Skipped

The bottom of the Mistake Notebook contains the main action:

> **🔥 Practice My Mistakes**

There are no unnecessary dashboards or complicated controls in the
primary Mistake Notebook view.

------------------------------------------------------------------------

# 11. Practice My Mistakes

Practice My Mistakes creates a targeted practice session from recorded
mistakes.

The user can practice questions originating from previous analyzed
tests.

The practice system can use categories such as:

-   Incorrect
-   Silly Mistakes
-   Skipped
-   Weak Topics

When the original PDF is available, the practice session should show the
**exact original question cutout**.

The practice attempt is separate from the original test.

The original test result is never changed by practicing the mistake
again.

------------------------------------------------------------------------

# 12. Redo My Mistakes

Redo My Mistakes is designed specifically for measuring improvement.

Example:

> Previous attempt → Incorrect\
> New attempt → Correct

StudyMate records this as an improvement without modifying the
historical test.

The exact original PDF question is displayed whenever the source PDF is
available.

The important data relationship is:

``` text
Original Test
    ↓
Original PDF
    ↓
Question
    ↓
Mistake
    ↓
Mistake Notebook
    ↓
Redo / Practice
    ↓
Previously Incorrect → Now Correct
```

------------------------------------------------------------------------

# 13. Practice --- Generate Mock Test

The Practice section can generate a mock practice session from the
available question bank.

Flow:

``` text
Practice Type
      ↓
Syllabus
      ↓
Number of Questions
      ↓
Question Level
      ↓
Generate
```

## Practice Types

### Chapter-wise Practice

First choose one subject, then one or multiple chapters.

### Subject-wise Practice

Choose exactly two subjects.

Each subject has independent chapter selection.

### Full Syllabus Test Practice

Uses the complete syllabus automatically.

## Question Counts

Supported choices can include:

-   10
-   20
-   30
-   45
-   60
-   90
-   180
-   Custom

## Difficulty / Source Presets

-   NEET Level
-   NEET Level --- Hard
-   NEET + Advanced --- Mixed
-   JEE Main Level

The offline starter question bank should not be presented as an official
NEET question bank.

------------------------------------------------------------------------

# 14. Upload PDF → Interactive Quiz

A question paper PDF can be uploaded for interactive practice.

The app identifies questions and displays the original question cutout.

The user selects:

-   A
-   B
-   C
-   D

An optional answer key can be supplied in a format such as:

``` text
1A 2C 3B 4D
```

If no answer key is available, the quiz can still be used, but a
verified score cannot be calculated.

------------------------------------------------------------------------

# 15. Success Planner

Success Planner is the chapter-based preparation tracker.

It uses the configured NEET 2027 syllabus.

Every chapter has independent milestones.

## Milestones

-   Watched Lectures
-   Complete Notes
-   NCERT Reading
-   DPP
-   Module / PYQs
-   Test
-   Rev-1
-   Rev-2
-   Rev-3
-   Rev-4
-   Rev-5
-   Mastered

Chapter progress is calculated from completed milestones.

## Mobile Design

On mobile:

-   No pinch zoom
-   No forced horizontal table scrolling
-   Large touch-friendly milestone controls
-   Responsive chapter cards
-   Milestones arranged in a mobile-friendly layout

On larger screens, a structured table layout can be used.

There is no Reset button in the primary Success Planner.

------------------------------------------------------------------------

# 16. NCERT Focus Mode

NCERT Focus Mode is a tracker rather than a reproduction of NCERT
content.

For each chapter, track:

-   NCERT Reading
-   Important lines reviewed
-   First Revision
-   Second Revision
-   PYQs practiced

StudyMate does not reproduce copyrighted NCERT textbook passages.

------------------------------------------------------------------------

# 17. Daily Goals

Daily Goals provide measurable preparation targets.

Categories include:

-   Study time
-   Questions
-   Revision
-   NCERT
-   Test

The user can track progress against the daily targets.

Daily Goals can work alongside the To-Do system and Day Summary.

------------------------------------------------------------------------

# 18. Day Summary

Day Summary is a manual end-of-day record.

The user specifies:

### What did I study?

For example:

-   Physics --- Kinematics
-   Chemistry --- Chemical Bonding
-   Biology --- Cell

### How many questions did I practice?

For example:

-   Physics --- 80
-   Chemistry --- 60
-   Biology --- 120
-   Total --- 260

### Effective Study Time

The user manually records actual effective study time.

For example:

> 6h 25m

StudyMate does not assume that time spent inside the app equals
effective study time.

### Optional Reflection

The user may add a short reflection about the day.

Previous Day Summaries can be reviewed later.

------------------------------------------------------------------------

# 19. Test Comparison

Test Comparison compares performance between tests.

Possible comparison metrics:

-   Score
-   Accuracy
-   Correct
-   Incorrect
-   Skipped
-   Silly Mistakes
-   Subject performance
-   Other recorded metrics

Example:

``` text
Score
517 → 548
+31

Accuracy
72% → 78%
+6%

Silly Mistakes
6 → 3
-3
```

The purpose is to make improvement measurable.

------------------------------------------------------------------------

# 20. Intelligent Revision System

The Intelligent Revision System helps schedule revisions.

A default spaced-revision pattern can be:

  Stage   Suggested Time
  ------- ----------------
  Study   Day 0
  Rev-1   Day 1
  Rev-2   Day 3
  Rev-3   Day 7
  Rev-4   Day 14
  Rev-5   Day 30

Revision priority can be influenced by test performance and whether a
revision is overdue.

------------------------------------------------------------------------

# 21. Smart Weakness Engine

The Smart Weakness Engine identifies weak chapters and topics from
actual StudyMate data.

Possible factors include:

-   Accuracy
-   Incorrect questions
-   Silly mistakes
-   Skipped questions
-   Recency
-   Last practice
-   Revision status

Example:

``` text
Kinematics

Accuracy: 58%
Incorrect: 15
Silly Mistakes: 4
Skipped: 3
Last Practiced: 8 days ago

Priority: HIGH
```

The system should use the user's recorded performance rather than
generic assumptions.

------------------------------------------------------------------------

# 22. Personal NEET StudyMate

Personal NEET StudyMate acts as a central recommendation system.

It uses the user's recorded StudyMate information, including:

-   Test performance
-   Mistakes
-   Success Planner
-   Revision
-   Practice
-   Daily Goals
-   Day Summary

The purpose is to answer:

> **What should I do now?**

Example:

``` text
🎯 Revise Kinematics — 45 min

Why:
• Accuracy is low
• Repeated mistakes are present
• Revision is overdue
```

Recommendations should be based on actual recorded data.

------------------------------------------------------------------------

# 23. Reports

Reports provide a broader performance overview.

## Overall Performance

-   Best Score
-   Average Score
-   Tests Analysed
-   Total Accuracy

## Score Trend

Visualize score progression across analyzed tests.

## Subject Performance

-   Physics accuracy
-   Chemistry accuracy
-   Botany accuracy
-   Zoology accuracy

## Marks Lost

-   Silly Mistakes
-   Incorrect
-   Skipped

## Mistake Breakdown

Analyze the types and frequency of mistakes.

## Silly Mistake Details

Show details of recorded silly mistakes.

## Weak Topics

Identify weak areas from actual data.

## Focus Areas

Produce data-driven areas that deserve attention.

------------------------------------------------------------------------

# 24. Settings

Settings are available from the three-dot menu.

## Security

-   App Lock ON/OFF
-   Change Passcode
-   Security Questions
-   Recovery/reset passcode
-   Auto Lock options

## Appearance

Theme options can include:

-   Light
-   Dark
-   System

The app should respect the selected appearance consistently.

------------------------------------------------------------------------

# 25. App Lock

StudyMate can be protected by a user-created 4--6 digit passcode.

## First Setup

``` text
Create Passcode
      ↓
Confirm Passcode
      ↓
Create 3 Recovery Questions
```

## Forgot Passcode

The user answers all three recovery questions correctly before resetting
the passcode.

## Security

Passcodes and recovery answers should be stored as hashes rather than
plain text.

Failed attempts can introduce a delay to reduce repeated guessing.

## Auto Lock

Possible options:

-   Immediately
-   1 minute
-   5 minutes
-   15 minutes
-   Never

------------------------------------------------------------------------

# 26. Backup & Restore

Backup & Restore is designed to protect the user's StudyMate data.

## Backup

StudyMate creates a backup file containing the user's app data.

The backup should include:

-   Test history
-   Test results
-   Question analysis
-   Mistake data
-   Success Planner progress
-   Daily Goals
-   Day Summaries
-   Revision data
-   Practice/Redo records
-   User settings
-   Relevant app preferences
-   Original uploaded test PDFs

Including the PDFs is especially important because Mistake Notebook,
Test Results, Practice My Mistakes, and Redo My Mistakes can depend on
the original PDF question cutouts.

## Recommended Backup Flow

``` text
Create Backup
      ↓
Create backup password
      ↓
Encrypt backup
      ↓
StudyMate backup file
```

## Restore Flow

``` text
Select StudyMate Backup
      ↓
Enter Backup Password
      ↓
Verify Backup
      ↓
Show backup information
      ↓
Confirm Restore
      ↓
Restore data + PDFs
```

The user should be warned before a restore if current data will be
replaced.

------------------------------------------------------------------------

# 27. Local-First Storage

StudyMate is designed to work locally.

## localStorage

Suitable for smaller structured data such as:

-   Test records
-   Results
-   Mistake records
-   Planner progress
-   Daily Goals
-   Day Summaries
-   Practice attempts
-   Preferences
-   Settings

## IndexedDB

Used for larger binary data such as:

-   Uploaded PDFs

This separation is important for reliable PDF persistence.

------------------------------------------------------------------------

# 28. PDF Persistence and Updates

An analyzed test should not disappear simply because the app's frontend
files are updated, as long as the app continues using the same
browser/site storage and the user does not clear that storage.

Data can be lost if the user:

-   Clears browser/site data
-   Uses a different browser profile
-   Changes the app origin/domain
-   Manually removes app storage
-   Uses a browser that removes stored site data

For this reason, Backup & Restore is important before major changes or
device migration.

------------------------------------------------------------------------

# 29. NEET 2027 Countdown

A persistent countdown appears near the bottom of the app.

It represents:

> **Time remaining until NEET 2027**

The countdown is separate from:

-   Study time
-   Effective time
-   Day Summary
-   Daily Goals

The exam date should be configurable rather than assuming an unofficial
date.

------------------------------------------------------------------------

# 30. Overall App Structure

``` text
STUDYMATE
│
├── HOME
│   ├── Time-based Greeting
│   ├── Daily Motivational Quote
│   ├── Start New Test
│   ├── History
│   ├── Reports
│   ├── Success Planner
│   ├── Day Summary
│   ├── Mistake Notebook
│   └── NEET 2027 Countdown
│
├── HISTORY
│   └── Previous Test Results
│
├── REPORTS
│   ├── Overall Performance
│   ├── Score Trend
│   ├── Subjects
│   ├── Marks Lost
│   ├── Mistakes
│   └── Weak Topics
│
└── ⋮ MORE
    ├── Practice
    │   ├── Generate Mock Test
    │   ├── Upload PDF → Interactive Quiz
    │   ├── Practice My Mistakes
    │   └── Redo My Mistakes
    │
    ├── Mistake Notebook
    ├── NCERT Focus Mode
    ├── Daily Goals
    ├── Test Comparison
    ├── Intelligent Revision
    ├── Smart Weakness Engine
    ├── Personal NEET StudyMate
    └── Settings
        ├── App Lock
        ├── Passcode
        ├── Security Questions
        ├── Backup & Restore
        └── Theme
```

------------------------------------------------------------------------

# 31. Core Data Flow

The most important StudyMate workflow is:

``` text
TEST PDF
   ↓
Saved locally
   ↓
TEST ANALYSIS
   ↓
Question-by-question analysis
   ↓
Incorrect / Silly / Skipped
   ↓
TEST RESULT
   ↓
Exact PDF Question Cutout
   ↓
MISTAKE NOTEBOOK
   ↓
PRACTICE MY MISTAKES
   ↓
REDO MY MISTAKES
   ↓
Previously Incorrect → Now Correct
```

At the same time, the recorded information feeds:

``` text
Tests
  ↓
Reports
  ↓
Test Comparison
  ↓
Smart Weakness Engine
  ↓
Intelligent Revision
  ↓
Personal NEET StudyMate
```

And:

``` text
Day Summary + Daily Goals
          ↓
Personal NEET StudyMate
          ↓
Better daily recommendations
```

------------------------------------------------------------------------

# 32. Design Philosophy

StudyMate should feel:

-   Clean
-   Personal
-   Motivating
-   Fast
-   Mobile-friendly
-   Easy to use
-   Data-driven
-   Local-first

The Home screen should remain simple.

Advanced tools should live in the three-dot menu.

The most important interaction should always be easy to understand:

> **Study → Test → Analyze → Identify Mistakes → Practice → Improve →
> Revise → Repeat**

------------------------------------------------------------------------

## Final Feature List

### Core

-   Test Analysis
-   PDF Upload
-   Local PDF Storage
-   Exact PDF Question Cutouts
-   Test Results
-   History
-   Reports

### Mistake System

-   Mistake Notebook
-   Practice My Mistakes
-   Redo My Mistakes
-   Incorrect Question Review
-   Silly Mistake Tracking
-   Skipped Question Tracking

### Preparation

-   Success Planner
-   NCERT Focus Mode
-   Daily Goals
-   Intelligent Revision
-   Smart Weakness Engine
-   Personal NEET StudyMate

### Productivity

-   Day Summary
-   Daily progress tracking
-   NEET 2027 Countdown

### Practice

-   Generate Mock Test
-   Chapter-wise Practice
-   Subject-wise Practice
-   Full Syllabus Practice
-   Upload PDF Interactive Quiz

### Security & Data

-   App Lock
-   Passcode
-   Security Questions
-   Auto Lock
-   Backup
-   Restore
-   Local data storage
-   Local PDF storage
-   Light/Dark/System theme

------------------------------------------------------------------------

## The StudyMate Goal

StudyMate is not intended to be just a test-analysis app.

Its complete loop is:

> **Know where you stand → Understand why you lost marks → Practice
> exactly what you got wrong → Revise at the right time → Track
> improvement → Decide what to do next.**

That is the foundation of the StudyMate NEET 2027 system.
