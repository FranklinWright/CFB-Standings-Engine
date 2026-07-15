/**
 * @file TeamsDirectory.jsx
 * @description Serves as the index page for all teams. 
 * Provides search, conference filtering, and sorting functionality, 
 * while calculating live national rankings (Top 25).
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

/**
 * TeamsDirectory Component
 * @param {Object} props
 * @param {Array} props.teams - Array of team objects
 * @param {Array} props.masterSchedule - Global schedule data
 * @param {Object} props.results - Mapping of gameId to winnerId
 * @param {Function} props.onSimulate - Handler for simulation mode selection
 */
function TeamsDirectory({ teams = [], masterSchedule = [], results = {}, onSimulate }) {
  const [search, setSearch] = useState('');
  const [selectedConf, setSelectedConf] = useState('All');
  const [showSimMenu, setShowSimMenu] = useState(false);
  const [sortBy, setSortBy] = useState('rank');

  /**
   * Returns conference-specific branding color for UI elements.
   */
  const getConfColor = (conf) => {
    const styles = {
      'SEC': '#f5ce42', 'Big Ten': '#25bee8', 'ACC': '#003087',
      'Big 12': '#C41230', 'Pac-12': '#ff4d4d', 'American': '#006747',
      'Independent': '#0c2340', 'CUSA': '#003366', 'Mountain West': '#98002e',
      'Sun Belt': '#0039A6', 'MAC': '#006633', 'FCS/Other': '#475569'
    };
    return styles[conf] || '#94a3b8';
  };

  /**
   * Safely returns logo URL. 
   * Fallback to CBS logic included for ESPN default placeholders.
   */
  const getLogoSrc = (team) => {
    if (!team.logo) return null;
    if (team.logo.includes('default.png')) {
      return `https://sports.cbsimg.net/images/collegefootball/logos/50x50/${team.id.toLowerCase()}.png`;
    }
    return team.logo;
  };

  // 1. Calculate all stats globally
  const allTeamStats = useMemo(() => {
    return teams.map(team => {
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
  }, [teams, masterSchedule, results]);

  // 2. Calculate Top 25 National Ranks (Excluding FCS)
  const nationalRanks = useMemo(() => {
    const sorted = [...allTeamStats]
      .filter(t => t.conf !== 'FCS/Other')
      .sort((a, b) => b.wins - a.wins || b.rating - a.rating);
    const ranks = {};
    sorted.forEach((t, i) => { ranks[t.id] = i + 1; });
    return ranks;
  }, [allTeamStats]);

  // 3. Filter and Sort for UI display
  const filteredTeams = useMemo(() => {
    let result = allTeamStats.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(search.toLowerCase());
      let matchesConf = selectedConf === 'All' ? team.conf !== 'FCS/Other' : team.conf === selectedConf;
      return matchesSearch && matchesConf;
    });

    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => {
        const aHasFullSchedule = a.totalGames >= 12;
        const bHasFullSchedule = b.totalGames >= 12;
        if (aHasFullSchedule && !bHasFullSchedule) return -1;
        if (!aHasFullSchedule && bHasFullSchedule) return 1;
        return b.winPct - a.winPct || b.wins - a.wins || b.rating - a.rating;
      });
    }
    return result;
  }, [allTeamStats, search, selectedConf, sortBy]);

  const simModes = [
    { id: 'realistic', label: 'Realistic Sim', desc: 'Ratings + Home Field + Random Upsets', icon: '🎯' },
    { id: 'blueblood', label: 'Blue Blood Bias', desc: 'Massive boost to SEC & Big Ten', icon: '👑' },
    { id: 'underdog', label: 'Underdog Story', desc: 'Lower rated teams win 70% of games', icon: '🐕' },
    { id: 'homefortress', label: 'Home Fortress', desc: 'Home teams are nearly unbeatable', icon: '🏰' },
    { id: 'coinflip', label: 'Pure Chaos', desc: '50/50 chance for every single game', icon: '🎲' }
  ];

  const conferences = useMemo(() => {
    const all = [...new Set(teams.map(t => t.conf))].sort();
    const priority = ['SEC', 'Big Ten'];
    const others = all.filter(c => !priority.includes(c) && c !== 'FCS/Other');
    const hasFCS = all.includes('FCS/Other');
    return ['All', ...priority, ...others, ...(hasFCS ? ['FCS/Other'] : [])];
  }, [teams]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder={`Search ${filteredTeams.length} ${selectedConf === 'All' ? 'FBS' : selectedConf} Teams...`}
              className="flex-1 w-full bg-gray-100 border-2 border-transparent focus:bg-white rounded-xl px-6 py-3 text-slate-900 outline-none transition-all font-bold text-lg focus:border-[#25bee8]"
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex flex-wrap md:flex-nowrap gap-3 w-full lg:w-auto items-center">
              <div className="relative flex-1 md:flex-none">
                <button
                  onClick={() => setShowSimMenu(!showSimMenu)}
                  className="cursor-pointer w-full px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all border-2 border-black bg-[#25bee8] text-white flex items-center justify-center gap-2 hover:bg-[#1aa0c7] shadow-lg"
                >
                  Simulation Tools
                </button>
                {showSimMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border-2 border-black rounded-xl shadow-2xl z-50 overflow-hidden text-left">
                    <div className="bg-gray-50 p-3 border-b border-gray-100 text-[9px] font-black uppercase text-slate-400 tracking-widest">Select Logic</div>
                    {simModes.map(mode => (
                      <button key={mode.id} onClick={() => { onSimulate(mode.id); setShowSimMenu(false); }} className="cursor-pointer w-full p-4 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors border-b last:border-0 border-gray-100 group">
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
                <button onClick={() => setSortBy('rank')} className={`cursor-pointer px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${sortBy === 'rank' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  <span className="opacity-50 text-[12px]">#</span> Rank
                </button>
                <button onClick={() => setSortBy('name')} className={`cursor-pointer px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${sortBy === 'name' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
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
                <button key={conf} onClick={() => setSelectedConf(conf)} className={`cursor-pointer px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${isActive ? 'text-white shadow-md' : 'bg-white border-gray-200 text-slate-400'}`} style={{ backgroundColor: isActive ? confColor : 'transparent', borderColor: isActive ? confColor : undefined, color: isActive ? '#FFFFFF' : undefined }}>
                  {conf}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-6 md:p-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredTeams.map((team) => (
            <Link to={`/team/${team.id}`} key={team.id} className="cursor-pointer group bg-white border border-gray-100 rounded-2xl p-4 transition-all text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[140px] shadow-sm hover:shadow-xl hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-full h-1.5 z-20" style={{ backgroundColor: team.color }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity z-10" style={{ backgroundColor: team.color }} />
              <div className="relative z-30 flex flex-col items-center w-full mt-2">
                {team.logo && (
                  <div className="bg-white p-1.5 rounded-full mb-2 shadow-sm border border-gray-100 group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                    <img src={getLogoSrc(team)} onError={(e) => { e.target.src = '/favicon.ico'; }} alt={team.name} className="w-10 h-10 object-contain drop-shadow-sm" />
                  </div>
                )}
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 group-hover:text-white transition-colors leading-tight flex items-center justify-center gap-1.5">
                  {nationalRanks[team.id] <= 25 && <span className="text-slate-900 group-hover:text-white">#{nationalRanks[team.id]}</span>}
                  {team.name}
                </h3>
                <div className="flex flex-col items-center mt-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase group-hover:text-white/80 transition-colors">{team.conf}</p>
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