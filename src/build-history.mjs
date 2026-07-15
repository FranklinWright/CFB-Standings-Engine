#!/usr/bin/env node
/**
 * build-history.mjs
 * ------------------
 * Fetches real college-football results from the free CollegeFootballData.com
 * (CFBD) API and writes a history.js file in the SAME shape as your existing one:
 *
 *   export const historicalData = {
 *     2025: {
 *       year: 2025,
 *       nationalChampion: "ind",
 *       conferenceChampions: { ... },
 *       schedules: {
 *         "af": [ { opponentId, opponentName, result, ourScore, theirScore, type, bowlName? }, ... ],
 *         ...
 *       }
 *     },
 *     ...
 *   }
 *
 * WHY IT WORKS WITHOUT YOU HAND-MAPPING 250 TEAM IDS:
 * Your current history.js already stores, for every game, both `opponentId`
 * (your short id) and `opponentName` (the human name). This script imports your
 * existing file and derives a name -> id map from it. So it reuses YOUR ids.
 *
 * ---------------------------------------------------------------------------
 * SETUP (one time):
 *   1. Get a free API key: https://collegefootballdata.com/key
 *   2. Put this file next to your existing history.js
 *   3. Node 18+ required (uses built-in fetch). Check: node --version
 *
 * RUN:
 *   CFBD_KEY=your_key_here node build-history.mjs
 *
 * OPTIONS (env vars):
 *   CFBD_KEY      (required) your API key
 *   YEARS         e.g. "2014-2025" or "2019,2020,2021"   default: 2014-2025
 *   IN_FILE       path to your current history.js         default: ./history.js
 *   OUT_FILE      where to write the result               default: ./history.generated.js
 *   PRESERVE_META "1" to copy nationalChampion + conferenceChampions
 *                 from your existing file for years it has them   default: 1
 *
 * The script NEVER overwrites your input file. It writes OUT_FILE so you can diff.
 * ---------------------------------------------------------------------------
 */

import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

// ----------------------------- config --------------------------------------

const API_BASE = "https://api.collegefootballdata.com";
const KEY = process.env.CFBD_KEY;

function parseYears(spec) {
  if (!spec) return range(1960, 1979);
  if (spec.includes("-")) {
    const [a, b] = spec.split("-").map((n) => parseInt(n.trim(), 10));
    return range(Math.min(a, b), Math.max(a, b));
  }
  return spec.split(",").map((n) => parseInt(n.trim(), 10)).filter(Boolean);
}
function range(a, b) {
  const out = [];
  for (let y = a; y <= b; y++) out.push(y);
  return out;
}
const YEARS = parseYears(process.env.YEARS);

// ------------------- build name -> id map from your file --------------------

/**
 * Some CFBD "school" strings differ from the names in your file. Map CFBD's
 * spelling to YOUR opponentName spelling here. If the script reports an
 * "UNMATCHED" team at the end, add an entry: "CFBD name": "Your name".
 * (Left side = exactly what the API returns; right side = what your file calls it.)
 */
const API_NAME_ALIASES = {
  "Appalachian State": "App State",
  "Louisiana Monroe": "UL Monroe",
  "UL Monroe": "UL Monroe",
  "Mississippi": "Ole Miss",
  "Ole Miss": "Ole Miss",
  "UMass": "Massachusetts",
  "Connecticut": "UConn",
  "Southern Mississippi": "Southern Miss",
  "Sam Houston State": "Sam Houston",
  "San Jose State": "San José State",
  "Hawaii": "Hawai'i",
  "Louisiana": "Louisiana",
  "UT San Antonio": "UTSA",
  "Florida International": "Florida International",
};

function normalizeName(s) {
  return String(s)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function loadExisting(inFile) {
  const abs = resolve(inFile);
  const mod = await import(pathToFileURL(abs).href);
  const data = mod.historicalData || mod.default;
  if (!data) throw new Error(`${inFile} must export 'historicalData'`);
  return data;
}

function buildNameToId(existing) {
  const nameToId = new Map(); // normalized name -> id
  const idToName = new Map(); // id -> display name (first seen)
  for (const yr of Object.values(existing)) {
    for (const games of Object.values(yr.schedules || {})) {
      for (const g of games) {
        if (g.opponentId && g.opponentName) {
          const norm = normalizeName(g.opponentName);
          if (!nameToId.has(norm)) nameToId.set(norm, g.opponentId);
          if (!idToName.has(g.opponentId)) idToName.set(g.opponentId, g.opponentName);
        }
      }
    }
  }
  return { nameToId, idToName };
}

function resolveId(apiName, nameToId) {
  const direct = nameToId.get(normalizeName(apiName));
  if (direct) return direct;
  const aliased = API_NAME_ALIASES[apiName];
  if (aliased) {
    const viaAlias = nameToId.get(normalizeName(aliased));
    if (viaAlias) return viaAlias;
  }
  return null;
}

// ------------------------------ API calls -----------------------------------

async function cfbd(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`CFBD ${path} -> ${res.status} ${res.statusText}\n${body.slice(0, 300)}`);
  }
  return res.json();
}

