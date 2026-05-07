// Inside src/App.jsx, replace your playoffData variable with this:

  const playoffData = useMemo(() => {
    const stats = teams.map(t => ({ ...t, wins: 0, losses: 0, confWins: 0, confLosses: 0 }));
    
    // 1. Calculate Regular Season Stats
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

    // 2. Generate Conference Championship Games (Top 2 from each conference)
    const confs = [...new Set(stats.map(t => t.conf))].filter(c => c !== 'Independent');
    const ccGames = [];
    const confChamps = [];

    confs.forEach(conf => {
      const confTeams = stats.filter(t => t.conf === conf).sort((a, b) => b.confWins - a.confWins || b.wins - a.wins || b.rating - a.rating);
      
      if (confTeams.length >= 2) {
        const home = confTeams[0]; // #1 Seed in Conference
        const away = confTeams[1]; // #2 Seed in Conference
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
        
        // If user picked a winner for the CCG, they are the champ. Otherwise, project the #1 seed.
        if (results[gameId]) {
          confChamps.push(stats.find(t => t.id === results[gameId]));
        } else {
          confChamps.push(home); 
        }
      } else if (confTeams.length === 1) {
        confChamps.push(confTeams[0]);
      }
    });

    // 3. CFP Selection Logic (5 Auto-Bids + 7 At-Larges)
    const getChamp = (confNames) => {
      const eligible = confChamps.filter(c => confNames.includes(c.conf)).sort((a,b) => a.rank - b.rank);
      return eligible[0];
    };

    const power4Champs = [getChamp(['ACC']), getChamp(['Big Ten']), getChamp(['Big 12']), getChamp(['SEC'])].filter(Boolean);
    const g6Champs = confChamps.filter(c => !['ACC', 'Big Ten', 'Big 12', 'SEC', 'Independent'].includes(c.conf)).sort((a,b) => a.rank - b.rank);
    const highestG6Champ = g6Champs[0];

    const autoQualifiers = [...power4Champs, highestG6Champ].filter(Boolean).sort((a,b) => a.rank - b.rank);
    
    // Top 4 Ranked Champions get Seeds 1-4
    const top4Champs = autoQualifiers.slice(0, 4);
    const fifthChamp = autoQualifiers[4];

    // Next 7 Highest Ranked
    let remaining = stats.filter(t => !top4Champs.find(c => c.id === t.id) && (!fifthChamp || t.id !== fifthChamp.id));
    const atLarges = remaining.slice(0, 7);

    // Seeds 5-12
    const next8 = [...(fifthChamp ? [fifthChamp] : []), ...atLarges].sort((a, b) => a.rank - b.rank);
    const seedsArray = [...top4Champs, ...next8];
    
    const seedMap = {};
    seedsArray.forEach((t, i) => seedMap[t.id] = i + 1);
    const getSeed = (num) => seedsArray[num - 1];

    // 4. Combine CCGs and CFP Games
    const games = [
      ...ccGames,
      
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

    return { seeds: seedsArray, seedMap, games, ccGames };
  }, [teams, masterSchedule, results]);