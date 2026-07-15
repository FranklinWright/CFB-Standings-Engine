/**
 * @file TeamPage.jsx
 * @description Renders the comprehensive team dashboard including 2026 schedule, 
 * historical trophy room, head-to-head comparison tool, and the "Whack-an-Opponent" minigame.
 */

import { useParams, Link } from 'react-router-dom';
import { useMemo, useState, useEffect, useRef } from 'react';
import { historicalData } from '../data/history';

/**
 * TeamPage Component
 * @param {Object} props
 * @param {Array} props.teams - Full list of team objects
 * @param {Array} props.schedule - 2026 season game objects
 * @param {Object} props.results - Mapping of gameId to selected winnerId
 * @param {Function} props.onPick - Handler for recording user game picks
 * @param {Object} props.playoffData - Playoff structure, seeds, and completion state
 */
function TeamPage({ teams, schedule, results, onPick, playoffData }) {
  const { teamId } = useParams();
  const team = useMemo(() => teams.find(t => t.id === teamId), [teams, teamId]);

  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState('season');

  // --- LEGACY STATES ---
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDecade, setSelectedDecade] = useState('');
  const [h2hOpponentId, setH2hOpponentId] = useState('');
  const [h2hSearch, setH2hSearch] = useState('');
  const [isH2hDropdownOpen, setIsH2hDropdownOpen] = useState(false);

  // --- REWARD STATES ---
  const [hasPerfectScore, setHasPerfectScore] = useState(() => localStorage.getItem(`perfect_score_${teamId}`) === 'true');
  const [isChampionTheme, setIsChampionTheme] = useState(() => localStorage.getItem(`champion_theme_active_${teamId}`) !== 'false' && localStorage.getItem(`perfect_score_${teamId}`) === 'true');

  const toggleTheme = () => {
    const newState = !isChampionTheme;
    setIsChampionTheme(newState);
    localStorage.setItem(`champion_theme_active_${teamId}`, newState ? 'true' : 'false');
  };

  const getConfStyles = (conf) => {
    const styles = {
      'SEC': { bg: '#f5ce42', text: '#000' },
      'Big Ten': { bg: '#25bee8', text: '#fff' },
      'ACC': { bg: '#003087', text: '#fff' },
      'Big 12': { bg: '#C41230', text: '#fff' }, 
      'Pac-12': { bg: '#ff4d4d', text: '#fff' },
      'American': { bg: '#006747', text: '#fff' },
      'Independent': { bg: '#0c2340', text: '#fff' },
      'CUSA': { bg: '#C5B783', text: '#000' },
      'MAC': { bg: '#000000', text: '#fff' },
      'Mountain West': { bg: '#4A2580', text: '#fff' },
      'Sun Belt': { bg: '#004B87', text: '#fff' }
    };
    return styles[conf] || { bg: '#94a3b8', text: '#fff' };
  };

  const getGameTypeMeta = (game) => {
    const t = game.type || 'Regular';
    if (t === 'National Championship') return { label: '🏆 National Championship', color: '#eab308', special: true };
    if (t.startsWith('Playoff')) return { label: `🏆 ${t}`, color: '#0f172a', special: true };
    if (t === 'CCG') return { label: '🏅 Conf Championship', color: '#25bee8', special: true };
    if (t === 'Bowl') return { label: `🎳 ${game.bowlName || 'Bowl Game'}`, color: '#f5ce42', special: true };
    return { label: 'Regular Season', color: team?.color, special: false };
  };

  const teamStats = useMemo(() => {
    let wins = 0; let losses = 0;
    schedule.forEach(game => { if (results[game.id]) { if (results[game.id] === teamId) wins++; else if (game.home === teamId || game.away === teamId) losses++; } });
    return { wins, losses };
  }, [schedule, results, teamId]);

  const teamGames = useMemo(() => {
    const regGames = schedule.filter(g => g.home === teamId || g.away === teamId);
    let postGames = [];
    if (playoffData && playoffData.games) {
      postGames = playoffData.games.filter(g => g.home === teamId || g.away === teamId).map(g => ({ ...g, date: g.isCCG ? 'CHAMPIONSHIP' : g.isBowl ? 'BOWL GAME' : 'PLAYOFF' }));
    }
    return [...regGames, ...postGames];
  }, [schedule, teamId, playoffData]);

  const confStyle = getConfStyles(team?.conf);
  const playoffSeed = playoffData?.ccgsComplete ? playoffData?.seedMap[teamId] : null;

  const historicalRecords = useMemo(() => {
    let nattyYears = [], confYears = [], totalWins = 0, totalLosses = 0;
    Object.values(historicalData || {}).forEach(yearData => {
      if (yearData.nationalChampion === teamId) nattyYears.push(yearData.year);
      if (Object.values(yearData.conferenceChampions || {}).includes(teamId)) confYears.push(yearData.year);
      const teamSchedule = yearData.schedules[teamId];
      if (teamSchedule) teamSchedule.forEach(g => { if (g.result === 'W') totalWins++; if (g.result === 'L') totalLosses++; });
    });
    return { nattyYears: nattyYears.sort((a,b)=>b-a), confYears: confYears.sort((a,b)=>b-a), totalWins, totalLosses };
  }, [teamId]);

  const availableYears = useMemo(() => Object.keys(historicalData || {}).map(Number).sort((a, b) => b - a), []);
  const decades = useMemo(() => Array.from(new Set(availableYears.map(y => Math.floor(y / 10) * 10))).sort((a, b) => b - a), [availableYears]);
  const yearsInDecade = useMemo(() => selectedDecade === '' ? [] : availableYears.filter(y => Math.floor(y / 10) * 10 === Number(selectedDecade)), [availableYears, selectedDecade]);

  const h2hStats = useMemo(() => {
    if (!h2hOpponentId) return null;
    let w = 0, l = 0, pf = 0, pa = 0;
    let matchups = [];
    Object.values(historicalData || {}).forEach(yearData => {
      const teamSchedule = yearData.schedules[teamId];
      if (teamSchedule) teamSchedule.forEach(game => {
          if (game.opponentId === h2hOpponentId) {
            matchups.push({ year: yearData.year, ...game });
            if (game.result === 'W') w++; if (game.result === 'L') l++;
            pf += game.ourScore; pa += game.theirScore;
          }
      });
    });
    return { wins: w, losses: l, avgPf: matchups.length > 0 ? (pf / matchups.length).toFixed(1) : 0, avgPa: matchups.length > 0 ? (pa / matchups.length).toFixed(1) : 0, matchups: matchups.sort((a, b) => b.year - a.year) };
  }, [teamId, h2hOpponentId]);

  const filteredH2hOpponents = useMemo(() => teams.filter(t => t.id !== teamId && t.name.toLowerCase().includes(h2hSearch.toLowerCase())), [teams, teamId, h2hSearch]);

  const [showMinigame, setShowMinigame] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeEnemies, setActiveEnemies] = useState([]); 
  const timeoutRefs = useRef(new Map()); 
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const hasPerfect = localStorage.getItem(`perfect_score_${teamId}`) === 'true';
    setHasPerfectScore(hasPerfect);
    setIsChampionTheme(hasPerfect && localStorage.getItem(`champion_theme_active_${teamId}`) !== 'false');
    const savedHi = localStorage.getItem(`whack_score_${teamId}`);
    setHighScore(savedHi ? parseInt(savedHi, 10) : 0);
    setActiveTab('season'); setSelectedYear(''); setSelectedDecade(''); setH2hOpponentId(''); setH2hSearch('');
    timeoutRefs.current.forEach(clearTimeout); timeoutRefs.current.clear();
  }, [teamId]);

  const opponents = useMemo(() => {
    if (!teams || !teamGames) return [];
    const oppIds = new Set(teamGames.map(g => g.home === teamId ? g.away : g.home));
    return Array.from(oppIds).map(id => teams.find(t => t.id === id)).filter(t => t && t.logo && t.id !== teamId);
  }, [teamGames, teams, teamId]);

  useEffect(() => {
    let timer;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => { setTimeLeft(prev => prev <= 0.1 ? 0 : prev - 0.1); }, 100); 
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      if (score >= 20 && misses === 0) { setHasPerfectScore(true); setIsChampionTheme(true); localStorage.setItem(`perfect_score_${teamId}`, 'true'); localStorage.setItem(`champion_theme_active_${teamId}`, 'true'); }
      if (score > highScore) { setHighScore(score); localStorage.setItem(`whack_score_${teamId}`, score); }
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, score, misses, highScore, teamId]);

  useEffect(() => {
    let spawner;
    if (isPlaying) {
      const spawnRate = Math.max(450, 750 - (score * 5)); 
      spawner = setInterval(() => {
        if (opponents.length > 0) {
          const numToSpawn = score >= 30 ? 3 : score >= 10 ? 2 : 1;
          for (let i = 0; i < numToSpawn; i++) {
            const randomEnemy = opponents[Math.floor(Math.random() * opponents.length)];
            const diff = (randomEnemy.rating || 80) - (team.rating || 80);
            const scale = Math.max(0.35, Math.min(1.8, 1 - (diff * 0.04)));
            const lifespan = Math.max(600, 2000 - (diff * 40));
            const newEnemyId = Math.random().toString(36).substr(2, 9);
            const timerId = setTimeout(() => { setActiveEnemies(prev => prev.filter(e => e.id !== newEnemyId)); setScore(prev => prev - 1); setMisses(prev => prev + 1); timeoutRefs.current.delete(newEnemyId); }, lifespan);
            timeoutRefs.current.set(newEnemyId, timerId);
            setActiveEnemies(prev => [...prev, { id: newEnemyId, opponent: randomEnemy, top: `${15 + Math.random() * 65}%`, left: `${10 + Math.random() * 75}%`, scale, lifespan }]);
          }
        }
      }, spawnRate); 
    } else { timeoutRefs.current.forEach(clearTimeout); timeoutRefs.current.clear(); setActiveEnemies([]); }
    return () => clearInterval(spawner);
  }, [isPlaying, opponents, team, score]);

  const startGame = () => { setScore(0); setMisses(0); setTimeLeft(30); setActiveEnemies([]); setIsPlaying(true); };
  const handleEnemyClick = (e, id) => { e.stopPropagation(); setScore(prev => prev + 1); if (timeoutRefs.current.has(id)) { clearTimeout(timeoutRefs.current.get(id)); timeoutRefs.current.delete(id); } setActiveEnemies(prev => prev.filter(enemy => enemy.id !== id)); };
  const handleBackgroundClick = () => { if (isPlaying) { setScore(prev => prev - 1); setMisses(prev => prev + 1); } };
  const closeMinigame = () => { if (isPlaying && score > highScore) { setHighScore(score); localStorage.setItem(`whack_score_${teamId}`, score); } setShowMinigame(false); setIsPlaying(false); };

  const pageBackgroundClass = isChampionTheme ? "bg-yellow-400/20" : "bg-gray-50";

  return (
    <div className={`min-h-screen text-slate-900 font-sans pb-20 relative transition-colors duration-700 ${pageBackgroundClass}`}>
      
      {/* --- HEADER --- */}
      <div 
        className="relative pt-16 pb-20 px-6 shadow-2xl overflow-hidden transition-colors duration-700" 
        style={{ backgroundColor: isChampionTheme ? '#eab308' : team?.color }}
      >
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        {team?.logo && (
          <img 
            src={team.logo} 
            className={`absolute -right-16 -bottom-16 w-96 h-96 pointer-events-none transition-all duration-1000 
              ${isChampionTheme ? 'opacity-60 mix-blend-overlay scale-110 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]' : 'opacity-15 grayscale brightness-200'}`} 
            alt="" 
          />
        )}

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
          <div className="text-center md:text-left flex-1">
            <Link to="/teams" className="text-white/60 font-black text-[10px] uppercase tracking-[0.4em] mb-6 inline-block hover:text-white transition-colors">← DIRECTORY</Link>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              {team?.logo && (
                <div 
                  onClick={() => setShowMinigame(true)}
                  title="Click to play Whack-an-Opponent!"
                  className={`bg-white rounded-full shadow-2xl flex items-center justify-center shrink-0 w-24 h-24 md:w-32 md:h-32 cursor-pointer transform transition-all hover:scale-110 hover:rotate-3 active:scale-95 group relative z-50 ${isChampionTheme ? 'ring-4 ring-yellow-200' : ''}`}
                >
                  <img src={team.logo} className="w-16 h-16 md:w-20 md:h-20 object-contain group-hover:animate-pulse" alt={`${team.name} Logo`} />
                  <div className="absolute -bottom-2 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">Play</div>
                </div>
              )}
              
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-1">
                  {playoffSeed && (
                    <span className="text-white font-black uppercase tracking-widest text-sm drop-shadow-md opacity-80">CFP Seed #{playoffSeed}</span>
                  )}
                  {hasPerfectScore && (
                    <button 
                      onClick={toggleTheme}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer backdrop-blur-md shadow-xl border-2
                        ${isChampionTheme ? 'bg-yellow-600 text-white border-yellow-300 hover:bg-yellow-700' : 'bg-white text-slate-900 border-white animate-pulse hover:scale-105' }`}
                    >
                      👑 Perfect Champion
                    </button>
                  )}
                </div>
                <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-tight text-white drop-shadow-xl">
                  {team?.name}
                </h1>
              </div>
            </div>
            
            {/* BADGE AND NAVIGATION TABS */}
            <div className="mt-8 flex flex-col md:flex-row items-center gap-6">
              <span className="px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl border-2 border-black" style={{ backgroundColor: confStyle.bg, color: confStyle.text }}>
                {team?.conf} {team?.conf !== 'Independent' ? 'CONFERENCE' : ''}
              </span>
              
              <div className="flex gap-2 bg-black/20 p-1.5 rounded-full backdrop-blur-sm">
                <button 
                  onClick={() => setActiveTab('season')}
                  className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'season' ? 'bg-white text-slate-900 shadow-md' : 'text-white/80 hover:text-white hover:bg-black/20'}`}
                >
                  2026 Season
                </button>
                <button 
                  onClick={() => setActiveTab('legacy')}
                  className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'legacy' ? 'bg-white text-slate-900 shadow-md' : 'text-white/80 hover:text-white hover:bg-black/20'}`}
                >
                  Legacy & History
                </button>
              </div>
            </div>

          </div>

          {/* DYNAMIC RECORD BOX: Shows Projected or All-Time based on Tab */}
          <div className={`p-8 rounded-[2.5rem] text-center shadow-2xl min-w-[240px] transition-colors duration-700 ${isChampionTheme ? 'bg-yellow-50' : 'bg-white'}`}>
            <p className={`text-[10px] uppercase font-black mb-2 tracking-widest ${isChampionTheme ? 'text-yellow-700' : 'text-slate-400'}`}>
              {activeTab === 'season' ? 'PROJECTED RECORD' : 'ALL-TIME RECORD'}
            </p>
            <p className={`text-7xl font-black tracking-tighter ${isChampionTheme ? 'text-yellow-600' : 'text-slate-950'}`}>
              {activeTab === 'season' ? (
                <>{teamStats.wins}<span className={`${isChampionTheme ? 'text-yellow-300' : 'text-slate-200'} px-1 font-light italic`}>-</span>{teamStats.losses}</>
              ) : (
                <>{historicalRecords.totalWins}<span className={`${isChampionTheme ? 'text-yellow-300' : 'text-slate-200'} px-1 font-light italic`}>-</span>{historicalRecords.totalLosses}</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
                          TAB 1: 2026 SEASON
          ========================================================= */}
      {activeTab === 'season' && (
        <div className="max-w-4xl mx-auto px-6 animate-fade-in relative z-20">
          
          {/* About / Program Profile */}
          <div className={`-mt-8 rounded-3xl p-8 shadow-xl border transition-colors duration-700 ${isChampionTheme ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 ${isChampionTheme ? 'text-yellow-600' : 'text-slate-400'}`}>Program Profile</h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              {team?.description || "No program description available."}
            </p>
          </div>

          {/* Interactive Schedule */}
          <div className="mt-12 space-y-4">
            <h2 className={`text-xs font-black uppercase tracking-[0.4em] ml-2 mb-6 ${isChampionTheme ? 'text-yellow-700' : 'text-slate-400'}`}>2026 Season Schedule</h2>
            
            {teamGames.map((game) => {
              const isHome = game.home === teamId;
              const opponentId = isHome ? game.away : game.home;
              const opponent = teams.find(t => t.id === opponentId) || { name: 'TBD', id: null, logo: null };
              const userSelection = results[game.id];
              
              return (
                <div 
                  key={game.id} 
                  className={`border rounded-3xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg border-l-[12px] 
                    ${game.isPlayoff ? 'border-slate-900 shadow-md' : game.isCCG ? 'border-[#25bee8] shadow-md' : game.isBowl ? 'border-[#f5ce42] shadow-md' : 'border-gray-100 shadow-sm'}
                    ${isChampionTheme ? 'bg-yellow-50 border-yellow-400 shadow-yellow-500/20' : 'bg-white'}`} 
                  style={{ borderLeftColor: game.isPlayoff ? '#0f172a' : game.isCCG ? '#25bee8' : game.isBowl ? '#f5ce42' : (isChampionTheme ? '#eab308' : team?.color) }}
                >
                  <div className="flex flex-col text-center md:text-left w-full md:w-auto mb-4 md:mb-0">
                    <p className={`font-black text-[11px] uppercase mb-1 drop-shadow-sm flex items-center justify-center md:justify-start gap-1 
                      ${game.isPlayoff ? 'text-slate-900' : game.isCCG ? 'text-[#25bee8]' : game.isBowl ? 'text-[#f5ce42]' : isChampionTheme ? 'text-yellow-600' : 'text-slate-400'}`}>
                      {game.isPlayoff ? '🏆 CFP ' : game.isCCG ? '🏅 ' : game.isBowl ? '🎳 ' : ''} {game.name} {game.location}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-black uppercase text-slate-900 flex items-center justify-center md:justify-start gap-2 md:gap-3">
                      <span className="text-slate-300 italic mr-1 text-lg md:text-xl">{isHome ? 'vs' : '@'}</span>
                      {opponent.logo && <img src={opponent.logo} className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-sm" alt="" />}
                      {opponent.id ? (
                        <Link to={`/team/${opponent.id}`} className="transition-colors duration-200 hover:opacity-70">{opponent.name}</Link>
                      ) : (
                        <span className="text-slate-400">{opponent.name}</span>
                      )}
                    </h3>
                  </div>

                  <div className={`flex gap-2 p-1.5 rounded-2xl w-full md:w-auto ${isChampionTheme ? 'bg-yellow-100/50' : 'bg-gray-50'}`}>
                    <button 
                      onClick={() => opponent.id && onPick(game.id, teamId)} disabled={!opponent.id}
                      className={`cursor-pointer flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${userSelection === teamId ? 'text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`} 
                      style={userSelection === teamId ? { backgroundColor: isChampionTheme ? '#ca8a04' : team?.color, boxShadow: `0 4px 12px ${isChampionTheme ? '#ca8a0440' : team?.color + '40'}` } : {}}
                    >Win</button>
                    <button 
                      onClick={() => opponent.id && onPick(game.id, opponentId)} disabled={!opponent.id}
                      className={`cursor-pointer flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${userSelection && userSelection !== teamId ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >Loss</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
                          TAB 2: LEGACY & HISTORY
          ========================================================= */}
      {activeTab === 'legacy' && (
        <div className="max-w-6xl mx-auto px-6 animate-fade-in relative z-20">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 -mt-8">
            {/* TROPHY ROOM */}
            <div className={`rounded-3xl p-8 shadow-xl border transition-colors duration-700 h-full ${isChampionTheme ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-100'}`}>
              <h2 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-6 ${isChampionTheme ? 'text-yellow-600' : 'text-slate-400'}`}>Trophy Room</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">🏆 National Titles <span className="bg-yellow-200 text-yellow-800 px-2 rounded-full text-xs">{historicalRecords.nattyYears.length}</span></h3>
                  <div className="flex flex-wrap gap-2">
                    {historicalRecords.nattyYears.length > 0 ? historicalRecords.nattyYears.map(year => (
                      <button 
                        key={year} 
                        onClick={() => {
                          setSelectedDecade(Math.floor(year / 10) * 10);
                          setSelectedYear(String(year));
                        }}
                        className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-sm font-black px-3 py-1 rounded-lg border border-yellow-300 shadow-sm cursor-pointer transition-colors active:scale-95"
                        title={`View ${year} Schedule`}
                      >
                        {year}
                      </button>
                    )) : <span className="text-sm text-slate-400 italic">No national championships recorded.</span>}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">🏅 Conference Titles <span className="bg-blue-200 text-blue-800 px-2 rounded-full text-xs">{historicalRecords.confYears.length}</span></h3>
                  <div className="flex flex-wrap gap-2">
                    {historicalRecords.confYears.length > 0 ? historicalRecords.confYears.map(year => (
                      <button 
                        key={year} 
                        onClick={() => {
                          setSelectedDecade(Math.floor(year / 10) * 10);
                          setSelectedYear(String(year));
                        }}
                        className="bg-blue-50 text-blue-800 hover:bg-blue-100 text-sm font-black px-3 py-1 rounded-lg border border-blue-200 shadow-sm cursor-pointer transition-colors active:scale-95"
                        title={`View ${year} Schedule`}
                      >
                        {year}
                      </button>
                    )) : <span className="text-sm text-slate-400 italic">No conference championships recorded.</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* HEAD TO HEAD TOOL */}
            <div className={`rounded-3xl p-8 shadow-xl border transition-colors duration-700 h-full flex flex-col ${isChampionTheme ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-100'}`}>
              <h2 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${isChampionTheme ? 'text-yellow-600' : 'text-slate-400'}`}>Head-to-Head History</h2>
              
              <div className="relative mb-6">
                <input 
                  type="text"
                  placeholder="Search for an opponent..."
                  value={h2hSearch} 
                  onChange={(e) => {
                    setH2hSearch(e.target.value);
                    setIsH2hDropdownOpen(true);
                  }}
                  onFocus={() => setIsH2hDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsH2hDropdownOpen(false), 200)}
                  className="w-full bg-slate-100 border-2 border-slate-200 text-slate-800 font-black uppercase tracking-widest text-sm rounded-xl px-4 py-4 outline-none focus:border-slate-400"
                />
                
                {isH2hDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl max-h-60 overflow-y-auto shadow-xl">
                    {filteredH2hOpponents.length > 0 ? (
                      filteredH2hOpponents.map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => {
                            setH2hOpponentId(t.id);
                            setH2hSearch(t.name);
                            setIsH2hDropdownOpen(false);
                          }}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm font-black uppercase tracking-widest text-slate-700 border-b border-slate-100 last:border-0"
                        >
                          {t.name}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm font-black uppercase tracking-widest text-slate-400">
                        No opponents found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {h2hStats && h2hOpponentId ? (
                <div className="animate-fade-in flex-1 flex flex-col">
                  {h2hStats.matchups.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between bg-slate-900 text-white rounded-2xl p-6 mb-6 shadow-lg">
                        <div className="text-center">
                          <span className="block text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-1">Record</span>
                          <span className="text-3xl font-black" style={{ color: h2hStats.wins > h2hStats.losses ? '#4ade80' : h2hStats.wins < h2hStats.losses ? '#f87171' : '#fff' }}>
                            {h2hStats.wins} - {h2hStats.losses}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-1">Avg PF</span>
                          <span className="text-2xl font-black">{h2hStats.avgPf}</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-1">Avg PA</span>
                          <span className="text-2xl font-black">{h2hStats.avgPa}</span>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-[250px] pr-2 space-y-3">
                        {h2hStats.matchups.map((game, i) => (
                          <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                            <div>
                              <span className="text-sm font-black text-slate-900 block">{game.year} Season</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{game.type === 'Bowl' && game.bowlName ? game.bowlName : game.type}</span>
                            </div>
                            <div className="text-right flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-100 shadow-sm">
                              <span className="text-base font-bold text-slate-600">{game.ourScore} - {game.theirScore}</span>
                              <span className={`text-lg font-black ${game.result === 'W' ? 'text-green-600' : 'text-red-600'}`}>{game.result}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50">
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs text-center">No historical matchups recorded<br/>against this opponent.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs text-center">Search and select a team above<br/>to view head-to-head records.</p>
                </div>
              )}
            </div>
          </div>

          {/* PAST SCHEDULE VIEWER */}
          <div className="mt-8">
            <div className={`rounded-3xl p-8 shadow-xl border transition-colors duration-700 ${isChampionTheme ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-100'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${isChampionTheme ? 'text-yellow-600' : 'text-slate-400'}`}>Historical Schedules</h2>
                  <p className="text-sm text-slate-500 font-bold">Pick a decade, then a season, to view all game results.</p>
                </div>
                {selectedYear !== '' && (
                  <button
                    onClick={() => setSelectedYear('')}
                    className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-2 border-slate-200 hover:border-slate-400 transition-colors cursor-pointer"
                  >
                    ✕ Clear Season
                  </button>
                )}
              </div>

              {/* Decade selector */}
              <div className="flex flex-wrap gap-2">
                {decades.map(dec => (
                  <button
                    key={dec}
                    onClick={() => setSelectedDecade(dec)}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 transition-all cursor-pointer ${Number(selectedDecade) === dec ? 'text-white shadow-md' : 'bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-400'}`}
                    style={Number(selectedDecade) === dec ? { backgroundColor: isChampionTheme ? '#ca8a04' : team?.color, borderColor: isChampionTheme ? '#ca8a04' : team?.color } : {}}
                  >
                    {dec}s
                  </button>
                ))}
              </div>

              {/* Year selector for chosen decade */}
              {selectedDecade !== '' && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                  {yearsInDecade.map(year => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(String(year))}
                      className={`px-4 py-2 rounded-lg text-sm font-black tracking-widest border-2 transition-all cursor-pointer ${String(selectedYear) === String(year) ? 'text-white shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                      style={String(selectedYear) === String(year) ? { backgroundColor: isChampionTheme ? '#ca8a04' : team?.color, borderColor: isChampionTheme ? '#ca8a04' : team?.color } : {}}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 space-y-4">
              {selectedYear === '' ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                  <p className="text-slate-400 font-bold uppercase tracking-widest">
                    {selectedDecade === '' ? 'Select a decade above to begin.' : 'Now pick a season to view the schedule.'}
                  </p>
                </div>
              ) : historicalData && historicalData[selectedYear]?.schedules[teamId] ? (
                historicalData[selectedYear].schedules[teamId].map((game, idx) => {
                  const opp = teams.find(t => t.id === game.opponentId) || { logo: null, id: null };
                  const meta = getGameTypeMeta(game);
                  return (
                    <div 
                      key={idx} 
                      className="border rounded-3xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between border-l-[12px] bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow" 
                      style={{ borderLeftColor: meta.special ? meta.color : team?.color }}
                    >
                      <div className="flex flex-col text-center md:text-left w-full md:w-auto mb-4 md:mb-0">
                        <p 
                          className="font-black text-[11px] uppercase mb-1 drop-shadow-sm flex items-center justify-center md:justify-start gap-1 tracking-widest"
                          style={{ color: meta.special ? meta.color : undefined }}
                        >
                          {meta.label}
                        </p>
                        <h3 className="text-2xl md:text-3xl font-black uppercase text-slate-900 flex items-center justify-center md:justify-start gap-3">
                          <span className="text-slate-300 italic mr-1 text-lg md:text-xl">vs</span>
                          {opp.logo && <img src={opp.logo} className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-sm" alt="" />}
                          {opp.id ? (
                            <Link to={`/team/${opp.id}`} className="transition-colors duration-200 hover:opacity-70 text-slate-800">{game.opponentName}</Link>
                          ) : (
                            <span className="text-slate-800">{game.opponentName}</span>
                          )}
                        </h3>
                      </div>

                      <div className="flex flex-col text-center items-center px-8 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className={`text-2xl font-black ${game.result === 'W' ? 'text-green-600' : 'text-red-600'}`}>{game.result}</span>
                        <span className="text-slate-600 font-bold tracking-widest text-lg">{game.ourScore} - {game.theirScore}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                  <p className="text-slate-400 font-bold uppercase tracking-widest">No schedule data found for {team?.name} in {selectedYear}.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
                          MINIGAME MODAL OVERLAY 
          ========================================================= */}
      {showMinigame && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <style>
            {`
              @keyframes shrinkBar { from { width: 100%; } to { width: 0%; } }
              .enemy-pop-in { animation: popIn 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
              @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
            `}
          </style>
          <div className="relative w-full max-w-4xl h-[75vh] bg-white rounded-[2.5rem] border-4 overflow-hidden shadow-2xl flex flex-col" style={{ borderColor: team?.color }}>
            <div className="bg-gray-50 p-4 md:px-8 flex justify-between items-center z-10 border-b border-gray-200">
              <div className="flex items-center gap-6">
                <div className="text-slate-800 font-black uppercase tracking-widest text-xl">Score: <span style={{ color: score < 0 ? '#ef4444' : team?.color }}>{score}</span></div>
                <div className="hidden sm:block text-slate-400 font-bold uppercase tracking-widest text-sm bg-gray-200/50 px-3 py-1 rounded-lg">Top Score: {highScore}</div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-slate-800 font-black uppercase tracking-widest text-xl w-32 text-right">{timeLeft.toFixed(1)}s</div>
                <button onClick={closeMinigame} className="text-slate-300 hover:text-slate-600 font-black text-2xl cursor-pointer transition-colors">✕</button>
              </div>
            </div>
            {isPlaying && (
              <div className="h-1.5 w-full bg-gray-100">
                 <div className="h-full transition-all duration-100 ease-linear" style={{ width: `${(timeLeft / 30) * 100}%`, backgroundColor: team?.color }} />
              </div>
            )}
            <div className="flex-1 relative overflow-hidden bg-white cursor-default" onClick={handleBackgroundClick}>
              {!isPlaying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20">
                  <h2 className="text-4xl md:text-6xl font-black italic uppercase text-slate-900 mb-2 tracking-tighter text-center px-4">Whack-an-Opponent</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest mb-2 text-center px-4 text-xs">{score !== 0 ? `Game Over! Final Score: ${score} | Misses: ${misses}` : "Score 20+ with 0 Misses to permanently unlock the Perfect Champion reward!"}</p>
                  {score >= 20 && misses === 0 && (
                     <p className="text-white font-black uppercase tracking-widest mb-8 text-center px-4 text-sm rounded-lg py-2 shadow-lg" style={{ backgroundColor: team?.color }}>🏆 PERFECT SCORE UNLOCKED! 🏆</p>
                  )}
                  {score !== 0 && (score < 20 || misses > 0) && (
                     <p className="text-red-400 font-bold uppercase tracking-widest mb-8 text-center px-4 text-[10px]">Challenge Failed.</p>
                  )}
                  <button onClick={startGame} className="px-8 py-4 rounded-2xl text-white font-black uppercase tracking-widest transition-transform hover:scale-105 active:scale-95 shadow-xl cursor-pointer mt-4" style={{ backgroundColor: team?.color }}>
                    {score !== 0 ? "Play Again" : "Start Game"}
                  </button>
                </div>
              )}
              {isPlaying && activeEnemies.map(enemy => {
                const size = 110 * enemy.scale; 
                return (
                  <div key={enemy.id} onClick={(e) => handleEnemyClick(e, enemy.id)} className="absolute bg-white border border-gray-100 rounded-full flex flex-col items-center justify-center shadow-xl enemy-pop-in hover:scale-105 hover:shadow-2xl transition-shadow cursor-pointer" style={{ top: enemy.top, left: enemy.left, width: `${size}px`, height: `${size}px` }}>
                    <div className="absolute -top-4 w-3/4 h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-sm pointer-events-none">
                      <div className="h-full bg-red-500" style={{ animation: `shrinkBar ${enemy.lifespan}ms linear forwards` }} />
                    </div>
                    <img src={enemy.opponent.logo} alt={enemy.opponent.name} className="w-[70%] h-[70%] object-contain pointer-events-none" />
                  </div>
                );
              })}
            </div>
            <div className="bg-gray-50 p-3 text-center z-10 border-t border-gray-200">
              <span className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-400">Misses cost you -1 point!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamPage;