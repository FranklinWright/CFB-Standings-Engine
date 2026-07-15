/**
 * @file ConferenceStandings.jsx
 * @description Displays the current win/loss standings grouped by conference.
 * Calculates conference records, overall records, and national Top 25 rankings.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

/**
 * ConferenceStandings Component
 * @param {Object} props
 * @param {Array} props.teams - Array of team objects
 * @param {Array} props.schedule - Array of game objects
 * @param {Object} props.results - Mapping of gameId to winnerId
 */
function ConferenceStandings({ teams, schedule, results }) {

  /**
   * Resolves the logo source. 
   */
  const getLogoSrc = (team) => {
    if (!team.logo) return null;
    return team.logo;
  };

  /**
   * Calculates national rankings for all non-FCS teams based on total wins
   * and team rating (tie-breaker).
   */
  const nationalRanks = useMemo(() => {
    const stats = teams.map(t => {
      let wins = 0;
      schedule.forEach(game => {
        if (results[game.id] === t.id) wins++;
      });
      return { id: t.id, wins, rating: t.rating, conf: t.conf };
    });

    // Remove FCS from top 25 rankings logic
    const filteredStats = stats.filter(t => t.conf !== 'FCS/Other');
    filteredStats.sort((a, b) => b.wins - a.wins || b.rating - a.rating);

    const ranks = {};
    filteredStats.forEach((t, i) => ranks[t.id] = i + 1);
    return ranks;
  }, [teams, schedule, results]);

  /**
   * Aggregates standings data. Filters out 'FCS/Other', calculates
   * conference and overall records, and sorts by conference success.
   */
  const standingsData = useMemo(() => {
    const stats = teams.map(t => ({
      ...t,
      wins: 0,
      losses: 0,
      confWins: 0,
      confLosses: 0
    }));

    schedule.forEach(game => {
      const winnerId = results[game.id];
      if (winnerId) {
        const homeTeam = teams.find(t => t.id === game.home);
        const awayTeam = teams.find(t => t.id === game.away);

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

        if (winT) winT.wins++;
        if (lossT) lossT.losses++;

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

    const existingConfs = [...new Set(teams.filter(t => t.conf !== 'FCS/Other').map(t => t.conf))];

    const sortedConfs = existingConfs.sort((a, b) => {
      let indexA = popularityOrder.indexOf(a);
      let indexB = popularityOrder.indexOf(b);
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });

    return sortedConfs.map(conf => ({
      name: conf,
      teams: stats
        .filter(t => t.conf === conf)
        .sort((a, b) => b.confWins - a.confWins || b.wins - a.wins || b.rating - a.rating)
    }));
  }, [teams, schedule, results]);

  /**
   * Helper to retrieve color constants by conference.
   */
  const getConfColor = (conf) => {
    const styles = {
      'SEC': '#f5ce42', 'Big Ten': '#25bee8', 'ACC': '#003087',
      'Big 12': '#C41230', 'Pac-12': '#ff4d4d', 'American': '#006747',
      'Independent': '#0c2340', 'CUSA': '#003366', 'Mountain West': '#98002e',
      'Sun Belt': '#0039A6', 'MAC': '#006633'
    };
    return styles[conf] || '#94a3b8';
  };

  const scrollToConf = (confName) => {
    const element = document.getElementById(`conf-${confName}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 py-12 px-6 mb-8 text-center shadow-sm">
        <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
          <span style={{ color: '#25bee8' }}>CONFERENCE</span> <span style={{ color: '#f5ce42' }}>STANDINGS</span>
        </h1>

        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-2 md:gap-3 mt-8">
          {standingsData.map(conf => (
            <button
              key={conf.name}
              onClick={() => scrollToConf(conf.name)}
              className="cursor-pointer px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md text-white"
              style={{ backgroundColor: getConfColor(conf.name) }}
            >
              {conf.name}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 xl:grid-cols-2 gap-10">
        {standingsData.map(conf => (
          <div key={conf.name} id={`conf-${conf.name}`} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-6 flex items-center justify-between border-b-4 bg-gray-50/30" style={{ borderBottomColor: getConfColor(conf.name) }}>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900">{conf.name}</h2>
              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">{conf.teams.length} Teams</span>
            </div>

            <div className="divide-y divide-gray-100">
              <div className="grid grid-cols-12 p-4 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest bg-white">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-6 md:col-span-5">School</div>
                <div className="col-span-2 md:col-span-3 text-center">CONF</div>
                <div className="col-span-3 text-center">OVERALL</div>
              </div>

              {conf.teams.map((team, index) => (
                <Link
                  to={`/team/${team.id}`}
                  key={team.id}
                  className="cursor-pointer grid grid-cols-12 p-4 md:p-5 items-center hover:bg-gray-50 transition-colors group"
                >
                  <div className="col-span-1 text-center font-black text-slate-900 group-hover:text-[#25bee8] transition-colors">{index + 1}</div>

                  <div className="col-span-6 md:col-span-5 flex items-center gap-2 md:gap-4">
                    <div className="hidden sm:block w-1.5 h-8 md:h-10 rounded-full shadow-sm" style={{ backgroundColor: team.color }} />

                    {team.logo && (
                      <div className="w-8 h-8 md:w-10 md:h-10 shrink-0">
                        <img
                          src={getLogoSrc(team)}
                          alt={team.name}
                          className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 truncate">
                      {nationalRanks[team.id] <= 25 && <span className="font-black text-slate-900 text-xs">#{nationalRanks[team.id]}</span>}
                      <span className="font-bold text-slate-800 uppercase text-xs md:text-sm truncate group-hover:text-slate-950">{team.name}</span>
                    </div>
                  </div>

                  <div className="col-span-2 md:col-span-3 text-center font-black text-slate-900 text-base md:text-lg">
                    {team.confWins}<span className="text-slate-300 font-light mx-0.5">-</span>{team.confLosses}
                  </div>

                  <div className="col-span-3 text-center font-bold text-slate-900 text-sm md:text-base">
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