// Which teams count as FBS in a given year (so top-level keys match your file:
// FBS teams get a schedule; everyone else only appears as an opponent).
async function fetchFbsTeamNames(year) {
  const teams = await cfbd(`/teams/fbs?year=${year}`);
  return new Set(teams.map((t) => normalizeName(t.school)));
}

async function fetchGames(year) {
  const reg = await cfbd(`/games?year=${year}&seasonType=regular&classification=fbs`);
  const post = await cfbd(`/games?year=${year}&seasonType=postseason&classification=fbs`);
  return [...reg, ...post];
}

// ------------------------- game-type classification -------------------------
//
// The API does not hand you clean "CCG / Playoff Quarterfinal / Bowl" labels,
// so we infer them. Anything uncertain is collected in `reviewNotes` and
// printed at the end. Adjust the keyword lists if your labels differ.

const CONF_CHAMP_HINTS = [/championship/i];
const NATTY_HINTS = [/national championship/i, /cfp national/i];
const PLAYOFF_HINTS = {
  "Playoff First Round": [/first round/i, /1st round/i],
  "Playoff Quarterfinal": [/quarterfinal/i],
  "Playoff Semifinal": [/semifinal/i, /semi-final/i],
  "National Championship": NATTY_HINTS,
};

function classify(game, review) {
  const notes = (game.notes || "").trim();
  const seasonType = game.seasonType || game.season_type;

  if (seasonType === "postseason") {
    // playoff rounds / natty first
    for (const [label, pats] of Object.entries(PLAYOFF_HINTS)) {
      if (pats.some((re) => re.test(notes))) return { type: label };
    }
    // otherwise it's a bowl; keep the bowl name
    if (notes) return { type: "Bowl", bowlName: notes };
    review.push(`postseason game with no notes: ${game.awayTeam} @ ${game.homeTeam} (${game.season})`);
    return { type: "Bowl" };
  }

  // regular season: detect conference championship games.
  // Heuristic: neutral site + both same conference + very late week + notes says "Championship".
  const conf = game.homeConference || game.home_conference;
  const awayConf = game.awayConference || game.away_conference;
  const neutral = game.neutralSite ?? game.neutral_site;
  const looksTitle =
    CONF_CHAMP_HINTS.some((re) => re.test(notes)) ||
    (neutral && conf && conf === awayConf && (game.week ?? 0) >= 13);
  if (looksTitle) {
    if (!CONF_CHAMP_HINTS.some((re) => re.test(notes))) {
      review.push(`possible CCG (verify): ${game.awayTeam} @ ${game.homeTeam} wk${game.week} ${game.season}`);
    }
    return { type: "CCG" };
  }
  return { type: "Regular" };
}

// ------------------------------- transform ----------------------------------

function toResult(us, them) {
  if (us == null || them == null) return null; // unplayed/forfeit
  return us > them ? "W" : "L";
}

function buildSeason(year, games, fbsSet, nameToId, unmatched, review) {
  const schedules = {};
  const ensure = (id) => (schedules[id] ||= []);

  for (const g of games) {
    const home = g.homeTeam || g.home_team;
    const away = g.awayTeam || g.away_team;
    const homePts = g.homePoints ?? g.home_points;
    const awayPts = g.awayPoints ?? g.away_points;
    if (homePts == null && awayPts == null) continue; // not played yet

    const homeId = resolveId(home, nameToId);
    const awayId = resolveId(away, nameToId);
    if (!homeId) unmatched.add(home);
    if (!awayId) unmatched.add(away);

    const cls = classify(g, review);

    // Add the game to a team's schedule only if that team is FBS this year
    // (mirrors your file: non-FBS teams appear only as opponents).
    if (homeId && fbsSet.has(normalizeName(home))) {
      const game = {
        opponentId: awayId || slugFallback(away),
        opponentName: away,
        result: toResult(homePts, awayPts),
        ourScore: homePts,
        theirScore: awayPts,
        type: cls.type,
      };
      if (cls.bowlName) game.bowlName = cls.bowlName;
      ensure(homeId).push(game);
    }
    if (awayId && fbsSet.has(normalizeName(away))) {
      const game = {
        opponentId: homeId || slugFallback(home),
        opponentName: home,
        result: toResult(awayPts, homePts),
        ourScore: awayPts,
        theirScore: homePts,
        type: cls.type,
      };
      if (cls.bowlName) game.bowlName = cls.bowlName;
      ensure(awayId).push(game);
    }
  }
  return schedules;
}

