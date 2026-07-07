# Testing Checklist

## Authentication

- Login form appears before any CRM data.
- Unapproved email cannot register.
- Approved manager email can register.
- Owner email can register and sees Owner Dashboard and Admin Panel.
- Disabled user cannot continue using the app.

## Firestore Rules

- Manager can create a lead assigned to self.
- Manager cannot read another manager's lead.
- Manager cannot update another manager's lead by changing `ownerId`.
- Owner can read and edit all leads.
- Owner can read all users.
- Unapproved authenticated account cannot read or write Firestore data.

## CRM

- Add lead.
- Edit lead.
- Delete lead.
- Search by company, contact, city, phone, email, notes.
- Filter by status.
- Filter by source.
- Filter by category.
- Owner can filter by manager.
- Manager sees only own leads.

## Pipeline

- Funnel shows all statuses.
- Counters update after status changes.
- Won and Lost are counted correctly.

## Daily Checklist

- Checklist saves for today's date.
- Refresh keeps saved checklist values.
- Owner sees today's progress for managers.

## Daily Reports

- Submit daily report.
- Report appears in Daily Reports.
- Owner sees all manager reports.
- KPI dashboard updates from report numbers.

## Follow-up Queue

- Lead with follow-up date today appears in queue.
- Overdue lead appears in queue.
- Won and Lost leads do not appear in queue.
- Mark as contacted saves note and updates next follow-up date.

## CSV Export

- Export leads CSV downloads a file.
- Export reports CSV downloads a file.
- Export follow-ups CSV downloads a file.
- Export checklists CSV downloads a file.
- Manager exports only own accessible records.
- Owner exports team records.

## Mobile

- Open site on phone width.
- Login card fits screen.
- Navigation scrolls horizontally.
- Forms stack into one column.
- Record action buttons are tappable.

## Deployment

- GitHub Pages URL opens the app.
- Firebase authorized domain includes the GitHub Pages domain.
- Browser console has no JavaScript syntax errors.
- Firestore rules are published after every email allowlist change.
