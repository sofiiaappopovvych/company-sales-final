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
- Manager can read sanitized `bookingSlots` for busy times.
- Manager cannot see another manager's client name, phone, email, address, package, notes, deposit, or balance through calendar busy slots.
- Manager cannot update another manager's lead by changing `ownerId`.
- Owner can read and edit all leads.
- Owner can read all users.
- Unapproved authenticated account cannot read or write Firestore data.

## CRM

- Add lead.
- Edit lead.
- Delete lead.
- Save event details: child age, child gender, guest count, event date, event time, event end time, event duration, event address, party theme, package option, add-ons, main character, and additional characters.
- Save booking details: booking status, deposit paid, deposit amount, balance due, and booking confirmed.
- Reopen the lead with Edit and confirm event details are still selected.
- Reopen the lead with Edit and confirm booking details are still selected.
- Search by company, contact, city, phone, email, address, notes.
- Search by package, character, party theme, add-on, booking status, or deposit detail.
- Filter by status.
- Filter by source.
- Filter by category.
- Owner can filter by manager.
- Manager sees only own leads.
- Dates display as `MM/DD/YYYY` in cards, dashboards, calendars, and CSV exports.

## Booking Workflow

- Lead card shows visual booking status badge.
- Inquiry lead can move to Tentative.
- Tentative lead can move to Booked.
- Booked lead can move to Completed.
- Booked lead can move to Cancelled.
- Invalid transitions are not shown.
- Deposit paid checkbox saves and reopens correctly.
- Balance due saves and appears on the lead card.
- Manager dashboard shows upcoming own booked events.
- Owner Dashboard shows upcoming booked events across the team.

## Booking Calendar

- Calendar page opens from the main navigation.
- Booked, tentative, and completed leads appear on the correct event date.
- Inquiry and cancelled leads do not appear as booked calendar events.
- Calendar cards show event time, end time, character, city, package, and manager for owner.
- Manager sees own booking details.
- Manager sees other managers' bookings only as busy slots in the app UI.
- Manager busy slots come from sanitized `bookingSlots`, not full lead records.
- Previous, Today, and Next buttons change the visible month.
- Mobile view stacks days into a scannable single-column calendar.

## Character Availability

- Character Availability opens from the main navigation.
- All characters appear in the quick availability summary.
- Character filter shows only the selected character.
- Date filter updates the free/busy summary and 7-day calendar.
- Booking status filter narrows bookings by booked, tentative, or completed.
- A character with no booking on the selected date shows Available.
- A character with one or more matching bookings on the selected date shows Busy.
- Owner sees full booking details.
- Manager sees full details for own bookings and limited busy-slot details for other managers' bookings.
- Mobile view stacks character calendars into single-column cards.

## Conflict Detection

- Create two booked/tentative leads with the same character, same date, and overlapping times.
- CRM form shows a conflict warning before saving the second lead.
- Saving with a conflict asks for confirmation and saves only after confirmation.
- Cancelling the confirmation keeps the lead unsaved.
- CRM lead card shows the conflict warning list after save.
- Booking Calendar shows conflict warning on the affected booking cards.
- Owner sees conflict details.
- Manager sees own conflict details and sees another manager's conflicting booking only as a busy slot.
- Leads with different characters or non-overlapping times do not show conflict warnings.

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
- Manager can delete own report.
- Owner can delete manager reports.
- Owner sees all manager reports.
- KPI dashboard updates from report numbers.

## Follow-up Queue

- Lead with follow-up date today appears in queue.
- Overdue lead appears in queue.
- Won and Lost leads do not appear in queue.
- Mark as contacted saves note and updates next follow-up date.

## CSV Export

- Export leads CSV downloads a file.
- Leads CSV includes booking status, event end time, event duration, event address, main character, additional characters, deposit paid, deposit amount, balance due, and booking confirmed.
- CSV date fields use `MM/DD/YYYY`.
- Export reports CSV downloads a file.
- Export follow-ups CSV downloads a file.
- Export checklists CSV downloads a file.
- Manager exports only own accessible records.
- Owner exports team records.

## Mobile

- Open site on phone width.
- Login card fits screen.
- Navigation appears as a collapsible menu.
- Selecting a menu item closes the menu on mobile.
- Forms stack into one column.
- Record action buttons are tappable.

## Navigation

- Desktop navigation appears as a grouped sidebar.
- Sections are grouped into Overview, CRM & Bookings, Daily Work, Resources, and Owner.
- Owner/Admin links appear only for owner users.
- Active section is highlighted.

## Deployment

- GitHub Pages URL opens the app.
- Firebase authorized domain includes the GitHub Pages domain.
- Browser console has no JavaScript syntax errors.
- Firestore rules are published after every email allowlist change.
- Approved production emails can log in: `skillfulsweing@gmail.com`, `sales@funandjoy.io`, and `snek.sova@gmail.com`.
- Existing older `status: "won"` booking appears in Booking Calendar after owner login/sync.
