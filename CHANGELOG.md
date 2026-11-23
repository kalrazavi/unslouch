# Changelog

Every version of Unslouch and what I changed after using it on real shifts. Nothing here was right out of the box: I used each build, found what got in the way, worked out what it should do instead, and had it changed.

Dates are when the change went live. Commit IDs link each entry to the code.

---

## v1.0.2 · 23 Nov 2026 · Timer keeps running
`fb54e3e`

### Fixed
- **Switching tabs reset the exercise timer.** Chrome closes the popup as soon as you click away, and the timer lived inside it, so it started over every time. The timer now remembers when it started and keeps running as long as Chrome is open, even if I switch tabs, minimise Chrome or close the popup. Reopening the popup shows the time left, and if it runs out while the popup is closed, the break is still checked off.

## v1.0.1 · 22 Nov 2026 · Ownership
`dff0436`, `3297efa`

- Ownership notice in the code and at the bottom of the popup.

### Fixed (outside the code)
- **Moving the extension's folder made Chrome treat it as a new, empty extension**, so saved progress looked lost. The saved data was copied across to the new location, and the rule now is that extension folders are never moved.

## v1.0 · 21 Nov 2026 · First release
`1725e9f`, `8ba6049`

The first public version already carried four rounds of my changes from testing it:

- **The figure did not show the actual move.** Each break now shows a drawn figure doing that exact pose.
- **Sound would distract me at work.** Breaks are silent: a notification and the popup, no sound.
- **No way to close out a day.** Added a reset button and "Day finished", which counts into a tally.
- **Nothing showed whether I kept it up.** Added a real-time year calendar (2026 onwards): a finished day gets a green check, a missed day an X.
- **Breaks felt like orders with no reason.** Each break now comes with a short "worth knowing" fact about why the move matters.
- **Running late meant losing my place.** Added arrows to go to the next or previous exercise, and an "overdue" stamp across a break I missed. The next break still opens on its own at the right time.
