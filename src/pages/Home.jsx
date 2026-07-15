/**
 * @file Home.jsx
 * @description Serves as the dashboard/landing page. 
 * Displays the Top 25 national rankings based on projected season results.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

/**
 * Home Component
 * @param {Object} props
 * @param {Array} props.teams - Array of team objects
 * @param {Array} props.schedule - Array of game objects
 * @param {Object} props.results - Mapping of gameId to winnerId
 */
function Home({ teams, schedule, results }) {
  
  /**
   * Aggregates team standings and sorts them by wins and ratings.
   * Returns a sorted array of teams for the ranking display.
   */
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

      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid gap-2 md:gap-3">
          {top25.map((team, i) => (
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
    </div>
  );
}

export default Home;