// If a team truly isn't in your file yet, invent a stable slug so nothing breaks.
// These show up in the UNMATCHED report so you can rename them to your scheme.
function slugFallback(name) {
  return "x_" + normalizeName(name).replace(/[^a-z0-9]+/g, "");
}

// ------------------------------ serialize ------------------------------------
// Emit one game per line, matching your file's readable style.

function serializeGame(g) {
  const parts = [
    `opponentId: ${JSON.stringify(g.opponentId)}`,
    `opponentName: ${JSON.stringify(g.opponentName)}`,
    `result: ${JSON.stringify(g.result)}`,
    `ourScore: ${g.ourScore}`,
    `theirScore: ${g.theirScore}`,
    `type: ${JSON.stringify(g.type)}`,
  ];
  if (g.bowlName) parts.push(`bowlName: ${JSON.stringify(g.bowlName)}`);
  return `{ ${parts.join(", ")} }`;
}

function serialize(all) {
  const yearBlocks = Object.keys(all)
    .sort((a, b) => b - a) // newest first, like your file
    .map((year) => {
      const y = all[year];
      const schedBlocks = Object.entries(y.schedules)
        .map(([id, games]) => {
          const gs = games.map(serializeGame).join(", ");
          return `      ${JSON.stringify(id)}: [ ${gs} ]`;
        })
        .join(",\n");
      const cc = JSON.stringify(y.conferenceChampions ?? {}, null, 0);
      return (
        `  ${year}: {\n` +
        `    year: ${year},\n` +
        `    nationalChampion: ${JSON.stringify(y.nationalChampion ?? null)},\n` +
        `    conferenceChampions: ${cc},\n` +
        `    schedules: {\n${schedBlocks}\n    }\n` +
        `  }`
      );
    })
    .join(",\n");
  return `// Generated by build-history.mjs on ${new Date().toISOString()}\n// Source: CollegeFootballData.com API\n\nexport const historicalData = {\n${yearBlocks}\n};\n`;
}

// -------------------------------- main ---------------------------------------

async function main() {
  if (!KEY) {
    console.error("ERROR: set CFBD_KEY.  Get a free key at https://collegefootballdata.com/key");
    console.error("Example:  CFBD_KEY=xxxxx node build-history.mjs");
    process.exit(1);
  }
  const IN_FILE = process.env.IN_FILE || "./history.js";
  const OUT_FILE = process.env.OUT_FILE || "./history.generated.js";
  const PRESERVE_META = (process.env.PRESERVE_META ?? "1") !== "0";

  console.log(`Years: ${YEARS.join(", ")}`);
  const existing = await loadExisting(IN_FILE);
  const { nameToId } = buildNameToId(existing);
  console.log(`Loaded ${nameToId.size} team name->id mappings from ${IN_FILE}`);

  const all = {};
  const unmatched = new Set();
  const review = [];

  for (const year of YEARS) {
    process.stdout.write(`Fetching ${year}... `);
    const [games, fbsSet] = await Promise.all([fetchGames(year), fetchFbsTeamNames(year)]);
    const schedules = buildSeason(year, games, fbsSet, nameToId, unmatched, review);
    all[year] = {
      year,
      nationalChampion:
        PRESERVE_META && existing[year] ? existing[year].nationalChampion ?? null : null,
      conferenceChampions:
        PRESERVE_META && existing[year] ? existing[year].conferenceChampions ?? {} : {},
      schedules,
    };
    const teamCount = Object.keys(schedules).length;
    const gameCount = Object.values(schedules).reduce((n, a) => n + a.length, 0);
    console.log(`${teamCount} teams, ${gameCount} game-rows`);
  }

  await writeFile(OUT_FILE, serialize(all), "utf8");
  console.log(`\nWrote ${OUT_FILE}`);

  if (unmatched.size) {
    console.log(`\n=== ${unmatched.size} UNMATCHED team names (given a temporary x_ id) ===`);
    console.log("Add these to API_NAME_ALIASES (CFBD name -> your file's name), or add the team to your data:");
    [...unmatched].sort().forEach((n) => console.log(`   "${n}": "",`));
  }
  if (review.length) {
    console.log(`\n=== ${review.length} game-type guesses to eyeball ===`);
    review.slice(0, 60).forEach((r) => console.log("   " + r));
    if (review.length > 60) console.log(`   ...and ${review.length - 60} more`);
  }
  if (!unmatched.size && !review.length) {
    console.log("\nNo unmatched teams and no ambiguous game types. Nice.");
  }
}

// Only run when executed directly (so the pure helpers can be imported/tested).
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((e) => {
    console.error("\nFAILED:", e.message);
    process.exit(1);
  });
}

export { buildNameToId, resolveId, classify, serialize, buildSeason, normalizeName };
