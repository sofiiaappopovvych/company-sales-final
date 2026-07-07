# Company Sales Hub Booking Calendar - Production Final

Production-ready internal sales CRM and booking calendar for owner and sales managers.

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
- Owner sees all CRM details; managers see their own CRM details and sanitized busy slots for other managers
- CRM leads with search, filters, add/edit/delete, manager assignment, party details, package options, add-ons, character, and next follow-up date
- Booking Calendar with booked, tentative, and completed events from Firebase leads
- Character Availability view with character, date, and booking status filters
- Booking confirmation workflow with controlled status transitions and upcoming booked event dashboards
- Sales pipeline statuses and visual funnel counters
- Follow-up queue for today and overdue leads
- Daily sales checklist saved by date and user
- Daily reports by manager with delete option
- Owner dashboard, Admin Panel, and KPI Dashboard
- Searchable Sales Playbook in English and Russian
- Message templates with copy buttons
- CSV backup/export for leads, reports, follow-ups, and checklists
- Mobile-friendly responsive layout
- Collapsible grouped sidebar navigation on desktop and accordion menu navigation on mobile
- Loading states and user-facing error messages
- Dates display as `MM/DD/YYYY`

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

### Approved Emails

This production package already approves these emails:

| Email | Role |
| --- | --- |
| `skillfulsweing@gmail.com` | Owner |
| `sales@funandjoy.io` | Owner |
| `snek.sova@gmail.com` | Sales manager |

Add future emails in lowercase to both `app-config.js` and `firestore.rules`.

Important: every approved email must also be listed inside `firestore.rules`.

## Security Model

- The website itself is public because GitHub Pages is public.
- Business data is private because Firestore reads/writes require Firebase login.
- Only approved emails can create/read/write app data.
- Owner access requires both:
  - `role: "owner"` in the user profile
  - the email listed in owner allowlists
- Sales managers can read/write only documents where `ownerId` equals their Firebase UID.
- Cross-manager availability uses the `bookingSlots` collection, which stores only sanitized busy-slot data: date, time, duration, booking status, character, and ownerId.
- Managers can see other managers' busy slots in calendars, but not full lead details such as client name, phone, email, address, package, notes, deposit, or balance.
- Disabled users are blocked by the app and by Firestore rules.

Static GitHub Pages cannot fully prevent someone from creating a Firebase Auth account outside the UI. Firestore Rules are the real protection: unapproved accounts cannot access company data.

## CSV Backup / Export

After login, open Dashboard and use:

- Export leads CSV
- Export reports CSV
- Export follow-ups CSV
- Export checklists CSV

Owner exports team-wide data. Managers export only their own accessible data.

Lead CSV export includes all booking fields and exports date fields as `MM/DD/YYYY`.

## Booking Calendar

The Booking Calendar reads Firebase leads with booking status `booked`, `tentative`, or `completed`.

Calendar cards show:

- Event time and end time
- Main character
- City
- Package
- Manager

Owner users see all booking details. Sales managers see their own booking details; other managers' bookings appear as sanitized busy slots from `bookingSlots`.

## Existing Booking Compatibility

The app supports the existing Firebase lead shown in the production database screenshots. If an older lead has `status: "won"` but does not yet have the new booking fields, the app treats it as a booked event and infers missing booking display data from existing fields:

- `eventDate` from `nextFollowUpDate`
- `eventTime` from notes such as `5 pm`
- `eventDuration` from notes such as `45 minutes`
- `packageOption` from notes containing `Special Option`
- `mainCharacter` from notes containing `Bear`

When an owner opens the app, sanitized booking slots are synced for booked, tentative, and completed leads.

## Conflict Detection

The CRM and Booking Calendar warn when the same main or additional character is already `booked` or `tentative` on the same date with overlapping time.

- The CRM form shows a conflict warning list before saving.
- Saving is not fully blocked, but the user must confirm before saving through the warning.
- Owner users see conflicting booking details.
- Managers see their own conflicting booking details; conflicts with another manager's lead appear as a busy slot in the app UI.
- If event end time is empty, the app uses event duration. If duration is also empty, the app checks a default 60-minute slot.

## Character Availability

The Character Availability page shows a quick free/busy view and a 7-day availability calendar for each character.

Filters include:

- Character
- Date
- Booking status

Owner users see full booking details. Sales managers see full details for their own bookings and limited busy-slot details for bookings owned by another manager.

## Booking Confirmation Workflow

CRM lead cards include booking workflow actions:

- Inquiry to Tentative
- Tentative to Booked
- Booked to Completed
- Booked to Cancelled

Booking status uses visual badges. The dashboard shows upcoming booked events for the current manager. The Owner Dashboard shows upcoming booked events across the team. Deposit paid is saved as a checkbox boolean, and balance due remains visible in lead cards and booked event summaries.

## CRM Event Fields

The CRM lead form includes sales/event details for birthday and event inquiries:

- Child age
- Child gender
- Number of guests
- Event date
- Event time
- Event end time
- Event duration
- Event address
- Party theme
- Booking status: inquiry, tentative, booked, completed, cancelled
- Package option
- Add-ons
- Main character
- Additional characters
- Deposit paid
- Deposit amount
- Balance due
- Booking confirmed

Package options are based on the current Fun&Joy pricing PDF:

- Option 1 - $200 - 30 minutes - 1 character
- Special Option - $350 - 45 minutes - bear drum show
- Option 2 - $550 - 60 minutes - host + character
- Option 3 - $700 - 90 minutes - silver show
- Festival/corporate - $2400 - up to 6 hours
- Custom package

Add-ons include additional character, extra 30 minutes, desserts/cake, flowers, decorations, helium balloons, bubble machine, face painting, and balloon sticks.

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
