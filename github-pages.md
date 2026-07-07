# GitHub Pages Guide

## Upload Files

Upload these files and folders to the repository root:

- `index.html`
- `styles.css`
- `app.js`
- `firebase-config.js`
- `app-config.js`
- `firestore.rules`
- `README.md`
- `docs/`

## Enable Pages

1. Open the GitHub repository.
2. Go to Settings.
3. Open Pages.
4. Under Build and deployment, choose Deploy from a branch.
5. Select branch `main`.
6. Select folder `/root`.
7. Save.

## Open Site

GitHub Pages usually publishes at:

```text
https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/
```

For a user or organization site repository, it may publish at:

```text
https://YOUR_USERNAME.github.io/
```

## Firebase Authorized Domain

Copy only the domain part and add it in Firebase Authentication authorized domains:

```text
YOUR_USERNAME.github.io
```

Do not include `https://` or the repository path.

## Production Check

After GitHub Pages publishes:

1. Open the site in a private browser window.
2. Register or log in with an approved owner email.
3. Confirm Firebase Auth authorized domains includes the GitHub Pages domain.
4. Open Firestore Rules and publish the included `firestore.rules`.
5. Confirm the app loads without browser console errors.
6. Test the mobile layout from your phone.
