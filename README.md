# Company Sales Hub v1.0

Production-ready internal sales CRM for owner and sales managers.

Built for GitHub Pages with plain HTML, CSS, JavaScript, Firebase Authentication, and Firestore. No React, no npm, no build step.

## File Structure

```text
company-sales-hub/
├── index.html
├── styles.css
├── app.js
├── firebase-config.js
├── app-config.js
├── firestore.rules
├── README.md
└── docs/
    ├── firebase-setup.md
    ├── github-pages.md
    └── testing-checklist.md
```

## Features

- Public GitHub Pages website with private Firebase-protected data
- Email/password login and registration
- Approved-user allowlist in `app-config.js` and `firestore.rules`
- Roles: `owner` and `sales_manager`
- Owner email allowlist
- Owner sees all data; managers see only their own data
- CRM leads with search, filters, add/edit/delete, manager assignment, and next follow-up date
- Sales pipeline statuses and visual funnel counters
- Follow-up queue for today and overdue leads
- Daily sales checklist saved by date and user
- Daily reports by manager
- Owner dashboard, Admin Panel, and KPI Dashboard
- Searchable Sales Playbook in English and Russian
- Message templates with copy buttons
- CSV backup/export for leads, reports, follow-ups, and checklists
- Mobile-friendly responsive layout
- Loading states and user-facing error messages

## Setup Steps

1. Create a Firebase project.
2. Enable Firebase Authentication with Email/Password.
3. Create a Firestore database.
4. Add a Firebase Web App and copy the config into `firebase-config.js`.
5. Add owner and approved manager emails to `app-config.js`.
6. Add the same emails to `firestore.rules`.
7. Publish `firestore.rules` in Firebase Console.
8. Upload all project files to GitHub.
9. Enable GitHub Pages for the repository.
10. Add the GitHub Pages domain to Firebase Authentication authorized domains.
11. Register the owner account with an email listed in `OWNER_EMAILS`.
12. Test with one owner and one manager before giving access to the full team.

## Required Config

### `firebase-config.js`

Paste the Firebase Web App config from Firebase Console:

```js
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### `app-config.js`

Add all emails in lowercase:

```js
export const OWNER_EMAILS = [
  "owner@example.com"
];

export const APPROVED_MANAGER_EMAILS = [
  "manager@example.com"
];
```

Important: every approved email must also be listed inside `firestore.rules`.

## Security Model

- The website itself is public because GitHub Pages is public.
- Business data is private because Firestore reads/writes require Firebase login.
- Only approved emails can create/read/write app data.
- Owner access requires both:
  - `role: "owner"` in the user profile
  - the email listed in owner allowlists
- Sales managers can read/write only documents where `ownerId` equals their Firebase UID.
- Disabled users are blocked by the app and by Firestore rules.

Static GitHub Pages cannot fully prevent someone from creating a Firebase Auth account outside the UI. Firestore Rules are the real protection: unapproved accounts cannot access company data.

## CSV Backup / Export

After login, open Dashboard and use:

- Export leads CSV
- Export reports CSV
- Export follow-ups CSV
- Export checklists CSV

Owner exports team-wide data. Managers export only their own accessible data.

## Guides

- Firebase setup: `docs/firebase-setup.md`
- GitHub Pages setup: `docs/github-pages.md`
- Testing checklist: `docs/testing-checklist.md`

## Deployment Checklist

- `firebase-config.js` contains the correct Firebase project config.
- `app-config.js` contains real owner and manager emails.
- `firestore.rules` contains the same approved emails.
- Firestore rules are published.
- Email/Password Auth is enabled.
- GitHub Pages domain is authorized in Firebase Auth.
- Owner account is registered first.
- Manager account is tested in a separate browser or private window.
- CSV export buttons are tested after sample data is added.
