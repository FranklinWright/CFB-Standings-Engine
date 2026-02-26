import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

function Home({ teams, schedule, results }) {
  const standings = useMemo(() => {
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
    return stats.sort((a, b) => b.wins - a.wins || b.rating - a.rating);
  }, [teams, schedule, results]);

  const top25 = standings.slice(0, 25);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-200 py-16 px-6 text-center shadow-sm relative overflow-hidden">
        
        <div className="relative z-10">
          <div className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-4 inline-block shadow-sm border" style={{ color: '#25bee8', borderColor: '#25bee8' }}>
            2026 Season
          </div>
          <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
            <span style={{ color: '#25bee8' }}>THE</span> <span style={{ color: '#f5ce42' }}>POLL</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-xs mt-6">Projected National Rankings</p>
        </div>
      </div>

      {/* POLL LIST */}
      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid gap-3">
          {top25.map((team, i) => (
            <Link 
              to={`/team/${team.id}`} 
              key={team.id}
              className="group bg-white hover:bg-gray-50 border border-gray-200 rounded-3xl p-6 flex items-center justify-between transition-all shadow-sm hover:shadow-xl hover:scale-[1.01]"
            >
              <div className="flex items-center gap-6">
                {/* Darkened Rank Number */}
                <span className="text-4xl font-black italic text-slate-300 group-hover:text-[#25bee8] transition-colors w-12">
                  #{i + 1}
                </span>
                <div className="w-2 h-12 rounded-full shadow-sm" style={{ backgroundColor: team.color }} />
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">{team.name}</h3>
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 inline-block">{team.conf}</span>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right">
                  <p className="text-[10px] uppercase font-black text-slate-500 mb-0.5 tracking-tighter">Record</p>
                  {/* Darkened Record Numbers */}
                  <p className="text-4xl font-black font-mono text-slate-950 tracking-tighter">
                    {team.wins}<span className="text-slate-300 mx-0.5">-</span>{team.losses}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center transition-all group-hover:bg-[#25bee8] group-hover:text-white text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;