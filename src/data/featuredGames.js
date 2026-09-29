// Featured broadcast games — manually curated
//
// gameDay:  true → ESPN College GameDay site game
// bigNoon:  true → FOX Big Noon Kickoff
// abcNight: true → ABC Saturday Night Football (7:30 PM ET)
// summary:  short paragraph shown on the game page
//
// To find a game's ID: check masterSchedule in src/data/teams.js
// or read the URL when viewing /game/ID

export const featuredGames = {

  // ── Week 1: Sep 5 ────────────────────────────────────────────────────────
  // ESPN GameDay + ABC Night: Clemson at #11 LSU (Baton Rouge)
  29: {
    gameDay: true,
    abcNight: true,
    summary: `College GameDay opened the 2026 season in Baton Rouge for a marquee primetime clash between Clemson and #11 LSU. Death Valley lived up to its name: the Tigers roared out of the gate with 17 first-quarter points and never let up, pouring in 51 points for one of the most dominant season-opening statements in recent memory. Clemson, despite managing an early field goal, was completely overwhelmed as LSU's offense operated in a different gear all night. The lopsided 51–10 final sent a clear message to the rest of the country — the SEC powerhouse was ready to make a serious run.`,
  },

  // FOX Big Noon: North Texas at #6 Indiana (Bloomington)
  53: {
    bigNoon: true,
    summary: `#6 Indiana brought the Big Noon Kickoff to Bloomington in their 2026 opener against North Texas, using the nationally televised stage to flex their Big Ten muscle. The Hoosiers built a comfortable lead through the first half and put the game away in emphatic fashion with a massive 21-point fourth quarter, cruising to a 52–16 final. North Texas showed some fight in the middle quarters — picking up 16 points across the second and third — but Indiana's firepower was simply too much. It was a confident season-opening performance for a Hoosiers squad with legitimate playoff aspirations.`,
  },

  // ── Week 2: Sep 12 ───────────────────────────────────────────────────────
  // ESPN GameDay + ABC Night: #1 Ohio State at #5 Texas (Austin)
  114: {
    gameDay: true,
    abcNight: true,
    summary: `The biggest game of the young season delivered an instant classic. #1 Ohio State arrived in Austin carrying all the swagger of a defending powerhouse, and for three quarters they looked every bit the part — building a 23–3 lead that had the Buckeyes seemingly in cruise control. Then came one of the greatest fourth-quarter comebacks in Texas Longhorns history. Sark's offense erupted for 21 unanswered points across three lightning-fast scoring drives, stunning the College GameDay crowd and the nation watching on ABC. The final score of 24–23 sent the Forty Acres into a frenzy and immediately reshuffled the entire College Football Playoff picture. Texas was no longer a contender — they were the standard.`,
  },

  // FOX Big Noon: #10 Oklahoma at #16 Michigan (Ann Arbor)
  111: {
    bigNoon: true,
    summary: `Two blue bloods collided under the Big Noon lights at the Big House in a battle that was tighter than either team expected. Michigan took an early 7-point lead and nursed it carefully throughout, leaning on their defense to stifle a #10 Oklahoma offense that never fully found its rhythm. The Sooners cut it to a one-score game late, but Michigan's relentless ground game chewed the clock and sealed a 17–10 victory. The win reaffirmed Michigan's status as a legitimate Big Ten contender while raising early questions about Oklahoma's ceiling under their new offensive system.`,
  },

  // ── Week 3: Sep 19 ───────────────────────────────────────────────────────
  // ESPN GameDay + ABC Night: #8 LSU at #9 Ole Miss (Oxford)
  191: {
    gameDay: true,
    abcNight: true,
    summary: `College GameDay rolled into The Grove for what turned out to be one of the wildest SEC showdowns of the season. #8 LSU and #9 Ole Miss traded blows in a game that swung momentum multiple times. Ole Miss raced out to a 24–7 lead after two quarters, then LSU mounted a furious third-quarter comeback to claw it back to 24–21. A late LSU field goal appeared to force overtime at 24–24 — but Ole Miss had other ideas, responding with an 8-point drive featuring a touchdown and a two-point conversion to steal a 32–24 victory. The Rebels left Oxford ranked higher than they entered, with a statement win over a top-10 opponent on national television.`,
  },

  // FOX Big Noon: Kent State at #1 Ohio State (Columbus)
  225: {
    bigNoon: true,
    summary: `Coming off their soul-crushing loss to Texas the week prior, #1 Ohio State used Kent State as a punching bag in the most clinical way possible. The Buckeyes scored 21 first-quarter points before most viewers had finished their morning coffee and rolled to a 59–3 destruction that was really never in doubt at any point. Ohio State's defense allowed just a single late field goal, a reminder that despite the heartbreak in Austin, this was still one of the most talented rosters in the country. A necessary catharsis heading into conference play.`,
  },

  // ── Week 4: Sep 26 ───────────────────────────────────────────────────────
  // ESPN GameDay: #1 Texas at #15 Tennessee (Knoxville)
  271: {
    gameDay: true,
    summary: `College GameDay made the trip to Neyland Stadium for a true test of #1 Texas's mettle. Tennessee's raucous crowd rattled the Longhorns early, but Texas's defense kept the Vols at arm's length all afternoon. The game was tight throughout — both teams exchanged scores in the first half and again in the fourth quarter — but Texas's defense made just enough plays down the stretch to escape with a hard-fought 20–17 win. It wasn't always pretty, but winning on the road in that environment against a top-15 opponent is the mark of a championship-caliber team. Texas's grip on #1 remained firm heading into October.`,
  },

  // FOX Big Noon: Illinois at #6 Ohio State (Columbus)
  293: {
    bigNoon: true,
    summary: `The Big Noon Kickoff came to Columbus as #6 Ohio State — on a mission to prove the Texas loss was an aberration — put on a show against Illinois. The Buckeyes scored 14 in each of the first two quarters to build a commanding lead, then closed things out with another 14-spot in the fourth for a 42–19 final. Illinois showed surprising life, putting up 19 points and keeping it interesting at moments, but Ohio State's talent advantage ultimately won out. It was the kind of dominating bounce-back performance the Buckeyes needed to remind the nation they remained firmly in the playoff conversation.`,
  },

  // ABC Saturday Night: #9 Texas A&M at #7 LSU (Baton Rouge)
  269: {
    abcNight: true,
    summary: `Death Valley turned into a nightmare for #9 Texas A&M under the Saturday night lights on ABC. #7 LSU delivered their most complete performance of the season, especially in a third quarter where they outscored the Aggies 21–0 to blow the game wide open. Texas A&M, who entered with legitimate SEC title hopes, was held to just two field goals the entire night — a stunning offensive collapse against an LSU defense operating at an elite level. The 35–6 final was a statement win that vaulted LSU into the top tier of the SEC and left A&M searching for answers heading into the meat of conference play.`,
  },
};
