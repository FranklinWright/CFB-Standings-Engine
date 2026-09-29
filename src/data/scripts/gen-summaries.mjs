#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '../../..');

const { masterSchedule, teams } = await import(pathToFileURL(resolve(ROOT, 'src/data/teams.js')).href);
const { liveScores, liveResults, liveLineScores } = await import(pathToFileURL(resolve(ROOT, 'src/data/liveResults.js')).href);
const { apPoll } = await import(pathToFileURL(resolve(ROOT, 'src/data/apPoll.js')).href);

const AP_ALIASES = {
  'ole miss': 'miss', 'mississippi': 'miss',
  'southern california': 'usc', 'louisiana state': 'lsu',
  'brigham young': 'byu', 'southern methodist': 'smu',
  'texas christian': 'tcu', 'central florida': 'ucf',
  'connecticut': 'uconn', 'pittsburgh': 'pitt',
  'appalachian state': 'appst', 'app state': 'appst',
  'miami (fl)': 'miami',
};

const DATE_TO_WEEK = {
  'Sep 5': '1', 'Sep 12': '2', 'Sep 19': '3',
  'Sep 26': '4', 'Oct 3': '5', 'Oct 10': '6',
};

// Build pre-game rank maps keyed by week
const weekRanks = {};
Object.entries(apPoll.history || {}).forEach(([w, rankings]) => {
  const map = {};
  rankings.forEach(e => {
    if (e.rank > 25) return;
    const lower = e.school.toLowerCase();
    const aliasId = AP_ALIASES[lower];
    const team = aliasId
      ? teams.find(t => t.id === aliasId)
      : teams.find(t => t.name.toLowerCase() === lower);
    if (team) map[team.id] = e.rank;
  });
  weekRanks[w] = map;
});

function getRanks(gameDate, homeId, awayId) {
  const week = DATE_TO_WEEK[gameDate] || '1';
  const preWeek = String(Math.max(1, parseInt(week, 10) - 1));
  const ranks = weekRanks[preWeek] || weekRanks['1'] || {};
  return { homeRank: ranks[homeId] || null, awayRank: ranks[awayId] || null };
}

// Deterministic pick based on game id so output is stable
function pick(arr, seed) {
  return arr[seed % arr.length];
}

