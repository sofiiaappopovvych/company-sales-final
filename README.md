# Company Sales Hub CRM v1.2

Simple internal web app for owner and sales managers.

## What is included

- Firebase email/password login and registration
- Roles: `owner` and `sales_manager`
- CRM leads v1.1 with company/contact fields, assigned manager, dates, search, and filters
- Sales pipeline statuses: New Lead, Contacted, Interested, Follow-up, Proposal Sent, Won, Lost
- Visual sales funnel with counters for every status
- Daily checklist
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

## Files

- `index.html` - app layout
- `styles.css` - responsive design
- `app.js` - Firebase auth, Firestore sync, CRM logic
- `firebase-config.js` - paste your Firebase config here
- `firestore.rules` - Firestore security rules

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
