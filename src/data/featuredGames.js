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

  // ── Week 5: Oct 3 ────────────────────────────────────────────────────────
  // ABC Night: #3 Notre Dame at North Carolina (Chapel Hill)
  355: {
    abcNight: true,
    summary: `Under the Saturday night lights on ABC, #3 Notre Dame traveled to Chapel Hill for a battle that North Carolina hoped would be their program-defining moment — and for long stretches they nearly delivered. The Fighting Irish found themselves in a real fight, with the Tar Heels matching them score for score through the first three quarters. But Notre Dame's depth and composure showed when it mattered most, with a 10-point fourth quarter sealing a 37–26 road win. The victory kept the Fighting Irish locked in at #3 in the AP poll and sent a clear message: this Notre Dame squad has the tools to make a deep playoff run. For North Carolina, a valiant effort on the biggest national stage of their season.`,
  },

  // ESPN GameDay + FOX Big Noon: #7 Ohio State at #14 Iowa (Iowa City)
  360: {
    gameDay: true,
    bigNoon: true,
    summary: `College GameDay and the Big Noon Kickoff both landed in Iowa City for one of the most anticipated Big Ten matchups of the young season, as #14 Iowa welcomed #7 Ohio State to Kinnick Stadium. The Hawkeyes gave the hostile crowd early reasons to believe, but Ohio State's offense was too much — scoring 10 in the first quarter to set the tone before their defense completely strangled Iowa's offense for two and a half quarters. Iowa went scoreless in both the second and third quarters as the Buckeyes methodically extended the lead. The 31–14 final was a convincing statement from an Ohio State team that has steadily rebuilt its national standing since the Week 2 loss to Texas.`,
  },

  // ABC Saturday Night: #6 Miami at Clemson (Clemson, SC)
  354: {
    abcNight: true,
    summary: `#6 Miami rolled into Death Valley and completely took it over under the Saturday night lights, delivering one of the most dominant performances of the week 5 slate. The Hurricanes were clinical in the first three quarters before exploding for 17 fourth-quarter points to turn a manageable game into a 41–13 blowout. Clemson, who had entered with some momentum, managed only two field goals through three quarters as Miami's defense suffocated their offense. The performance sent Miami skyrocketing up the national rankings and made a loud statement about their ACC title ambitions. Death Valley rarely looks this quiet.`,
  },

  // UPSET of the week: Michigan at Minnesota
  361: {
    summary: `In the biggest upset of Week 5, Minnesota stunned Michigan 20–14 in a game that completely flipped on its head in the second half. The Wolverines grabbed a commanding 14–7 halftime lead after a dominant second quarter, seemingly in full control. Then Minnesota's defense turned into a wall. Michigan went scoreless in both the third and fourth quarters — not a single point — while the Gophers chipped away with a third-quarter field goal and then a 10-point fourth quarter to steal the victory. The upset sent shockwaves through the Big Ten standings and raised serious questions about Michigan's path forward in the conference race.`,
  },

  // ── Week 6: Oct 10 ───────────────────────────────────────────────────────
  // ESPN GameDay + ABC Night: #2 Georgia at #6 Alabama (Tuscaloosa)
  400: {
    gameDay: true,
    abcNight: true,
    summary: `College GameDay descended on Tuscaloosa for one of the premier matchups in college football — #2 Georgia traveling to face #6 Alabama in Bryant-Denny Stadium. Alabama came out firing, dominating the second quarter with 14 points to take a 14–10 halftime lead and silence the doubters who thought Georgia's defense was elite. But the Bulldogs responded with exactly the kind of composure that defines championship-caliber programs — grinding out two second-half scoring drives while their defense completely shut down Alabama over the final two quarters, holding them scoreless after the half. Georgia's 20–17 road win over Alabama was statement enough: they are the new number one team in the country and the clear frontrunner for the College Football Playoff.`,
  },

  // FOX Big Noon: #1 Texas at Oklahoma (Norman)
  405: {
    bigNoon: true,
    summary: `The biggest story of the college football season dropped on a Saturday morning in Norman. #1 Texas strutted into Owen Field as heavy favorites, and for a half it showed — the Longhorns built a 17–7 halftime lead and looked every bit like the nation's top team. Then Oklahoma flipped a switch. The Sooners held Texas scoreless in the third quarter, chipped away, and then absolutely exploded for 17 fourth-quarter points compared to Texas's 7. With the final seconds ticking down, Oklahoma completed the 27–24 comeback upset over the top-ranked team in the country. The loss immediately vaporized Texas's #1 ranking and blew the College Football Playoff race wide open. For Sooner Nation, it was the biggest win of the season.`,
  },

  // UPSET: #10 LSU at Kentucky (OT)
  403: {
    summary: `Kentucky pulled off one of the most dramatic upsets of the season in overtime, stunning #10 LSU 35–34 in a game that had absolutely everything. The teams were locked at 27–27 through four quarters after Kentucky's defense stopped an LSU scoring drive late. In overtime, Kentucky delivered the knockout punch — a touchdown followed by a gutsy two-point conversion to take the 35–34 lead. LSU answered with a touchdown of their own but couldn't match the conversion, and the Wildcats held on to complete the stunning victory. The loss was devastating for LSU's playoff hopes and announced Kentucky as a genuine SEC contender.`,
  },

  // UPSET: South Carolina at #16 Florida
  402: {
    summary: `South Carolina delivered one of the more convincing upsets of the week, going into The Swamp and dismantling #16 Florida 38–19 with a performance that was never really in doubt. The Gamecocks scored in every quarter and were particularly dominant in the third, outscoring Florida 14–3 to put the game out of reach. Florida's offense, which had shown promise in previous weeks, was completely neutralized. The lopsided final was a stunning result for a Florida program that had playoff aspirations, and a massive statement for South Carolina heading into the SEC gauntlet.`,
  },

  // UPSET: #21 UCLA at #13 Oregon
  423: {
    summary: `In a tight, defensive battle in Eugene, #21 UCLA pulled off a narrow 17–15 upset over #13 Oregon that will have massive Big Ten implications. The Bruins built a 10–6 lead at halftime and then weathered a late Oregon push that cut the deficit to two. UCLA's defense made the stops it needed to down the stretch, preserving the two-point victory. Oregon, who had the conference's best record heading in, now faces an uphill battle for a spot in the Big Ten Championship Game. For UCLA, the road win over a top-15 opponent was a resume-defining result.`,
  },
};
