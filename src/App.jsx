import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { teams, masterSchedule } from './teams'; 
import Home from './pages/Home';
import TeamPage from './pages/TeamPage';
import TeamsDirectory from './pages/TeamsDirectory';

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
    setResults(prev => ({ ...prev, [gameId]: winnerId }));
  };

  const autoPredictAll = () => {
    const newResults = { ...results };
    masterSchedule.forEach(game => {
      if (!newResults[game.id]) {
        const homeTeam = teams.find(t => t.id === game.home);
        const awayTeam = teams.find(t => t.id === game.away);

        if (homeTeam && !awayTeam) {
          newResults[game.id] = game.home;
        } else if (!homeTeam && awayTeam) {
          newResults[game.id] = game.away;
        } else if (homeTeam && awayTeam) {
          const homeStrength = homeTeam.rating + 2;
          const awayStrength = awayTeam.rating;
          newResults[game.id] = homeStrength >= awayStrength ? game.home : game.away;
        }
      }
    });
    setResults(newResults);
  };

  const resetAllPicks = () => {
    if (window.confirm("Clear all your 2026 picks?")) setResults({});
  };

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-gray-50 font-sans text-slate-900 transition-colors duration-300">
        <nav className="bg-white/90 backdrop-blur-md border-b-4 p-4 sticky top-0 z-50 shadow-sm" style={{ borderBottomColor: '#f5ce42' }}>
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-3xl font-black tracking-tighter uppercase italic transition-colors" style={{ color: '#25bee8' }}>
                CFB<span style={{ color: '#f5ce42' }}>ENGINE</span>
              </span>
            </Link>
            <div className="flex items-center gap-8">
              <div className="flex gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
                <Link to="/" className="text-slate-500 hover:text-[#25bee8] transition-all">Poll</Link>
                <Link to="/teams" className="text-slate-500 hover:text-[#25bee8] transition-all">Find Teams</Link>
              </div>
              <button 
                onClick={resetAllPicks} 
                className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
              >
                Reset
              </button>
            </div>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Home teams={teams} schedule={masterSchedule} results={results} />} />
            <Route path="/teams" element={<TeamsDirectory teams={teams} onAutoPredict={autoPredictAll} />} />
            <Route path="/team/:teamId" element={<TeamPage teams={teams} schedule={masterSchedule} results={results} onPick={handlePick} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;