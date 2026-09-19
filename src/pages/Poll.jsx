import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apPoll } from '../data/apPoll';

function Poll({ teams, schedule, results }) {
  const [activeTab, setActiveTab] = useState('ap');
  // Historical AP Poll week browser — default to current week
  const [selectedPollWeek, setSelectedPollWeek] = useState(apPoll.currentWeek);

  // All weeks available in the poll (history keys + current week), ascending
  const availablePollWeeks = useMemo(() => {
    const histWeeks = Object.keys(apPoll.history || {}).map(Number);
    const all = new Set([...histWeeks, apPoll.currentWeek].filter(w => w != null));
    return [...all].sort((a, b) => a - b);
  }, []);

  // Rankings to display for the selected week — with computed trends from history
  const displayedRankings = useMemo(() => {
    let entries;
    if (selectedPollWeek === apPoll.currentWeek) {
      entries = apPoll.rankings.map(r => ({ ...r, previousRank: r.previousRank ?? null }));
    } else {
      const histData = apPoll.history?.[String(selectedPollWeek)];
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
    const prevWeekData = prevWeekKey ? (apPoll.history?.[prevWeekKey] ?? null) : null;

    return entries.map(entry => {
      // Use CFBD value if it has one
      if (entry.previousRank != null) return { ...entry, hasPrevData: true };
      // Compute from our stored previous week
      if (prevWeekData) {
        const prevEntry = prevWeekData.find(r => r.school === entry.school);
        return {
          ...entry,
          previousRank: prevEntry?.rank ?? null,
          hasPrevData: true,
          isNewEntry: !prevEntry,
        };
      }
      // No previous week data available (e.g. week 1)
      return { ...entry, hasPrevData: false };
    });
  }, [selectedPollWeek]);

  // --- Projected poll: built from user picks ---
  const projectedTop25 = useMemo(() => {
    const stats = teams.map(t => ({ ...t, wins: 0, losses: 0 }));
    schedule.forEach(game => {
      const winnerId = results[game.id];
      if (winnerId) {
        const loserId = winnerId === game.home ? game.away : game.home;
        const winT = stats.find(t => t.id === winnerId);
        const lossT = stats.find(t => t.id === loserId);
        if (winT) winT.wins++;
        if (lossT) lossT.losses++;
      }
    });
    return stats
      .filter(t => t.conf !== 'FCS/Other')
      .sort((a, b) => b.wins - a.wins || b.rating - a.rating)
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

  const weekLabel = apPoll.currentWeek === 'Preseason' || apPoll.currentWeek === 0
    ? 'Preseason'
    : apPoll.currentWeek != null
    ? `Week ${apPoll.currentWeek}`
    : null;

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
            onClick={() => setActiveTab('ap')}
            className={`cursor-pointer flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              activeTab === 'ap' ? 'text-white shadow-md' : 'text-slate-400 hover:text-slate-700 hover:bg-gray-50'
            }`}
            style={activeTab === 'ap' ? { backgroundColor: '#25bee8' } : {}}
          >
            <span>AP Poll</span>
            {apPoll.isLoaded && weekLabel && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${activeTab === 'ap' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-700'}`}>
                {weekLabel}
              </span>
            )}
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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center mb-4">Rankings based on your picks</p>
          <div className="grid gap-2 md:gap-3">
            {projectedTop25.map((team, i) => (
              <Link
                to={`/team/${team.id}`}
                key={team.id}
                className="group bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl p-3 md:p-4 flex items-center justify-between transition-all shadow-sm hover:shadow-md hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3 md:gap-5">
                  <span className="text-2xl md:text-3xl font-black italic text-slate-900 group-hover:text-[#25bee8] transition-colors w-8 md:w-10 text-center">
                    {i + 1}
                  </span>
                  {team.logo && (
                    <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center">
                      <img
                        src={team.logo}
                        alt={team.name}
                        onError={(e) => { e.target.src = '/favicon.ico'; }}
                        className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
                      />
                    </div>
                  )}
                  <div className="w-1.5 h-8 md:h-10 rounded-full shadow-sm hidden sm:block" style={{ backgroundColor: team.color }} />
                  <div>
                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 leading-none">{team.name}</h3>
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1 inline-block">{team.conf}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:gap-8">
                  <div className="text-right">
                    <p className="text-[8px] md:text-[9px] uppercase font-black text-slate-500 mb-0.5 tracking-tighter">Record</p>
                    <p className="text-2xl md:text-3xl font-black font-mono text-slate-950 tracking-tighter">
                      {team.wins}<span className="text-slate-300 mx-0.5">-</span>{team.losses}
                    </p>
                  </div>
                  <div className="hidden sm:flex w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gray-100 items-center justify-center transition-all group-hover:bg-[#25bee8] group-hover:text-white text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- AP POLL --- */}
      {activeTab === 'ap' && (
        <div className="max-w-4xl mx-auto px-6">
          {!apPoll.isLoaded ? (
            /* Setup instructions when no data has been fetched yet */
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-10 text-center shadow-sm">
              <div className="text-5xl mb-4">📡</div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">AP Poll Not Yet Loaded</h3>
              <p className="text-slate-500 font-medium leading-relaxed max-w-lg mx-auto mb-8">
                Run the fetch script once to pull real AP Poll rankings from the CollegeFootballData.com API.
                Rankings will auto-update each time you run it.
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
              {/* Week selector — only shown when history has data */}
              {availablePollWeeks.length > 1 && (
                <div className="mb-4 overflow-x-auto">
                  <div className="flex gap-2 min-w-max pb-1">
                    {availablePollWeeks.map(w => {
                      const isCurrent = w === apPoll.currentWeek;
                      const isSelected = w === selectedPollWeek;
                      return (
                        <button
                          key={w}
                          onClick={() => setSelectedPollWeek(w)}
                          className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap
                            ${isSelected
                              ? 'text-white shadow-md'
                              : 'bg-white border border-gray-200 text-slate-400 hover:border-slate-400'
                            }`}
                          style={isSelected ? { backgroundColor: isCurrent ? '#f5ce42' : '#0f172a', color: isCurrent ? '#0f172a' : 'white' } : {}}
                        >
                          {w === 'Preseason' || w === 0 ? 'Preseason' : `Week ${w}`}
                          {isCurrent && ' ●'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  Official AP Poll —{' '}
                  {selectedPollWeek === apPoll.currentWeek
                    ? (weekLabel || `Week ${apPoll.currentWeek}`)
                    : `Week ${selectedPollWeek}`}
                  {selectedPollWeek === apPoll.currentWeek && (
                    <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded-full font-black"
                          style={{ backgroundColor: '#f5ce42', color: '#0f172a' }}>CURRENT</span>
                  )}
                </p>
                {selectedPollWeek === apPoll.currentWeek && apPoll.lastUpdated && (
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Updated {new Date(apPoll.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-12 px-4 pb-2 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-6">Team</div>
                <div className="col-span-2 text-center hidden sm:block">Trend</div>
                <div className="col-span-2 text-center hidden sm:block">Points</div>
                <div className="col-span-3 sm:col-span-1 text-right">1st</div>
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

                      <div className="col-span-6 flex items-center gap-3">
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

                      <div className="col-span-2 text-center hidden sm:block">
                        <span className="text-base font-black text-slate-900">{entry.points?.toLocaleString()}</span>
                      </div>

                      <div className="col-span-3 sm:col-span-1 text-right">
                        {entry.firstPlaceVotes > 0 && (
                          <span className="text-sm font-black text-slate-900">{entry.firstPlaceVotes}</span>
                        )}
                      </div>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Poll;
