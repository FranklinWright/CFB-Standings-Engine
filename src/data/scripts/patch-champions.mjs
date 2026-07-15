#!/usr/bin/env node
/**
 * patch-champions.mjs
 * -------------------
 * Fills in `nationalChampion` and `conferenceChampions` for every year in a
 * history file you ALREADY built (no need to re-fetch all the games).
 *
 * It reuses helpers from build-history.mjs, so keep both files together.
 *
 * HOW IT DECIDES:
 *   nationalChampion    -> final AP poll #1 for that year (CFBD /rankings)
 *   conferenceChampions -> 1) if a conference has a CCG in YOUR file that year,
 *                             the CCG winner is the champion (accurate & modern)
 *                          2) otherwise, best conference record (CFBD /records);
 *                             ties become an array of co-champions and are flagged
 *
 * By default it ONLY fills fields that are currently empty (null / {}), so your
 * hand-curated 2014-2025 values are left alone. Set FORCE=1 to overwrite all.
 *
 * SETUP / RUN (PowerShell on Windows):
 *   $env:CFBD_KEY="your_key_here"
 *   node patch-champions.mjs
 *
 * (bash/mac/linux:  CFBD_KEY=your_key node patch-champions.mjs )
 *
 * OPTIONS (env vars):
 *   CFBD_KEY   (required)
 *   IN_FILE    file to read           default: ./history.generated.js
 *   OUT_FILE   file to write          default: ./history.champions.js
 *   FORCE      "1" = overwrite existing champion values  default: off
 *   POLL       preferred poll name    default: "AP Top 25"
 *
 * Never overwrites IN_FILE; writes OUT_FILE so you can diff/rename.
 */

import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import {
  buildNameToId,
  resolveId,
  serialize,
  normalizeName,
} from "./build-history.mjs";

const API_BASE = "https://api.collegefootballdata.com";
const KEY = process.env.CFBD_KEY;
const IN_FILE = process.env.IN_FILE || "./history.generated.js";
const OUT_FILE = process.env.OUT_FILE || "./history.champions.js";
const FORCE = (process.env.FORCE ?? "0") === "1";
const PREF_POLL = process.env.POLL || "AP Top 25";

// ------------------------------- helpers -----------------------------------

async function cfbd(path, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json" },
    });
    if (res.ok) return res.json();
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500 * (i + 1))); // back off
      continue;
    }
    const body = await res.text().catch(() => "");
    throw new Error(`CFBD ${path} -> ${res.status} ${res.statusText}\n${body.slice(0, 200)}`);
  }
  throw new Error(`CFBD ${path} -> rate limited after ${tries} tries`);
}

async function loadExisting(inFile) {
  const abs = resolve(inFile);
  const mod = await import(pathToFileURL(abs).href);
  const data = mod.historicalData || mod.default;
  if (!data) throw new Error(`${inFile} must export 'historicalData'`);
  return data;
}

// ------------------------- national champion (pure) -------------------------

/**
 * REST /rankings shape:
 *   [ { season, seasonType, week, polls: [ { poll, ranks: [ {rank, school, ...} ] } ] } ]
 * Take the LAST postseason week, prefer AP, else Coaches; never the CFP
 * committee poll (its #1 is the top seed, not the champion).
 */
export function pickChampionSchool(rankingWeeks, prefPoll = PREF_POLL) {
  if (!Array.isArray(rankingWeeks) || rankingWeeks.length === 0) return null;
  const latest = rankingWeeks.reduce((a, b) => ((b.week ?? 0) >= (a.week ?? 0) ? b : a));
  const polls = latest.polls || [];
  const isCFP = (n) => /playoff committee|cfp/i.test(n || "");
  const order = [
    (p) => normalizeName(p.poll) === normalizeName(prefPoll),
    (p) => /ap/i.test(p.poll) && !isCFP(p.poll),
    (p) => /coaches|afca|upi/i.test(p.poll) && !isCFP(p.poll),
  ];
  for (const match of order) {
    const poll = polls.find(match);
    const top = poll?.ranks?.find((r) => r.rank === 1);
    if (top?.school) return top.school;
  }
  return null;
}

// --------------------- conference champions (pure) --------------------------

/** ids of teams that WON a game typed "CCG" in a given year's schedules */
export function ccgWinnerIds(seasonObj) {
  const winners = new Set();
  for (const [teamId, games] of Object.entries(seasonObj.schedules || {})) {
    if (games.some((g) => g.type === "CCG" && g.result === "W")) winners.add(teamId);
  }
  return winners;
}

/**
 * records: REST /records array. Group by conference; prefer a CCG winner that
 * sits in that conference, else best conference win%. Ties -> array + flag.
 */
export function deriveConferenceChampions(records, ccgWinners, idOf, year, review) {
  const byConf = {};
  for (const r of records) {
    if (r.classification && normalizeName(r.classification) !== "fbs") continue;
    const conf = r.conference;
    if (!conf) continue;
    const cg = r.conferenceGames || r.conference_games || {};
    const w = cg.wins ?? 0, l = cg.losses ?? 0, t = cg.ties ?? 0;
    const games = w + l + t;
    const pct = games ? (w + t * 0.5) / games : -1;
    const id = idOf(r.team);
    (byConf[conf] ||= []).push({ id, team: r.team, pct, games });
  }

  const champs = {};
  for (const [conf, teams] of Object.entries(byConf)) {
    const ccg = teams.find((x) => x.id && ccgWinners.has(x.id));
    if (ccg) {
      champs[conf] = ccg.id || ccg.team;
      continue;
    }
    const played = teams.filter((x) => x.games > 0);
    if (!played.length) continue;
    const max = Math.max(...played.map((x) => x.pct));
    const leaders = played.filter((x) => Math.abs(x.pct - max) < 1e-9);
    if (leaders.length === 1) {
      champs[conf] = leaders[0].id || leaders[0].team;
    } else {
      champs[conf] = leaders.map((x) => x.id || x.team);
      review.push(`${year} ${conf}: co-champion guess -> ${leaders.map((x) => x.team).join(", ")}`);
    }
  }
  return champs;
}

// -------------------------------- main --------------------------------------

async function main() {
  if (!KEY) {
    console.error('ERROR: set CFBD_KEY. PowerShell: $env:CFBD_KEY="your_key"; node patch-champions.mjs');
    process.exit(1);
  }
  const existing = await loadExisting(IN_FILE);
  const { nameToId } = buildNameToId(existing);
  const idOf = (name) => resolveId(name, nameToId);
  console.log(`Loaded ${nameToId.size} name->id mappings from ${IN_FILE}`);

  const years = Object.keys(existing).map(Number).sort((a, b) => a - b);
  const review = [];
  const unmatched = new Set();
  let filledNC = 0, filledCC = 0;

  for (const year of years) {
    const season = existing[year];
    const needNC = FORCE || season.nationalChampion == null;
    const needCC =
      FORCE || !season.conferenceChampions || Object.keys(season.conferenceChampions).length === 0;
    if (!needNC && !needCC) continue;

    process.stdout.write(`${year}: `);

    if (needNC) {
      try {
        const ranks = await cfbd(`/rankings?year=${year}&seasonType=postseason`);
        const school = pickChampionSchool(ranks);
        if (school) {
          const id = idOf(school);
          if (id) {
            season.nationalChampion = id;
            filledNC++;
            process.stdout.write(`NC=${id} `);
          } else {
            unmatched.add(school);
            process.stdout.write(`NC=? (${school}) `);
          }
        } else {
          review.push(`${year}: no postseason AP/Coaches #1 found`);
          process.stdout.write(`NC=none `);
        }
      } catch (e) {
        review.push(`${year}: rankings error - ${e.message.split("\n")[0]}`);
        process.stdout.write(`NC=err `);
      }
    }

    if (needCC) {
      try {
        const records = await cfbd(`/records?year=${year}`);
        const cc = deriveConferenceChampions(records, ccgWinnerIds(season), idOf, year, review);
        if (Object.keys(cc).length) {
          season.conferenceChampions = cc;
          filledCC++;
          process.stdout.write(`CC=${Object.keys(cc).length}confs `);
        } else {
          process.stdout.write(`CC=none `);
        }
      } catch (e) {
        review.push(`${year}: records error - ${e.message.split("\n")[0]}`);
        process.stdout.write(`CC=err `);
      }
    }
    process.stdout.write("\n");
  }

  await writeFile(OUT_FILE, serialize(existing), "utf8");
  console.log(`\nWrote ${OUT_FILE}`);
  console.log(`Filled national champions for ${filledNC} year(s), conferences for ${filledCC} year(s).`);

  if (unmatched.size) {
    console.log(`\n=== ${unmatched.size} champion school(s) that didn't map to an id ===`);
    console.log("Add these to API_NAME_ALIASES in build-history.mjs (CFBD name -> your file's name):");
    [...unmatched].sort().forEach((n) => console.log(`   "${n}": "",`));
  }
  if (review.length) {
    console.log(`\n=== ${review.length} item(s) to review (co-champs / missing data) ===`);
    review.slice(0, 80).forEach((r) => console.log("   " + r));
    if (review.length > 80) console.log(`   ...and ${review.length - 80} more`);
  }
  console.log(
    "\nNOTE: 'national champion' = final AP #1. Split-title years (e.g. 1990, 1991, 1997, 2003)\n" +
      "and pre-1965 pre-bowl polls may differ from other selectors — verify those if it matters."
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((e) => {
    console.error("\nFAILED:", e.message);
    process.exit(1);
  });
}
