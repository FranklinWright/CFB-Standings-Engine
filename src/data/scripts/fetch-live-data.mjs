#!/usr/bin/env node
/**
 * fetch-live-data.mjs
 * -------------------
 * Fetches two things from the CollegeFootballData.com (CFBD) API:
 *
 *   1. AP Poll rankings for the current 2026 season week
 *   2. Real game results for games that have already been played
 *
 * Then writes updated versions of:
 *   src/data/apPoll.js     — AP Poll rankings + history
 *   src/data/liveResults.js — gameId → winning teamId map (read-only in the UI)
 *
 * SETUP:
 *   1. Get a free API key at https://collegefootballdata.com/key
 *   2. Run: CFBD_KEY=your_key_here node src/data/scripts/fetch-live-data.mjs
 *
 * OPTIONS (env vars):
 *   CFBD_KEY   (required) your API key
 *   YEAR       season year, default: 2026
 *   WEEK       specific week to fetch, default: auto-detect latest completed week
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '../../..');

const API_BASE = 'https://api.collegefootballdata.com';
const KEY = process.env.CFBD_KEY;
const YEAR = parseInt(process.env.YEAR || '2026', 10);

if (!KEY) {
  console.error('\n  ERROR: CFBD_KEY environment variable is required.');
  console.error('  Get a free key at https://collegefootballdata.com/key');
  console.error('  Then run: CFBD_KEY=your_key node src/data/scripts/fetch-live-data.mjs\n');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${KEY}` };

async function cfbd(path) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`CFBD ${res.status}: ${url}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Load the app's teams so we can match CFBD school names to our short IDs
// ---------------------------------------------------------------------------
async function loadTeams() {
  const teamsPath = resolve(ROOT, 'src/data/teams.js');
  const { teams } = await import(pathToFileURL(teamsPath).href);
  return teams;
}

// Normalise a school name for fuzzy matching
function normalise(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Find the app team ID that best matches a CFBD school name
function matchTeamId(cfbdSchool, appTeams) {
  const target = normalise(cfbdSchool);

  // 1. Exact name match
  let match = appTeams.find(t => normalise(t.name) === target);
  if (match) return match.id;

  // 2. Common alias overrides — checked BEFORE fuzzy to prevent partial collisions
  //    e.g. "Florida International" must not fuzzy-match to "Florida" (UF)
  const aliases = {
    'ole miss': 'miss',
    'mississippi': 'miss',
    'pitt': 'pitt',
    'pittsburgh': 'pitt',
    'miami': 'miami',
    'miami (fl)': 'miami',
    'miami (oh)': 'miamoh',
    'notre dame': 'nd',
    'usc': 'usc',
    'southern california': 'usc',
    'ucf': 'ucf',
    'central florida': 'ucf',
    'uconn': 'uconn',
    'connecticut': 'uconn',
    'utsa': 'utsa',
    'texas san antonio': 'utsa',
    'utep': 'utep',
    'texas el paso': 'utep',
    'smu': 'smu',
    'southern methodist': 'smu',
    'lsu': 'lsu',
    'louisiana state': 'lsu',
    'tcu': 'tcu',
    'texas christian': 'tcu',
    'byu': 'byu',
    'brigham young': 'byu',
    'unlv': 'unlv',
    'nevada las vegas': 'unlv',
    'uab': 'uab',
    'alabama birmingham': 'uab',
    'fiu': 'fiu',
    'florida international': 'fiu',
    'app state': 'appst',
    'appalachian state': 'appst',
    'coastal carolina': 'coastal',
    'james madison': 'jmu',
    'san jose state': 'sjsu',
    'georgia southern': 'gasou',
    'middle tennessee': 'mtsu',
    'ohio': 'ohiou',
    'western michigan': 'wmich',
    'eastern michigan': 'emich',
    'central michigan': 'cmich',
    'northern illinois': 'niu',
    'ball state': 'ballst',
    'bowling green': 'bgsu',
    'kent state': 'kent',
    'buffalo': 'buff',
    'akron': 'akron',
    'miami ohio': 'miamoh',
    'western kentucky': 'wku',
    'marshall': 'marshall',
    'old dominion': 'odu',
    'south florida': 'usf',
    'temple': 'temple',
    'tulane': 'tulane',
    'tulsa': 'tulsa',
    'east carolina': 'ecu',
    'north texas': 'unt',
    'rice': 'rice',
    'utep': 'utep',
    'louisiana': 'ulaf',
    'louisiana lafayette': 'ulaf',
    'louisiana monroe': 'ulm',
    'ul monroe': 'ulm',
    'southern miss': 'usm',
    'southern mississippi': 'usm',
    'georgia state': 'gast',
    'texas state': 'txst',
    'south alabama': 'usouthal',
    'troy': 'troy',
    'arkansas state': 'arkst',
    'louisiana tech': 'latech',
    'sam houston state': 'shsu',
    'kennesaw state': 'kennesaw',
    'liberty': 'liberty',
    'new mexico state': 'nmsu',
    'jacksonville state': 'jsu',
    'florida atlantic': 'fau',
    'charlotte': 'charlotte',
    'north carolina at': 'ncat',
    'utah state': 'usu',
    'colorado state': 'colost',
    'new mexico': 'unm',
    'wyoming': 'wyo',
    'boise state': 'boise',
    'fresno state': 'fresno',
    'nevada': 'nevada',
    'hawaii': 'hawaii',
    'san diego state': 'sdsu',
    'air force': 'airforce',
    'colorado': 'colo',
    'washington state': 'wazzu',
    'oregon state': 'orest',
  };

  const aliasId = aliases[target];
  if (aliasId) {
    match = appTeams.find(t => t.id === aliasId);
    if (match) return match.id;
  }

  // 3. Fuzzy: team name contains the CFBD name or vice-versa (last resort)
  match = appTeams.find(t => {
    const n = normalise(t.name);
    return n.includes(target) || target.includes(n);
  });
  if (match) return match.id;

  return null;
}

// ---------------------------------------------------------------------------
// Fetch AP Poll
// ---------------------------------------------------------------------------
async function fetchAPPoll(week) {
  console.log(`  Fetching AP Poll rankings (week ${week ?? 'latest'})...`);
  const weekParam = week ? `&week=${week}` : '';
  const data = await cfbd(`/rankings?year=${YEAR}&seasonType=regular${weekParam}`);

  if (!data || data.length === 0) {
    // Try preseason
    const preData = await cfbd(`/rankings?year=${YEAR}&seasonType=postseason`);
    if (!preData || preData.length === 0) {
      console.warn('  No AP Poll data returned from CFBD API yet.');
      return null;
    }
    data.push(...preData);
  }

  // Get the most recent week available
  const latest = [...data].sort((a, b) => b.week - a.week)[0];
  const apEntry = latest?.polls?.find(p => p.poll === 'AP Top 25');
  if (!apEntry) {
    console.warn('  AP Top 25 poll not found in response.');
    return null;
  }

  return {
    week: latest.week,
    seasonType: latest.seasonType,
    ranks: apEntry.ranks,
  };
}

// ---------------------------------------------------------------------------
// Fetch game results
// ---------------------------------------------------------------------------
async function fetchGameResults() {
  console.log(`  Fetching ${YEAR} game results...`);
  const games = await cfbd(`/games?year=${YEAR}&seasonType=regular`);
  return games.filter(g => g.completed && g.homePoints != null && g.awayPoints != null);
}

// ---------------------------------------------------------------------------
// Load existing apPoll.js so we can preserve history
// ---------------------------------------------------------------------------
async function loadExistingPoll() {
  try {
    const pollPath = resolve(ROOT, 'src/data/apPoll.js');
    const { apPoll } = await import(pathToFileURL(pollPath).href + `?bust=${Date.now()}`);
    return apPoll;
  } catch {
    return { history: {} };
  }
}

// ---------------------------------------------------------------------------
// Match played games to masterSchedule IDs
// ---------------------------------------------------------------------------
// Parse "Oct 10" style date strings into a Date for 2026 season
function parseGameDate(dateStr) {
  const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  const [mon, day] = (dateStr || '').split(' ');
  if (!Object.prototype.hasOwnProperty.call(months, mon)) return null;
  return new Date(YEAR, months[mon], parseInt(day, 10));
}

async function buildLiveResults(playedGames, appTeams) {
  const schedulePath = resolve(ROOT, 'src/data/teams.js');
  const { masterSchedule } = await import(pathToFileURL(schedulePath).href);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const liveResults = {};
  const liveScores = {};
  const liveLineScores = {};
  const gamesMeta = {};
  const cfbdIdMap = {};
  let matched = 0;
  let unmatched = 0;

  for (const game of playedGames) {
    const homeId = matchTeamId(game.homeTeam, appTeams);
    const awayId = matchTeamId(game.awayTeam, appTeams);

    if (!homeId || !awayId) {
      unmatched++;
      continue;
    }

    // Try matching with same home/away orientation first
    let schedGame = masterSchedule.find(s => s.home === homeId && s.away === awayId);
    let flipped = false;

    if (!schedGame) {
      schedGame = masterSchedule.find(s => s.home === awayId && s.away === homeId);
      flipped = true;
    }

    if (!schedGame) {
      unmatched++;
      continue;
    }

    // Skip games whose date hasn't passed yet (CFBD sometimes marks future games as complete)
    const gameDate = parseGameDate(schedGame.date);
    if (gameDate && gameDate >= today) {
      unmatched++;
      continue;
    }

    const winnerId = game.homePoints > game.awayPoints ? homeId : awayId;
    liveResults[schedGame.id] = winnerId;
    cfbdIdMap[game.id] = schedGame.id;

    // Store scores relative to masterSchedule orientation (home/away)
    liveScores[schedGame.id] = flipped
      ? { home: game.awayPoints, away: game.homePoints }
      : { home: game.homePoints, away: game.awayPoints };

    // Quarter-by-quarter line scores
    liveLineScores[schedGame.id] = flipped
      ? { home: game.awayLineScores || [], away: game.homeLineScores || [] }
      : { home: game.homeLineScores || [], away: game.awayLineScores || [] };

    // Venue / attendance metadata
    gamesMeta[schedGame.id] = {
      venue: game.venue || null,
      attendance: game.attendance || null,
      neutralSite: game.neutralSite || false,
    };

    matched++;
  }

  console.log(`  Game results: ${matched} matched, ${unmatched} unmatched/skipped`);
  return { liveResults, liveScores, liveLineScores, gamesMeta, cfbdIdMap };
}

// ---------------------------------------------------------------------------
// Write output files
// ---------------------------------------------------------------------------
function jsString(val) {
  return JSON.stringify(val, null, 2);
}

async function writePollFile(pollData, existingPoll) {
  const history = { ...(existingPoll.history || {}) };

  // Add current week to history
  if (pollData) {
    history[pollData.week] = pollData.ranks;
  }

  const rankings = pollData?.ranks.map(r => ({
    rank: r.rank,
    school: r.school,
    conference: r.conference,
    firstPlaceVotes: r.firstPlaceVotes ?? 0,
    points: r.points ?? 0,
    previousRank: r.previousRank ?? null,
  })) ?? [];

  const output = `// AP Poll rankings — auto-generated by fetch-live-data.mjs
// Last updated: ${new Date().toISOString()}
// Do not edit by hand; re-run the script to refresh.

export const apPoll = ${jsString({
    lastUpdated: new Date().toISOString(),
    currentWeek: pollData ? (pollData.seasonType === 'regular' ? pollData.week : 'Preseason') : null,
    isLoaded: rankings.length > 0,
    rankings,
    history,
  })};
`;

  await writeFile(resolve(ROOT, 'src/data/apPoll.js'), output, 'utf8');
  console.log(`  Wrote apPoll.js (${rankings.length} teams ranked)`);
}

async function writeLiveResultsFile(liveResults, liveScores, liveLineScores, gamesMeta) {
  const count = Object.keys(liveResults).length;
  const output = `// Real 2026 game results — auto-generated by fetch-live-data.mjs
// Last updated: ${new Date().toISOString()}
// liveResults:    gameId → winning teamId (read-only; overrides user picks)
// liveScores:     gameId → { home, away } final point totals
// liveLineScores: gameId → { home: [Q1,Q2,Q3,Q4,...], away: [...] }
// gamesMeta:      gameId → { venue, attendance, neutralSite }

export const liveResults = ${jsString(liveResults)};

export const liveScores = ${jsString(liveScores)};

export const liveLineScores = ${jsString(liveLineScores)};

export const gamesMeta = ${jsString(gamesMeta)};
`;

  await writeFile(resolve(ROOT, 'src/data/liveResults.js'), output, 'utf8');
  console.log(`  Wrote liveResults.js (${count} games locked)`);
}

async function fetchGameTeamStats() {
  console.log('  Fetching game team stats (week by week)...');
  const all = [];
  for (let w = 1; w <= 15; w++) {
    try {
      const data = await cfbd(`/games/teams?year=${YEAR}&week=${w}`);
      if (data && data.length) {
        all.push(...data);
        process.stdout.write(`    Week ${w}: ${data.length} entries\n`);
      } else {
        break; // no data = season hasn't reached this week yet
      }
    } catch (_) {
      break;
    }
  }
  return all;
}

async function fetchPlayerStats() {
  console.log('  Fetching player season stats...');
  try {
    const data = await cfbd(`/stats/player/season?year=${YEAR}&seasonType=regular`);
    return data || [];
  } catch (e) {
    console.warn('  Could not fetch player stats:', e.message);
    return [];
  }
}

async function fetchTeamSeasonStats() {
  console.log('  Fetching team season stats...');
  try {
    const data = await cfbd(`/stats/season?year=${YEAR}`);
    return data || [];
  } catch (e) {
    console.warn('  Could not fetch team season stats:', e.message);
    return [];
  }
}

async function fetchCoaches() {
  console.log('  Fetching coaches...');
  try {
    const data = await cfbd(`/coaches?year=${YEAR}`);
    return data || [];
  } catch (e) {
    console.warn('  Could not fetch coaches:', e.message);
    return [];
  }
}

function buildGameStats(gameTeamData, cfbdIdMap) {
  const gameStats = {};
  // CFBD /games/teams returns { id, teams: [{teamId, team, homeAway, points, stats}] }
  for (const entry of gameTeamData) {
    const ourId = cfbdIdMap[entry.id];
    if (!ourId) continue;
    if (!gameStats[ourId]) gameStats[ourId] = {};

    for (const teamEntry of (entry.teams || [])) {
      const side = teamEntry.homeAway === 'home' ? 'home' : 'away';
      const sm = {};
      for (const s of (teamEntry.stats || [])) sm[s.category] = s.stat;

      let passCompletions = 0, passAttempts = 0;
      if (sm.completionAttempts) {
        const [c, a] = sm.completionAttempts.split('-');
        passCompletions = parseInt(c) || 0; passAttempts = parseInt(a) || 0;
      }
      let thirdDownConversions = 0, thirdDowns = 0;
      if (sm.thirdDownEff) {
        const [c, a] = sm.thirdDownEff.split('-');
        thirdDownConversions = parseInt(c) || 0; thirdDowns = parseInt(a) || 0;
      }
      let fourthDownConversions = 0, fourthDowns = 0;
      if (sm.fourthDownEff) {
        const [c, a] = sm.fourthDownEff.split('-');
        fourthDownConversions = parseInt(c) || 0; fourthDowns = parseInt(a) || 0;
      }
      let penalties = 0, penaltyYards = 0;
      if (sm.totalPenaltiesYards) {
        const [p, y] = sm.totalPenaltiesYards.split('-');
        penalties = parseInt(p) || 0; penaltyYards = parseInt(y) || 0;
      }

      gameStats[ourId][side] = {
        points: teamEntry.points || 0,
        totalYards: parseInt(sm.totalYards) || 0,
        rushingYards: parseInt(sm.rushingYards) || 0,
        rushingAttempts: parseInt(sm.rushingAttempts) || 0,
        yardsPerRushAttempt: parseFloat(sm.yardsPerRushAttempt) || 0,
        rushingTDs: parseInt(sm.rushingTDs) || 0,
        netPassingYards: parseInt(sm.netPassingYards) || 0,
        passCompletions,
        passAttempts,
        yardsPerPass: parseFloat(sm.yardsPerPass) || 0,
        passingTDs: parseInt(sm.passingTDs) || 0,
        interceptions: parseInt(sm.interceptions) || 0,
        fumblesLost: parseInt(sm.fumblesLost) || 0,
        turnovers: parseInt(sm.turnovers) || 0,
        penalties,
        penaltyYards,
        firstDowns: parseInt(sm.firstDowns) || 0,
        thirdDownConversions,
        thirdDowns,
        fourthDownConversions,
        fourthDowns,
        possessionTime: sm.possessionTime || null,
        sacks: parseInt(sm.sacks) || 0,
        tacklesForLoss: parseFloat(sm.tacklesForLoss) || 0,
        qbHurries: parseInt(sm.qbHurries) || 0,
        passesDeflected: parseInt(sm.passesDeflected) || 0,
        tackles: parseInt(sm.tackles) || 0,
        passesIntercepted: parseInt(sm.passesIntercepted) || 0,
        interceptionTDs: parseInt(sm.interceptionTDs) || 0,
      };
    }
  }
  return gameStats;
}

function buildCoaches(coachData, appTeams) {
  const coaches = {};
  for (const coach of coachData) {
    const season = (coach.seasons || []).find(s => s.year === YEAR);
    if (!season) continue;
    const id = matchTeamId(season.school, appTeams);
    if (!id) continue;
    coaches[id] = {
      headCoach: `${coach.firstName} ${coach.lastName}`,
    };
  }
  return coaches;
}

async function writeGameStatsFile(gameStats) {
  const count = Object.keys(gameStats).length;
  const output = `// Game team stats — auto-generated by fetch-live-data.mjs
// Last updated: ${new Date().toISOString()}
export const gameStats = ${JSON.stringify(gameStats, null, 2)};
`;
  await writeFile(resolve(ROOT, 'src/data/gameStats.js'), output, 'utf8');
  console.log(`  Wrote gameStats.js (${count} games)`);
}

async function writeCoachesFile(coaches) {
  const count = Object.keys(coaches).length;
  const output = `// Head coaches — auto-generated by fetch-live-data.mjs
// Last updated: ${new Date().toISOString()}
export const coaches = ${JSON.stringify(coaches, null, 2)};
`;
  await writeFile(resolve(ROOT, 'src/data/coaches.js'), output, 'utf8');
  console.log(`  Wrote coaches.js (${count} teams)`);
}

function buildPlayerStats(rawStats, appTeams) {
  // Group each stat row by (teamId, playerId, category) → statType: value
  const byKey = {};
  for (const entry of rawStats) {
    const teamId = matchTeamId(entry.team, appTeams);
    if (!teamId) continue;
    const key = `${teamId}||${entry.playerId || entry.player}||${entry.category}`;
    if (!byKey[key]) byKey[key] = { teamId, player: entry.player, category: entry.category, s: {} };
    byKey[key].s[entry.statType] = entry.stat;
  }

  const out = {};
  for (const { teamId, player, category, s } of Object.values(byKey)) {
    if (!out[teamId]) out[teamId] = {};
    if (!out[teamId][category]) out[teamId][category] = [];
    out[teamId][category].push({ player, ...s });
  }

  // Sort by most meaningful stat per category
  for (const teamId of Object.keys(out)) {
    const t = out[teamId];
    if (t.passing) t.passing.sort((a, b) => (parseFloat(b.YDS) || 0) - (parseFloat(a.YDS) || 0));
    if (t.rushing) t.rushing.sort((a, b) => (parseFloat(b.YDS) || 0) - (parseFloat(a.YDS) || 0));
    if (t.receiving) t.receiving.sort((a, b) => (parseFloat(b.YDS) || 0) - (parseFloat(a.YDS) || 0));
    if (t.defensive) t.defensive.sort((a, b) => (parseFloat(b.TOT) || 0) - (parseFloat(a.TOT) || 0));
    if (t.kicking) t.kicking.sort((a, b) => (parseFloat(b.PTS) || 0) - (parseFloat(a.PTS) || 0));
  }
  return out;
}

function buildTeamSeasonStats(rawStats, appTeams) {
  const out = {};
  for (const entry of rawStats) {
    const teamId = matchTeamId(entry.team, appTeams);
    if (!teamId) continue;
    if (!out[teamId]) out[teamId] = {};
    out[teamId][entry.statName] = entry.statValue;
  }
  return out;
}

async function writePlayerStatsFile(playerStats) {
  const count = Object.keys(playerStats).length;
  const output = `// Player season stats — auto-generated by fetch-live-data.mjs
// Last updated: ${new Date().toISOString()}
export const playerStats = ${JSON.stringify(playerStats, null, 2)};
`;
  await writeFile(resolve(ROOT, 'src/data/playerStats.js'), output, 'utf8');
  console.log(`  Wrote playerStats.js (${count} teams)`);
}

async function writeTeamSeasonStatsFile(teamSeasonStats) {
  const count = Object.keys(teamSeasonStats).length;
  const output = `// Team season stats — auto-generated by fetch-live-data.mjs
// Last updated: ${new Date().toISOString()}
export const teamSeasonStats = ${JSON.stringify(teamSeasonStats, null, 2)};
`;
  await writeFile(resolve(ROOT, 'src/data/teamSeasonStats.js'), output, 'utf8');
  console.log(`  Wrote teamSeasonStats.js (${count} teams)`);
}

async function fetchDrives() {
  console.log('  Fetching drive data (week by week)...');
  const all = [];
  for (let w = 1; w <= 15; w++) {
    try {
      const data = await cfbd(`/drives?year=${YEAR}&seasonType=regular&week=${w}`);
      if (data && data.length) {
        all.push(...data);
        process.stdout.write(`    Week ${w}: ${data.length} drives\n`);
      } else {
        break;
      }
    } catch (_) {
      break;
    }
  }
  return all;
}

function buildGameDrives(drivesData, cfbdIdMap, appTeams) {
  const byGame = {};
  const scoringResults = new Set(['TD','FG','SF','INT TD','FUMBLE RETURN TD','FUMBLE TD','PUNT TD','MISSED FG TD']);
  for (const drive of drivesData) {
    if (!drive.scoring && !scoringResults.has(drive.driveResult)) continue;
    const ourId = cfbdIdMap[drive.gameId];
    if (!ourId) continue;
    const elapsed = drive.elapsed
      ? `${drive.elapsed.minutes}:${String(drive.elapsed.seconds).padStart(2,'0')}`
      : null;
    const entry = {
      period: drive.endPeriod ?? drive.startPeriod,
      driveNum: drive.driveNumber,
      isHome: drive.isHomeOffense,
      result: drive.driveResult,
      yards: drive.yards,
      plays: drive.plays,
      elapsed,
      endOffenseScore: drive.endOffenseScore ?? 0,
      endDefenseScore: drive.endDefenseScore ?? 0,
    };
    if (!byGame[ourId]) byGame[ourId] = [];
    byGame[ourId].push(entry);
  }
  for (const id of Object.keys(byGame)) {
    byGame[id].sort((a, b) => a.period - b.period || a.driveNum - b.driveNum);
  }
  return byGame;
}

async function writeGameDrivesFile(gameDrives) {
  const count = Object.keys(gameDrives).length;
  const output = `// Game drive/scoring timeline — auto-generated by fetch-live-data.mjs
// Last updated: ${new Date().toISOString()}
export const gameDrives = ${JSON.stringify(gameDrives, null, 2)};
`;
  await writeFile(resolve(ROOT, 'src/data/gameDrives.js'), output, 'utf8');
  console.log(`  Wrote gameDrives.js (${count} games with drive data)`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nCFB Engine — fetching live data for ${YEAR} season...\n`);

  const appTeams = await loadTeams();
  console.log(`  Loaded ${appTeams.length} teams from teams.js`);

  const existingPoll = await loadExistingPoll();

  const week = process.env.WEEK ? parseInt(process.env.WEEK, 10) : undefined;

  const [pollData, playedGames] = await Promise.all([
    fetchAPPoll(week),
    fetchGameResults(),
  ]);

  console.log(`  Found ${playedGames.length} completed games`);

  const { liveResults, liveScores, liveLineScores, gamesMeta, cfbdIdMap } = await buildLiveResults(playedGames, appTeams);

  await writePollFile(pollData, existingPoll);
  await writeLiveResultsFile(liveResults, liveScores, liveLineScores, gamesMeta);

  const [gameTeamData, coachData, playerStatsRaw, teamStatsRaw, drivesData] = await Promise.all([
    fetchGameTeamStats(),
    fetchCoaches(),
    fetchPlayerStats(),
    fetchTeamSeasonStats(),
    fetchDrives(),
  ]);
  const builtGameStats = buildGameStats(gameTeamData, cfbdIdMap);
  const builtCoaches = buildCoaches(coachData, appTeams);
  const builtPlayerStats = buildPlayerStats(playerStatsRaw, appTeams);
  const builtTeamSeasonStats = buildTeamSeasonStats(teamStatsRaw, appTeams);
  await writeGameStatsFile(builtGameStats);
  await writeCoachesFile(builtCoaches);
  await writePlayerStatsFile(builtPlayerStats);
  await writeTeamSeasonStatsFile(builtTeamSeasonStats);
  const builtGameDrives = buildGameDrives(drivesData, cfbdIdMap, appTeams);
  await writeGameDrivesFile(builtGameDrives);

  console.log('\n  Done! Restart your dev server to pick up the new data.\n');
}

main().catch(err => {
  console.error('\n  Fatal error:', err.message);
  process.exit(1);
});
