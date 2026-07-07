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

## 6. Publish Security Rules

1. Open Firestore Database.
2. Go to Rules.
3. Replace the rules with the contents of `firestore.rules`.
4. Confirm owner and manager emails are listed in the rules.
5. Click Publish.

## 7. Create First Owner

1. Add the owner email to `OWNER_EMAILS` in `app-config.js`.
2. Add the same owner email to `ownerEmails()` and `approvedUserEmails()` in `firestore.rules`.
3. Upload the files to GitHub Pages.
4. Open the site.
5. Register with the owner email.
6. The app automatically creates the owner profile.
