# Performance Testing — k6 + Docker + GitHub Actions + BlazeMeter

A self-contained performance-testing portfolio project. It simulates a realistic 3-endpoint commerce
BFF (GET/GET/POST) behind a local mock server, then load/stress/spike/soak-tests it with k6 — locally,
in a Docker container, through GitHub Actions CI, and through BlazeMeter's cloud-based execution.

All mock data is 100% fabricated — no real company names, URLs, or internal identifiers appear anywhere
in this repo.

---

## Why this project exists

Most "performance testing" portfolio pieces stop at "I ran one k6 script." This one goes further:

- **Two GET endpoints with deliberately different payload weights**, to produce a real, measurable
  comparison (`product-catalog`'s heavier ~16KB response is consistently ~4x slower at p95 than
  `order-summary`'s lighter one — a genuine finding, not an assumed one).
- **A POST endpoint** (`update-order`), since real performance testing covers writes, not just reads.
- **Positive AND negative scenarios**, mixed realistically — because real production traffic is never
  100% happy-path, and error responses need their own speed/impact validation.
- **All four standard load-testing shapes** — load, stress (1x→2x→3x ramp), spike (sudden burst), and
  soak (sustained long-duration run) — not just one flat script.
- **The same scripts run in three different environments** — local, Dockerized, and via BlazeMeter's
  real cloud infrastructure — specifically to show the measurable gap between "is my code fast" and
  "is the full real-world network path fast," rather than just asserting the difference exists.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         k6 (the test tool)                       │
│   load.js · negative.js · stress.js · spike.js · soak.js         │
└──────────────────────────────┬────────────────────────────────── ┘
                                │  HTTP requests
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Express mock server (server.js)                 │
│                                                                   │
│   GET  /order-summary/:orderId               (lighter payload)   │
│   GET  /product-catalog/:productFamily       (heavier payload)   │
│   POST /update-order/:orderId                                    │
│                                                                   │
│   Special ids (quote-404 / quote-400 / quote-500) trigger         │
│   the matching error fixture — used for negative scenarios        │
└─────────────────────────────────────────────────────────────────┘
```

**Where this runs:**

| Environment | What it proves |
|---|---|
| Local (`npm start` + `k6 run`) | Fast feedback, measures the application's own processing speed |
| Docker (`docker build` + `docker run`) | The exact same server, packaged to run identically anywhere |
| GitHub Actions (`.github/workflows/performance-tests.yml`) | Automated: builds the image, starts it, runs the load tests, on every push |
| BlazeMeter (cloud, via an `ngrok` tunnel to the local server) | Real network-path latency — the same script that averaged ~4-6ms locally averaged ~70ms end-to-end through real cloud infrastructure |

---

## Endpoints under test

| Endpoint | Method | Payload | Purpose |
|---|---|---|---|
| `/order-summary/:orderId` | GET | Lighter (~1.5KB) | Baseline — order summary |
| `/product-catalog/:productFamily` | GET | Heavier (~16KB) | Catalog listing — nested promotions/allowances/addOns |
| `/update-order/:orderId` | POST | — | Write path — the one method type GET-only tests miss |

Any id other than `quote-404` / `quote-400` / `quote-500` returns a 200 success; those three ids
deliberately trigger the matching error status, for negative-scenario testing.

---

## Test scripts — what each one proves

| Script | Shape | What it measures |
|---|---|---|
| `*-load.js` | Flat VUs, fixed duration | Baseline performance under expected traffic |
| `*-negative.js` | Flat VUs, randomized mix of valid + error ids | Are error responses fast? Does the error-rate threshold actually catch problems? |
| `*-stress.js` | Ramping stages (1x → 2x → 3x → 0) | Does performance degrade as concurrent load climbs? |
| `*-spike.js` | Sudden sharp burst, hold, drop | Can the system absorb a sudden traffic shock? |
| `*-soak.js` | Flat VUs, long duration (3+ min) | Does performance degrade gradually over time (the thing a short test can never catch)? |

Every script declares real k6 thresholds (`p(95)`, `p(99)`, error rate) — automated pass/fail gates,
not just descriptive numbers.

---

## Running it locally

```bash
npm install
npm start                               # starts the mock server on :3000

# in a second terminal:
k6 run k6-scripts/order-summary-load.js
k6 run k6-scripts/product-catalog-load.js
k6 run k6-scripts/update-order-load.js
# ...negative / stress / spike / soak variants follow the same pattern
```

## Running it in Docker

```bash
docker build -t performance-testing-mock .
docker run -p 3000:3000 performance-testing-mock
```

The Docker image packages **only the mock server** — k6 deliberately stays out of it. The system being
tested and the tool doing the testing are kept as two separate concerns; see `.github/workflows/performance-tests.yml`
for how the two are orchestrated together in CI.

## CI/CD

`.github/workflows/performance-tests.yml` runs on every push: provisions a fresh Ubuntu runner, builds
and starts the Docker image, installs k6, then runs one load test per endpoint against the live
container — all automated, no manual steps.

## Cloud execution via BlazeMeter

The same k6 scripts were also run through BlazeMeter (wrapped in Taurus YAML configs, since BlazeMeter
doesn't execute k6 directly) against the local mock server exposed temporarily through an `ngrok`
tunnel. This surfaced a genuine finding the local runs couldn't: real network-path latency added roughly
60-70ms per request that pure localhost testing never captures — the actual difference between "my code
is fast" and "the full path a real user takes is fast."

---

## Project structure

```
performance-testing/
├── server.js                          # the mock server (Express)
├── Dockerfile                         # packages the server only
├── .dockerignore
├── .github/workflows/
│   └── performance-tests.yml          # CI: build → run → k6 load tests
├── mock-data/
│   ├── order-summary.json
│   ├── product-catalog.json
│   ├── update-order.json
│   └── errors/                        # not-found / bad-request / server-error
└── k6-scripts/
    ├── order-summary-{load,negative,stress,soak}.js
    ├── product-catalog-{load,negative,stress,spike}.js
    ├── update-order-load.js
    └── blazemeter/                    # Taurus-wrapped copies for cloud execution
```

---

## Tech stack

**k6** (Grafana) — load generation and metrics · **Express** — mock server · **Docker** — packaging ·
**GitHub Actions** — CI orchestration · **BlazeMeter + Taurus** — cloud-based execution · **ngrok** —
temporary public tunnel for cloud testing against a local target
