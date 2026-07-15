/**
 * @file PlayoffBracket.jsx
 * @description Manages the postseason dashboard, including Conference Championship Games (CCG),
 * the 12-team College Football Playoff bracket, and non-playoff Bowl games.
 */

import React, { useState, useEffect } from 'react';

/**
 * PlayoffBracket Component
 * @param {Object} props
 * @param {Object} props.playoffData - Contains game structure, seeds, and postseason state
 * @param {Array} props.teams - Array of team objects
 * @param {Object} props.results - Mapping of gameId to winnerId
 * @param {Function} props.onPick - Callback to record game selections
 */
function PlayoffBracket({ playoffData, teams, results, onPick }) {
  const { games, seedMap, ccGames, ccgsComplete, bowlGames } = playoffData;
  const [activeTab, setActiveTab] = useState('ccg'); // Tabs: 'ccg', 'cfp', 'bowls'

  /**
   * Resolves the logo source. If a team logo is missing or uses the default, 
   * falls back to the CBS sports logo format or a generic football icon.
   */
  const getLogoSrc = (logoUrl, teamId) => {
    if (!logoUrl) return '/favicon.ico';
    if (logoUrl.includes('default.png') && teamId) {
      return `https://sports.cbsimg.net/images/collegefootball/logos/50x50/${teamId.toLowerCase()}.png`;
    }
    return logoUrl;
  };

  const getTeamInfo = (teamId) => {
    if (!teamId) return { name: 'TBD', logo: null, seed: '-' };
    const team = teams.find(t => t.id === teamId);
    return { ...team, seed: seedMap[teamId] || '-' };
  };

  /**
   * Identifies FCS teams to exclude them from FBS postseason bracket logic.
   */
  const isFCS = (teamId) => {
    if (!teamId) return false;
    const team = teams.find(t => t.id === teamId);
    return team?.conf === 'FCS/Other';
  };

  /**
   * Background effect: Silently auto-picks any FCS Championship games 
   * so they don't block the UI logic for FBS post-season completion.
   */
  useEffect(() => {
    if (ccGames) {
      ccGames.forEach(game => {
        if ((isFCS(game.home) || isFCS(game.away)) && !results[game.id]) {
          if (game.home && game.away) {
            onPick(game.id, game.home); 
          }
        }
      });
    }
  }, [ccGames, results, onPick]);

  // Filter out any games that accidentally included an FCS team
  const safeCcGames = ccGames?.filter(g => !isFCS(g.home) && !isFCS(g.away)) || [];
  const safeBowlGames = bowlGames?.filter(g => !isFCS(g.home) && !isFCS(g.away)) || [];

  // Override engine state to strictly monitor FBS game completion
  const actualCcgsComplete = safeCcGames.length > 0 ? safeCcGames.every(game => results[game.id]) : ccgsComplete;

  /**
   * GameCard Component
   * Renders an individual matchup card with interactive selection buttons.
   */
  const GameCard = ({ gameId, className }) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return null;

    const home = getTeamInfo(game.home);
    const away = getTeamInfo(game.away);
    const winner = results[game.id];

    return (
      <div className={`bg-white border-2 border-slate-100 rounded-[1.5rem] p-3 shadow-md w-full transition-all ${className}`}>
        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 text-center leading-tight">
          <span className={`block ${game.isCCG ? 'text-slate-900' : game.isBowl ? 'text-[#f5ce42]' : 'text-[#25bee8]'}`}>{game.name}</span>
          {game.detail}
        </div>
        <div className="space-y-1">
            <button 
                onClick={() => game.away && game.home && onPick(game.id, game.away)}
                className={`cursor-pointer w-full flex items-center justify-between p-2.5 rounded-xl transition-all border ${winner === game.away ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-gray-50 border-transparent hover:border-slate-300'}`}
            >
            <div className="flex items-center gap-3">
                {!game.isCCG && !game.isBowl && <span className={`text-[10px] font-black w-4 text-left ${winner === game.away ? 'text-[#25bee8]' : 'text-slate-400'}`}>{away.seed !== '-' ? away.seed : ''}</span>}
                <img 
                    src={getLogoSrc(away.logo, away.id)} 
                    alt="" 
                    onError={(e) => { e.target.src = '/favicon.ico'; }} 
                    className="w-6 h-6 object-contain" 
                />
                <span className={`font-bold text-sm uppercase truncate ${!away.logo && 'ml-2'}`}>{away.name}</span>
            </div>
            {winner === game.away && <span className={game.isBowl ? "text-[#f5ce42] text-sm font-black" : "text-[#25bee8] text-sm font-black"}>✓</span>}
            </button>

            <button 
                onClick={() => game.away && game.home && onPick(game.id, game.home)}
                className={`cursor-pointer w-full flex items-center justify-between p-2.5 rounded-xl transition-all border ${winner === game.home ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-gray-50 border-transparent hover:border-slate-300'}`}
            >
            <div className="flex items-center gap-3">
                {!game.isCCG && !game.isBowl && <span className={`text-[10px] font-black w-4 text-left ${winner === game.home ? 'text-[#25bee8]' : 'text-slate-400'}`}>{home.seed !== '-' ? home.seed : ''}</span>}
                <img 
                    src={getLogoSrc(home.logo, home.id)} 
                    alt="" 
                    onError={(e) => { e.target.src = '/favicon.ico'; }} 
                    className="w-6 h-6 object-contain" 
                />
                <span className={`font-bold text-sm uppercase truncate ${!home.logo && 'ml-2'}`}>{home.name}</span>
            </div>
            {winner === game.home && <span className={game.isBowl ? "text-[#f5ce42] text-sm font-black" : "text-[#25bee8] text-sm font-black"}>✓</span>}
            </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* THEMATIC HEADER */}
      <div className="bg-white py-12 px-6 text-center shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-4 inline-block shadow-sm border" style={{ color: '#25bee8', borderColor: '#25bee8' }}>
            The Postseason Dashboard
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
            <span style={{ color: '#25bee8' }}>POSTSEASON</span> <span style={{ color: '#f5ce42' }}>GAMES</span>
          </h1>
        </div>
      </div>

      {/* DASHBOARD TOGGLE MENU */}
      <div className="max-w-4xl mx-auto px-6 mt-8 mb-12">
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-2">
          <button 
            onClick={() => setActiveTab('ccg')} 
            className={`cursor-pointer flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ccg' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            Championships
            {!actualCcgsComplete && <span className="ml-2 w-2 h-2 inline-block rounded-full bg-red-500 animate-pulse"></span>}
          </button>
          
          <button 
            onClick={() => setActiveTab('cfp')} 
            className={`cursor-pointer flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'cfp' ? 'bg-[#25bee8] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            CFP Bracket
          </button>
          
          <button 
            onClick={() => setActiveTab('bowls')} 
            className={`cursor-pointer flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'bowls' ? 'bg-[#f5ce42] text-slate-900 shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            Bowl Season
          </button>
        </div>
      </div>

      {/* RENDER TABS BASED ON ACTIVE STATE */}
      <div className="max-w-7xl mx-auto px-6">
        {activeTab === 'ccg' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b-2 border-slate-200 mb-6 pb-2">
                  <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">Conference Title Games</h2>
                  {!actualCcgsComplete && <span className="text-[10px] font-black uppercase bg-red-100 text-red-600 px-3 py-1 rounded-full shadow-sm">Action Required</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {safeCcGames.map(game => (
                      <GameCard key={game.id} gameId={game.id} className={results[game.id] ? "border-slate-300" : "border-slate-900 shadow-[0_0_15px_rgba(15,23,42,0.15)]"} />
                  ))}
              </div>
          </div>
        )}

        {activeTab === 'cfp' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {actualCcgsComplete ? (
              <div className="overflow-x-auto pb-8">
                  <div className="grid grid-cols-4 min-w-[1200px] gap-8 bg-white shadow-sm border border-slate-200 p-6 rounded-3xl">
                      <div className="flex flex-col justify-between h-[750px] py-4">
                          <GameCard gameId="p_r1_4" /> 
                          <GameCard gameId="p_r1_1" /> 
                          <GameCard gameId="p_r1_2" /> 
                          <GameCard gameId="p_r1_3" /> 
                      </div>
                      <div className="flex flex-col justify-between h-[750px] py-4">
                          <GameCard gameId="p_qf_1" /> 
                          <GameCard gameId="p_qf_4" /> 
                          <GameCard gameId="p_qf_3" /> 
                          <GameCard gameId="p_qf_2" /> 
                      </div>
                      <div className="flex flex-col justify-around h-[750px] py-16">
                          <GameCard gameId="p_sf_1" className="border-[#25bee8]/50 shadow-[#25bee8]/10" /> 
                          <GameCard gameId="p_sf_2" className="border-[#25bee8]/50 shadow-[#25bee8]/10" /> 
                      </div>
                      <div className="flex flex-col justify-center h-[750px]">
                          <div className="transform scale-110 origin-left">
                              <GameCard gameId="p_nc" className="border-slate-900 shadow-2xl bg-white" />
                          </div>
                      </div>
                  </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-3xl mx-auto mt-10 shadow-sm">
                  <span className="text-6xl mb-4 block">🔒</span>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Bracket Locked</h3>
                  <p className="text-slate-500 font-medium leading-relaxed max-w-lg mx-auto">
                      To finalize the 12-team seeding, you must first complete all <b>Conference Championship Games</b>.
                  </p>
                  <button onClick={() => setActiveTab('ccg')} className="mt-6 bg-slate-900 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-md">Go to Championships</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bowls' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {actualCcgsComplete ? (
              safeBowlGames.length > 0 ? (
                <div>
                    <div className="flex items-center justify-between border-b-2 border-slate-200 mb-6 pb-2">
                        <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">Winter Bowl Season</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {safeBowlGames.map(game => (
                            <GameCard key={game.id} gameId={game.id} className={results[game.id] ? "border-slate-300" : "border-[#f5ce42] shadow-[0_0_15px_rgba(245,206,66,0.15)]"} />
                        ))}
                    </div>
                </div>
              ) : (
                <div className="text-center p-12">
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">No Eligible Teams Remaining</h3>
                </div>
              )
            ) : (
                <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-3xl mx-auto mt-10 shadow-sm">
                  <span className="text-6xl mb-4 block">🔒</span>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Bowl Matchups Locked</h3>
                  <p className="text-slate-500 font-medium leading-relaxed max-w-lg mx-auto">
                      Complete all <b>Conference Championship Games</b> first.
                  </p>
                  <button onClick={() => setActiveTab('ccg')} className="mt-6 bg-slate-900 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-md">Go to Championships</button>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayoffBracket;