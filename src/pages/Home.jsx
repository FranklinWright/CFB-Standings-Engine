import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

function Home({ teams, schedule, results }) {
  const standings = useMemo(() => {
    const getConfMultiplier = (conf) => {
      if (!conf) return 0.5;
      
      // Massive SEC & Big Ten Bias (The "Power 2")
      if (conf === "SEC" || conf === "Big Ten") return 1.40;
      
      // Standard Power Conference (ACC & Big 12)
      if (conf === "ACC" || conf === "Big 12") return 1.15;
      
      // Group of 5
      const groupOf5 = ["American", "Mountain West", "Sun Belt", "MAC", "CUSA", "Independent"];
      if (groupOf5.includes(conf)) return 0.90;
      
      return 0.5; // FCS
    };

    const stats = teams.map(t => ({ ...t, wins: 0, losses: 0, resumeScore: 0, gamesPlayed: 0 }));
    
    schedule.forEach(game => {
      const winnerId = results[game.id];
      if (winnerId) {
        const loserId = winnerId === game.home ? game.away : game.home;
        const winT = stats.find(t => t.id === winnerId);
        const lossT = stats.find(t => t.id === loserId);
        
        // WINNER LOGIC
        if (winT) {
          winT.wins++;
          winT.gamesPlayed++;
          
          if (!lossT) {
            winT.resumeScore += 115; 
          } else {
            let winPoints = 100 + (lossT.rating * getConfMultiplier(lossT.conf));
            if (winnerId === game.away) winPoints += 15; // Road win
            
            // Explicit Committee Bias: Extra points just for being in the SEC or Big Ten
            if (winT.conf === "SEC" || winT.conf === "Big Ten") winPoints += 25;
            
            winT.resumeScore += winPoints;
          }
        }

        // LOSER LOGIC
        if (lossT) {
          lossT.losses++;
          lossT.gamesPlayed++;

          if (!winT) {
            lossT.resumeScore -= 100;
          } else {
            // Quality Loss Mechanics: Losing to a 95+ overall SEC team barely hurts you
            let lossPenalty = 130 - (winT.rating * getConfMultiplier(winT.conf));
            
            // Prevent negative penalties (getting rewarded for losing)
            if (lossPenalty < 5) lossPenalty = 5; 
            
            if (loserId === game.home) lossPenalty += 15; 
            lossT.resumeScore -= lossPenalty;
            
            // Track Conference Records (Only needed in App.jsx, but safe here)
            if (winT && winT.conf === lossT.conf) {
              winT.confWins = (winT.confWins || 0) + 1;
              lossT.confLosses = (lossT.confLosses || 0) + 1;
            }
          }
        }
      }
    });

    return stats.sort((a, b) => {
      if (Math.abs(b.resumeScore - a.resumeScore) < 5) {
        const pctA = a.wins / (a.gamesPlayed || 1);
        const pctB = b.wins / (b.gamesPlayed || 1);
        return pctB - pctA;
      }
      return b.resumeScore - a.resumeScore;
    });
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
                    <img src={team.logo} alt={team.name} className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
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