import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { teams, masterSchedule } from './teams';
import Home from './pages/Home';
import TeamPage from './pages/TeamPage';
import TeamsDirectory from './pages/TeamsDirectory';
import ConferenceStandings from './pages/ConferenceStandings';
import PlayoffBracket from './pages/PlayoffBracket';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem('cfb_picks_2026');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('cfb_picks_2026', JSON.stringify(results));
  }, [results]);

  const handlePick = (gameId, winnerId) => {
    setResults(prev => {
      const newResults = { ...prev, [gameId]: winnerId };
      
      /**
       * 1. REGULAR SEASON SAFETY
       * If a user changes a regular season game (ID is a number),
       * we MUST wipe all conference championships and all playoff games.
       * This forces the user to re-confirm champions based on new standings.
       */
      if (typeof gameId === 'number') {
        Object.keys(newResults).forEach(key => {
          if (key.startsWith('cc_') || key.startsWith('p_')) {
            delete newResults[key];
          }
        });
      }

      /**
       * 2. CONFERENCE CHAMPIONSHIP SAFETY
       * If a user changes a Conference Champion (ID starts with 'cc_'),
       * we MUST wipe all playoff games because the seeds/automatic bids changed.
       */
      if (typeof gameId === 'string' && gameId.startsWith('cc_')) {
        Object.keys(newResults).forEach(key => {
          if (key.startsWith('p_')) {
            delete newResults[key];
          }
        });
      }

      /**
       * 3. PLAYOFF ROUND-BY-ROUND SAFETY
       * Prevents the bracket from breaking if an early-round pick is changed.
       */
      // If Round 1 changes -> wipe Quarterfinals, Semis, and Finals
      if (typeof gameId === 'string' && gameId.startsWith('p_r1_')) {
        Object.keys(newResults).forEach(key => {
          if (key.startsWith('p_qf_') || key.startsWith('p_sf_') || key === 'p_nc') {
            delete newResults[key];
          }
        });
      }

      // If Quarterfinal changes -> wipe Semis and Finals
      if (typeof gameId === 'string' && gameId.startsWith('p_qf_')) {
        Object.keys(newResults).forEach(key => {
          if (key.startsWith('p_sf_') || key === 'p_nc') {
            delete newResults[key];
          }
        });
      }

      // If Semifinal changes -> wipe Finals
      if (typeof gameId === 'string' && gameId.startsWith('p_sf_')) {
        delete newResults['p_nc'];
      }
      
      return newResults;
    });
  };

  const runSimulation = (mode) => {
    const newResults = { ...results };

    // Before simulating, clear existing postseason picks to ensure 
    // the new simulation doesn't conflict with old data.
    Object.keys(newResults).forEach(key => {
      if (key.startsWith('cc_') || key.startsWith('p_')) {
        delete newResults[key];
      }
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

            if (power2.includes(home.conf) || power2.includes(away.conf)) {
              upsetBias = 0.7; 
            } else if (!standardPower.includes(home.conf) && !standardPower.includes(away.conf)) {
              upsetBias = 2.5; 
            }

            let dynamicUpsetThreshold = 0;
            if (diff > 25) dynamicUpsetThreshold = 0.001; 
            else if (diff > 10) dynamicUpsetThreshold = 0.02;
            else if (diff > 7) dynamicUpsetThreshold = 0.08;
            else dynamicUpsetThreshold = 0.20;

            const finalThreshold = dynamicUpsetThreshold * upsetBias;
            const roll = Math.random();

            if (roll > finalThreshold) {
              newResults[game.id] = homePower >= awayPower ? game.home : game.away;
            } else {
              newResults[game.id] = homePower >= awayPower ? game.away : game.home;
            }
            break;
          case 'underdog':
            newResults[game.id] = Math.random() < 0.7 ? (homePower < awayPower ? game.home : game.away) : (homePower >= awayPower ? game.home : game.away);
            break;
          case 'blueblood':
            const hBias = (home.conf === 'SEC' || home.conf === 'Big Ten') ? 15 : 0;
            const aBias = (away.conf === 'SEC' || away.conf === 'Big Ten') ? 15 : 0;
            newResults[game.id] = (homePower + hBias) >= (awayPower + aBias) ? game.home : game.away;
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
    if (window.confirm("Clear all your 2026 picks?")) setResults({});
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
        const home = confTeams[0];
        const away = confTeams[1];
        const gameId = `cc_${conf.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
        
        ccGames.push({
          id: gameId,
          round: 0,
          name: `${conf} Championship`,
          detail: 'Dec. 5/6 • Neutral Site',
          home: home.id,
          away: away.id,
          isCCG: true
        });
        
        if (results[gameId]) {
          confChamps.push(stats.find(t => t.id === results[gameId]));
        }
      } else if (confTeams.length === 1) {
        confChamps.push(confTeams[0]);
      }
    });

    const ccgsComplete = ccGames.length > 0 && ccGames.every(g => results[g.id]);

    let seedsArray = [];
    let seedMap = {};
    let cfpGames = [];

    if (ccgsComplete) {
      const getChamp = (confNames) => {
        const eligible = confChamps.filter(c => confNames.includes(c.conf)).sort((a,b) => a.rank - b.rank);
        return eligible[0];
      };

      const power4Champs = [getChamp(['ACC']), getChamp(['Big Ten']), getChamp(['Big 12']), getChamp(['SEC'])].filter(Boolean);
      const g6Champs = confChamps.filter(c => !['ACC', 'Big Ten', 'Big 12', 'SEC', 'Independent'].includes(c.conf)).sort((a,b) => a.rank - b.rank);
      const highestG6Champ = g6Champs[0];

      const autoQualifiers = [...power4Champs, highestG6Champ].filter(Boolean).sort((a,b) => a.rank - b.rank);
      
      const top4Champs = autoQualifiers.slice(0, 4);
      const fifthChamp = autoQualifiers[4];

      let remaining = stats.filter(t => !top4Champs.find(c => c.id === t.id) && (!fifthChamp || t.id !== fifthChamp.id));
      
      // === THE NOTRE DAME RULE ===
      // "The University of Notre Dame will be included in the playoff if it is ranked among the top 12 teams in the final rankings."
      let atLarges = [];
      const nd = stats.find(t => t.id === 'nd');
      
      if (nd && nd.rank <= 12 && !remaining.slice(0, 7).find(t => t.id === 'nd')) {
         // Guarantee ND a spot in the 7 at-larges if they are Top 12.
         atLarges.push(nd);
         remaining = remaining.filter(t => t.id !== 'nd');
         atLarges = [...atLarges, ...remaining.slice(0, 6)];
      } else {
         atLarges = remaining.slice(0, 7);
      }

      const next8 = [...(fifthChamp ? [fifthChamp] : []), ...atLarges].sort((a, b) => a.rank - b.rank);
      seedsArray = [...top4Champs, ...next8];
      
      seedsArray.forEach((t, i) => seedMap[t.id] = i + 1);
      const getSeed = (num) => seedsArray[num - 1];

      cfpGames = [
        { id: 'p_r1_1', round: 1, name: 'First Round', detail: 'Dec. 19/20 • Campus Site', home: getSeed(5)?.id, away: getSeed(12)?.id },
        { id: 'p_r1_2', round: 1, name: 'First Round', detail: 'Dec. 20 • Campus Site', home: getSeed(6)?.id, away: getSeed(11)?.id },
        { id: 'p_r1_3', round: 1, name: 'First Round', detail: 'Dec. 20 • Campus Site', home: getSeed(7)?.id, away: getSeed(10)?.id },
        { id: 'p_r1_4', round: 1, name: 'First Round', detail: 'Dec. 20 • Campus Site', home: getSeed(8)?.id, away: getSeed(9)?.id },
        
        { id: 'p_qf_1', round: 2, name: 'Quarterfinal', detail: 'Dec. 31/Jan. 1 • Bowl Game', home: getSeed(1)?.id, away: results['p_r1_4'] || null },
        { id: 'p_qf_4', round: 2, name: 'Quarterfinal', detail: 'Dec. 31/Jan. 1 • Bowl Game', home: getSeed(4)?.id, away: results['p_r1_1'] || null },
        { id: 'p_qf_2', round: 2, name: 'Quarterfinal', detail: 'Dec. 31/Jan. 1 • Bowl Game', home: getSeed(2)?.id, away: results['p_r1_3'] || null },
        { id: 'p_qf_3', round: 2, name: 'Quarterfinal', detail: 'Dec. 31/Jan. 1 • Bowl Game', home: getSeed(3)?.id, away: results['p_r1_2'] || null },
        
        { id: 'p_sf_1', round: 3, name: 'Semifinal', detail: 'Jan. 8 • Fiesta Bowl', home: results['p_qf_1'] || null, away: results['p_qf_4'] || null },
        { id: 'p_sf_2', round: 3, name: 'Semifinal', detail: 'Jan. 9 • Peach Bowl', home: results['p_qf_2'] || null, away: results['p_qf_3'] || null },
        
        { id: 'p_nc', round: 4, name: 'National Championship', detail: 'Jan. 19 • Miami, FL', home: results['p_sf_1'] || null, away: results['p_sf_2'] || null }
      ];
    }

    return { seeds: seedsArray, seedMap, games: [...ccGames, ...cfpGames], ccGames, ccgsComplete };
  }, [teams, masterSchedule, results]);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-gray-50 font-sans text-slate-900 transition-colors duration-300">
        <nav className="bg-white border-b border-gray-200 p-4 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic transition-colors" style={{ color: '#25bee8' }}>
                CFB<span style={{ color: '#f5ce42' }}>ENGINE</span>
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <div className="flex gap-4 md:gap-6 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                <Link to="/" className="text-slate-500 hover:text-[#25bee8] transition-all">Poll</Link>
                <Link to="/standings" className="text-slate-500 hover:text-[#25bee8] transition-all">Standings</Link>
                <Link to="/teams" className="text-slate-500 hover:text-[#25bee8] transition-all">Teams</Link>
                <Link to="/postseason" className="text-slate-500 hover:text-[#25bee8] transition-all">Postseason</Link>
              </div>
              <button
                onClick={resetAllPicks}
                className="hidden md:block px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
              >
                Reset
              </button>
            </div>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Home teams={teams} schedule={masterSchedule} results={results} />} />
            <Route path="/standings" element={<ConferenceStandings teams={teams} schedule={masterSchedule} results={results} />} />
            <Route path="/teams" element={<TeamsDirectory teams={teams} masterSchedule={masterSchedule} results={results} onSimulate={runSimulation} />} />
            <Route path="/postseason" element={<PlayoffBracket playoffData={playoffData} teams={teams} results={results} onPick={handlePick} />} />
            <Route path="/team/:teamId" element={<TeamPage teams={teams} schedule={masterSchedule} results={results} onPick={handlePick} playoffData={playoffData} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;