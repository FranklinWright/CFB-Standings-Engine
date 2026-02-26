import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

function TeamsDirectory({ teams }) {
  const [search, setSearch] = useState('');
  const [selectedConf, setSelectedConf] = useState('All');

  const getConfColor = (conf) => {
    const conferenceStyles = {
      'SEC': '#f5ce42',      
      'Big Ten': '#25bee8',  
      'ACC': '#003087',      
      'Big 12': '#C41230',   
      'Pac-12': '#ff4d4d',   
      'American': '#006747', 
      'Independent': '#0c2340'
    };
    return conferenceStyles[conf] || '#94a3b8';
  };

  const conferences = useMemo(() => {
    const allConfs = [...new Set(teams.map(t => t.conf))].sort();
    const priority = ['SEC', 'Big Ten'];
    const others = allConfs.filter(c => !priority.includes(c));
    return ['All', ...priority, ...others];
  }, [teams]);

  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(search.toLowerCase());
      const matchesConf = selectedConf === 'All' || team.conf === selectedConf;
      return matchesSearch && matchesConf;
    });
  }, [teams, search, selectedConf]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* STICKY SEARCH HEADER */}
      <div className="sticky top-[73px] z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 w-full relative">
            <input 
              type="text" 
              placeholder="Search Teams..." 
              className="w-full bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl px-6 py-4 text-slate-900 outline-none transition-all font-bold text-lg shadow-inner focus:border-[#25bee8]"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {conferences.map(conf => {
              const isActive = selectedConf === conf;
              const confColor = getConfColor(conf);
              return (
                <button
                  key={conf}
                  onClick={() => setSelectedConf(conf)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${isActive ? 'text-white border-transparent' : 'bg-white border-gray-100 text-slate-400 hover:border-slate-300'}`}
                  style={isActive ? { backgroundColor: confColor } : {}}
                >
                  {conf}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredTeams.map(team => (
            <Link 
              to={`/team/${team.id}`} 
              key={team.id}
              className="group bg-white border border-gray-100 rounded-3xl p-6 transition-all text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[140px] shadow-sm hover:shadow-2xl"
            >
              {/* THE LITTLE COLOR BAR AT TOP (STAYS VISIBLE) */}
              <div 
                className="absolute top-0 left-0 w-full h-1.5 z-20 transition-all group-hover:h-2" 
                style={{ backgroundColor: team.color }} 
              />
              
              {/* FULL COLOR HIGHLIGHT ON HOVER */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" 
                style={{ backgroundColor: team.color }} 
              />
              
              <div className="relative z-30">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 leading-tight group-hover:text-white transition-colors">
                  {team.name}
                </h3>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2 group-hover:text-white/80 transition-colors">
                  {team.conf}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeamsDirectory;