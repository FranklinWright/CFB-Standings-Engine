/**
 * @file App.jsx
 * @description The main entry point and orchestrator for the College Football Engine.
 * Manages global application state, routing, data persistence, and the shared 
 * result-tracking logic required for the simulation engine.
 */
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { teams, masterSchedule } from './data/teams';
import Home from './pages/Home';
import Poll from './pages/Poll';
import TeamPage from './pages/TeamPage';
import TeamsDirectory from './pages/TeamsDirectory';
import ConferenceStandings from './pages/ConferenceStandings';
import PlayoffBracket from './pages/PlayoffBracket';
import NotFound from './pages/NotFound'; // <-- NEW IMPORT

/**
 * ScrollToTop Component
 * Resets the window scroll position whenever the route path changes.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * Navigation Component
 * Handles site-wide navigation and autocomplete search.
 */
function Navigation({ setShowModal, resetAllPicks, teams, results, masterSchedule }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  // Compute ranks for the search dropdown
  const nationalRanks = useMemo(() => {
    const stats = teams.map(team => {
      let wins = 0;
      masterSchedule.forEach(game => {
        if (results[game.id] === team.id) wins++;
      });
      return { ...team, wins };
    });
    
    const sorted = stats
      .filter(t => t.conf !== 'FCS/Other')
      .sort((a, b) => b.wins - a.wins || b.rating - a.rating);
    
    const ranks = {};
    sorted.forEach((t, i) => { ranks[t.id] = i + 1; });
    return ranks;
  }, [teams, masterSchedule, results]);

  // Handles typing in search bar, filtering out FCS, and sorting SEC / Big Ten higher
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    if (val.trim()) {
      const matches = teams.filter(t => 
        t.conf !== 'FCS/Other' && 
        (t.name.toLowerCase().includes(val.toLowerCase()) || 
         t.conf.toLowerCase().includes(val.toLowerCase()))
      );

      // Priority sort: SEC (weight 2) > Big Ten (weight 1) > Others (weight 0)
      matches.sort((a, b) => {
        const getWeight = (conf) => conf === 'SEC' ? 2 : conf === 'Big Ten' ? 1 : 0;
        const diff = getWeight(b.conf) - getWeight(a.conf);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      });

      setFilteredTeams(matches.slice(0, 6)); // Top 6 popup results
    } else {
      setFilteredTeams([]);
    }
  };

  // Submitting by pressing Enter or clicking the magnifying glass
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/teams?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
      setIsFocused(false);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 p-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center">
        
        {/* Top Row: Logo & Mobile Controls */}
        <div className="flex justify-between items-center w-full sm:w-auto">
          <Link to="/" className="flex items-center gap-2 group" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic transition-colors" style={{ color: '#25bee8' }}>
              CFB<span style={{ color: '#f5ce42' }}> GAMES</span>
            </span>
          </Link>
          
          {/* Mobile Hamburger */}
          <button 
            className="sm:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5 cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-slate-900 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-slate-900 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-slate-900 transition-transform duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>

        {/* Navigation Links and Search */}
        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mt-4 sm:mt-0 w-full sm:w-auto`}>
          
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 text-xs font-black uppercase tracking-[0.2em] w-full sm:w-auto">
            <Link to="/poll" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-[#25bee8] transition-all py-2 sm:py-0 border-b border-gray-100 sm:border-none w-full">Poll</Link>
            <Link to="/standings" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-[#25bee8] transition-all py-2 sm:py-0 border-b border-gray-100 sm:border-none w-full">Standings</Link>
            <Link to="/teams" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-[#25bee8] transition-all py-2 sm:py-0 border-b border-gray-100 sm:border-none w-full">Teams</Link>
            <Link to="/postseason" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-[#25bee8] transition-all py-2 sm:py-0 border-b border-gray-100 sm:border-none w-full">Postseason</Link>
          </div>

          {/* Autocomplete Search Bar */}
          <div className="relative w-full sm:w-64 border-b border-gray-100 sm:border-none pb-4 sm:pb-0">
            <form onSubmit={handleSearchSubmit} className="flex items-center relative w-full">
              <input 
                type="text" 
                placeholder="Search teams..." 
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                className="w-full pl-3 pr-10 py-2 border-2 border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-[#25bee8] transition-colors"
              />
              <button type="submit" className="absolute right-3 text-slate-400 hover:text-[#25bee8] cursor-pointer transition-colors" aria-label="Search">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {/* Dropdown Results */}
            {isFocused && filteredTeams.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                {filteredTeams.map(team => (
                  <div 
                    key={team.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      navigate(`/team/${team.id}`);
                      setSearchQuery('');
                      setIsFocused(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                  >
                    <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                      <img 
                        src={team.logo} 
                        alt={team.name} 
                        onError={(e) => e.target.src='/favicon.ico'} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-900 leading-none">
                        {nationalRanks[team.id] && <span className="text-slate-500 mr-1">#{nationalRanks[team.id]}</span>}
                        {team.name}
                      </p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{team.conf}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-start sm:justify-end mt-2 sm:mt-0">
            <button onClick={() => { setShowModal(true); setIsMobileMenuOpen(false); }} className="cursor-pointer px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all bg-slate-900 text-white hover:bg-slate-800 shadow-sm flex items-center gap-2">
              <span className="hidden md:inline">Share / Save</span><span className="md:hidden">Save</span>
            </button>
            <button onClick={() => { resetAllPicks(); setIsMobileMenuOpen(false); }} className="cursor-pointer px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100">
              Reset
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem('cfb_picks_2026');
    return saved ? JSON.parse(saved) : {};
  });

  const [showModal, setShowModal] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [copyStatus, setCopyStatus] = useState("Copy Save Code");
  const [exportName, setExportName] = useState("my-2026-season");

  useEffect(() => {
    localStorage.setItem('cfb_picks_2026', JSON.stringify(results));
  }, [results]);

  const handlePick = (gameId, winnerId) => {
    setResults(prev => {
      const newResults = { ...prev, [gameId]: winnerId };
      
      if (typeof gameId === 'number') {
        Object.keys(newResults).forEach(key => {
          if (key.startsWith('cc_') || key.startsWith('p_') || key.startsWith('b_')) delete newResults[key];
        });
      }

      if (typeof gameId === 'string' && gameId.startsWith('cc_')) {
        Object.keys(newResults).forEach(key => {
          if (key.startsWith('p_') || key.startsWith('b_')) delete newResults[key];
        });
      }

      if (typeof gameId === 'string' && gameId.startsWith('p_r1_')) {
        Object.keys(newResults).forEach(key => {
          if (key.startsWith('p_qf_') || key.startsWith('p_sf_') || key === 'p_nc') delete newResults[key];
        });
      }
      if (typeof gameId === 'string' && gameId.startsWith('p_qf_')) {
        Object.keys(newResults).forEach(key => {
          if (key.startsWith('p_sf_') || key === 'p_nc') delete newResults[key];
        });
      }
      if (typeof gameId === 'string' && gameId.startsWith('p_sf_')) {
        delete newResults['p_nc'];
      }
      
      return newResults;
    });
  };

  const runSimulation = (mode) => {
    const newResults = { ...results };

    Object.keys(newResults).forEach(key => {
      if (key.startsWith('cc_') || key.startsWith('p_') || key.startsWith('b_')) delete newResults[key];
    });

    masterSchedule.forEach(game => {
      if (!newResults[game.id]) {
        const home = teams.find(t => t.id === game.home);
        const away = teams.find(t => t.id === game.away);

        if (!home || !away) {
          newResults[game.id] = home ? game.home : game.away;
          return;
        }

        const homePower = home.rating + 3;
        const awayPower = away.rating;
        const diff = Math.abs(homePower - awayPower);

        switch (mode) {
          case 'realistic':
            const power2 = ['SEC', 'Big Ten'];
            const standardPower = ['ACC', 'Big 12'];
            let upsetBias = 1.0;
            if (power2.includes(home.conf) || power2.includes(away.conf)) upsetBias = 0.7; 
            else if (!standardPower.includes(home.conf) && !standardPower.includes(away.conf)) upsetBias = 2.5; 
            let dynamicUpsetThreshold = diff > 25 ? 0.001 : diff > 10 ? 0.02 : diff > 7 ? 0.08 : 0.20;
            const finalThreshold = dynamicUpsetThreshold * upsetBias;
            newResults[game.id] = Math.random() > finalThreshold ? (homePower >= awayPower ? game.home : game.away) : (homePower >= awayPower ? game.away : game.home);
            break;
          case 'underdog':
            newResults[game.id] = Math.random() < 0.7 ? (homePower < awayPower ? game.home : game.away) : (homePower >= awayPower ? game.home : game.away);
            break;
          case 'blueblood':
            newResults[game.id] = (homePower + (home.conf === 'SEC' || home.conf === 'Big Ten' ? 15 : 0)) >= (awayPower + (away.conf === 'SEC' || away.conf === 'Big Ten' ? 15 : 0)) ? game.home : game.away;
            break;
          case 'homefortress':
            newResults[game.id] = (homePower + 17) >= awayPower ? game.home : game.away;
            break;
          case 'coinflip':
            newResults[game.id] = Math.random() > 0.5 ? game.home : game.away;
            break;
          default:
            newResults[game.id] = homePower >= awayPower ? game.home : game.away;
        }
      }
    });
    setResults(newResults);
  };

  const resetAllPicks = () => {
    if (window.confirm("Clear all your picks?")) setResults({});
  };

  const loadImportedResults = (importedResults) => {
    if (window.confirm("This will overwrite your current season progress. Are you sure?")) setResults(importedResults);
  };

  const handleExportFile = () => {
    const fileName = exportName.trim() ? exportName.trim() : "my-season";
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(results));
    const link = document.createElement("a");
    link.href = dataStr;
    link.download = `${fileName}.cfb`; 
    link.click();
  };

  const handleExportCode = () => {
    try {
      const base64 = btoa(JSON.stringify(results));
      navigator.clipboard.writeText(base64);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus("Copy Save Code"), 2000);
    } catch (e) { alert("Error generating code"); }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        loadImportedResults(JSON.parse(event.target.result));
        setShowModal(false);
      } catch (err) { alert("Invalid save file! Make sure it is a valid .cfb file."); }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const handleImportCode = () => {
    try {
      if (!importCode) return;
      loadImportedResults(JSON.parse(atob(importCode)));
      setShowModal(false);
      setImportCode("");
    } catch (err) { alert("Invalid save code!"); }
  };

  // --- POSTSEASON LOGIC ---
  const playoffData = useMemo(() => {
    const stats = teams.map(t => ({ ...t, wins: 0, losses: 0, confWins: 0, confLosses: 0 }));
    
    masterSchedule.forEach(game => {
      const winnerId = results[game.id];
      if (winnerId) {
        const homeTeam = teams.find(t => t.id === game.home);
        const awayTeam = teams.find(t => t.id === game.away);
        if (!homeTeam || !awayTeam) {
          const winT = stats.find(t => t.id === winnerId);
          const lossT = stats.find(t => t.id === (winnerId === game.home ? game.away : game.home));
          if (winT) winT.wins++;
          if (lossT) lossT.losses++;
          return;
        }
        const winT = stats.find(t => t.id === winnerId);
        const lossT = stats.find(t => t.id === (winnerId === game.home ? game.away : game.home));
        if (winT) winT.wins++;
        if (lossT) lossT.losses++;
        if (homeTeam.conf === awayTeam.conf) {
          if (winT) winT.confWins++;
          if (lossT) lossT.confLosses++;
        }
      }
    });

    stats.sort((a, b) => b.wins - a.wins || b.rating - a.rating);
    stats.forEach((t, i) => t.rank = i + 1);

    const confs = [...new Set(stats.map(t => t.conf))].filter(c => c !== 'Independent');
    const ccGames = [];
    const confChamps = [];

    confs.forEach(conf => {
      const confTeams = stats.filter(t => t.conf === conf).sort((a, b) => b.confWins - a.confWins || b.wins - a.wins || b.rating - a.rating);
      if (confTeams.length >= 2) {
        const gameId = `cc_${conf.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
        ccGames.push({ id: gameId, round: 0, name: `${conf} Championship`, detail: 'Neutral Site', home: confTeams[0].id, away: confTeams[1].id, isCCG: true });
        if (results[gameId]) confChamps.push(stats.find(t => t.id === results[gameId]));
      } else if (confTeams.length === 1) {
        confChamps.push(confTeams[0]);
      }
    });

    const ccgsComplete = ccGames.length > 0 && ccGames.every(g => results[g.id]);

    let seedsArray = [];
    let seedMap = {};
    let cfpGames = [];
    let bowlGames = [];

    if (ccgsComplete) {
      const getChamp = (confNames) => confChamps.filter(c => confNames.includes(c.conf)).sort((a,b) => a.rank - b.rank)[0];
      const power4Champs = [getChamp(['ACC']), getChamp(['Big Ten']), getChamp(['Big 12']), getChamp(['SEC'])].filter(Boolean);
      const highestG6Champ = confChamps.filter(c => !['ACC', 'Big Ten', 'Big 12', 'SEC', 'Independent'].includes(c.conf)).sort((a,b) => a.rank - b.rank)[0];

      const autoQualifiers = [...power4Champs, highestG6Champ].filter(Boolean).sort((a,b) => a.rank - b.rank);
      const top4Champs = autoQualifiers.slice(0, 4);
      const fifthChamp = autoQualifiers[4];

      let remaining = stats.filter(t => !top4Champs.find(c => c.id === t.id) && (!fifthChamp || t.id !== fifthChamp.id));
      let atLarges = [];
      const nd = stats.find(t => t.id === 'nd');
      
      if (nd && nd.rank <= 12 && !remaining.slice(0, 7).find(t => t.id === 'nd')) {
         atLarges.push(nd);
         remaining = remaining.filter(t => t.id !== 'nd');
         atLarges = [...atLarges, ...remaining.slice(0, 6)];
      } else {
         atLarges = remaining.slice(0, 7);
      }

      seedsArray = [...top4Champs, ...[...(fifthChamp ? [fifthChamp] : []), ...atLarges].sort((a, b) => a.rank - b.rank)];
      seedsArray.forEach((t, i) => seedMap[t.id] = i + 1);
      const getSeed = (num) => seedsArray[num - 1];

      cfpGames = [
        { id: 'p_r1_4', round: 1, name: 'First Round', detail: 'Campus Site', home: getSeed(8)?.id, away: getSeed(9)?.id },
        { id: 'p_r1_1', round: 1, name: 'First Round', detail: 'Campus Site', home: getSeed(5)?.id, away: getSeed(12)?.id },
        { id: 'p_r1_2', round: 1, name: 'First Round', detail: 'Campus Site', home: getSeed(6)?.id, away: getSeed(11)?.id },
        { id: 'p_r1_3', round: 1, name: 'First Round', detail: 'Campus Site', home: getSeed(7)?.id, away: getSeed(10)?.id },
        { id: 'p_qf_1', round: 2, name: 'Quarterfinal', detail: 'Bowl Game', home: getSeed(1)?.id, away: results['p_r1_4'] || null },
        { id: 'p_qf_4', round: 2, name: 'Quarterfinal', detail: 'Bowl Game', home: getSeed(4)?.id, away: results['p_r1_1'] || null },
        { id: 'p_qf_3', round: 2, name: 'Quarterfinal', detail: 'Bowl Game', home: getSeed(3)?.id, away: results['p_r1_2'] || null },
        { id: 'p_qf_2', round: 2, name: 'Quarterfinal', detail: 'Bowl Game', home: getSeed(2)?.id, away: results['p_r1_3'] || null },
        { id: 'p_sf_1', round: 3, name: 'Semifinal', detail: 'Bowl Game', home: results['p_qf_1'] || null, away: results['p_qf_4'] || null },
        { id: 'p_sf_2', round: 3, name: 'Semifinal', detail: 'Bowl Game', home: results['p_qf_3'] || null, away: results['p_qf_2'] || null },
        { id: 'p_nc', round: 4, name: 'National Championship', detail: 'Neutral Site', home: results['p_sf_1'] || null, away: results['p_sf_2'] || null }
      ];

      const eligible = stats.filter(t => t.wins >= 6 && !seedsArray.find(s => s.id === t.id)).sort((a, b) => a.rank - b.rank);
      const assignedBowls = new Set();
      const getBowlTeam = (confs) => {
        for (const conf of confs) {
          const team = eligible.find(t => t.conf === conf && !assignedBowls.has(t.id));
          if (team) { assignedBowls.add(team.id); return team; }
        }
        const fallback = eligible.find(t => !assignedBowls.has(t.id));
        if (fallback) { assignedBowls.add(fallback.id); return fallback; }
        return null;
      };

      const potentialBowls = [
        { id: 'b_citrus', name: 'Citrus Bowl', detail: 'Orlando, Florida', home: getBowlTeam(['SEC']), away: getBowlTeam(['Big Ten', 'ACC']) },
        { id: 'b_reliaquest', name: 'ReliaQuest Bowl', detail: 'Tampa, Florida', home: getBowlTeam(['SEC']), away: getBowlTeam(['Big Ten', 'ACC']) },
        { id: 'b_poptarts', name: 'Pop-Tarts Bowl', detail: 'Orlando, Florida', home: getBowlTeam(['ACC']), away: getBowlTeam(['Big 12']) },
        { id: 'b_alamo', name: 'Alamo Bowl', detail: 'San Antonio, Texas', home: getBowlTeam(['Big 12']), away: getBowlTeam(['Pac-12', 'SEC']) },
        { id: 'b_gator', name: 'Gator Bowl', detail: 'Jacksonville, Florida', home: getBowlTeam(['SEC']), away: getBowlTeam(['ACC']) },
        { id: 'b_texas', name: 'Texas Bowl', detail: 'Houston, Texas', home: getBowlTeam(['Big 12']), away: getBowlTeam(['SEC']) },
        { id: 'b_musiccity', name: 'Music City Bowl', detail: 'Nashville, Tennessee', home: getBowlTeam(['SEC']), away: getBowlTeam(['Big Ten']) },
        { id: 'b_lasvegas', name: 'Las Vegas Bowl', detail: 'Las Vegas, Nevada', home: getBowlTeam(['SEC']), away: getBowlTeam(['Pac-12', 'Big Ten']) },
        { id: 'b_mayo', name: "Duke's Mayo Bowl", detail: 'Charlotte, North Carolina', home: getBowlTeam(['ACC']), away: getBowlTeam(['Big Ten']) },
        { id: 'b_holiday', name: 'Holiday Bowl', detail: 'San Diego, California', home: getBowlTeam(['ACC']), away: getBowlTeam(['Pac-12', 'Big Ten']) },
        { id: 'b_liberty', name: 'Liberty Bowl', detail: 'Memphis, Tennessee', home: getBowlTeam(['Big 12']), away: getBowlTeam(['SEC']) },
        { id: 'b_sun', name: 'Sun Bowl', detail: 'El Paso, Texas', home: getBowlTeam(['ACC']), away: getBowlTeam(['Pac-12', 'Big Ten']) },
        { id: 'b_pinstripe', name: 'Pinstripe Bowl', detail: 'Bronx, New York', home: getBowlTeam(['ACC']), away: getBowlTeam(['Big Ten']) },
        { id: 'b_xbox', name: 'Xbox Bowl', detail: 'Frisco, Texas', home: getBowlTeam(['American']), away: getBowlTeam(['Big 12', 'ACC']) },
        { id: 'b_fenway', name: 'Fenway Bowl', detail: 'Boston, Massachusetts', home: getBowlTeam(['ACC']), away: getBowlTeam(['American']) },
        { id: 'b_gasparilla', name: 'Gasparilla Bowl', detail: 'Tampa, Florida', home: getBowlTeam(['SEC']), away: getBowlTeam(['American']) },
        { id: 'b_armedforces', name: 'Armed Forces Bowl', detail: 'Fort Worth, Texas', home: getBowlTeam(['Big 12']), away: getBowlTeam(['American']) },
        { id: 'b_puertorico', name: 'Puerto Rico Bowl', detail: 'Bayamón, Puerto Rico', home: getBowlTeam(['American']), away: getBowlTeam(['Independent', 'ACC']) },
        { id: 'b_idaho', name: 'Famous Idaho Potato Bowl', detail: 'Boise, Idaho', home: getBowlTeam(['American']), away: getBowlTeam(['Big Ten', 'Big 12']) },
      ];

      bowlGames = potentialBowls
        .filter(b => b.home && b.away)
        .map(b => ({ ...b, home: b.home.id, away: b.away.id, round: 5, isBowl: true }));
    }

    return { seeds: seedsArray, seedMap, games: [...ccGames, ...cfpGames, ...bowlGames], ccGames, cfpGames, bowlGames, ccgsComplete };
  }, [teams, masterSchedule, results]);

  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-slate-900 transition-colors duration-300">
        
        {/* Pass teams, results, and masterSchedule to compute live ranks in the Nav bar search */}
        <Navigation setShowModal={setShowModal} resetAllPicks={resetAllPicks} teams={teams} results={results} masterSchedule={masterSchedule} />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/poll" element={<Poll teams={teams} schedule={masterSchedule} results={results} />} />
            <Route path="/standings" element={<ConferenceStandings teams={teams} schedule={masterSchedule} results={results} />} />
            <Route path="/teams" element={<TeamsDirectory teams={teams} masterSchedule={masterSchedule} results={results} onSimulate={runSimulation} />} />
            <Route path="/postseason" element={<PlayoffBracket playoffData={playoffData} teams={teams} results={results} onPick={handlePick} />} />
            <Route path="/team/:teamId" element={<TeamPage teams={teams} schedule={masterSchedule} results={results} onPick={handlePick} playoffData={playoffData} />} />
            
            {/* Catch-all route for the 404 page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Basic Footer */}
        <footer className="bg-slate-900 text-slate-400 text-center py-8 mt-auto border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-3">
            
            {/* Site Name */}
            <p className="text-sm font-black italic uppercase tracking-widest text-white">
              <span style={{ color: '#25bee8' }}>CFB</span> <span style={{ color: '#f5ce42' }}>GAMES</span>
            </p>
            
            {/* Creator & GitHub */}
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
              <span>Made by Franklin</span>
              <span className="text-slate-700">•</span>
              <a 
                href="https://github.com/franklinwright/cfb-standings-engine" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 hover:text-[#25bee8] transition-colors"
                aria-label="GitHub Repository"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>

            {/* Disclaimer */}
            <p className="text-[9px] mt-1 tracking-[0.2em] uppercase text-slate-600">
              Not affiliated with the NCAA.
            </p>

          </div>
        </footer>

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setShowModal(false)} className="cursor-pointer absolute top-5 right-5 text-slate-400 hover:text-slate-900 font-black text-xl">✕</button>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 mb-6">Share & Save</h2>
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-[0.2em]">Export Data</h3>
                  <div className="mb-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Save File Name</label>
                    <div className="flex items-center mt-1">
                      <input type="text" value={exportName} onChange={(e) => setExportName(e.target.value)} className="flex-1 border-2 border-slate-200 rounded-l-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-[#25bee8] transition-colors" />
                      <span className="bg-slate-200 text-slate-500 font-bold text-sm px-3 py-2.5 border-y-2 border-r-2 border-slate-200 rounded-r-xl">.cfb</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={handleExportFile} className="cursor-pointer bg-[#25bee8] text-white p-3 rounded-xl font-bold uppercase text-xs hover:bg-sky-500 transition-colors shadow-sm">💾 Download File</button>
                    <button onClick={handleExportCode} className="cursor-pointer bg-slate-900 text-white p-3 rounded-xl font-bold uppercase text-xs hover:bg-slate-800 transition-colors shadow-sm truncate">📋 {copyStatus}</button>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-[0.2em]">Load Progress</h3>
                  <div className="space-y-3">
                    <label className="cursor-pointer flex w-full bg-white border-2 border-dashed border-slate-300 text-slate-600 justify-center p-4 rounded-xl font-bold uppercase text-xs hover:border-[#25bee8] hover:text-[#25bee8] transition-all">
                      📂 Upload .cfb Save File
                      <input type="file" accept=".cfb" className="hidden" onChange={handleImportFile} />
                    </label>
                    <div className="flex gap-2 items-center"><span className="text-xs font-bold text-slate-400 uppercase w-full text-center">-- OR --</span></div>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Paste Save Code here..." value={importCode} onChange={(e) => setImportCode(e.target.value)} className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:border-[#25bee8] outline-none transition-colors" />
                      <button onClick={handleImportCode} className="cursor-pointer bg-slate-900 text-white px-6 py-2 rounded-xl font-bold uppercase text-xs hover:bg-slate-800 transition-colors shadow-sm">Load</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;