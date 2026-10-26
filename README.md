# GymGuru

A phone-first workout logger for the **W9–12** program from the "shawn" Google Sheet.
It shows what to do today, records the weight and reps of every set, runs the rest timer,
and charts your top weight per exercise week by week.

## Using it

- **Today**: pick the week and day (Chest, Back, Legs, Shoulders). The plan lists
  sets × reps, target RPE, rest and what you lifted last time. It opens on the day after
  the last one you logged.
- **More weeks**: tap **+** after the last week (or Settings → Program length) to add one.
  Added weeks repeat the sheet's 4-week cycle, the way its W1-4, W5-8 and W9-12 tabs do:
  week 5 is like week 1 (pause bench, high-stance leg press, DB split squat, DB shoulder
  press), week 7 like week 3 (incline press added). "Last time" compares like with like, so
  week 5's DB split squat shows week 1's DB weight, not week 4's Smith weight. An added week
  can be removed from Settings while it's empty.
- **Workout**: set the weight (±2.5 kg) and reps, then press **Done · Rest** at the bottom.
  That logs the set, copies the weight to the remaining sets and starts the rest
  countdown, which beeps when it ends (iPhone: if the silent switch is off). On the last
  set of a movement it moves on to the next exercise instead. The ✓ on each row does the
  same for any set. "Try +2.5 kg" bumps the sets still to do. Rate the exercise's RPE.
- **How to**: tap a movement (in the day's plan, or its name during a workout) for a demo
  video, form tips and a YouTube search. Videos and their tips are in
  `src/exerciseGuides.ts`; if a video won't play, the app offers a YouTube search instead.
- **Finish → Save**: shows sets, volume and change versus last time, then marks the day
  logged.
- **History**: top weight per exercise for each week of the block.
- **Settings** (gear on Today): download/restore a backup, export sets as CSV for Google
  Sheets, ask the browser to keep the data, delete everything.

Week 1 Legs weights (leg press 40, Bulgarian split squat 10, leg curl 30, hip adduction 20,
DB bench 45, lat pulldown 25) come from the sheet and count as history.

### Where the data lives

Workouts are stored in the browser on your phone (`localStorage`), so the app works with no
signal. With Google Sheet sync set up (below), every saved workout is also copied to your
sheet, which is the copy that survives a cleared browser or a new phone. Without it:

- Add it to your home screen. Installed web apps keep their data; Safari can clear data of
  sites you haven't opened in a while.
- Download a backup from Settings now and then, and before switching phones.

## Google Sheet sync

Saving a workout also writes its sets to a **GymGuru Log** tab in your Google Sheet (one
row per completed set: session, date, week, day, exercise, set, weight, reps, RPE). If the
phone is offline, the workout waits and is sent when it's back online. On a new phone,
**Settings → Restore from Google Sheet** brings your history back.

One-time setup (easiest on a computer):

1. Open the Google Sheet → **Extensions → Apps Script**.
2. Replace the code with [`apps-script/Code.gs`](apps-script/Code.gs) (the app's
   Settings has a **Copy script** button).
3. **Deploy → New deployment →** type **Web app**, **Execute as: Me**,
   **Who has access: Anyone** → **Deploy**. Allow access; Google calls the script
   unverified because it's your own, so choose **Advanced → Go to …**.
4. Copy the web app URL (ends in `/exec`), send it to your phone, and paste it into
   **Settings → Google Sheet sync → Connect**.

How it's protected: the URL is unguessable, and the first phone that connects registers its
random sync key with the script; requests with any other key are refused. To connect another
phone, restore its backup file, or paste the sync key (Settings → Sync key) under
"Already set up on another phone?". To start over, delete `SYNC_KEY` under the Apps Script
project's **Project Settings → Script properties**.

If you change the script later, use **Deploy → Manage deployments → Edit → Version: New
version** so the URL stays the same.

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
