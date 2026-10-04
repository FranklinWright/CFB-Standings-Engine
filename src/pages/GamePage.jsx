import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { getGameWeek, isPastDate } from '../data/weekMap';
import { liveScores, liveResults as liveResultsData, liveLineScores, gamesMeta } from '../data/liveResults';
import { gameStats } from '../data/gameStats';
import { gameDrives } from '../data/gameDrives';
import { coaches } from '../data/coaches';
import { featuredGames } from '../data/featuredGames';
import { gameSummaries } from '../data/gameSummaries';
import { apPoll } from '../data/apPoll';

const AP_ALIASES = {
  'ole miss': 'miss', 'mississippi': 'miss',
  'southern california': 'usc', 'louisiana state': 'lsu',
  'brigham young': 'byu', 'southern methodist': 'smu',
  'texas christian': 'tcu', 'central florida': 'ucf',
  'connecticut': 'uconn', 'pittsburgh': 'pitt',
  'appalachian state': 'appst', 'app state': 'appst',
  'miami (fl)': 'miami',
};

// Labels + colors for drive results
const RESULT_META = {
  'TD':               { label: 'Touchdown',           icon: '🏈', color: '#16a34a' },
  'FG':               { label: 'Field Goal',           icon: '🎯', color: '#2563eb' },
  'SF':               { label: 'Safety',               icon: '🛡️', color: '#7c3aed' },
  'INT TD':           { label: 'Pick-6',               icon: '🔵', color: '#7c3aed' },
  'FUMBLE RETURN TD': { label: 'Fumble Return TD',     icon: '💪', color: '#7c3aed' },
  'FUMBLE TD':        { label: 'Fumble TD',            icon: '💪', color: '#7c3aed' },
  'PUNT TD':          { label: 'Punt Return TD',       icon: '⚡', color: '#7c3aed' },
  'MISSED FG TD':     { label: 'Blocked FG TD',        icon: '🚫', color: '#7c3aed' },
  'Uncategorized':    { label: 'Score',               icon: '📌', color: '#94a3b8' },
};

// Whether the DEFENSE scored on this drive result
const DEFENSE_SCORES = new Set(['SF', 'INT TD', 'FUMBLE RETURN TD', 'FUMBLE TD', 'PUNT TD', 'MISSED FG TD']);

function StatRow({ label, homeVal, awayVal, homeColor, awayColor, invert = false }) {
  const h = parseFloat(String(homeVal ?? 0).replace(/[^\d.]/g, '')) || 0;
  const a = parseFloat(String(awayVal ?? 0).replace(/[^\d.]/g, '')) || 0;
  const total = h + a;
  const homePct = total > 0 ? Math.round((h / total) * 100) : 50;
  const homeLeads = invert ? h < a : h > a;
  const awayLeads = invert ? a < h : a > h;
  return (
    <div className="py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-lg font-black tabular-nums w-16 text-left ${homeLeads ? 'text-slate-900' : 'text-slate-400'}`}>{homeVal ?? '—'}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center flex-1">{label}</span>
        <span className={`text-lg font-black tabular-nums w-16 text-right ${awayLeads ? 'text-slate-900' : 'text-slate-400'}`}>{awayVal ?? '—'}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
        <div className="h-full rounded-l-full transition-all duration-700" style={{ width: `${homePct}%`, backgroundColor: homeColor || '#25bee8' }} />
        <div className="h-full flex-1 rounded-r-full transition-all duration-700" style={{ backgroundColor: awayColor || '#f5ce42' }} />
      </div>
    </div>
  );
}

