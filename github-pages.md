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
