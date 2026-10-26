# GymGuru

A phone-first workout logger for the **W9–12** program from the "shawn" Google Sheet.
It shows what to do today, records the weight and reps of every set, runs the rest timer,
and charts your top weight per exercise week by week.

## Using it

- **Today**: pick the week (W1–W4) and day (Chest, Back, Legs, Shoulders). The plan lists
  sets × reps, target RPE, rest and what you lifted last time. It opens on the day after
  the last one you logged.
- **Workout**: adjust weight (±2.5 kg) and reps, tick each set. Ticking starts the rest
  countdown and copies the weight to the remaining sets. "Try +2.5 kg" bumps the sets
  still to do. Rate the exercise's RPE.
- **Finish → Save**: shows sets, volume and change versus last time, then marks the day
  logged.
- **History**: top weight per exercise for each week of the block.
- **Settings** (gear on Today): download/restore a backup, export sets as CSV for Google
  Sheets, ask the browser to keep the data, delete everything.

Week 1 Legs weights (leg press 40, Bulgarian split squat 10, leg curl 30, hip adduction 20,
DB bench 45, lat pulldown 25) come from the sheet and count as history.

### Where the data lives

Everything is stored in the browser on your phone (`localStorage`). There is no server or
account. That means:

- Add it to your home screen. Installed web apps keep their data; Safari can clear data of
  sites you haven't opened in a while.
- Download a backup from Settings now and then, and before switching phones.

## Deployment

The site is static and is published to **GitHub Pages** by
`.github/workflows/deploy.yml` on every push to `main` (or the current default branch).

One-time setup:

1. In the repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Actions → Deploy to GitHub Pages → Run workflow** (or push a commit).
3. The app is then at `https://thiefkid.github.io/GymGuru/`.

On your phone open that link, then:

- **iPhone**: Safari → Share → *Add to Home Screen*.
- **Android**: Chrome → ⋮ → *Add to Home screen* / *Install app*.

It runs full screen and works offline after the first visit. New versions arrive the next
time you open it with a connection.

## Development

```sh
npm install
npm run dev        # local dev server
npm test           # unit tests (program, progression, logging)
npm run build      # type-check and build to dist/
npm run preview    # serve the built app
```

The program itself is in `src/program.ts`; edit it to change exercises, sets, reps, RPE or
rest.
