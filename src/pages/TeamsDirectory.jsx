import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

function TeamsDirectory({ teams, onAutoPredict }) {
  const [search, setSearch] = useState('');
  const [selectedConf, setSelectedConf] = useState('All');

  const getConfColor = (conf) => {
    const styles = {
      'SEC': '#f5ce42', 'Big Ten': '#25bee8', 'ACC': '#003087',
      'Big 12': '#C41230', 'Pac-12': '#ff4d4d', 'American': '#006747', 
      'Independent': '#0c2340', 'CUSA': '#003366'
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
    return teams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(search.toLowerCase());
      const matchesConf = selectedConf === 'All' || team.conf === selectedConf;
      return matchesSearch && matchesConf;
    });
  }, [teams, search, selectedConf]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-[77px] z-40 bg-white border-b border-gray-200 px-6 py-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          
          <div className="flex-1 w-full flex gap-3">
            <input 
              type="text" 
              placeholder={`Search ${filteredTeams.length} ${selectedConf === 'All' ? 'FBS' : selectedConf} Teams...`} 
              className="flex-1 bg-gray-100 border-2 border-transparent focus:bg-white rounded-2xl px-6 py-3 text-slate-900 outline-none transition-all font-bold text-lg focus:border-[#25bee8]"
              onChange={(e) => setSearch(e.target.value)}
            />
            
            <button 
              onClick={onAutoPredict}
              className="px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 border-2 bg-[#25bee8] text-white hover:bg-[#f5ce42] hover:text-black"
              style={{ borderColor: '#25bee8' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#f5ce42';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#25bee8';
              }}
            >
              ⚡ Quick Predict
            </button>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {conferences.map(conf => {
              const isActive = selectedConf === conf;
              const confColor = getConfColor(conf);
              
              return (
                <button 
                  key={conf} 
                  onClick={() => setSelectedConf(conf)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                    isActive 
                      ? 'text-white shadow-md' 
                      : 'bg-white border-gray-200 text-slate-400 hover:shadow-sm'
                  }`}
                  style={{ 
                    backgroundColor: isActive ? confColor : 'transparent',
                    borderColor: isActive ? confColor : undefined,
                    color: isActive ? '#FFFFFF' : undefined
                  }}
                  onMouseEnter={(e) => {
                    if(!isActive) {
                      e.currentTarget.style.borderColor = confColor;
                      e.currentTarget.style.color = confColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if(!isActive) {
                      e.currentTarget.style.borderColor = ''; 
                      e.currentTarget.style.color = '';       
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
          {filteredTeams.map(team => (
            <Link 
              to={`/team/${team.id}`} 
              key={team.id} 
              className="group bg-white border border-gray-100 rounded-[2rem] p-8 transition-all text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[160px] shadow-sm hover:shadow-xl"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 z-20" style={{ backgroundColor: team.color }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity z-10" style={{ backgroundColor: team.color }} />
              <div className="relative z-30">
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 group-hover:text-white transition-colors">{team.name}</h3>
                <p className="text-[10px] font-black text-slate-300 uppercase mt-2 group-hover:text-white/80">{team.conf}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeamsDirectory;