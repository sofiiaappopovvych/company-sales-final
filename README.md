# Company Sales Hub CRM v2.0 Security Review

Simple internal web app for owner and sales managers.

## What is included

- Firebase email/password login and registration
- Roles: `owner` and `sales_manager`
- CRM leads v1.1 with company/contact fields, assigned manager, dates, search, and filters
- Sales pipeline statuses: New Lead, Contacted, Interested, Follow-up, Proposal Sent, Won, Lost
- Visual sales funnel with counters for every status
- Daily checklist
- Daily Sales Checklist with measurable goals saved by date and user
- Owner can see today's checklist progress for all managers
- Daily Report form with sales activity metrics
- Owner can see all manager reports
- Follow-up Queue for leads due today or overdue
- Mark queued leads as contacted, add follow-up note, and update the next follow-up date
- Searchable Sales Playbook knowledge base in English and Russian
- Templates section with copy buttons
- Owner-only Admin Panel for users, roles, lead assignment, manager KPI, disabled users, and all daily reports
- KPI Dashboard with today/week/month metrics and manager leaderboard
- Private access allowlist with owner emails and approved manager emails

## KPI Dashboard

- Leads added today/week/month
- Follow-ups today/week/month
- Messages sent
- Calls made
- Proposals sent
- Meetings booked
- Deals won
- Conversion rate
- Leaderboard managers

## Admin Panel

- View all users
- Change user roles
- Disable or enable users
- Assign leads to managers
- View manager KPI
- View all daily reports
- Follow-up tracker
- Daily reports
- Owner dashboard
- Shared Firestore sync between users
- Sales managers see their own data
- Owner sees all team data
- Works on GitHub Pages with plain HTML/CSS/JavaScript

## Lead fields

- Company name
- Contact name
- Phone
- Email
- City
- Category
- Source
- Status
- Assigned manager
- Next follow-up date
- Notes
- Created date
- Updated date

## CRM functions

- Add lead
- Edit lead
- Delete lead
- Search leads
- Filter by status
- Filter by source
- Filter by category
- Filter by manager for owner
- Visual funnel and status counters

## Daily Sales Checklist goals

- 20 new CRM contacts
- 15-20 new outreaches
- 30 follow-ups
- 20-30 Facebook groups reviewed
- 10-15 relevant posts found
- Daily report submitted

## Daily Report fields

- New leads added
- New outreaches
- Follow-ups completed
- Calls made
- Messages sent
- Proposals sent
- Responses received
- Meetings booked
- Deals closed
- Problems / objections
- Tomorrow plan

## Sales Playbook sections

- Company overview
- Services
- Target audiences
- Facebook strategy
- Instagram strategy
- Grand opening strategy
- Schools/daycares/churches
- Objection handling
- Closing
- SOP

## Template categories

- Facebook group reply
- Facebook DM
- Instagram DM
- Email
- SMS
- Phone scripts
- Follow-up messages
- Objection responses

## Files

- `index.html` - app layout
- `styles.css` - responsive design
- `app.js` - Firebase auth, Firestore sync, CRM logic
- `firebase-config.js` - paste your Firebase config here
- `app-config.js` - owner emails and approved manager emails
- `firestore.rules` - Firestore security rules

## Privacy and security setup

This app can be publicly hosted on GitHub Pages, but company data is protected by Firebase Authentication and Firestore Security Rules.

Before using with the team:

1. Add owner emails to `app-config.js`.
2. Add approved manager emails to `app-config.js`.
3. Add the same emails to `firestore.rules` inside `ownerEmails()` and `approvedUserEmails()`.
4. Publish `firestore.rules` in Firebase Console.
5. Keep Email/Password Authentication enabled.
6. Keep `sofiiaappopovych.github.io` in Firebase Authorized domains.

Important: client-side config improves the app experience, but Firestore Rules are the real data protection layer. Always update both.

## Firebase setup

1. Open Firebase Console and create a project.
2. Add a Web App.
3. Copy the web config into `firebase-config.js`.
4. Go to Authentication -> Sign-in method.
5. Enable Email/Password.
6. Go to Firestore Database and create a database.
7. Publish the rules from `firestore.rules`.

## GitHub Pages setup

1. Upload all files to your GitHub repository.
2. Go to repository Settings -> Pages.
3. Select the branch and folder where these files are stored.
4. Open the GitHub Pages URL.

## Important role note

During MVP registration, users can choose `owner` or `sales_manager`.

For a private company tool, the safer next step is to let only the real owner assign roles in Firebase/Firestore. For now, this is kept simple so you can start testing immediately.

## First test

1. Register an owner account.
2. Register one sales manager account in another browser or private window.
3. Add leads and reports as sales manager.
4. Login as owner and confirm that the dashboard shows all users' data.
