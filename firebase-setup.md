# Firebase Setup Guide

## 1. Create Project

1. Open Firebase Console.
2. Click Add project.
3. Name the project.
4. Analytics is optional for this app.

## 2. Add Web App

1. Go to Project settings.
2. In Your apps, click Web App.
3. Register the app.
4. Copy the Firebase config.
5. Paste it into `firebase-config.js`.

## 3. Enable Authentication

1. Open Authentication.
2. Go to Sign-in method.
3. Enable Email/Password.
4. Save.

## 4. Add Authorized Domains

1. Open Authentication.
2. Go to Settings.
3. Open Authorized domains.
4. Add your GitHub Pages domain, for example:
   - `yourusername.github.io`
5. Keep `localhost` for local testing.

## 5. Create Firestore

1. Open Firestore Database.
2. Click Create database.
3. Choose Standard edition.
4. Choose Production mode.
5. Select a region.
6. Create the database.

## 6. Confirm Approved Emails

This package already includes:

| Email | Role |
| --- | --- |
| `skillfulsweing@gmail.com` | Owner |
| `sales@funandjoy.io` | Owner |
| `snek.sova@gmail.com` | Sales manager |

If you add more people later, update both `app-config.js` and `firestore.rules`.

## 7. Publish Security Rules

1. Open Firestore Database.
2. Go to Rules.
3. Replace the rules with the contents of `firestore.rules`.
4. Confirm owner and manager emails are listed in the rules.
5. Click Publish.

The rules protect full CRM leads and allow managers to read only sanitized `bookingSlots` for other managers' busy times.

## 8. Create First Owner

1. Upload the files to GitHub Pages.
2. Open the site.
3. Register with `skillfulsweing@gmail.com` or `sales@funandjoy.io`.
4. The app automatically creates the owner profile.
5. After owner login, the app syncs sanitized booking slots for existing booked/tentative/completed leads.