function buildSummary(game) {
  const ht = teams.find(t => t.id === game.home);
  const at = teams.find(t => t.id === game.away);
  if (!ht || !at) return null;

  const sc = liveScores[game.id];
  const winner = liveResults[game.id];
  const ls = liveLineScores[game.id];
  if (!sc || !winner || !ls) return null;

  const { homeRank, awayRank } = getRanks(game.date, game.home, game.away);

  const homeWon = winner === game.home;
  const winTeam  = homeWon ? ht : at;
  const loseTeam = homeWon ? at : ht;
  const winScore  = homeWon ? sc.home : sc.away;
  const loseScore = homeWon ? sc.away : sc.home;
  const winRank  = homeWon ? homeRank : awayRank;
  const loseRank = homeWon ? awayRank : homeRank;
  const margin   = winScore - loseScore;
  const roadWin  = !homeWon;
  const seed     = game.id;

  const winQ  = homeWon ? (ls.home || []) : (ls.away || []);
  const loseQ = homeWon ? (ls.away || []) : (ls.home || []);

  // Cumulative scores after each quarter
  const cumWin  = winQ.reduce((a, v, i)  => { a.push((a[i - 1] || 0) + v); return a; }, []);
  const cumLose = loseQ.reduce((a, v, i) => { a.push((a[i - 1] || 0) + v); return a; }, []);

  // Largest deficit the winner faced
  let maxDeficit = 0;
  for (let q = 0; q < Math.min(cumWin.length, cumLose.length); q++) {
    const deficit = cumLose[q] - cumWin[q];
    if (deficit > maxDeficit) maxDeficit = deficit;
  }
  const isComeback = maxDeficit >= 10;

  // Halftime lead for winner
  const halfLead = (cumWin[1] || 0) - (cumLose[1] || 0);
  const leadingAtHalf = halfLead > 0;

  // Winner's best quarter
  const maxQScore   = Math.max(...winQ);
  const bigQIdx     = winQ.indexOf(maxQScore);
  const qLabels     = ['first', 'second', 'third', 'fourth'];
  const qNums       = ['1st', '2nd', '3rd', '4th'];

  // Rank helpers
  const rw = winRank  ? `#${winRank} ` : '';
  const rl = loseRank ? `#${loseRank} ` : '';
  const isUpset    = loseRank && winRank && loseRank < winRank;
  const isBigUpset = loseRank && !winRank;

  let s = '';

  if (isComeback) {
    const deficitStr = maxDeficit >= 17
      ? `a ${maxDeficit}-point deficit`
      : `double digits`;

    const openers = [
      `${rw}${winTeam.name} engineered one of the more memorable comebacks of the season,`,
      `Down ${deficitStr} at one point, ${rw}${winTeam.name} refused to quit,`,
      `In a game that looked all but over, ${rw}${winTeam.name} mounted a stunning rally,`,
      `${rw}${winTeam.name} showed tremendous resilience, digging out of ${deficitStr}`,
    ];
    s += pick(openers, seed);
    s += ` erasing ${deficitStr} to defeat ${rl}${loseTeam.name} ${winScore}–${loseScore}.`;

    if (maxQScore >= 14 && bigQIdx >= 0) {
      s += ` The ${qLabels[bigQIdx] || 'final'} quarter was the turning point — ${winTeam.name} poured in ${maxQScore} unanswered points to completely flip the momentum.`;
    } else {
      s += ` A relentless effort over the closing quarters gave ${winTeam.name} just enough to pull it out.`;
    }
    if (roadWin) s += ` Doing it away from home made the result all the more impressive.`;
    if (loseRank) s += ` For ${rl}${loseTeam.name}, the collapse will sting — they had every opportunity to hold on.`;

  } else if (margin >= 28) {
    const openers = [
      `${rw}${winTeam.name} was absolutely dominant from the opening drive,`,
      `There was never any doubt as ${rw}${winTeam.name} overwhelmed ${rl}${loseTeam.name},`,
      `${rw}${winTeam.name} put on a masterclass of efficiency and execution,`,
      `${rw}${winTeam.name} left no room for drama,`,
    ];
    s += pick(openers, seed);
    s += ` cruising to a commanding ${winScore}–${loseScore} victory over ${rl}${loseTeam.name}.`;

    if (maxQScore >= 14 && bigQIdx >= 0) {
      s += ` The ${qLabels[bigQIdx] || 'decisive'} quarter was particularly devastating — ${winTeam.name} scored ${maxQScore} points in the period to put the game completely out of reach.`;
    }
    if (isBigUpset) s += ` The unranked ${winTeam.name} made a major statement with the lopsided result.`;
    else if (!winRank && !loseRank) s += ` The emphatic margin settled any debate about which program had the upper hand.`;
    else s += ` The final score was an accurate reflection of the gap between the two teams on this day.`;

  } else if (margin >= 14) {
    const openers = [
      `${rw}${winTeam.name} controlled the pace from early on,`,
      `A steady, efficient performance carried ${rw}${winTeam.name} past ${rl}${loseTeam.name},`,
      `${rw}${winTeam.name} got the job done with authority,`,
      `${rw}${winTeam.name} handled business in convincing fashion,`,
    ];
    s += pick(openers, seed);
    s += ` coming away with a ${winScore}–${loseScore} win over ${rl}${loseTeam.name}.`;

    if (leadingAtHalf) {
      s += ` ${winTeam.name} built their advantage steadily across the first half and never let ${loseTeam.name} get within striking distance in the second.`;
    } else {
      s += ` After a competitive first half, ${winTeam.name} pulled away in the second to put it away decisively.`;
    }
    if (roadWin) s += ` Picking up the road victory was an important result for the program heading into conference play.`;
    if (isBigUpset) s += ` The unranked ${winTeam.name} turned a lot of heads with the margin of victory over ${rl}${loseTeam.name}.`;

  } else if (margin >= 7) {
    const openers = [
      `${rw}${winTeam.name} and ${rl}${loseTeam.name} went back and forth before ${winTeam.name} pulled away for a ${winScore}–${loseScore} victory.`,
      `A competitive battle swung ${rw}${winTeam.name}'s way as they knocked off ${rl}${loseTeam.name}, ${winScore}–${loseScore}.`,
      `${rw}${winTeam.name} found another gear when it mattered most, securing a ${winScore}–${loseScore} win over ${rl}${loseTeam.name}.`,
      `It took some work, but ${rw}${winTeam.name} came through with a ${winScore}–${loseScore} victory over ${rl}${loseTeam.name}.`,
    ];
    s += pick(openers, seed);

    if (maxQScore >= 14 && bigQIdx >= 0) {
      s += ` ${winTeam.name}'s ${maxQScore}-point ${qNums[bigQIdx] || 'fourth-quarter'} performance proved to be the decisive stretch of the game.`;
    }
    if (roadWin && winRank) s += ` Winning on the road against a quality opponent only added to the quality of the result.`;
    if (isBigUpset) s += ` The unranked ${winTeam.name} pulled off the upset and made some noise in the national picture.`;
    else if (isUpset) s += ` ${winTeam.name} came in as the lower-ranked side, making the win a notable upset.`;

  } else {
    // Nail-biter (1–6)
    const openers = [
      `In one of the tensest finishes of the week, ${rw}${winTeam.name} survived to beat ${rl}${loseTeam.name} ${winScore}–${loseScore}.`,
      `${rw}${winTeam.name} held on by the slimmest of margins, edging ${rl}${loseTeam.name} ${winScore}–${loseScore} in a nerve-wracking finish.`,
      `A thriller from start to finish ended with ${rw}${winTeam.name} emerging on the right side, ${winScore}–${loseScore} over ${rl}${loseTeam.name}.`,
      `${rw}${winTeam.name} found a way in the final minutes, defeating ${rl}${loseTeam.name} ${winScore}–${loseScore} in a game that could have gone either way.`,
    ];
    s += pick(openers, seed);

    s += ` ${loseTeam.name} had every opportunity to steal it — the narrow final score barely captures how close this contest really was.`;
    if (roadWin) s += ` Escaping with a road win by that margin took a full team effort and some clutch moments down the stretch.`;
    if (isBigUpset) s += ` For the unranked ${winTeam.name}, it stands as one of the signature wins of their schedule.`;
    else if (isUpset) s += ` The lower-ranked ${winTeam.name} pulled off the upset and sent shockwaves through the rankings.`;
  }

  return s.trim();
}

// Generate
const summaries = {};
let count = 0;
for (const game of masterSchedule) {
  const s = buildSummary(game);
  if (s) { summaries[game.id] = s; count++; }
}

// Write output file
const lines = ['export const gameSummaries = {'];
for (const [id, text] of Object.entries(summaries)) {
  const safe = text.replace(/`/g, "'").replace(/\\/g, '\\\\');
  lines.push(`  ${id}: \`${safe}\`,`);
}
lines.push('};');
lines.push('');

const outPath = resolve(ROOT, 'src/data/gameSummaries.js');
await writeFile(outPath, lines.join('\n'), 'utf8');
console.log(`Written ${count} summaries → ${outPath}`);
