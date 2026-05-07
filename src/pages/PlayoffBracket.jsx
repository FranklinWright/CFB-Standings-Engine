import React from 'react';

function PlayoffBracket({ playoffData, teams, results, onPick }) {
  const { games, seedMap, ccGames, ccgsComplete } = playoffData;

  const getTeamInfo = (teamId) => {
    if (!teamId) return { name: 'TBD', logo: null, seed: '-' };
    const team = teams.find(t => t.id === teamId);
    return { 
      ...team, 
      seed: seedMap[teamId] || '-' 
    };
  };

  const GameCard = ({ gameId, className }) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return null;

    const home = getTeamInfo(game.home);
    const away = getTeamInfo(game.away);
    const winner = results[game.id];

    return (
      <div className={`bg-white border-2 border-slate-100 rounded-[1.5rem] p-3 shadow-md w-full hover:shadow-xl transition-all ${className}`}>
        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 text-center leading-tight">
          <span className={`block ${game.isCCG ? 'text-slate-900' : 'text-[#25bee8]'}`}>{game.name}</span>
          {game.detail}
        </div>
        
        <div className="space-y-1">
            <button 
                onClick={() => game.away && game.home && onPick(game.id, game.away)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border ${winner === game.away ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-gray-50 border-transparent hover:border-slate-300'}`}
            >
            <div className="flex items-center gap-3">
                {!game.isCCG && <span className={`text-[10px] font-black w-4 text-left ${winner === game.away ? 'text-[#25bee8]' : 'text-slate-400'}`}>{away.seed !== '-' ? away.seed : ''}</span>}
                {away.logo && <img src={away.logo} alt="" className="w-6 h-6 object-contain" />}
                <span className={`font-bold text-sm uppercase truncate ${!away.logo && 'ml-2'}`}>{away.name}</span>
            </div>
            {winner === game.away && <span className="text-[#25bee8] text-sm font-black">✓</span>}
            </button>

            <button 
                onClick={() => game.away && game.home && onPick(game.id, game.home)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border ${winner === game.home ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-gray-50 border-transparent hover:border-slate-300'}`}
            >
            <div className="flex items-center gap-3">
                {!game.isCCG && <span className={`text-[10px] font-black w-4 text-left ${winner === game.home ? 'text-[#25bee8]' : 'text-slate-400'}`}>{home.seed !== '-' ? home.seed : ''}</span>}
                {home.logo && <img src={home.logo} alt="" className="w-6 h-6 object-contain" />}
                <span className={`font-bold text-sm uppercase truncate ${!home.logo && 'ml-2'}`}>{home.name}</span>
            </div>
            {winner === game.home && <span className="text-[#25bee8] text-sm font-black">✓</span>}
            </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER - Sticky class removed so it stays at the top of the page only */}
      <div className="bg-white py-12 px-6 text-center shadow-sm border-b border-gray-200">
        <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
          <span className="text-[#25bee8]">THE</span> POSTSEASON
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-4">Championship Week & 12-Team CFP Format</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* CONFERENCE CHAMPIONSHIPS */}
        <div className="mb-16">
            <div className="flex items-center justify-between border-b-2 border-slate-200 mb-6 pb-2">
                <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">Conference Championships</h2>
                {!ccgsComplete && <span className="text-[10px] font-black uppercase bg-red-100 text-red-600 px-3 py-1 rounded-full">Action Required</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ccGames.map(game => (
                    <GameCard key={game.id} gameId={game.id} className={results[game.id] ? "border-slate-300" : "border-[#25bee8] shadow-[0_0_15px_rgba(37,190,232,0.2)]"} />
                ))}
            </div>
        </div>

        {/* 12-TEAM CFP BRACKET */}
        <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tighter mb-6 border-b-2 border-slate-200 pb-2">College Football Playoff</h2>
        
        {ccgsComplete ? (
            <div className="overflow-x-auto pb-8">
                <div className="grid grid-cols-4 min-w-[1200px] gap-8">
                    
                    {/* ROUND 1 */}
                    <div className="flex flex-col justify-between h-[750px] py-4">
                        <GameCard gameId="p_r1_1" /> {/* 5v12 */}
                        <GameCard gameId="p_r1_2" /> {/* 6v11 */}
                        <GameCard gameId="p_r1_3" /> {/* 7v10 */}
                        <GameCard gameId="p_r1_4" /> {/* 8v9 */}
                    </div>

                    {/* QUARTERFINALS */}
                    <div className="flex flex-col justify-between h-[750px] py-4">
                        <GameCard gameId="p_qf_4" /> 
                        <GameCard gameId="p_qf_3" /> 
                        <GameCard gameId="p_qf_2" /> 
                        <GameCard gameId="p_qf_1" /> 
                    </div>

                    {/* SEMIFINALS */}
                    <div className="flex flex-col justify-around h-[750px] py-16">
                        <GameCard gameId="p_sf_1" className="border-[#25bee8]/50 shadow-[#25bee8]/10" />
                        <GameCard gameId="p_sf_2" className="border-[#25bee8]/50 shadow-[#25bee8]/10" />
                    </div>

                    {/* NATIONAL CHAMPIONSHIP */}
                    <div className="flex flex-col justify-center h-[750px]">
                        <div className="transform scale-110 origin-left">
                            <GameCard gameId="p_nc" className="border-slate-900 shadow-xl" />
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-3xl mx-auto mt-10">
                <span className="text-6xl mb-4 block">🔒</span>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">CFP Bracket Locked</h3>
                <p className="text-slate-500 font-medium leading-relaxed max-w-lg mx-auto">
                    To determine the 5 Automatic Qualifiers and finalize the 12-team seeding, you must first select the winners of <b>all Conference Championship Games</b> above.
                </p>
            </div>
        )}
      </div>
    </div>
  );
}

export default PlayoffBracket;