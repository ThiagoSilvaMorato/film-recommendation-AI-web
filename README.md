# CineMatch AI — Movie Recommendation Engine

A portfolio project: a content-based movie recommender that trains a small
neural network **entirely in the browser**, using [TensorFlow.js](https://www.tensorflow.org/js)
inside a Web Worker so the UI never freezes. No backend, no API keys, no
environment variables — everything runs client-side against a small static
dataset checked into the repo.

Built with React + TypeScript + Vite + Tailwind CSS.

## What it does

1. Browse a catalog of ~500 movies (poster, title, genres, year), with search
   and filters.
2. Pick one of 12 example users (or create your own) and mark movies as
   "watched" from the catalog.
3. Train a neural net on every mock user's watch history, right in your
   browser — watch the loss/accuracy curves update live per epoch.
4. Get a ranked list of movie recommendations for the selected user, scored
   by the trained model.

## How the recommender works

This is a **content-based** recommender: instead of "users who liked X also
liked Y," it learns to predict compatibility between a user's taste profile
and a movie's features. The encoding/training/recommend logic in `src/ml/`
and `src/worker/recommender.worker.ts` closely follows a companion study
project (an e-commerce product recommender built the same way, with
`price`/`age`/`category`/`color` in place of `releaseYear`/`avgViewerAge`/
`genres`/`decade`) — same weighting philosophy, same layer sizes, same
`tf.js` API calls (`tf.oneHot`, `tf.stack().mean(0)`, `tf.concat1d`), so the
two are easy to read side by side.

**Encoding.** Each movie is turned into a numeric vector with four weighted
parts, concatenated (weights mirror the reference project's
category(0.4)/color(0.3)/price(0.2)/age(0.1) split):

- Genres, as a multi-hot vector, weight **0.4** (a movie can have several
  genres, unlike the reference's single category; each active genre's
  weight is divided by the movie's genre count so movies don't get more
  "genre mass" just for having more tags).
- Decade of release, one-hot, weight **0.3**.
- Release year, normalized against the catalog's min/max, weight **0.2**.
- Average age of the mock users who've watched that movie, normalized
  against the current min/max user age, weight **0.1** (computed fresh from
  the live user roster at training time — not stored in the dataset —
  falling back to the midpoint age, which always normalizes to exactly 0.5,
  for unwatched movies).

A **user's vector** is the average of the vectors of the movies they've
watched (or, for a brand-new user, a neutral vector carrying only their
normalized age). The encoding context (age range, per-movie average-age
norms, genre/decade index maps) is rebuilt fresh from the live user roster
every time the model is (re)trained, and reused as-is for every prediction
against that model — mixing a stale context with a freshly trained model
would put vectors on the wrong numeric scale.

**Training.** For every mock user with watch history, the app pairs their
vector with the vector of *every* movie in the local catalog, labeling each
pair `1` if they watched it and `0` otherwise. A `tf.sequential()` model
(dense layers 128 → 64 → 32 → 1, ReLU hidden / sigmoid output,
`binaryCrossentropy` loss, Adam optimizer at learning rate 0.01, 100 epochs)
trains on these pairs, reporting loss/accuracy per epoch back to the UI via
`postMessage`.

**Recommending.** For the selected user, the app pairs their vector with
every catalog movie, runs a batch `model.predict`, and sorts by predicted
score.

**Where it runs.** All of the above — encoding, training, prediction — runs
inside `src/worker/recommender.worker.ts`, a dedicated Web Worker. The main
thread only ever sends/receives typed messages (see
`src/types/workerMessages.ts`), so a full training run never blocks
scrolling, clicking, or navigation.

**Persistence.** User profiles and watch history live in `localStorage`.
The trained model itself is persisted via TensorFlow.js's `indexeddb://`
storage scheme (Web Workers can't reach `localStorage`, but they can reach
IndexedDB) — so a trained model survives a page reload without retraining.

## Known limitations

- **Class imbalance**: each user's training rows are mostly negatives (a
  user watches a handful of movies out of ~500), which is a known MVP
  limitation of this simple pairwise-training approach — acceptable for a
  portfolio demo, not tuned for production-grade accuracy.
- Recommendations are only as good as the mock users' watch histories; this
  isn't connected to real user behavior data.

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL. No environment variables or API keys are
needed — the app only reads the static JSON files in `public/data/` and
`data/`.

Other scripts:

```bash
npm run build     # production build (outputs to dist/)
npm run preview   # serve the production build locally
npm run test      # run the ml/* unit tests (vitest)
npm run lint      # oxlint
```

## Regenerating the movie catalog

The app never fetches the raw dataset at runtime. Instead, `public/data/movies.json`
and `public/data/catalogMeta.json` are generated once by a script from the
public [meilisearch movies dataset](https://github.com/meilisearch/datasets/tree/main/datasets/movies)
(~33k movies). To regenerate them (e.g. with a different sample size or seed):

```bash
npx tsx scripts/prepareMovies.ts --seed 42 --size 500 --minYear 1950
```

- `--seed` — PRNG seed for the deterministic sample (same seed + size always
  produces the same output).
- `--size` — how many movies to sample (clamped to 200–1000).
- `--minYear` — drop movies released before this year.
- `--refresh` — force re-downloading the raw dataset instead of using the
  cached copy at `scripts/.cache/movies-raw.json`.

The script filters out entries missing a title, overview, or genres, then
takes a seeded random sample and precomputes each movie's release year and
decade (so the app never does timestamp math at runtime). It also derives
the fixed genre vocabulary and decade buckets used to build encoding
vectors — **if you change `--size` or `--seed`, discard any previously
trained model** (the "Reset model" button on the Training screen, or just
clear IndexedDB) since the vector shape may have changed. The app also
detects this automatically and falls back gracefully instead of crashing.

## Regenerating the mock users

`data/seedUsers.json` holds 12 example users with distinct, genre-coherent
taste profiles (a horror fan, a rom-com fan, etc.), generated from real
movies in the sampled catalog. It must be regenerated **after** the catalog
(it samples real movie ids from `public/data/movies.json`):

```bash
npx tsx scripts/prepareSeedUsers.ts --seed 7
```

## Deploying

This is a static site with no server-side code. Build it and deploy the
`dist/` folder to Vercel, Netlify, or any static host — no environment
variables required.

```bash
npm run build
```

## Project structure

```
scripts/          one-time data preprocessing (movies + seed users)
public/data/      generated catalog, fetched by the app at runtime
data/             generated seed users, bundled at build time
src/types/        Movie, User, CatalogMeta, Worker message types
src/services/     localStorage wrapper, user CRUD, catalog fetch/filter
src/context/      global app state (catalog, users, current user)
src/ml/           encoding, dataset building, model, IndexedDB persistence
src/worker/       the Web Worker that runs ml/* + TensorFlow.js
src/hooks/        useMovieRecommender — worker lifecycle + message protocol
src/components/   UI building blocks, grouped by screen
src/pages/        Catalog, Profile, Training, Recommendations
tests/ml/         unit tests for the encoding/dataset logic (vitest)
```
