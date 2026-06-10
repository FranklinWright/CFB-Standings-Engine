import { useParams, Link } from 'react-router-dom';
import { useMemo, useState, useEffect, useRef } from 'react';

function TeamPage({ teams, schedule, results, onPick, playoffData }) {
  const { teamId } = useParams();
  const team = useMemo(() => teams.find(t => t.id === teamId), [teams, teamId]);

  // --- REWARD STATES ---
  const [hasPerfectScore, setHasPerfectScore] = useState(() => {
    return localStorage.getItem(`perfect_score_${teamId}`) === 'true';
  });
  
  const [isChampionTheme, setIsChampionTheme] = useState(() => {
    return localStorage.getItem(`champion_theme_active_${teamId}`) !== 'false' && localStorage.getItem(`perfect_score_${teamId}`) === 'true';
  });

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
      'Independent': { bg: '#0c2340', text: '#fff' }
    };
    return styles[conf] || { bg: '#94a3b8', text: '#fff' };
  };

  const teamStats = useMemo(() => {
    let wins = 0; let losses = 0;
    schedule.forEach(game => {
      if (results[game.id]) {
        if (results[game.id] === teamId) wins++;
        else if (game.home === teamId || game.away === teamId) losses++;
      }
    });
    return { wins, losses };
  }, [schedule, results, teamId]);

  const teamGames = useMemo(() => {
    const regGames = schedule.filter(g => g.home === teamId || g.away === teamId);
    
    let postGames = [];
    if (playoffData && playoffData.games) {
      postGames = playoffData.games.filter(g => g.home === teamId || g.away === teamId).map(g => ({
        ...g,
        date: g.isCCG ? 'CHAMPIONSHIP' : g.isBowl ? 'BOWL GAME' : 'PLAYOFF',
        location: g.detail,
        isPlayoff: !g.isCCG && !g.isBowl,
        isCCG: g.isCCG,
        isBowl: g.isBowl
      }));
    }
    
    return [...regGames, ...postGames];
  }, [schedule, teamId, playoffData]);

  const confStyle = getConfStyles(team?.conf);
  const playoffSeed = playoffData?.ccgsComplete ? playoffData?.seedMap[teamId] : null;

  // --- MINIGAME STATE & LOGIC ---
  const [showMinigame, setShowMinigame] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeEnemies, setActiveEnemies] = useState([]); 
  const timeoutRefs = useRef(new Map()); 

  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem(`whack_score_${teamId}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  const opponents = useMemo(() => {
    if (!teams || !teamGames) return [];
    const oppIds = new Set(teamGames.map(g => g.home === teamId ? g.away : g.home));
    return Array.from(oppIds)
      .map(id => teams.find(t => t.id === id))
      .filter(t => t && t.logo && t.id !== teamId);
  }, [teamGames, teams, teamId]);

  useEffect(() => {
    let timer;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0.1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 0.1;
        });
      }, 100); 
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      
      if (score >= 20 && misses === 0) {
        setHasPerfectScore(true);
        setIsChampionTheme(true);
        localStorage.setItem(`perfect_score_${teamId}`, 'true');
        localStorage.setItem(`champion_theme_active_${teamId}`, 'true');
      }

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem(`whack_score_${teamId}`, score);
      }
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
            
            const timerId = setTimeout(() => {
              setActiveEnemies(prev => prev.filter(e => e.id !== newEnemyId));
              setScore(prev => prev - 1); 
              setMisses(prev => prev + 1); 
              timeoutRefs.current.delete(newEnemyId);
            }, lifespan);
            
            timeoutRefs.current.set(newEnemyId, timerId);

            setActiveEnemies(prev => [...prev, {
              id: newEnemyId,
              opponent: randomEnemy,
              top: `${15 + Math.random() * 65}%`,
              left: `${10 + Math.random() * 75}%`,
              scale,
              lifespan
            }]);
          }
        }
      }, spawnRate); 
    } else {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current.clear();
      setActiveEnemies([]);
    }
    return () => clearInterval(spawner);
  }, [isPlaying, opponents, team, score]);

  const startGame = () => {
    setScore(0);
    setMisses(0);
    setTimeLeft(30); 
    setActiveEnemies([]);
    setIsPlaying(true);
  };

  const handleEnemyClick = (e, id) => {
    e.stopPropagation(); 
    setScore(prev => prev + 1);
    
    if (timeoutRefs.current.has(id)) {
      clearTimeout(timeoutRefs.current.get(id));
      timeoutRefs.current.delete(id);
    }
    
    setActiveEnemies(prev => prev.filter(enemy => enemy.id !== id));
  };

  const handleBackgroundClick = () => {
    if (isPlaying) {
      setScore(prev => prev - 1);
      setMisses(prev => prev + 1); 
    }
  };

  const closeMinigame = () => {
    if (isPlaying && score > highScore) {
      setHighScore(score);
      localStorage.setItem(`whack_score_${teamId}`, score);
    }
    setShowMinigame(false);
    setIsPlaying(false);
  };
  // --------------------------------

  // Solid gold whole-screen background when Champion
  const pageBackgroundClass = isChampionTheme 
    ? "bg-yellow-400/20" 
    : "bg-gray-50";

  return (
    <div className={`min-h-screen text-slate-900 font-sans pb-20 relative transition-colors duration-700 ${pageBackgroundClass}`}>
      
      {/* Solid Gold Header (No Gradients) */}
      <div 
        className="relative pt-16 pb-24 px-6 shadow-2xl overflow-hidden transition-colors duration-700" 
        style={{ backgroundColor: isChampionTheme ? '#eab308' : team?.color }}
      >
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        
        {team?.logo && (
          <img 
            src={team.logo} 
            className={`absolute -right-16 -bottom-16 w-96 h-96 pointer-events-none transition-all duration-1000 
              ${isChampionTheme 
                ? 'opacity-60 mix-blend-overlay scale-110 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]' 
                : 'opacity-15 grayscale brightness-200'
              }`} 
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
                  <div className="absolute -bottom-2 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                    Play
                  </div>
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
                        ${isChampionTheme 
                          ? 'bg-yellow-600 text-white border-yellow-300 hover:bg-yellow-700' 
                          : 'bg-white text-slate-900 border-white animate-pulse hover:scale-105' 
                        }`}
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
            
            <div className="mt-6 flex items-center justify-center md:justify-start">
              <span 
                className="px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl border-2 border-black"
                style={{ backgroundColor: confStyle.bg, color: confStyle.text }}
              >
                {team?.conf} {team?.conf !== 'Independent' ? 'CONFERENCE' : ''}
              </span>
            </div>
          </div>

          <div className={`p-8 rounded-[2.5rem] text-center shadow-2xl min-w-[240px] transition-colors duration-700 ${isChampionTheme ? 'bg-yellow-50' : 'bg-white'}`}>
            <p className={`text-[10px] uppercase font-black mb-2 tracking-widest ${isChampionTheme ? 'text-yellow-700' : 'text-slate-400'}`}>PROJECTED RECORD</p>
            <p className={`text-7xl font-black tracking-tighter ${isChampionTheme ? 'text-yellow-600' : 'text-slate-950'}`}>
              {teamStats.wins}<span className={`${isChampionTheme ? 'text-yellow-300' : 'text-slate-200'} px-1 font-light italic`}>-</span>{teamStats.losses}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
        <div className={`rounded-3xl p-8 shadow-xl border transition-colors duration-700 ${isChampionTheme ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-100'}`}>
          <h2 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 ${isChampionTheme ? 'text-yellow-600' : 'text-slate-400'}`}>Program Profile</h2>
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            {team?.description || "No program description available."}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-12 space-y-4">
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
                    <Link to={`/team/${opponent.id}`} className="transition-colors duration-200 hover:opacity-70">
                      {opponent.name}
                    </Link>
                  ) : (
                    <span className="text-slate-400">{opponent.name}</span>
                  )}
                </h3>
              </div>

              <div className={`flex gap-2 p-1.5 rounded-2xl w-full md:w-auto ${isChampionTheme ? 'bg-yellow-100/50' : 'bg-gray-50'}`}>
                <button 
                  onClick={() => opponent.id && onPick(game.id, teamId)} 
                  disabled={!opponent.id}
                  className={`cursor-pointer flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${userSelection === teamId ? 'text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`} 
                  style={userSelection === teamId ? { backgroundColor: isChampionTheme ? '#ca8a04' : team?.color, boxShadow: `0 4px 12px ${isChampionTheme ? '#ca8a0440' : team?.color + '40'}` } : {}}
                >
                  Win
                </button>
                <button 
                  onClick={() => opponent.id && onPick(game.id, opponentId)} 
                  disabled={!opponent.id}
                  className={`cursor-pointer flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${userSelection && userSelection !== teamId ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Loss
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MINIGAME MODAL OVERLAY --- */}
      {showMinigame && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <style>
            {`
              @keyframes shrinkBar {
                from { width: 100%; }
                to { width: 0%; }
              }
              .enemy-pop-in {
                animation: popIn 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
              }
              @keyframes popIn {
                0% { transform: scale(0); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}
          </style>
          
          <div className="relative w-full max-w-4xl h-[75vh] bg-white rounded-[2.5rem] border-4 overflow-hidden shadow-2xl flex flex-col" style={{ borderColor: team?.color }}>
            
            {/* Header / Scoreboard */}
            <div className="bg-gray-50 p-4 md:px-8 flex justify-between items-center z-10 border-b border-gray-200">
              <div className="flex items-center gap-6">
                <div className="text-slate-800 font-black uppercase tracking-widest text-xl">
                  Score: <span style={{ color: score < 0 ? '#ef4444' : team?.color }}>{score}</span>
                </div>
                <div className="hidden sm:block text-slate-400 font-bold uppercase tracking-widest text-sm bg-gray-200/50 px-3 py-1 rounded-lg">
                  Top Score: {highScore}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-slate-800 font-black uppercase tracking-widest text-xl w-32 text-right">
                  {timeLeft.toFixed(1)}s
                </div>
                <button 
                  onClick={closeMinigame}
                  className="text-slate-300 hover:text-slate-600 font-black text-2xl cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Main Progress Bar */}
            {isPlaying && (
              <div className="h-1.5 w-full bg-gray-100">
                 <div 
                   className="h-full transition-all duration-100 ease-linear" 
                   style={{ width: `${(timeLeft / 30) * 100}%`, backgroundColor: team?.color }}
                 />
              </div>
            )}

            {/* Game Area */}
            <div 
              className="flex-1 relative overflow-hidden bg-white cursor-default" 
              onClick={handleBackgroundClick}
            >
              {/* Pre-Game / Post-Game Screen */}
              {!isPlaying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20">
                  <h2 className="text-4xl md:text-6xl font-black italic uppercase text-slate-900 mb-2 tracking-tighter text-center px-4">
                    Whack-an-Opponent
                  </h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest mb-2 text-center px-4 text-xs">
                    {score !== 0 ? `Game Over! Final Score: ${score} | Misses: ${misses}` : "Score 20+ with 0 Misses to permanently unlock the Perfect Champion reward!"}
                  </p>
                  
                  {score >= 20 && misses === 0 && (
                     <p className="text-white font-black uppercase tracking-widest mb-8 text-center px-4 text-sm rounded-lg py-2 shadow-lg" style={{ backgroundColor: team?.color }}>
                       🏆 PERFECT SCORE UNLOCKED! 🏆
                     </p>
                  )}
                  {score !== 0 && (score < 20 || misses > 0) && (
                     <p className="text-red-400 font-bold uppercase tracking-widest mb-8 text-center px-4 text-[10px]">
                       Challenge Failed.
                     </p>
                  )}

                  <button 
                    onClick={startGame}
                    className="px-8 py-4 rounded-2xl text-white font-black uppercase tracking-widest transition-transform hover:scale-105 active:scale-95 shadow-xl cursor-pointer mt-4"
                    style={{ backgroundColor: team?.color }}
                  >
                    {score !== 0 ? "Play Again" : "Start Game"}
                  </button>
                </div>
              )}

              {/* Active Enemies Rendering */}
              {isPlaying && activeEnemies.map(enemy => {
                const size = 110 * enemy.scale; 
                return (
                  <div 
                    key={enemy.id}
                    onClick={(e) => handleEnemyClick(e, enemy.id)}
                    className="absolute bg-white border border-gray-100 rounded-full flex flex-col items-center justify-center shadow-xl enemy-pop-in hover:scale-105 hover:shadow-2xl transition-shadow cursor-pointer"
                    style={{ 
                      top: enemy.top, 
                      left: enemy.left, 
                      width: `${size}px`, 
                      height: `${size}px`
                    }}
                  >
                    {/* The timer bar that drops to zero specific to this enemy */}
                    <div className="absolute -top-4 w-3/4 h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-sm pointer-events-none">
                      <div 
                        className="h-full bg-red-500" 
                        style={{ animation: `shrinkBar ${enemy.lifespan}ms linear forwards` }} 
                      />
                    </div>
                    
                    <img src={enemy.opponent.logo} alt={enemy.opponent.name} className="w-[70%] h-[70%] object-contain pointer-events-none" />
                  </div>
                );
              })}
            </div>
            
            <div className="bg-gray-50 p-3 text-center z-10 border-t border-gray-200">
              <span className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-400">
                Misses cost you -1 point!
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default TeamPage;