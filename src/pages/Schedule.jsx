import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getGameWeek, isPastDate, getWeekLabel, getWeekShortLabel,
  getDatesForWeek, isWeekPast, ALL_WEEKS, CURRENT_WEEK,
} from '../data/weekMap';
import { liveScores as liveScoresData } from '../data/liveResults';

// Colors match TeamPage's getConfStyles for visual consistency
const CONF_CHIPS = [
  { key: 'SEC',           label: 'SEC',      bg: '#f5ce42', fg: '#000' },
  { key: 'Big Ten',       label: 'Big Ten',  bg: '#25bee8', fg: '#fff' },
  { key: 'ACC',           label: 'ACC',      bg: '#003087', fg: '#fff' },
  { key: 'Big 12',        label: 'Big 12',   bg: '#C41230', fg: '#fff' },
  { key: 'American',      label: 'AAC',      bg: '#006747', fg: '#fff' },
  { key: 'Mountain West', label: 'Mtn West', bg: '#4A2580', fg: '#fff' },
  { key: 'Sun Belt',      label: 'Sun Belt', bg: '#004B87', fg: '#fff' },
  { key: 'CUSA',          label: 'C-USA',    bg: '#C5B783', fg: '#000' },
  { key: 'MAC',           label: 'MAC',      bg: '#000000', fg: '#fff' },
  { key: 'Pac-12',        label: 'Pac-12',   bg: '#ff4d4d', fg: '#fff' },
  { key: 'Independent',   label: 'Ind.',     bg: '#0c2340', fg: '#fff' },
];

function Schedule({ teams, schedule, results, onPick, liveResults = {} }) {
  const [selectedWeek, setSelectedWeek] = useState(CURRENT_WEEK);
  const [pinnedConfs, setPinnedConfs] = useState(new Set());

  const toggleConf = (key) => {
    setPinnedConfs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Group all games by week
  const gamesByWeek = useMemo(() => {
    const map = {};
    schedule.forEach(game => {
      const w = getGameWeek(game.date);
      if (w === null) return;
      if (!map[w]) map[w] = [];
      map[w].push(game);
    });
    return map;
  }, [schedule]);

  const weekGames = gamesByWeek[selectedWeek] || [];
  const weekDates = getDatesForWeek(selectedWeek);

  // Games grouped by date within the selected week
  const gamesByDate = useMemo(() => {
    const map = {};
    weekGames.forEach(g => {
      if (!map[g.date]) map[g.date] = [];
      map[g.date].push(g);
    });
    return map;
  }, [weekGames]);

  // Pick progress for the selected week (FBS-only games)
  const progress = useMemo(() => {
    const fbs = weekGames.filter(g => {
      const h = teams.find(t => t.id === g.home);
      const a = teams.find(t => t.id === g.away);
      return h && a && h.conf !== 'FCS/Other' && a.conf !== 'FCS/Other';
    });
    const picked = fbs.filter(g => results[g.id]).length;
    return { picked, total: fbs.length };
  }, [weekGames, teams, results]);

  const weekPast = isWeekPast(selectedWeek);
  const weekStatus =
    selectedWeek < CURRENT_WEEK ? 'past' :
    selectedWeek === CURRENT_WEEK ? 'current' : 'upcoming';

  const findTeam = id => teams.find(t => t.id === id);

  // ─── Game Card ───────────────────────────────────────────────────────────────
  function GameCard({ game }) {
    const awayTeam = findTeam(game.away);
    const homeTeam = findTeam(game.home);
    const picked = results[game.id];
    const liveWinner = liveResults[game.id];
    const liveScore = liveScoresData[game.id] ?? null;
    const isLocked = !!liveWinner || isPastDate(game.date);
    const isFinal = !!liveWinner;

    const teamUnknown = !awayTeam || !homeTeam;

    function TeamSide({ team }) {
      if (!team) {
        return (
          <div className="flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <p className="text-xs font-black uppercase text-slate-400">TBD</p>
          </div>
        );
      }
      const isPickedTeam = picked === team.id;
      const isOtherPicked = !!picked && picked !== team.id;
      const isWinner = isFinal && liveWinner === team.id;
      const isLoser = isFinal && liveWinner && liveWinner !== team.id;

      return (
        <button
          onClick={() => !isLocked && !teamUnknown && onPick(game.id, team.id)}
          disabled={isLocked || teamUnknown}
          className={`relative flex-1 flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl bg-white overflow-hidden transition-all duration-200
            ${!isLocked ? 'cursor-pointer active:scale-[0.97]' : 'cursor-default'}
            ${isLoser ? 'opacity-35' : ''}
            ${isOtherPicked && !isFinal ? 'opacity-45' : ''}
          `}
          style={{
            boxShadow: isPickedTeam
              ? '0 8px 24px rgba(0,0,0,0.13)'
              : '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {/* Very light team-color tint wash — subtle, doesn't hide logo */}
          {isPickedTeam && (
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{ backgroundColor: team.color, opacity: 0.09 }}
            />
          )}
          {isWinner && (
            <div className="absolute inset-0 pointer-events-none rounded-2xl bg-emerald-50" />
          )}

          {/* Checkmark badge top-right */}
          {isPickedTeam && !isFinal && (
            <div
              className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center z-10 shadow-sm"
              style={{ backgroundColor: team.color }}
            >
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {isWinner && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center z-10 shadow-sm">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* Logo — always fully visible */}
          <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center relative z-10">
            {team.logo ? (
              <img
                src={team.logo}
                alt={team.name}
                onError={e => { e.target.src = '/favicon.ico'; }}
                className="w-full h-full object-contain drop-shadow-sm"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-full" />
            )}
          </div>

          <div className="text-center relative z-10">
            <p className="text-[11px] md:text-xs font-black uppercase tracking-tight leading-none text-slate-900">
              {team.name}
            </p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
              {team.conf}
            </p>
          </div>

          {isPickedTeam && !isFinal && (
            <span
              className="relative z-10 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: team.color }}
            >
              Your Pick
            </span>
          )}
          {isLoser && (
            <span className="relative z-10 text-[7px] font-black uppercase tracking-widest text-slate-400">L</span>
          )}
        </button>
      );
    }

    const borderColor = awayTeam?.color || '#e2e8f0';

    return (
      <div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden border-l-4 hover:shadow-md transition-shadow"
        style={{ borderLeftColor: borderColor }}
      >
        <div className="flex gap-2 md:gap-3 p-3 md:p-4">
          <TeamSide team={awayTeam} side="away" />

          {/* Center divider */}
          <div className="flex flex-col items-center justify-center gap-1 shrink-0 w-20 md:w-24 text-center">
            {isFinal && liveScore ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black text-slate-900 tabular-nums leading-none">{liveScore.away}</span>
                  <span className="text-xs text-slate-300 font-bold">–</span>
                  <span className="text-xl font-black text-slate-900 tabular-nums leading-none">{liveScore.home}</span>
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest bg-slate-900 text-white px-2 py-0.5 rounded-full">
                  FINAL
                </span>
                <span className="text-[7px] text-slate-400 uppercase tracking-wider">{game.date}</span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">vs</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{game.date}</span>
                {game.location && (
                  <span className="text-[7px] text-slate-300 uppercase tracking-wide leading-tight hidden md:block">
                    {game.location}
                  </span>
                )}
                {!isFinal && isPastDate(game.date) && (
                  <span className="mt-1 text-[7px] font-black uppercase tracking-widest bg-slate-400 text-white px-2 py-0.5 rounded-full">
                    PAST
                  </span>
                )}
              </>
            )}
          </div>

          <TeamSide team={homeTeam} side="home" />
        </div>
        {/* Mobile location */}
        {game.location && (
          <p className="text-center text-[8px] text-slate-300 uppercase tracking-wide pb-2 md:hidden">
            {game.location}
          </p>
        )}
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12 px-6 text-center shadow-sm">
        <div className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-3 inline-block border"
             style={{ color: '#25bee8', borderColor: '#25bee8' }}>
          2026 Season
        </div>
        <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
          <span style={{ color: '#25bee8' }}>WEEKLY</span>{' '}
          <span style={{ color: '#f5ce42' }}>SCHEDULE</span>
        </h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-3">
          Pick your winners for each matchup
        </p>
      </div>

      {/* Sticky week selector + conference filter */}
      <div className="sticky top-[65px] z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        {/* Week tabs */}
        <div className="max-w-5xl mx-auto px-4 pt-3 pb-2 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 min-w-max">
            {ALL_WEEKS.filter(w => gamesByWeek[w]?.length > 0).map(w => {
              const isPast = w < CURRENT_WEEK;
              const isCurrent = w === CURRENT_WEEK;
              const isSelected = w === selectedWeek;
              return (
                <button
                  key={w}
                  onClick={() => setSelectedWeek(w)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 px-4 py-3 rounded-xl min-w-[60px] transition-all duration-150 cursor-pointer
                    ${isSelected
                      ? isPast ? 'bg-slate-600 text-white shadow-md'
                        : isCurrent ? 'text-white shadow-md'
                        : 'bg-slate-900 text-white shadow-md'
                      : isPast ? 'bg-gray-100 text-slate-400 hover:bg-gray-200'
                        : isCurrent ? 'text-white/90 hover:opacity-90'
                        : 'bg-white border border-gray-200 text-slate-500 hover:bg-gray-50 hover:border-slate-300'
                    }`}
                  style={
                    isSelected && isCurrent ? { backgroundColor: '#25bee8' }
                    : !isSelected && isCurrent ? { backgroundColor: '#25bee8' }
                    : {}
                  }
                >
                  <span className="text-[8px] font-black uppercase tracking-widest leading-none opacity-70">
                    {w === 0 ? 'PRE' : 'WK'}
                  </span>
                  <span className="text-lg font-black leading-none">
                    {w === 0 ? '0' : w}
                  </span>
                  {isCurrent && (
                    <span className="text-[7px] font-black uppercase tracking-widest leading-none opacity-80">
                      NOW
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conference filter */}
        <div className="border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-2 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300 shrink-0 select-none">
                Confs:
              </span>
              {CONF_CHIPS.map(({ key, label, bg, fg }) => {
                const active = pinnedConfs.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleConf(key)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-150 cursor-pointer
                      ${active
                        ? 'shadow-md scale-105 ring-2 ring-offset-1'
                        : 'bg-gray-100 text-slate-500 hover:bg-gray-200 hover:text-slate-700'
                      }`}
                    style={active
                      ? { backgroundColor: bg, color: fg, ringColor: bg }
                      : {}}
                  >
                    {label}
                  </button>
                );
              })}
              {pinnedConfs.size > 0 && (
                <button
                  onClick={() => setPinnedConfs(new Set())}
                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-400 hover:bg-red-50 transition-all cursor-pointer"
                >
                  Clear ×
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6">

        {/* Week status bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
              {getWeekLabel(selectedWeek)}
              {weekStatus === 'current' && (
                <span className="ml-3 text-xs font-black uppercase tracking-widest text-white px-2.5 py-1 rounded-full align-middle"
                      style={{ backgroundColor: '#25bee8' }}>
                  Current
                </span>
              )}
              {weekStatus === 'past' && (
                <span className="ml-3 text-xs font-black uppercase tracking-widest bg-slate-400 text-white px-2.5 py-1 rounded-full align-middle">
                  Completed
                </span>
              )}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
              {weekDates.length > 0 && `${weekDates[0]} – ${weekDates[weekDates.length - 1]}`}
              {' · '}{weekGames.length} games
            </p>
          </div>

          {/* Pick progress */}
          {progress.total > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 px-5 py-3 shadow-sm text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {weekStatus === 'past' ? 'Results' : 'Picks Made'}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(progress.picked / progress.total) * 100}%`,
                      backgroundColor: progress.picked === progress.total ? '#10b981' : '#25bee8',
                    }}
                  />
                </div>
                <p className="text-sm font-black text-slate-900 tabular-nums">
                  {progress.picked}<span className="text-slate-300 mx-0.5">/</span>{progress.total}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Games by date */}
        {weekDates.map(date => {
          let gamesOnDate = gamesByDate[date] || [];
          if (gamesOnDate.length === 0) return null;

          // Sort pinned conferences to the top within each day
          if (pinnedConfs.size > 0) {
            gamesOnDate = [...gamesOnDate].sort((a, b) => {
              const aPin = [findTeam(a.home), findTeam(a.away)].some(t => t && pinnedConfs.has(t.conf));
              const bPin = [findTeam(b.home), findTeam(b.away)].some(t => t && pinnedConfs.has(t.conf));
              return aPin === bPin ? 0 : aPin ? -1 : 1;
            });
          }

          const dayNames = { 'Sep 3': 'Thursday', 'Sep 4': 'Friday', 'Sep 5': 'Saturday', 'Sep 6': 'Sunday',
            'Sep 7': 'Monday', 'Sep 10': 'Thursday', 'Sep 11': 'Friday', 'Sep 12': 'Saturday',
            'Sep 17': 'Thursday', 'Sep 18': 'Friday', 'Sep 19': 'Saturday', 'Sep 24': 'Thursday',
            'Sep 25': 'Friday', 'Sep 26': 'Saturday', 'Oct 1': 'Thursday', 'Oct 2': 'Friday',
            'Oct 3': 'Saturday', 'Oct 6': 'Tuesday', 'Oct 7': 'Wednesday', 'Oct 8': 'Thursday',
            'Oct 9': 'Friday', 'Oct 10': 'Saturday', 'Oct 13': 'Tuesday', 'Oct 14': 'Wednesday',
            'Oct 15': 'Thursday', 'Oct 16': 'Friday', 'Oct 17': 'Saturday', 'Oct 20': 'Tuesday',
            'Oct 21': 'Wednesday', 'Oct 22': 'Thursday', 'Oct 23': 'Friday', 'Oct 24': 'Saturday',
            'Oct 27': 'Tuesday', 'Oct 28': 'Wednesday', 'Oct 29': 'Thursday', 'Oct 30': 'Friday',
            'Oct 31': 'Saturday', 'Nov 3': 'Tuesday', 'Nov 4': 'Wednesday', 'Nov 5': 'Thursday',
            'Nov 6': 'Friday', 'Nov 7': 'Saturday', 'Nov 10': 'Tuesday', 'Nov 11': 'Wednesday',
            'Nov 12': 'Thursday', 'Nov 13': 'Friday', 'Nov 14': 'Saturday', 'Nov 17': 'Tuesday',
            'Nov 18': 'Wednesday', 'Nov 19': 'Thursday', 'Nov 20': 'Friday', 'Nov 21': 'Saturday',
            'Nov 24': 'Tuesday', 'Nov 27': 'Friday', 'Nov 28': 'Saturday', 'Aug 29': 'Saturday',
            'Dec 12': 'Saturday',
          };
          const dayName = dayNames[date] || '';

          return (
            <div key={date} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gray-200" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 shrink-0">
                  {dayName && `${dayName} · `}{date}
                </p>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid gap-2 md:gap-3">
                {gamesOnDate.map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          );
        })}

        {weekGames.length === 0 && (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center">
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No games scheduled this week.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Schedule;