function GamePage({ teams, schedule }) {
  const { gameId } = useParams();
  const id = parseInt(gameId, 10);

  const game = useMemo(() => schedule.find(g => g.id === id), [schedule, id]);
  const homeTeam = useMemo(() => game ? teams.find(t => t.id === game.home) : null, [teams, game]);
  const awayTeam = useMemo(() => game ? teams.find(t => t.id === game.away) : null, [teams, game]);

  const score       = liveScores[id]     ?? null;
  const winner      = liveResultsData[id] ?? null;
  const lineScores  = liveLineScores[id]  ?? null;
  const meta        = gamesMeta[id]       ?? null;
  const hs          = gameStats[id]?.home ?? null;
  const as_         = gameStats[id]?.away ?? null;
  const drives      = gameDrives[id]      ?? [];
  const featured    = featuredGames[id]   ?? null;
  const isFinal     = !!winner;
  const isPast      = game ? isPastDate(game.date) : false;

  // AP rank map (current)
  const apRankMap = useMemo(() => {
    if (!apPoll.isLoaded || !apPoll.rankings?.length) return {};
    const map = {};
    apPoll.rankings.forEach(e => {
      if (e.rank > 25) return;
      const lower = e.school.toLowerCase();
      const aliasId = AP_ALIASES[lower];
      const team = aliasId ? teams.find(t => t.id === aliasId) : teams.find(t => t.name.toLowerCase() === lower);
      if (team) map[team.id] = e.rank;
    });
    return map;
  }, [teams]);

  // AP rank AT TIME of this game (use poll from the week before)
  const preGameRankMap = useMemo(() => {
    if (!game) return {};
    const gameWeek = getGameWeek(game.date);
    // Use the poll that was current FOR this game week (CFBD stores it as history[gameWeek])
    const histKey = String(gameWeek);
    const hist = apPoll.history?.[histKey] ?? [];
    const map = {};
    hist.forEach(e => {
      if (e.rank > 25) return;
      const lower = e.school.toLowerCase();
      const aliasId = AP_ALIASES[lower];
      const team = aliasId ? teams.find(t => t.id === aliasId) : teams.find(t => t.name.toLowerCase() === lower);
      if (team) map[team.id] = e.rank;
    });
    return map;
  }, [game, teams]);

  const coaches_ = { home: homeTeam ? coaches[homeTeam.id] : null, away: awayTeam ? coaches[awayTeam.id] : null };

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🏈</p>
          <h1 className="text-2xl font-black uppercase text-slate-900 mb-2">Game Not Found</h1>
          <Link to="/schedule" className="text-[#25bee8] font-black uppercase text-sm hover:underline">← Back to Schedule</Link>
        </div>
      </div>
    );
  }

  const gameTypeLabel =
    game.type === 'National Championship' ? '🏆 National Championship' :
    game.type?.startsWith('Playoff') ? `🏆 ${game.type}` :
    game.type === 'CCG' ? '🏅 Conference Championship' :
    game.type === 'Bowl' ? `🎳 ${game.bowlName || 'Bowl Game'}` : null;

  // Quarter labels (handle OT)
  const maxQtrs = Math.max((lineScores?.home?.length || 0), (lineScores?.away?.length || 0), 4);
  const quarterLabels = Array.from({ length: maxQtrs }, (_, i) =>
    i < 4 ? `Q${i + 1}` : i === 4 ? 'OT' : `${i - 3}OT`
  );

  const fg = (n) => n != null ? String(n) : '—';

  // Correct the period label for each drive using cumulative line scores.
  // CFBD uses startPeriod, but a drive that began in Q3 and scored in Q4
  // should appear in Q4. We find the earliest quarter whose cumulative score
  // is >= both teams' running totals at the end of the drive.
  function resolvedPeriod(drive) {
    if (!lineScores) return drive.period ?? 1;
    const homeEnd = drive.isHome ? drive.endOffenseScore : drive.endDefenseScore;
    const awayEnd = drive.isHome ? drive.endDefenseScore : drive.endOffenseScore;
    let cumH = 0, cumA = 0;
    const maxQ = Math.max(lineScores.home.length, lineScores.away.length);
    for (let q = 0; q < maxQ; q++) {
      cumH += lineScores.home[q] ?? 0;
      cumA += lineScores.away[q] ?? 0;
      if (homeEnd <= cumH && awayEnd <= cumA) return q + 1;
    }
    return drive.period ?? 1;
  }

  // Group scoring drives by corrected period
  const drivesByPeriod = useMemo(() => {
    if (!drives.length) return {};
    const map = {};
    for (const d of drives) {
      const p = lineScores ? resolvedPeriod(d) : (d.period ?? 1);
      if (!map[p]) map[p] = [];
      map[p].push(d);
    }
    return map;
  }, [drives, lineScores]);

  const periods = Object.keys(drivesByPeriod).map(Number).sort((a, b) => a - b);

  const periodLabel = (p) => p <= 4 ? `Q${p}` : p === 5 ? 'Overtime' : `${p - 4}OT`;

  // For each drive: determine which team (home or away) actually scored points
  function scorerIsHome(drive) {
    return DEFENSE_SCORES.has(drive.result) ? !drive.isHome : drive.isHome;
  }

  // Derive running score after each drive (home perspective)
  function driveScores(drive) {
    const home = drive.isHome
      ? { end: drive.endOffenseScore }
      : { end: drive.endDefenseScore };
    const away = drive.isHome
      ? { end: drive.endDefenseScore }
      : { end: drive.endOffenseScore };
    return { home: home.end, away: away.end };
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Back nav */}
      <div className="max-w-4xl mx-auto px-6 pt-6 flex items-center gap-4">
        <Link to="/schedule" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors">
          ← Schedule
        </Link>
        {featured?.gameDay && (
          <span className="text-[9px] font-black uppercase tracking-widest bg-[#e8343a] text-white px-3 py-1.5 rounded-full">
            📺 College GameDay
          </span>
        )}
        {featured?.bigNoon && (
          <span className="text-[9px] font-black uppercase tracking-widest bg-[#0032A0] text-white px-3 py-1.5 rounded-full">
            🌞 Big Noon Kickoff
          </span>
        )}
        {featured?.abcNight && (
          <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-full">
            🌙 ABC Saturday Night Football
          </span>
        )}
      </div>

      {/* ── Hero: split team colors ── */}
      <div className="relative overflow-hidden mt-4 mx-4 md:mx-auto md:max-w-4xl rounded-3xl shadow-2xl">
        <div className="flex min-h-[180px] md:min-h-[220px]">
          {/* Away */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-5 relative overflow-hidden"
            style={{ backgroundColor: awayTeam?.color || '#64748b' }}>
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            {awayTeam?.logo && <img src={awayTeam.logo} alt="" className="absolute opacity-10 w-44 h-44 object-contain -bottom-6 -left-6 pointer-events-none" onError={e => e.target.style.display='none'} />}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              {preGameRankMap[awayTeam?.id] && (
                <span className="bg-white/25 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                  Was #{preGameRankMap[awayTeam.id]} AP
                </span>
              )}
              {awayTeam?.logo && (
                <div className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center">
                  <img src={awayTeam.logo} alt={awayTeam.name} className="w-9 h-9 object-contain" onError={e => e.target.src='/favicon.ico'} />
                </div>
              )}
              <Link to={awayTeam ? `/team/${awayTeam.id}` : '#'} className="text-white font-black uppercase tracking-tight text-base md:text-xl text-center leading-tight hover:opacity-80 drop-shadow-md">
                {awayTeam?.name || 'TBD'}
              </Link>
              <span className="text-white/50 text-[8px] font-black uppercase tracking-widest">Away</span>
              {coaches_.away && <span className="text-white/50 text-[8px] font-bold">{coaches_.away.headCoach}</span>}
            </div>
          </div>

          {/* Center */}
          <div className="bg-white flex flex-col items-center justify-center px-4 gap-1 z-10 shadow-xl min-w-[110px] md:min-w-[130px]">
            {isFinal && score ? (
              <>
                <div className="flex items-center gap-2">
                  <span className={`text-4xl md:text-5xl font-black tabular-nums ${winner === game.away ? 'text-slate-900' : 'text-slate-300'}`}>{score.away}</span>
                  <span className="text-slate-200 font-bold text-lg">–</span>
                  <span className={`text-4xl md:text-5xl font-black tabular-nums ${winner === game.home ? 'text-slate-900' : 'text-slate-300'}`}>{score.home}</span>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1 rounded-full">FINAL</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-black text-slate-200">vs</span>
                {isPast && !isFinal && <span className="text-[8px] font-black uppercase tracking-widest bg-slate-400 text-white px-3 py-1 rounded-full">PAST</span>}
              </>
            )}
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{game.date}</span>
          </div>

          {/* Home */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-5 relative overflow-hidden"
            style={{ backgroundColor: homeTeam?.color || '#64748b' }}>
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            {homeTeam?.logo && <img src={homeTeam.logo} alt="" className="absolute opacity-10 w-44 h-44 object-contain -bottom-6 -right-6 pointer-events-none" onError={e => e.target.style.display='none'} />}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              {preGameRankMap[homeTeam?.id] && (
                <span className="bg-white/25 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                  Was #{preGameRankMap[homeTeam.id]} AP
                </span>
              )}
              {homeTeam?.logo && (
                <div className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center">
                  <img src={homeTeam.logo} alt={homeTeam.name} className="w-9 h-9 object-contain" onError={e => e.target.src='/favicon.ico'} />
                </div>
              )}
              <Link to={homeTeam ? `/team/${homeTeam.id}` : '#'} className="text-white font-black uppercase tracking-tight text-base md:text-xl text-center leading-tight hover:opacity-80 drop-shadow-md">
                {homeTeam?.name || 'TBD'}
              </Link>
              <span className="text-white/50 text-[8px] font-black uppercase tracking-widest">Home</span>
              {coaches_.home && <span className="text-white/50 text-[8px] font-bold">{coaches_.home.headCoach}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-4 mt-4">

        {/* ── Game Summary ── */}
        {(() => {
          const summary = featured?.summary || gameSummaries[id];
          if (!summary || !isFinal) return null;
          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Game Summary</p>
              <p className="text-slate-700 leading-relaxed text-sm font-medium">{summary}</p>
            </div>
          );
        })()}

        {/* ── Quarter Scoreboard ── */}
        {isFinal && lineScores && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-5 py-3 w-28">Team</th>
                  {quarterLabels.map(q => (
                    <th key={q} className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 py-3 text-center">{q}</th>
                  ))}
                  <th className="text-[9px] font-black uppercase tracking-widest text-slate-900 px-5 py-3 text-center bg-gray-50">FINAL</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { team: awayTeam, side: 'away', scores: lineScores.away, total: score?.away, isWinner: winner === game.away },
                  { team: homeTeam, side: 'home', scores: lineScores.home, total: score?.home, isWinner: winner === game.home },
                ].map(({ team, side, scores, total, isWinner }) => (
                  <tr key={side} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {team?.logo && <img src={team.logo} alt="" className="w-5 h-5 object-contain" onError={e => e.target.style.display='none'} />}
                        <span className="font-black text-slate-900 text-sm uppercase tracking-tight leading-tight">{team?.name || side}</span>
                      </div>
                    </td>
                    {Array.from({ length: maxQtrs }, (_, i) => (
                      <td key={i} className="text-center px-3 py-4">
                        <span className="text-lg font-black text-slate-700 tabular-nums">{scores?.[i] ?? '—'}</span>
                      </td>
                    ))}
                    <td className="text-center px-5 py-4 bg-gray-50">
                      <span className={`text-2xl font-black tabular-nums ${isWinner ? 'text-slate-900' : 'text-slate-400'}`}>{total ?? '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Game Meta ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center justify-center p-4 text-center">
            {gameTypeLabel && <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">{gameTypeLabel}</span>}
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{game.date}</span>
            {(meta?.venue || game.location) && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">📍 {meta?.venue || game.location}</span>
            )}
            {meta?.neutralSite && <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">Neutral Site</span>}
            {meta?.attendance && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">👥 {meta.attendance.toLocaleString()}</span>}
          </div>
        </div>

        {/* ── Scoring Timeline ── */}
        {isFinal && drives.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Scoring Summary</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: awayTeam?.color }} />
                  <span className="text-[9px] font-black text-slate-400 uppercase">{awayTeam?.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: homeTeam?.color }} />
                  <span className="text-[9px] font-black text-slate-400 uppercase">{homeTeam?.name}</span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {periods.map(period => (
                <div key={period}>
                  {/* Period header */}
                  <div className="px-6 py-2 bg-gray-50/70 flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{periodLabel(period)}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {drivesByPeriod[period].map((drive, i) => {
                    const scorerHome = scorerIsHome(drive);
                    const scorerTeam = scorerHome ? homeTeam : awayTeam;
                    const rm = RESULT_META[drive.result] || { label: drive.result, icon: '🏈', color: '#64748b' };
                    const afterScore = driveScores(drive);

                    return (
                      <div key={i} className="flex items-center px-5 py-3.5 gap-4 hover:bg-gray-50/50 transition-colors">
                        {/* Color accent bar */}
                        <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: scorerTeam?.color || '#94a3b8' }} />

                        {/* Team logo */}
                        {scorerTeam?.logo ? (
                          <img src={scorerTeam.logo} alt="" className="w-7 h-7 object-contain shrink-0" onError={e => e.target.style.display='none'} />
                        ) : (
                          <div className="w-7 h-7 shrink-0" />
                        )}

                        {/* Drive info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm">{scorerTeam?.name || '—'}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: rm.color }}>
                              {rm.icon} {rm.label}
                            </span>
                          </div>
                          {(drive.plays > 0 || drive.yards > 0 || drive.elapsed) && (
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                              {drive.plays > 0 && `${drive.plays} plays`}
                              {drive.plays > 0 && drive.yards > 0 && ' · '}
                              {drive.yards > 0 && `${drive.yards} yds`}
                              {drive.elapsed && drive.elapsed !== '0:00' && ` · ${drive.elapsed}`}
                            </p>
                          )}
                        </div>

                        {/* Running score */}
                        <div className="text-right shrink-0">
                          <p className="font-black text-slate-900 text-sm tabular-nums">
                            <span style={{ color: awayTeam?.color }}>{afterScore.away}</span>
                            <span className="text-slate-300 mx-1">–</span>
                            <span style={{ color: homeTeam?.color }}>{afterScore.home}</span>
                          </p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Score</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Team Stats ── */}
        {hs && as_ && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {awayTeam?.logo && <img src={awayTeam.logo} alt="" className="w-6 h-6 object-contain" onError={e => e.target.style.display='none'} />}
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">{awayTeam?.name}</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Team Stats</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">{homeTeam?.name}</span>
                {homeTeam?.logo && <img src={homeTeam.logo} alt="" className="w-6 h-6 object-contain" onError={e => e.target.style.display='none'} />}
              </div>
            </div>

            <StatRow label="Total Yards" homeVal={hs.totalYards} awayVal={as_.totalYards} homeColor={homeTeam?.color} awayColor={awayTeam?.color} />
            <StatRow label="Rush Yards" homeVal={hs.rushingYards} awayVal={as_.rushingYards} homeColor={homeTeam?.color} awayColor={awayTeam?.color} />
            <StatRow label="Pass Yards" homeVal={hs.netPassingYards} awayVal={as_.netPassingYards} homeColor={homeTeam?.color} awayColor={awayTeam?.color} />
            <StatRow label="First Downs" homeVal={hs.firstDowns} awayVal={as_.firstDowns} homeColor={homeTeam?.color} awayColor={awayTeam?.color} />
            <StatRow label="Turnovers" homeVal={hs.turnovers} awayVal={as_.turnovers} homeColor={homeTeam?.color} awayColor={awayTeam?.color} invert />
            <StatRow label="Sacks Allowed" homeVal={as_.sacks} awayVal={hs.sacks} homeColor={homeTeam?.color} awayColor={awayTeam?.color} invert />
            <StatRow label="Penalties" homeVal={hs.penalties} awayVal={as_.penalties} homeColor={homeTeam?.color} awayColor={awayTeam?.color} invert />

            {/* Passing / Down efficiency */}
            <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-6">
              {[{ team: awayTeam, s: as_ }, { team: homeTeam, s: hs }].map(({ team, s }) => (
                <div key={team?.id}>
                  <div className="flex items-center gap-1.5 mb-3">
                    {team?.logo && <img src={team.logo} alt="" className="w-4 h-4 object-contain" onError={e => e.target.style.display='none'} />}
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{team?.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><p className="text-sm font-black text-slate-900">{fg(s.passCompletions)}/{fg(s.passAttempts)}</p><p className="text-[8px] text-slate-400 font-black uppercase">Passing</p></div>
                    <div><p className="text-sm font-black text-slate-900">{fg(s.yardsPerPass)}</p><p className="text-[8px] text-slate-400 font-black uppercase">YD/Att</p></div>
                    <div><p className="text-sm font-black text-slate-900">{fg(s.yardsPerRushAttempt)}</p><p className="text-[8px] text-slate-400 font-black uppercase">YD/Car</p></div>
                    {s.thirdDownConversions != null && (
                      <div><p className="text-sm font-black text-slate-900">{fg(s.thirdDownConversions)}/{fg(s.thirdDowns)}</p><p className="text-[8px] text-slate-400 font-black uppercase">3rd Dn</p></div>
                    )}
                    {s.fourthDownConversions != null && (
                      <div><p className="text-sm font-black text-slate-900">{fg(s.fourthDownConversions)}/{fg(s.fourthDowns)}</p><p className="text-[8px] text-slate-400 font-black uppercase">4th Dn</p></div>
                    )}
                    {s.possessionTime && (
                      <div><p className="text-sm font-black text-slate-900">{s.possessionTime}</p><p className="text-[8px] text-slate-400 font-black uppercase">Poss.</p></div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Defensive breakdown */}
            <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-6">
              {[{ team: awayTeam, s: as_ }, { team: homeTeam, s: hs }].map(({ team, s }) => (
                <div key={team?.id}>
                  <div className="flex items-center gap-1.5 mb-3">
                    {team?.logo && <img src={team.logo} alt="" className="w-4 h-4 object-contain" onError={e => e.target.style.display='none'} />}
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{team?.name} Defense</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div><p className="text-sm font-black text-slate-900">{fg(s.sacks)}</p><p className="text-[8px] text-slate-400 font-black uppercase">Sacks</p></div>
                    <div><p className="text-sm font-black text-slate-900">{fg(s.tacklesForLoss)}</p><p className="text-[8px] text-slate-400 font-black uppercase">TFL</p></div>
                    <div><p className="text-sm font-black text-slate-900">{fg(s.passesDeflected)}</p><p className="text-[8px] text-slate-400 font-black uppercase">PD</p></div>
                    <div><p className="text-sm font-black text-slate-900">{fg(s.qbHurries)}</p><p className="text-[8px] text-slate-400 font-black uppercase">HUR</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GamePage;
