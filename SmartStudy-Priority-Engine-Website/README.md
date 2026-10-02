# SmartStudy Priority Engine

A mobile-first prototype based on the **SmartStudy Priority Engine – Software Project Proposal**.

## Included
- Dynamic priority ranking
- Priority score using urgency, preparation gap, difficulty and exam weightage
- Dashboard with today's top priority
- Recommended study-time allocation
- Subject add/delete management
- Preparation progress
- 25-minute study timer
- Study-session history
- LocalStorage persistence
- Responsive mobile/tablet/desktop UI

## Run
Open `index.html` in a browser.

No build tool is required for this prototype.

## Backend-ready direction
The proposal specifies PHP + MySQL for authentication, business logic and database communication. The current version keeps data in browser LocalStorage so the UI and priority engine can be demonstrated immediately. A next phase can replace LocalStorage with PHP APIs and MySQL tables:
- students
- subjects
- study_sessions

## Core formula from proposal
Priority Score =
40% Exam Urgency +
30% Preparation Gap +
15% Difficulty +
10% Exam Weightage +
5% Neglected Study Time

The prototype normalizes these factors for a usable front-end demonstration.
