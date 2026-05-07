import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';

function TeamPage({ teams, schedule, results, onPick, playoffData }) {
  const { teamId } = useParams();
  const team = useMemo(() => teams.find(t => t.id === teamId), [teams, teamId]);

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

  // Combine regular schedule with dynamic Postseason games
  const teamGames = useMemo(() => {
    const regGames = schedule.filter(g => g.home === teamId || g.away === teamId);
    
    let postGames = [];
    if (playoffData && playoffData.games) {
      postGames = playoffData.games.filter(g => g.home === teamId || g.away === teamId).map(g => ({
        ...g,
        date: g.isCCG ? 'CHAMPIONSHIP' : 'PLAYOFF',
        location: g.detail,
        isPlayoff: !g.isCCG,
        isCCG: g.isCCG
      }));
    }
    
    return [...regGames, ...postGames];
  }, [schedule, teamId, playoffData]);

  const confStyle = getConfStyles(team?.conf);
  const playoffSeed = playoffData?.seedMap[teamId];

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans pb-20">
      <div className="relative pt-16 pb-24 px-6 shadow-2xl overflow-hidden" style={{ backgroundColor: team?.color }}>
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        
        {team?.logo && (
          <img 
            src={team.logo} 
            className="absolute -right-16 -bottom-16 w-96 h-96 opacity-15 grayscale brightness-200 pointer-events-none" 
            alt="" 
          />
        )}

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
          <div className="text-center md:text-left flex-1">
            <Link to="/teams" className="text-white/60 font-black text-[10px] uppercase tracking-[0.4em] mb-6 inline-block hover:text-white transition-colors">← DIRECTORY</Link>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              {team?.logo && (
                <div className="bg-white rounded-full shadow-2xl flex items-center justify-center shrink-0 w-24 h-24 md:w-32 md:h-32">
                  <img src={team.logo} className="w-16 h-16 md:w-20 md:h-20 object-contain" alt={`${team.name} Logo`} />
                </div>
              )}
              
              <div className="flex flex-col">
                {playoffSeed && (
                  <span className="text-white font-black uppercase tracking-widest text-sm drop-shadow-md mb-1 opacity-80">CFP Seed #{playoffSeed}</span>
                )}
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

          <div className="bg-white p-8 rounded-[2.5rem] text-center shadow-2xl min-w-[240px]">
            <p className="text-[10px] uppercase text-slate-400 font-black mb-2 tracking-widest">PROJECTED RECORD</p>
            <p className="text-7xl font-black text-slate-950 tracking-tighter">
              {teamStats.wins}<span className="text-slate-200 px-1 font-light italic">-</span>{teamStats.losses}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">Program Profile</h2>
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            {team?.description || "No program description available."}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-12 space-y-4">
        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 ml-2 mb-6">2026 Season Schedule</h2>
        
        {teamGames.map((game) => {
          const isHome = game.home === teamId;
          const opponentId = isHome ? game.away : game.home;
          const opponent = teams.find(t => t.id === opponentId) || { name: 'TBD', id: null, logo: null };
          const userSelection = results[game.id];
          
          return (
            <div 
              key={game.id} 
              // Changed styling: Playoff games are dark slate, CCG games are light blue
              className={`bg-white border rounded-3xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg border-l-[12px] 
                ${game.isPlayoff ? 'border-slate-900 shadow-md' : game.isCCG ? 'border-[#25bee8] shadow-md' : 'border-gray-100 shadow-sm'}`} 
              style={{ borderLeftColor: game.isPlayoff ? '#0f172a' : game.isCCG ? '#25bee8' : team?.color }}
            >
              <div className="flex flex-col text-center md:text-left w-full md:w-auto mb-4 md:mb-0">
                <p className={`font-black text-[11px] uppercase mb-1 drop-shadow-sm flex items-center justify-center md:justify-start gap-1 
                  ${game.isPlayoff ? 'text-slate-900' : game.isCCG ? 'text-[#25bee8]' : 'text-slate-400'}`}>
                  {game.isPlayoff ? '🏆 CFP ' : game.isCCG ? '🏅 ' : ''} {game.name} • {game.location}
                </p>
                
                {/* Opponent Logo added next to their name */}
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

              <div className="flex gap-2 bg-gray-50 p-1.5 rounded-2xl w-full md:w-auto">
                <button 
                  onClick={() => opponent.id && onPick(game.id, teamId)} 
                  disabled={!opponent.id}
                  className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${userSelection === teamId ? 'text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`} 
                  style={userSelection === teamId ? { backgroundColor: team?.color, boxShadow: `0 4px 12px ${team?.color}40` } : {}}
                >
                  Win
                </button>
                <button 
                  onClick={() => opponent.id && onPick(game.id, opponentId)} 
                  disabled={!opponent.id}
                  className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${userSelection && userSelection !== teamId ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Loss
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TeamPage;