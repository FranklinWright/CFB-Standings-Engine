import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apPoll } from '../data/apPoll';
import { cfpPoll } from '../data/cfpPoll';

function Poll({ teams, schedule, results }) {
  const [activeTab, setActiveTab] = useState(cfpPoll.isLoaded ? 'cfp' : 'ap');

  // Active poll data — switches between CFP and AP
  const activePoll = activeTab === 'cfp' ? cfpPoll : apPoll;

  // Historical poll week browser — reset to current when tab changes
  const [selectedPollWeek, setSelectedPollWeek] = useState(activePoll.currentWeek);

  // All weeks available in the active poll (history keys + current week), ascending
  const availablePollWeeks = useMemo(() => {
    const histWeeks = Object.keys(activePoll.history || {}).map(Number);
    const all = new Set([...histWeeks, activePoll.currentWeek].filter(w => w != null));
    return [...all].sort((a, b) => a - b);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Rankings to display for the selected week — with computed trends from history
  const displayedRankings = useMemo(() => {
    let entries;
    if (selectedPollWeek === activePoll.currentWeek) {
      entries = activePoll.rankings.map(r => ({ ...r, previousRank: r.previousRank ?? null }));
    } else {
      const histData = activePoll.history?.[String(selectedPollWeek)];
      if (!histData) return [];
      entries = histData.map(r => ({
        rank: r.rank,
        school: r.school,
        conference: r.conference,
        firstPlaceVotes: r.firstPlaceVotes ?? 0,
        points: r.points ?? 0,
        previousRank: r.previousRank ?? null,
      }));
    }

    // CFBD often returns null for previousRank — compute from our own stored history
    const prevWeekKey = typeof selectedPollWeek === 'number' ? String(selectedPollWeek - 1) : null;
    const prevWeekData = prevWeekKey ? (activePoll.history?.[prevWeekKey] ?? null) : null;

    return entries.map(entry => {
      if (entry.previousRank != null) return { ...entry, hasPrevData: true };
      if (prevWeekData) {
        const prevEntry = prevWeekData.find(r => r.school === entry.school);
        return {
          ...entry,
          previousRank: prevEntry?.rank ?? null,
          hasPrevData: true,
          isNewEntry: !prevEntry,
        };
      }
      return { ...entry, hasPrevData: false };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPollWeek, activeTab]);

  // Teams that were ranked last week but fell out of the top 25 this week
  const droppedTeams = useMemo(() => {
    const prevWeekKey = typeof selectedPollWeek === 'number' ? String(selectedPollWeek - 1) : null;
    const prevWeekData = prevWeekKey ? (activePoll.history?.[prevWeekKey] ?? null) : null;
    if (!prevWeekData || !displayedRankings.length) return [];
    const currentSchools = new Set(displayedRankings.map(e => e.school));
    return prevWeekData
      .filter(e => !currentSchools.has(e.school))
      .sort((a, b) => a.rank - b.rank);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPollWeek, displayedRankings, activeTab]);

  // --- Projected poll: weighted scoring model ---
  const projectedTop25 = useMemo(() => {
    // Conference prestige — mirrors how AP voters actually weight conferences
    const CONF_PRESTIGE = {
      'SEC': 1.10, 'Big Ten': 1.08,
      'ACC': 1.03, 'Big 12': 1.03,
      'Pac-12': 1.00, 'Independent': 1.00,
      'American': 0.94, 'Mountain West': 0.92,
      'Sun Belt': 0.87, 'MAC': 0.86, 'CUSA': 0.84,
    };

    // Build lookup of real poll ranks (CFP preferred over AP)
    const ALIASES = {
      'ole miss': 'miss', 'mississippi': 'miss',
      'southern california': 'usc', 'louisiana state': 'lsu',
      'brigham young': 'byu', 'southern methodist': 'smu',
      'texas christian': 'tcu', 'central florida': 'ucf',
      'connecticut': 'uconn', 'pittsburgh': 'pitt',
      'appalachian state': 'app', 'app state': 'app',
      'miami (fl)': 'mia',
    };
    const resolvePollTeam = (school) => {
      if (!school) return null;
      const lower = school.toLowerCase();
      const id = ALIASES[lower];
      return id ? teams.find(t => t.id === id) : teams.find(t => t.name.toLowerCase() === lower);
    };

    const realRanks = {};
    const basePoll = cfpPoll.isLoaded ? cfpPoll : apPoll;
    basePoll.rankings?.forEach(e => {
      const t = resolvePollTeam(e.school);
      if (t && e.rank <= 25) realRanks[t.id] = e.rank;
    });

    // Accumulate records and track quality wins/losses
    const stats = {};
    teams.forEach(t => {
      if (t.conf === 'FCS/Other') return;
      stats[t.id] = {
        ...t,
        wins: 0, losses: 0,
        rankedWins: [],   // ranks of ranked teams beaten
        rankedLosses: [], // ranks of ranked teams lost to
      };
    });

    schedule.forEach(game => {
      const winnerId = results[game.id];
      if (!winnerId) return;
      const loserId = winnerId === game.home ? game.away : game.home;
      const winT = stats[winnerId];
      const lossT = stats[loserId];
      if (winT) {
        winT.wins++;
        const oppRank = realRanks[loserId];
        if (oppRank != null) winT.rankedWins.push(oppRank);
      }
      if (lossT) {
        lossT.losses++;
        const oppRank = realRanks[winnerId];
        if (oppRank != null) lossT.rankedLosses.push(oppRank);
      }
    });

    const scored = Object.values(stats).map(t => {
      // 1. Poll momentum: existing rank gives head start
      const currentRank = realRanks[t.id];
      const momentum = currentRank ? (26 - currentRank) * 4 : 0;

      // 2. Win value: each win + bonus for beating ranked teams
      const winScore = t.wins * 10;
      const qualityBonus = t.rankedWins.reduce((sum, rank) =>
        sum + (26 - rank) * 2.5, 0);

      // 3. Loss penalty: unranked losses hurt far more than ranked losses
      const rankedLossCount = t.rankedLosses.length;
      const unrankedLossCount = t.losses - rankedLossCount;
      const lossPenalty = unrankedLossCount * 35 + rankedLossCount * 12;

      // 4. Conference prestige scales the whole score
      const prestige = CONF_PRESTIGE[t.conf] ?? 1.0;

      const score = (momentum + winScore + qualityBonus - lossPenalty) * prestige;
      return { ...t, projScore: score, currentRank };
    });

    return scored
      .filter(t => t.wins > 0 && t.projScore > 0)
      .sort((a, b) => b.projScore - a.projScore || b.wins - a.wins || b.rating - a.rating)
      .slice(0, 25);
  }, [teams, schedule, results]);

  // Trend indicator for AP Poll entries
  const Trend = ({ current, previous, hasPrevData, isNewEntry }) => {
    if (!hasPrevData) return <span className="text-slate-300 text-xs font-bold">—</span>;
    if (isNewEntry || previous == null) {
      return <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">NEW</span>;
    }
    if (previous === current) {
      return <span className="text-[10px] font-black text-slate-400 px-2 py-0.5 rounded-full bg-slate-100">=</span>;
    }
    const diff = previous - current;
    if (diff > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
          ▲ {diff}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
        ▼ {Math.abs(diff)}
      </span>
    );
  };

  // Maps CFBD school names (lowercase) to app team IDs where names differ
  const CFBD_TO_APP_ID = {
    'ole miss': 'miss',
    'mississippi': 'miss',
    'southern california': 'usc',
    'louisiana state': 'lsu',
    'brigham young': 'byu',
    'southern methodist': 'smu',
    'texas christian': 'tcu',
    'central florida': 'ucf',
    'connecticut': 'uconn',
    'pittsburgh': 'pitt',
    'appalachian state': 'app',
    'app state': 'app',
    'miami (fl)': 'mia',
  };

  // Match a CFBD school name to an app team — exact match only to prevent
  // "Georgia" matching "Georgia Tech" or "Texas" matching "North Texas"
  const findAppTeam = (school) => {
    if (!school) return null;
    const lower = school.toLowerCase();
    const aliasId = CFBD_TO_APP_ID[lower];
    if (aliasId) return teams.find(t => t.id === aliasId) || null;
    return teams.find(t => t.name.toLowerCase() === lower) || null;
  };

  // CFBD week 1 = preseason poll; CFBD week N = user's "Week N-1"
  const pollWeekLabel = (w) => {
    if (w === 'Preseason' || w === 0 || w === 1) return 'Preseason';
    if (w == null) return null;
    return `Week ${w - 1}`;
  };

  const weekLabel = pollWeekLabel(activePoll.currentWeek);

  const switchTab = (tab) => {
    const poll = tab === 'cfp' ? cfpPoll : apPoll;
    setActiveTab(tab);
    setSelectedPollWeek(poll.currentWeek);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-16 px-6 text-center shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-4 inline-block shadow-sm border" style={{ color: '#25bee8', borderColor: '#25bee8' }}>
            2026 Season
          </div>
          <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
            <span style={{ color: '#25bee8' }}>THE</span> <span style={{ color: '#f5ce42' }}>POLL</span>
          </h1>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="max-w-4xl mx-auto px-6 mt-6 mb-4">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 flex gap-2">
          <button
            onClick={() => switchTab('cfp')}
            className={`cursor-pointer flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'cfp' ? 'text-white shadow-md' : 'text-slate-400 hover:text-slate-700 hover:bg-gray-50'
            }`}
            style={activeTab === 'cfp' ? { backgroundColor: '#1a1a2e' } : {}}
          >
            CFP Rankings
          </button>
          <button
            onClick={() => switchTab('ap')}
            className={`cursor-pointer flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'ap' ? 'text-white shadow-md' : 'text-slate-400 hover:text-slate-700 hover:bg-gray-50'
            }`}
            style={activeTab === 'ap' ? { backgroundColor: '#25bee8' } : {}}
          >
            AP Poll
          </button>
          <button
            onClick={() => setActiveTab('projected')}
            className={`cursor-pointer flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'projected' ? 'shadow-md' : 'text-slate-400 hover:text-slate-700 hover:bg-gray-50'
            }`}
            style={activeTab === 'projected' ? { backgroundColor: '#f5ce42', color: '#0f172a' } : {}}
          >
            Projected Poll
          </button>
        </div>
      </div>

      {/* --- PROJECTED POLL --- */}
      {activeTab === 'projected' && (
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center mb-4">Projected based on your picks</p>

          {/* Column headers */}
          <div className="grid grid-cols-12 px-4 pb-2 text-[9px] font-black uppercase text-slate-400 tracking-widest">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-8">Team</div>
            <div className="col-span-3 text-right">Record</div>
          </div>

          <div className="grid gap-2">
            {projectedTop25.map((team, i) => (
              <Link
                to={`/team/${team.id}`}
                key={team.id}
                className="group bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl p-3 md:p-4 grid grid-cols-12 items-center gap-2 transition-all shadow-sm hover:shadow-md hover:scale-[1.01]"
              >
                <div className="col-span-1 text-center">
                  <span className="text-2xl font-black italic text-slate-900 group-hover:text-[#25bee8] transition-colors">
                    {i + 1}
                  </span>
                </div>

                <div className="col-span-8 flex items-center gap-3">
                  {team.logo && (
                    <div className="w-10 h-10 shrink-0">
                      <img
                        src={team.logo}
                        alt={team.name}
                        onError={e => { e.target.src = '/favicon.ico'; }}
                        className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
                      />
                    </div>
                  )}
                  <div className="w-1.5 h-8 rounded-full hidden sm:block" style={{ backgroundColor: team.color }} />
                  <div className="min-w-0">
                    <p className="text-sm md:text-base font-black uppercase tracking-tight text-slate-900 leading-none truncate">{team.name}</p>
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{team.conf}</span>
                  </div>
                </div>

                <div className="col-span-3 text-right">
                  <span className="text-xl md:text-2xl font-black text-slate-900 tabular-nums">
                    {team.wins}<span className="text-slate-300 font-light mx-0.5">-</span>{team.losses}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- CFP / AP POLL --- */}
      {(activeTab === 'cfp' || activeTab === 'ap') && (
        <div className="max-w-4xl mx-auto px-6">
          {!activePoll.isLoaded ? (
            /* Setup instructions when no data has been fetched yet */
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-10 text-center shadow-sm">
              <div className="text-5xl mb-4">📡</div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">
                {activeTab === 'cfp' ? 'CFP Rankings Not Yet Available' : 'AP Poll Not Yet Loaded'}
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed max-w-lg mx-auto mb-8">
                {activeTab === 'cfp'
                  ? 'CFP Rankings are released each Tuesday starting around Week 9. Run the fetch script after they\'re released to load them.'
                  : 'Run the fetch script once to pull real AP Poll rankings from the CollegeFootballData.com API. Rankings will auto-update each time you run it.'}
              </p>
              <div className="bg-slate-900 text-left rounded-2xl p-6 max-w-lg mx-auto">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Setup (one time)</p>
                <p className="text-emerald-400 font-mono text-sm mb-1"># 1. Get a free API key:</p>
                <p className="text-slate-300 font-mono text-xs mb-4">https://collegefootballdata.com/key</p>
                <p className="text-emerald-400 font-mono text-sm mb-1"># 2. Run the script:</p>
                <p className="text-white font-mono text-xs break-all">CFBD_KEY=your_key node src/data/scripts/fetch-live-data.mjs</p>
                <p className="text-slate-400 font-mono text-xs mt-4"># 3. Restart the dev server</p>
              </div>
            </div>
          ) : (
            /* Loaded: real AP Poll with historical week browser */
            <>
              {/* Week dropdown */}
              {availablePollWeeks.length > 1 && (
                <div className="mb-4 flex items-center gap-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                    Week
                  </label>
                  <select
                    value={selectedPollWeek}
                    onChange={e => setSelectedPollWeek(Number(e.target.value))}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-black text-slate-900 uppercase tracking-wide cursor-pointer shadow-sm hover:border-slate-300 focus:outline-none focus:border-slate-400 transition-colors appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    {[...availablePollWeeks].reverse().map(w => {
                      const isCurrent = w === activePoll.currentWeek;
                      const label = pollWeekLabel(w);
                      return (
                        <option key={w} value={w}>
                          {label}{isCurrent ? '  - Current' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end mb-4">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                  {activeTab === 'cfp' ? 'CFP Committee Rankings' : 'Official AP Poll'}
                </p>
                {selectedPollWeek === activePoll.currentWeek && activePoll.lastUpdated && (
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-3">
                    · Updated {new Date(activePoll.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-12 px-4 pb-2 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                <div className="col-span-1 text-center">#</div>
                <div className={activeTab === 'cfp' ? 'col-span-9' : 'col-span-6'}>Team</div>
                <div className="col-span-2 text-center hidden sm:block">Trend</div>
                {activeTab === 'ap' && <div className="col-span-2 text-center hidden sm:block">Points</div>}
                {activeTab === 'ap' && <div className="col-span-3 sm:col-span-1 text-right">1st</div>}
              </div>

              <div className="grid gap-2">
                {displayedRankings.map((entry) => {
                  const appTeam = findAppTeam(entry.school);
                  const card = (
                    <div className="group bg-white border border-gray-200 rounded-2xl p-3 md:p-4 flex items-center transition-all shadow-sm hover:shadow-md hover:scale-[1.01] grid grid-cols-12 gap-2">
                      <div className="col-span-1 text-center">
                        <span className="text-2xl font-black italic text-slate-900 group-hover:text-[#25bee8] transition-colors">
                          {entry.rank}
                        </span>
                      </div>

                      <div className={`${activeTab === 'cfp' ? 'col-span-9' : 'col-span-6'} flex items-center gap-3`}>
                        {appTeam?.logo ? (
                          <div className="w-10 h-10 shrink-0">
                            <img
                              src={appTeam.logo}
                              alt={entry.school}
                              onError={(e) => { e.target.src = '/favicon.ico'; }}
                              className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 shrink-0 bg-gray-100 rounded-full flex items-center justify-center text-slate-400 text-xs font-black">?</div>
                        )}
                        {appTeam && <div className="w-1.5 h-8 rounded-full hidden sm:block" style={{ backgroundColor: appTeam.color }} />}
                        <div>
                          <p className="text-sm md:text-base font-black uppercase tracking-tight text-slate-900 leading-none">{entry.school}</p>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{entry.conference}</p>
                        </div>
                      </div>

                      <div className="col-span-2 text-center hidden sm:block">
                        <Trend
                          current={entry.rank}
                          previous={entry.previousRank}
                          hasPrevData={entry.hasPrevData}
                          isNewEntry={entry.isNewEntry}
                        />
                      </div>

                      {activeTab === 'ap' && (
                        <div className="col-span-2 text-center hidden sm:block">
                          <span className="text-base font-black text-slate-900">{entry.points?.toLocaleString()}</span>
                        </div>
                      )}

                      {activeTab === 'ap' && (
                        <div className="col-span-3 sm:col-span-1 text-right">
                          {entry.firstPlaceVotes > 0 && (
                            <span className="text-sm font-black text-slate-900">{entry.firstPlaceVotes}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );

                  const uniqKey = `${entry.rank}-${entry.school}`;
                  return appTeam ? (
                    <Link key={uniqKey} to={`/team/${appTeam.id}`} className="block">
                      {card}
                    </Link>
                  ) : (
                    <div key={uniqKey}>{card}</div>
                  );
                })}

                {displayedRankings.length === 0 && (
                  <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                      No poll data available for this week yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Dropped out of the poll this week */}
              {droppedTeams.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                      Dropped Out
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  <div className="grid gap-2">
                    {droppedTeams.map((entry) => {
                      const appTeam = findAppTeam(entry.school);
                      const card = (
                        <div className="group bg-white/70 border border-gray-200 rounded-2xl p-3 md:p-4 flex items-center transition-all shadow-sm hover:shadow-md grid grid-cols-12 gap-2 opacity-70 hover:opacity-100">
                          <div className="col-span-1 text-center">
                            <span className="text-xl font-black italic text-slate-300">—</span>
                          </div>
                          <div className="col-span-6 flex items-center gap-3">
                            {appTeam?.logo ? (
                              <div className="w-10 h-10 shrink-0">
                                <img
                                  src={appTeam.logo}
                                  alt={entry.school}
                                  onError={(e) => { e.target.src = '/favicon.ico'; }}
                                  className="w-full h-full object-contain drop-shadow-sm grayscale group-hover:grayscale-0 transition-all"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 shrink-0 bg-gray-100 rounded-full flex items-center justify-center text-slate-400 text-xs font-black">?</div>
                            )}
                            {appTeam && <div className="w-1.5 h-8 rounded-full hidden sm:block opacity-40" style={{ backgroundColor: appTeam.color }} />}
                            <div>
                              <p className="text-sm md:text-base font-black uppercase tracking-tight text-slate-500 leading-none">{entry.school}</p>
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{entry.conference}</p>
                            </div>
                          </div>
                          <div className="col-span-2 text-center hidden sm:block">
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              ▼ Was #{entry.rank}
                            </span>
                          </div>
                          <div className="col-span-2 text-center hidden sm:block" />
                          <div className="col-span-3 sm:col-span-1 text-right" />
                        </div>
                      );
                      const key = `dropped-${entry.school}`;
                      return appTeam ? (
                        <Link key={key} to={`/team/${appTeam.id}`} className="block">{card}</Link>
                      ) : (
                        <div key={key}>{card}</div>
                      );
                    })}
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Poll;
