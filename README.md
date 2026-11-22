# Unslouch

**Break reminders I actually obey.** A browser extension that gives you a posture or movement break every 30 minutes of your shift. Do the move, check it off, and a plant grows.

## Why I built it

I work long remote shifts at a desk, and by the end of one my back let me know. Every reminder app I tried nagged me with the same notification, and within a week I was dismissing it without reading it.

I did not need another alarm. I needed a reason to take the break: something small to look after, and an answer to "why this move, and why now?"

## What it does

- A break every 30 minutes: a posture move on the half hour, a short walk on the hour.
- Six posture moves, each with a drawn figure, a cue and a built-in timer.
- A plant that grows through the day as breaks get done, a daily tally, and a year calendar of finished days.

## What makes it different

- **Reward instead of nagging.** The plant, the tally and the calendar give the break a point.
- **It knows your shift.** Reminders only fire between your start and end time.
- **Every break explains itself** with a short "worth knowing" fact about why the move matters.
- **No account, no server.** Everything stays in your browser.

## How it works

Browser alarms fire on the half hour during the shift, a notification names the move, the popup runs the countdown, and the check-off updates the tally, the plant and the calendar in the browser's local storage.

## Install

1. Download this repository (Code > Download ZIP) and unzip it.
2. Open `chrome://extensions` in Chrome, switch on **Developer mode**.
3. Click **Load unpacked** and choose the folder.

## How it was made

I am not a programmer. I designed the routine and how a break should feel (quick, a little rewarding, never nagging), and tested it through real shifts. An AI coding assistant (Claude Code) wrote the code.
