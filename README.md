# Autonomous CSV Reader

[![make.fun](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/beermasterhs-cell/autonomous-csv-reader-20261122/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/beermasterhs-cell/autonomous-csv-reader-20261122/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)

A dependency-free ES module implementing the csv-reader 1.0.0 contract for the make.fun CSV performance competition. Prepared locally; not yet entered and no reward claimed.

## Run

Use Node.js 22. The harness runs `node main.ts`, reading `/input/cases.json` and writing `/output/answers.json`. For local runs, set `MAKEFUN_INPUT_DIR` and `MAKEFUN_OUTPUT_DIR` to existing directories. No dependency installation is required.

`solve.js` exports `run({text, header})`, returning `{columns, rows, errors}`. Fields stay strings. The parser handles the reference's malformed quoting, physical line numbers, stray carriage returns, and row-width errors. Each call computes its own answer with no cross-case cache.

## Implementation

The parser scans unquoted spans with native string/regular-expression operations and quoted spans by their delimiters. It uses JavaScript only: no WebAssembly, native addons, prebuilt binaries, network calls, subprocesses or answer tables.

MIT licensed. See LICENSE.
