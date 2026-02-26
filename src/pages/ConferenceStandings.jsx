import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

function ConferenceStandings({ teams, schedule, results }) {
  const standingsData = useMemo(() => {
    // 1. Initialize stats for all teams
    const stats = teams.map(t => ({ 
      ...t, 
      wins: 0, 
      losses: 0, 
      confWins: 0, 
      confLosses: 0 
    }));
    
    // 2. Calculate records
    schedule.forEach(game => {
      const winnerId = results[game.id];
      if (winnerId) {
        const homeTeam = teams.find(t => t.id === game.home);
        const awayTeam = teams.find(t => t.id === game.away);
        
        // Skip if one team is an "unknown" FCS school
        if (!homeTeam || !awayTeam) {
          const winnerStats = stats.find(t => t.id === winnerId);
          const loserId = winnerId === game.home ? game.away : game.home;
          const loserStats = stats.find(t => t.id === loserId);
          if (winnerStats) winnerStats.wins++;
          if (loserStats) loserStats.losses++;
          return;
        }

        const loserId = winnerId === game.home ? game.away : game.home;
        const winT = stats.find(t => t.id === winnerId);
        const lossT = stats.find(t => t.id === loserId);
        
        // Update Overall Records
        if (winT) winT.wins++;
        if (lossT) lossT.losses++;

        // Update Conference Records if both teams are in the same conference
        if (homeTeam.conf === awayTeam.conf) {
          if (winT) winT.confWins++;
          if (lossT) lossT.confLosses++;
        }
      }
    });

    const popularityOrder = [
      'SEC', 'Big Ten', 'Big 12', 'ACC', 'Pac-12', 
      'American', 'CUSA', 'Mountain West', 'Sun Belt', 'MAC', 'Independent'
    ];

    const existingConfs = [...new Set(teams.map(t => t.conf))];
    const sortedConfs = existingConfs.sort((a, b) => {
      let indexA = popularityOrder.indexOf(a);
      let indexB = popularityOrder.indexOf(b);
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });
    
    return sortedConfs.map(conf => ({
      name: conf,
      teams: stats
        .filter(t => t.conf === conf)
        // Primary Sort: Conf Wins, Secondary: Overall Wins, Tertiary: Rating
        .sort((a, b) => b.confWins - a.confWins || b.wins - a.wins || b.rating - a.rating)
    }));
  }, [teams, schedule, results]);

  const getConfColor = (conf) => {
    const styles = {
      'SEC': '#f5ce42', 'Big Ten': '#25bee8', 'ACC': '#003087',
      'Big 12': '#C41230', 'Pac-12': '#ff4d4d', 'American': '#006747', 
      'Independent': '#0c2340', 'CUSA': '#003366'
    };
    return styles[conf] || '#94a3b8';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 py-12 px-6 mb-8 text-center shadow-sm">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900">
          <span style={{ color: '#25bee8' }}>CONFERENCE</span> <span style={{ color: '#f5ce42' }}>STANDINGS</span>
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {standingsData.map(conf => (
          <div key={conf.name} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 flex items-center justify-between border-b-4" style={{ borderBottomColor: getConfColor(conf.name) }}>
              <h2 className="text-2xl font-black uppercase tracking-tight">{conf.name}</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{conf.teams.length} Teams</span>
            </div>
            
            <div className="divide-y divide-gray-50">
              <div className="grid grid-cols-12 p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest bg-gray-50/50">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">School</div>
                <div className="col-span-3 text-center">CONF</div>
                <div className="col-span-3 text-center">OVERALL</div>
              </div>
              
              {conf.teams.map((team, index) => (
                <Link 
                  to={`/team/${team.id}`} 
                  key={team.id}
                  className="grid grid-cols-12 p-5 items-center hover:bg-gray-50 transition-colors group"
                >
                  <div className="col-span-1 text-center font-black text-slate-300 group-hover:text-[#25bee8]">{index + 1}</div>
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: team.color }} />
                    <span className="font-bold text-slate-800 uppercase text-sm truncate">{team.name}</span>
                  </div>
                  {/* Conference Record Column */}
                  <div className="col-span-3 text-center font-black text-slate-900 text-lg">
                    {team.confWins}-{team.confLosses}
                  </div>
                  {/* Overall Record Column */}
                  <div className="col-span-3 text-center font-bold text-slate-400">
                    {team.wins}-{team.losses}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConferenceStandings;