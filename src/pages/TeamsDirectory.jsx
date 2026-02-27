import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

function TeamsDirectory({ teams = [], masterSchedule = [], results = {}, onSimulate }) {
  const [search, setSearch] = useState('');
  const [selectedConf, setSelectedConf] = useState('All');
  const [showSimMenu, setShowSimMenu] = useState(false);
  const [sortBy, setSortBy] = useState('rank'); 

  const getConfColor = (conf) => {
    const styles = {
      'SEC': '#f5ce42', 'Big Ten': '#25bee8', 'ACC': '#003087',
      'Big 12': '#C41230', 'Pac-12': '#ff4d4d', 'American': '#006747', 
      'Independent': '#0c2340', 'CUSA': '#003366', 'Mountain West': '#98002e'
    };
    return styles[conf] || '#94a3b8';
  };

  const conferences = useMemo(() => {
    const all = [...new Set(teams.map(t => t.conf))].sort();
    const priority = ['SEC', 'Big Ten'];
    const others = all.filter(c => !priority.includes(c));
    return ['All', ...priority, ...others];
  }, [teams]);

  const filteredTeams = useMemo(() => {
    const teamStats = teams.map(team => {
      let wins = 0;
      let losses = 0;
      masterSchedule.forEach(game => {
        const winnerId = results[game.id];
        if (winnerId) {
          if (winnerId === team.id) wins++;
          else if (game.home === team.id || game.away === team.id) losses++;
        }
      });
      const totalGames = wins + losses;
      const winPct = totalGames > 0 ? wins / totalGames : 0;
      return { ...team, wins, losses, winPct, totalGames };
    });

    let result = teamStats.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(search.toLowerCase());
      const matchesConf = selectedConf === 'All' || team.conf === selectedConf;
      return matchesSearch && matchesConf;
    });

    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => {
        // Logic: Push teams with less than 12 games to the bottom
        const aHasFullSchedule = a.totalGames >= 12;
        const bHasFullSchedule = b.totalGames >= 12;

        if (aHasFullSchedule && !bHasFullSchedule) return -1;
        if (!aHasFullSchedule && bHasFullSchedule) return 1;

        // If both are full (or both are bummy), sort by AP Poll logic
        return b.winPct - a.winPct || b.wins - a.wins || b.rating - a.rating;
      });
    }
    return result;
  }, [teams, masterSchedule, results, search, selectedConf, sortBy]);

  const simModes = [
    { id: 'realistic', label: 'Realistic Sim', desc: 'Ratings + Home Field + Random Upsets', icon: '🏈' },
    { id: 'blueblood', label: 'Blue Blood Bias', desc: 'Massive boost to SEC & Big Ten', icon: '👑' },
    { id: 'underdog', label: 'Underdog Story', desc: 'Lower rated teams win 70% of games', icon: '👟' },
    { id: 'homefortress', label: 'Home Fortress', desc: 'Home teams are nearly unbeatable', icon: '🏰' },
    { id: 'coinflip', label: 'Pure Chaos', desc: '50/50 chance for every single game', icon: '🎲' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <input 
              type="text" 
              placeholder={`Search ${filteredTeams.length} ${selectedConf === 'All' ? 'FBS' : selectedConf} Teams...`} 
              className="flex-1 w-full bg-gray-100 border-2 border-transparent focus:bg-white rounded-2xl px-6 py-3 text-slate-900 outline-none transition-all font-bold text-lg focus:border-[#25bee8]"
              onChange={(e) => setSearch(e.target.value)}
            />
            
            <div className="flex flex-wrap md:flex-nowrap gap-3 w-full lg:w-auto items-center">
              <div className="relative flex-1 md:flex-none">
                <button 
                  onClick={() => setShowSimMenu(!showSimMenu)}
                  className="w-full px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all border-2 border-black bg-[#25bee8] text-white flex items-center justify-center gap-2 hover:bg-[#f5ce42] hover:text-black shadow-lg"
                >
                  Simulation Tools ▾
                </button>

                {showSimMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border-2 border-black rounded-2xl shadow-2xl z-50 overflow-hidden text-left">
                    <div className="bg-gray-50 p-3 border-b border-gray-100 text-[9px] font-black uppercase text-slate-400 tracking-widest">Select Logic</div>
                    {simModes.map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => {
                          onSimulate(mode.id);
                          setShowSimMenu(false);
                        }}
                        className="w-full p-4 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors border-b last:border-0 border-gray-100 group"
                      >
                        <span className="text-2xl group-hover:scale-125 transition-transform">{mode.icon}</span>
                        <div>
                          <p className="font-black uppercase text-[11px] text-slate-900 group-hover:text-[#25bee8]">{mode.label}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter leading-tight mt-0.5">{mode.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl border-2 border-gray-200">
                <button 
                  onClick={() => setSortBy('rank')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${sortBy === 'rank' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="opacity-50 text-[12px]">#</span> Rank
                </button>
                <button 
                  onClick={() => setSortBy('name')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${sortBy === 'name' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="opacity-50 text-[12px]">AZ</span> Name
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center lg:justify-start mt-4">
            {conferences.map(conf => {
              const isActive = selectedConf === conf;
              const confColor = getConfColor(conf);
              
              return (
                <button 
                  key={conf} 
                  onClick={() => setSelectedConf(conf)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                    isActive ? 'text-white shadow-md' : 'bg-white border-gray-200 text-slate-400'
                  }`}
                  style={{ 
                    backgroundColor: isActive ? confColor : 'transparent',
                    borderColor: isActive ? confColor : undefined,
                    color: isActive ? '#FFFFFF' : undefined
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = confColor;
                      e.currentTarget.style.color = confColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  {conf}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {filteredTeams.map((team, index) => (
            <Link 
              to={`/team/${team.id}`} 
              key={team.id} 
              className="group bg-white border border-gray-100 rounded-[2rem] p-8 transition-all text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[160px] shadow-sm hover:shadow-xl"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 z-20" style={{ backgroundColor: team.color }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity z-10" style={{ backgroundColor: team.color }} />
              
              {sortBy === 'rank' && search === '' && (
                <div className="absolute top-4 left-6 text-[14px] font-black text-slate-200 group-hover:text-white/50 transition-colors">
                  #{index + 1}
                </div>
              )}

              <div className="relative z-30">
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 group-hover:text-white transition-colors leading-tight">{team.name}</h3>
                <div className="flex flex-col items-center mt-2">
                  <p className="text-[10px] font-black text-slate-300 uppercase group-hover:text-white/80">{team.conf}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeamsDirectory;