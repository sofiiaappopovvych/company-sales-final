// Security config for Company Sales Hub.
// Add every approved login email here in lowercase.
// Owner emails automatically receive the owner role during registration.

export const OWNER_EMAILS = [
  "skillfulsweing@gmail.com"
];

export const APPROVED_MANAGER_EMAILS = [
  // "manager@example.com"
];

export const APPROVED_USER_EMAILS = [
  ...OWNER_EMAILS,
  ...APPROVED_MANAGER_EMAILS
];
