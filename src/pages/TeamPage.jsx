import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';

function TeamPage({ teams, schedule, results, onPick }) {
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

  const teamGames = useMemo(() => schedule.filter(g => g.home === teamId || g.away === teamId), [schedule, teamId]);
  const confStyle = getConfStyles(team?.conf);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans pb-20">
      <div className="relative pt-16 pb-24 px-6 shadow-2xl overflow-hidden" style={{ backgroundColor: team?.color }}>
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
          <div className="text-center md:text-left flex-1">
            <Link to="/teams" className="text-white/60 font-black text-[10px] uppercase tracking-[0.4em] mb-6 inline-block hover:text-white transition-colors">← DIRECTORY</Link>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-tight text-white drop-shadow-xl">
              {team?.name}
            </h1>
            <div className="mt-6 flex items-center justify-center md:justify-start">
              <span 
                className="px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl border-2 border-black"
                style={{ backgroundColor: confStyle.bg, color: confStyle.text }}
              >
                {team?.conf} CONFERENCE
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

      <div className="max-w-4xl mx-auto px-6 mt-12 space-y-4">
        {teamGames.map((game) => {
          const isHome = game.home === teamId;
          const opponentId = isHome ? game.away : game.home;
          const opponent = teams.find(t => t.id === opponentId) || { name: opponentId, id: null };
          const userSelection = results[game.id];
          
          return (
            <div 
              key={game.id} 
              className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-sm border-l-[10px] transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg" 
              style={{ borderLeftColor: team?.color }}
            >
              <div className="flex flex-col text-center sm:text-left">
                <p className="font-black text-[11px] uppercase text-slate-950 mb-1">{game.date} • {game.location}</p>
                <h3 className="text-3xl font-black uppercase text-slate-900">
                  <span className="text-slate-300 italic mr-2 text-xl">{isHome ? 'vs' : '@'}</span>
                  {opponent.id ? (
                    <Link 
                      to={`/team/${opponent.id}`} 
                      className="transition-colors duration-200 hover:text-[#25bee8]"
                    >
                      {opponent.name}
                    </Link>
                  ) : (
                    <span>{opponent.name}</span>
                  )}
                </h3>
              </div>
              <div className="flex gap-2 bg-gray-50 p-2 rounded-2xl">
                <button 
                  onClick={() => onPick(game.id, teamId)} 
                  className={`px-10 py-3 rounded-xl text-xs font-black uppercase transition-all duration-300 active:scale-95 ${userSelection === teamId ? 'text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`} 
                  style={userSelection === teamId ? { backgroundColor: team?.color, boxShadow: `0 4px 12px ${team?.color}40` } : {}}
                >
                  Win
                </button>
                <button 
                  onClick={() => onPick(game.id, opponentId)} 
                  className={`px-10 py-3 rounded-xl text-xs font-black uppercase transition-all duration-300 active:scale-95 ${userSelection && userSelection !== teamId ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
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