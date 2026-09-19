// 2026 CFB season week calendar
// Derived from masterSchedule date comments in teams.js

export const DATE_TO_WEEK = {
  'Aug 29': 0,
  'Sep 3': 1, 'Sep 4': 1, 'Sep 5': 1, 'Sep 6': 1, 'Sep 7': 1,
  'Sep 10': 2, 'Sep 11': 2, 'Sep 12': 2,
  'Sep 17': 3, 'Sep 18': 3, 'Sep 19': 3,
  'Sep 24': 4, 'Sep 25': 4, 'Sep 26': 4,
  'Oct 1': 5, 'Oct 2': 5, 'Oct 3': 5,
  'Oct 6': 6, 'Oct 7': 6, 'Oct 8': 6, 'Oct 9': 6, 'Oct 10': 6,
  'Oct 13': 7, 'Oct 14': 7, 'Oct 15': 7, 'Oct 16': 7, 'Oct 17': 7,
  'Oct 20': 8, 'Oct 21': 8, 'Oct 22': 8, 'Oct 23': 8, 'Oct 24': 8,
  'Oct 27': 9, 'Oct 28': 9, 'Oct 29': 9, 'Oct 30': 9, 'Oct 31': 9,
  'Nov 3': 10, 'Nov 4': 10, 'Nov 5': 10, 'Nov 6': 10, 'Nov 7': 10,
  'Nov 10': 11, 'Nov 11': 11, 'Nov 12': 11, 'Nov 13': 11, 'Nov 14': 11,
  'Nov 17': 12, 'Nov 18': 12, 'Nov 19': 12, 'Nov 20': 12, 'Nov 21': 12,
  'Nov 24': 13, 'Nov 27': 13, 'Nov 28': 13,
  'Dec 12': 15,
};

const MONTHS = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };

function parseGameDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(' ');
  const month = MONTHS[parts[0]];
  if (month === undefined) return null;
  return new Date(2026, month, parseInt(parts[1], 10));
}

export function getGameWeek(dateStr) {
  const w = DATE_TO_WEEK[dateStr];
  return w !== undefined ? w : null;
}

// True if the game date is strictly before today (yesterday or earlier)
export function isPastDate(dateStr) {
  const d = parseGameDate(dateStr);
  if (!d) return false;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return d < startOfToday;
}

export function getWeekLabel(week) {
  if (week === 0) return 'Kickoff';
  if (week === 15) return 'CCG Week';
  return `Week ${week}`;
}

// Short label for compact week selector tabs
export function getWeekShortLabel(week) {
  if (week === 0) return 'Wk 0';
  if (week === 15) return 'CCG';
  return `Wk ${week}`;
}

// All distinct weeks in the schedule, ascending
export const ALL_WEEKS = [...new Set(Object.values(DATE_TO_WEEK))].sort((a, b) => a - b);

// Dates that belong to a given week
export function getDatesForWeek(week) {
  return Object.entries(DATE_TO_WEEK)
    .filter(([, w]) => w === week)
    .map(([d]) => d)
    .sort((a, b) => parseGameDate(a) - parseGameDate(b));
}

// Whether every game in a week is strictly past
export function isWeekPast(week) {
  const dates = getDatesForWeek(week);
  return dates.length > 0 && dates.every(d => isPastDate(d));
}

function computeCurrentWeek() {
  const today = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const todayStr = months[today.getMonth()] + ' ' + today.getDate();
  if (DATE_TO_WEEK[todayStr] !== undefined) return DATE_TO_WEEK[todayStr];

  // Between game days — find the nearest upcoming week
  let nearest = ALL_WEEKS[ALL_WEEKS.length - 1];
  let smallestDiff = Infinity;
  for (const [dateStr, week] of Object.entries(DATE_TO_WEEK)) {
    const d = parseGameDate(dateStr);
    if (!d) continue;
    const diff = d - today;
    if (diff >= 0 && diff < smallestDiff) { smallestDiff = diff; nearest = week; }
  }
  return nearest;
}

export const CURRENT_WEEK = computeCurrentWeek();
