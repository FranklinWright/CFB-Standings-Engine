import React, { useState, useEffect, useMemo } from 'react';
import { cfpPoll } from '../data/cfpPoll';
import { apPoll } from '../data/apPoll';

const CONF_PRESTIGE = {
  'SEC': 1.10, 'Big Ten': 1.08,
  'ACC': 1.03, 'Big 12': 1.03,
  'Pac-12': 1.00, 'Independent': 1.00,
  'American': 0.94, 'Mountain West': 0.92,
  'Sun Belt': 0.87, 'MAC': 0.86, 'CUSA': 0.84,
};

// CFBD poll school name → app team ID
const CFP_ALIASES = {
  'ole miss': 'miss', 'mississippi': 'miss',
  'southern california': 'usc', 'louisiana state': 'lsu',
  'brigham young': 'byu', 'southern methodist': 'smu',
  'texas christian': 'tcu', 'central florida': 'ucf',
  'connecticut': 'uconn', 'pittsburgh': 'pitt',
  'appalachian state': 'app', 'miami (fl)': 'mia',
};

function PlayoffBracket({ playoffData, teams, schedule = [], results, onPick }) {
  const { games, seedMap, ccGames, ccgsComplete, bowlGames, seedReasons = {}, confLeaders = {}, teamRecords = {} } = playoffData;
  const [activeTab, setActiveTab] = useState('today');

  const resolvePollTeam = (school) => {
    if (!school) return null;
    const lower = school.toLowerCase();
    const id = CFP_ALIASES[lower];
    return id ? teams.find(t => t.id === id) : teams.find(t => t.name.toLowerCase() === lower);
  };

  // ── Projected scores (same formula as Poll.jsx) ───────────────────────────
  const projectedScores = useMemo(() => {
    const basePoll = cfpPoll.isLoaded ? cfpPoll : apPoll;
    const realRanks = {};
    basePoll.rankings?.forEach(e => {
      const t = resolvePollTeam(e.school);
      if (t && e.rank <= 25) realRanks[t.id] = e.rank;
    });

    const stats = {};
    teams.forEach(t => {
      if (t.conf === 'FCS/Other') return;
      stats[t.id] = { ...t, wins: 0, losses: 0, rankedWins: [], rankedLosses: [] };
    });

    schedule.forEach(game => {
      const winnerId = results[game.id];
      if (!winnerId) return;
      const loserId = winnerId === game.home ? game.away : game.home;
      const winT = stats[winnerId];
      const lossT = stats[loserId];
      if (winT) {
        winT.wins++;
        const r = realRanks[loserId];
        if (r != null) winT.rankedWins.push(r);
      }
      if (lossT) {
        lossT.losses++;
        const r = realRanks[winnerId];
        if (r != null) lossT.rankedLosses.push(r);
      }
    });

    const scored = {};
    Object.values(stats).forEach(t => {
      const momentum  = (realRanks[t.id] ?? null) != null ? (26 - realRanks[t.id]) * 4 : 0;
      const winScore  = t.wins * 10;
      const qualBonus = t.rankedWins.reduce((s, r) => s + (26 - r) * 2.5, 0);
      const penalty   = (t.losses - t.rankedLosses.length) * 35 + t.rankedLosses.length * 12;
      const prestige  = CONF_PRESTIGE[t.conf] ?? 1.0;
      scored[t.id] = { ...t, projScore: (momentum + winScore + qualBonus - penalty) * prestige };
    });
    return scored;
  }, [teams, schedule, results]);

  // ── "If Playoff Today" — strictly from CFP poll rankings ─────────────────
  const ifTodaySeeds = useMemo(() => {
    if (!cfpPoll.isLoaded || !cfpPoll.rankings?.length) return [];

    const P4 = new Set(['ACC', 'Big Ten', 'Big 12', 'SEC']);
    const G5 = new Set(['American', 'Mountain West', 'Sun Belt', 'MAC', 'CUSA', 'Pac-12']);

    const cfpRanked = cfpPoll.rankings
      .filter(e => e.rank <= 25)
      .map(e => {
        const team = resolvePollTeam(e.school);
        return team ? { ...team, cfpRank: e.rank, ...(teamRecords[team.id] || { wins: 0, losses: 0 }) } : null;
      })
      .filter(Boolean);

    const byId = {};
    cfpRanked.forEach(t => { byId[t.id] = t; });

    // P4 auto-qualifiers: current conf leaders, ordered by CFP rank
    const p4Autos = [];
    const autoIds = new Set();
    P4.forEach(conf => {
      const lid = confLeaders[conf];
      if (!lid) return;
      const leader = byId[lid] || { ...teams.find(t => t.id === lid), cfpRank: 99, ...(teamRecords[lid] || { wins: 0, losses: 0 }) };
      if (leader.id) { p4Autos.push({ ...leader, autoConf: conf }); autoIds.add(lid); }
    });

    // G5 auto: highest CFP-ranked G5 conf leader
    let g5Auto = null;
    let bestG5Rank = 99;
    G5.forEach(conf => {
      const lid = confLeaders[conf];
      if (!lid || autoIds.has(lid)) return;
      const inCFP = byId[lid];
      if (inCFP && inCFP.cfpRank < bestG5Rank) {
        bestG5Rank = inCFP.cfpRank;
        g5Auto = { ...inCFP, autoConf: conf };
      }
    });
    if (g5Auto) autoIds.add(g5Auto.id);

    // At-larges: next highest CFP-ranked teams not already auto-qualified
    const atLargeCount = 12 - p4Autos.length - (g5Auto ? 1 : 0);
    const atLarges = cfpRanked
      .filter(t => !autoIds.has(t.id))
      .slice(0, atLargeCount)
      .map(t => ({ ...t, autoConf: null }));

    // Seed all 12 by CFP rank — byes go to seeds 1-4 (top 4 by rank)
    const field = [...p4Autos, ...(g5Auto ? [g5Auto] : []), ...atLarges];
    return field
      .sort((a, b) => a.cfpRank - b.cfpRank)
      .slice(0, 12)
      .map((t, i) => ({ ...t, seed: i + 1, isBye: i < 4 }));
  }, [teams, confLeaders, teamRecords]);


  // First-round matchup pairs for seeds 5-12
  const todayMatchups = [
    [5, 12], [6, 11], [7, 10], [8, 9],
  ].map(([a, b]) => ({
    higher: ifTodaySeeds.find(t => t.seed === a),
    lower: ifTodaySeeds.find(t => t.seed === b),
  }));

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getLogoSrc = (logoUrl) => logoUrl || '/favicon.ico';

  const getTeamInfo = (teamId) => {
    if (!teamId) return { name: 'TBD', logo: null, seed: '-', wins: 0, losses: 0 };
    const team = teams.find(t => t.id === teamId);
    const rec = teamRecords[teamId] || { wins: 0, losses: 0 };
    return { ...team, ...rec, seed: seedMap[teamId] || '-' };
  };

  const isFCS = (teamId) => teams.find(t => t.id === teamId)?.conf === 'FCS/Other';

  useEffect(() => {
    if (ccGames) {
      ccGames.forEach(game => {
        if ((isFCS(game.home) || isFCS(game.away)) && !results[game.id]) {
          if (game.home && game.away) onPick(game.id, game.home);
        }
      });
    }
  }, [ccGames, results, onPick]);

  const safeCcGames = ccGames?.filter(g => !isFCS(g.home) && !isFCS(g.away)) || [];
  const safeBowlGames = bowlGames?.filter(g => !isFCS(g.home) && !isFCS(g.away)) || [];
  const actualCcgsComplete = safeCcGames.length > 0 ? safeCcGames.every(g => results[g.id]) : ccgsComplete;

  // ── Game Card (for CCG / CFP bracket / Bowl) ──────────────────────────────
  const GameCard = ({ gameId, className = '' }) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return null;
    const home = getTeamInfo(game.home);
    const away = getTeamInfo(game.away);
    const winner = results[game.id];

    const TeamRow = ({ team, side }) => {
      const picked = winner === team.id;
      return (
        <button
          onClick={() => team.id && game.home && game.away && onPick(game.id, team.id)}
          disabled={!team.id}
          className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all border-2
            ${picked ? 'bg-white border-slate-800 shadow-md' : 'bg-gray-50 border-transparent hover:border-slate-200'}`}
        >
          {!game.isCCG && !game.isBowl && (
            <span className={`text-[10px] font-black w-5 text-left shrink-0 ${picked ? 'text-[#25bee8]' : 'text-slate-300'}`}>
              {team.seed !== '-' ? team.seed : ''}
            </span>
          )}
          <img
            src={getLogoSrc(team.logo)}
            alt=""
            onError={e => { e.target.src = '/favicon.ico'; }}
            className="w-6 h-6 object-contain shrink-0"
          />
          <span className="font-black text-sm uppercase truncate flex-1 text-left">{team.name}</span>
          {!game.isCCG && !game.isBowl && team.id && (
            <span className="text-[9px] font-bold text-slate-400 shrink-0 tabular-nums">
              {(teamRecords[team.id]?.wins ?? 0)}-{(teamRecords[team.id]?.losses ?? 0)}
            </span>
          )}
          {picked && <span className="text-[#25bee8] font-black shrink-0">✓</span>}
        </button>
      );
    };

    return (
      <div className={`bg-white border-2 border-slate-100 rounded-2xl p-3 shadow-sm w-full ${className}`}>
        <div className="text-[9px] font-black uppercase tracking-widest text-center mb-2 leading-tight">
          <span className={game.isCCG ? 'text-slate-800' : game.isBowl ? 'text-amber-500' : 'text-[#25bee8]'}>
            {game.name}
          </span>
          {game.detail && <span className="block text-slate-400 mt-0.5">{game.detail}</span>}
        </div>
        <div className="space-y-1">
          <TeamRow team={away} side="away" />
          <TeamRow team={home} side="home" />
        </div>
      </div>
    );
  };

  // ── Seed reason chip ──────────────────────────────────────────────────────
  const ReasonChip = ({ reason, isAuto }) => (
    <span className={`text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded whitespace-nowrap
      ${isAuto ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
      {reason}
    </span>
  );

  // ── Today seed card ───────────────────────────────────────────────────────
  const TodaySeedCard = ({ team, opponent, label }) => {
    if (!team) return null;
    const isAuto = !!(team.autoConf);
    const reason = team.autoConf ? `Auto · ${team.autoConf}` : `At-Large`;

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
        <span className="text-2xl font-black italic text-slate-900 w-8 text-center shrink-0">{team.seed}</span>
        {team.logo && (
          <img src={team.logo} alt={team.name} onError={e => { e.target.src = '/favicon.ico'; }}
            className="w-10 h-10 object-contain shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-black uppercase tracking-tight text-slate-900 leading-none">{team.name}</p>
            {team.isBye && (
              <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Bye</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <ReasonChip reason={reason} isAuto={isAuto} />
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-base font-black text-slate-900 tabular-nums">
            {team.wins}-{team.losses}
          </span>
          {opponent && (
            <p className="text-[8px] text-slate-400 font-bold mt-0.5">vs #{opponent.seed}</p>
          )}
        </div>
      </div>
    );
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const TAB_CFG = [
    { key: 'today', label: 'If Today',      color: '#f5ce42', textColor: '#0f172a' },
    { key: 'ccg',   label: 'Championships', color: '#1a1a2e', textColor: '#fff' },
    { key: 'cfp',   label: 'CFP Bracket',   color: '#25bee8', textColor: '#fff' },
    { key: 'bowls', label: 'Bowl Season',   color: '#10b981', textColor: '#fff' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12 px-6 text-center shadow-sm">
        <div className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-4 inline-block border"
             style={{ color: '#25bee8', borderColor: '#25bee8' }}>
          2026 Postseason
        </div>
        <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
          <span style={{ color: '#25bee8' }}>POST</span><span style={{ color: '#f5ce42' }}>SEASON</span>
        </h1>
      </div>

      {/* Tab bar */}
      <div className="max-w-4xl mx-auto px-6 mt-6 mb-8">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-1.5">
          {TAB_CFG.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="cursor-pointer flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap"
              style={activeTab === tab.key
                ? { backgroundColor: tab.color, color: tab.textColor }
                : { color: '#94a3b8' }}
            >
              {tab.label}
              {tab.key === 'ccg' && !actualCcgsComplete && (
                <span className="ml-1.5 w-1.5 h-1.5 inline-block rounded-full bg-red-500 animate-pulse align-middle" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">

        {/* ── IF PLAYOFF TODAY ─────────────────────────────────────────────── */}
        {activeTab === 'today' && (
          <div>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">If Playoff Happened Today</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                    Based on CFP Committee Rankings · Week {cfpPoll.currentWeek != null ? cfpPoll.currentWeek - 1 : '—'}
                  </p>
                </div>
                {cfpPoll.lastUpdated && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-white border border-gray-200 px-3 py-1.5 rounded-full">
                    Updated {new Date(cfpPoll.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>

              {!cfpPoll.isLoaded || ifTodaySeeds.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                  <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                    CFP Rankings not yet available.
                  </p>
                  <p className="text-slate-400 text-xs mt-2">CFP Committee releases rankings each Tuesday starting Week 9.</p>
                </div>
              ) : (
                <>
                  {/* Seeds 1-4: First-round byes */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-gray-200" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Seeds 1–4 · First Round Bye (Top 4 Ranked)</span>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ifTodaySeeds.filter(t => t.seed <= 4).map(team => (
                        <TodaySeedCard key={team.id} team={team} />
                      ))}
                    </div>
                  </div>

                  {/* First-round matchups */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-gray-200" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">First Round Matchups</span>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {todayMatchups.map(({ higher, lower }) => higher && lower ? (
                        <div key={higher.seed} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="bg-slate-50 px-4 py-2 border-b border-gray-100">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                              #{higher.seed} vs #{lower.seed} · Campus Site
                            </span>
                          </div>
                          <div className="p-3 space-y-1">
                            <TodaySeedCard team={higher} opponent={lower} />
                            <div className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest py-0.5">vs</div>
                            <TodaySeedCard team={lower} opponent={higher} />
                          </div>
                        </div>
                      ) : null)}
                    </div>
                  </div>

                  {/* Key */}
                  <div className="mt-6 flex flex-wrap gap-3 items-center justify-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Key:</span>
                    <span className="text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Auto · Conference Leader</span>
                    <span className="text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">At-Large Selection</span>
                    <span className="text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">First Round Bye</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── CHAMPIONSHIPS ────────────────────────────────────────────────── */}
        {activeTab === 'ccg' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Conference Championship Games</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                  {actualCcgsComplete ? 'All games completed' : 'Pick the winner of each game to unlock the CFP bracket'}
                </p>
              </div>
              {!actualCcgsComplete && (
                <span className="text-[10px] font-black uppercase bg-red-100 text-red-600 px-3 py-1.5 rounded-full">
                  Action Required
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {safeCcGames.map(game => (
                <GameCard
                  key={game.id}
                  gameId={game.id}
                  className={results[game.id] ? '' : 'border-slate-900 shadow-lg'}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── CFP BRACKET ──────────────────────────────────────────────────── */}
        {activeTab === 'cfp' && (
          <div>
            {!actualCcgsComplete ? (
              <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-3xl mx-auto mt-6 shadow-sm">
                <p className="text-5xl mb-4">🔒</p>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Bracket Locked</h3>
                <p className="text-slate-500 leading-relaxed max-w-lg mx-auto text-sm">
                  Pick all Conference Championship Games to finalize the 12-team field.
                </p>
                <button
                  onClick={() => setActiveTab('ccg')}
                  className="cursor-pointer mt-6 bg-slate-900 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-colors"
                >
                  Go to Championships
                </button>
              </div>
            ) : (
              <>
                {/* 12-team seeding panel */}
                <div className="max-w-4xl mx-auto mb-10">
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-1">12-Team Field</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                    Why each team earned their seed
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Seeds 1-4: byes */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Seeds 1–4 · First Round Bye</span>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {playoffData.seeds?.slice(0, 4).map((team, i) => {
                          const reason = seedReasons[team.id] || 'At-Large';
                          const isAuto = reason.startsWith('Auto');
                          const rec = teamRecords[team.id] || { wins: team.wins ?? 0, losses: team.losses ?? 0 };
                          return (
                            <div key={team.id} className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
                              <span className="text-2xl font-black italic text-slate-900 w-8 text-center shrink-0">{i + 1}</span>
                              {team.logo && (
                                <img src={team.logo} alt={team.name} onError={e => { e.target.src = '/favicon.ico'; }}
                                  className="w-10 h-10 object-contain shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black uppercase tracking-tight text-slate-900 leading-none truncate">{team.name}</p>
                                <div className="mt-1">
                                  <ReasonChip reason={reason} isAuto={isAuto} />
                                </div>
                              </div>
                              <span className="text-base font-black text-slate-900 tabular-nums shrink-0">
                                {rec.wins}-{rec.losses}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Seeds 5-12: first-round participants */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Seeds 5–12 · First Round</span>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {playoffData.seeds?.slice(4, 12).map((team, i) => {
                          const seed = i + 5;
                          const reason = seedReasons[team.id] || 'At-Large';
                          const isAuto = reason.startsWith('Auto');
                          const rec = teamRecords[team.id] || { wins: team.wins ?? 0, losses: team.losses ?? 0 };
                          // Opponent: 5v12, 6v11, 7v10, 8v9
                          const pairMap = { 5: 12, 6: 11, 7: 10, 8: 9, 9: 8, 10: 7, 11: 6, 12: 5 };
                          const oppSeed = pairMap[seed];
                          const opp = playoffData.seeds?.find((_, j) => j + 1 === oppSeed);
                          return (
                            <div key={team.id} className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
                              <span className="text-2xl font-black italic text-slate-900 w-8 text-center shrink-0">{seed}</span>
                              {team.logo && (
                                <img src={team.logo} alt={team.name} onError={e => { e.target.src = '/favicon.ico'; }}
                                  className="w-10 h-10 object-contain shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black uppercase tracking-tight text-slate-900 leading-none truncate">{team.name}</p>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <ReasonChip reason={reason} isAuto={isAuto} />
                                  {opp && <span className="text-[8px] text-slate-400 font-bold">vs #{oppSeed} {opp.name}</span>}
                                </div>
                              </div>
                              <span className="text-base font-black text-slate-900 tabular-nums shrink-0">
                                {rec.wins}-{rec.losses}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bracket header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-gray-200" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Pick the Bracket</h3>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                {/* Desktop bracket */}
                <div className="hidden lg:block overflow-x-auto pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className="grid grid-cols-4 min-w-[1200px] gap-8 bg-white shadow-sm border border-slate-200 p-6 rounded-3xl">
                    <div className="flex flex-col justify-between h-[750px] py-4">
                      <GameCard gameId="p_r1_4" />
                      <GameCard gameId="p_r1_1" />
                      <GameCard gameId="p_r1_2" />
                      <GameCard gameId="p_r1_3" />
                    </div>
                    <div className="flex flex-col justify-between h-[750px] py-4">
                      <GameCard gameId="p_qf_1" />
                      <GameCard gameId="p_qf_4" />
                      <GameCard gameId="p_qf_3" />
                      <GameCard gameId="p_qf_2" />
                    </div>
                    <div className="flex flex-col justify-around h-[750px] py-16">
                      <GameCard gameId="p_sf_1" />
                      <GameCard gameId="p_sf_2" />
                    </div>
                    <div className="flex flex-col justify-center h-[750px]">
                      <div className="scale-110 origin-left">
                        <GameCard gameId="p_nc" className="border-slate-900 shadow-2xl" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile bracket */}
                <div className="lg:hidden flex flex-col gap-6 pb-8">
                  <div className="bg-white shadow-sm border border-slate-200 p-4 rounded-3xl">
                    <h3 className="text-base font-black uppercase text-slate-900 mb-3 pb-2 border-b border-slate-100">First Round</h3>
                    <div className="flex flex-col gap-3">
                      <GameCard gameId="p_r1_4" />
                      <GameCard gameId="p_r1_1" />
                      <GameCard gameId="p_r1_2" />
                      <GameCard gameId="p_r1_3" />
                    </div>
                  </div>
                  <div className="bg-white shadow-sm border border-slate-200 p-4 rounded-3xl">
                    <h3 className="text-base font-black uppercase text-[#25bee8] mb-3 pb-2 border-b border-slate-100">Quarterfinals</h3>
                    <div className="flex flex-col gap-3">
                      <GameCard gameId="p_qf_1" />
                      <GameCard gameId="p_qf_4" />
                      <GameCard gameId="p_qf_3" />
                      <GameCard gameId="p_qf_2" />
                    </div>
                  </div>
                  <div className="bg-white shadow-sm border border-slate-200 p-4 rounded-3xl">
                    <h3 className="text-base font-black uppercase text-amber-500 mb-3 pb-2 border-b border-slate-100">Semifinals</h3>
                    <div className="flex flex-col gap-3">
                      <GameCard gameId="p_sf_1" />
                      <GameCard gameId="p_sf_2" />
                    </div>
                  </div>
                  <div className="bg-slate-900 p-5 rounded-3xl">
                    <h3 className="text-base font-black uppercase text-white mb-3 pb-2 border-b border-slate-700 text-center">National Championship</h3>
                    <GameCard gameId="p_nc" className="border-slate-700 shadow-2xl" />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── BOWL SEASON ──────────────────────────────────────────────────── */}
        {activeTab === 'bowls' && (
          <div>
            {!actualCcgsComplete ? (
              <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-3xl mx-auto mt-6 shadow-sm">
                <p className="text-5xl mb-4">🔒</p>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Bowl Matchups Locked</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-lg mx-auto">
                  Complete all Conference Championship Games first.
                </p>
                <button
                  onClick={() => setActiveTab('ccg')}
                  className="cursor-pointer mt-6 bg-slate-900 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-colors"
                >
                  Go to Championships
                </button>
              </div>
            ) : safeBowlGames.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Bowl Season</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                      {safeBowlGames.filter(g => results[g.id]).length} of {safeBowlGames.length} games picked
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {safeBowlGames.map(game => (
                    <GameCard
                      key={game.id}
                      gameId={game.id}
                      className={results[game.id] ? '' : 'border-amber-300 shadow-[0_0_12px_rgba(245,206,66,0.15)]'}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center p-12">
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No eligible teams remaining.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayoffBracket;
