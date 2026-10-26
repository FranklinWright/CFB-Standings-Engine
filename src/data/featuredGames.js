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

  // ── Week 8: Oct 17 ───────────────────────────────────────────────────────
  // ESPN GameDay + ABC Night: #4 Ohio State at #5 Indiana (Bloomington)
  481: {
    gameDay: true,
    abcNight: true,
    summary: `College GameDay rolled into Bloomington for one of the biggest Big Ten showdowns of the decade — #4 Ohio State taking on unbeaten #5 Indiana in front of the loudest Memorial Stadium crowd in program history, with the game broadcast on ABC's Saturday Night Football. The Hoosiers gave everything they had in front of a delirious home crowd, and for most of the night it looked like it might be enough. Ohio State led by six going into the fourth quarter but Indiana found another gear, scoring 8 points including a gutsy two-point conversion to close within four. The Buckeyes' defense made the stop it needed to preserve a 19–15 victory. It was as tight as the scoreline suggests, but Ohio State left Bloomington with the win and their playoff case fully intact. For Indiana, a narrow loss to the fourth-ranked team in the country does nothing to dent their standing.`,
  },

  // FOX Big Noon: #2 Notre Dame at #8 BYU (Provo, UT)
  465: {
    bigNoon: true,
    summary: `The FOX Big Noon Kickoff delivered one of the signature upsets of the 2026 college football season as #8 BYU knocked off #2 Notre Dame 28–24 in a raucous LaVell Edwards Stadium. The Cougars were electric in the first half, exploding for 14 second-quarter points to build a commanding 21–10 halftime lead. Notre Dame refused to go quietly — chipping away through the third quarter and mounting a furious fourth-quarter push to get within four points in the final minutes. But BYU's offense answered with a scoring drive of their own, and their defense held firm to seal the 28–24 victory. The loss punched a serious hole in Notre Dame's College Football Playoff case and sent BYU — who now sit at #2 in the country — rocketing into the national conversation as a legitimate contender.`,
  },

  // UPSET OF THE YEAR: Auburn at #1 Georgia (Athens)
  457: {
    summary: `In the most stunning result of the 2026 college football season, unranked Auburn traveled to Athens and toppled #1 Georgia 27–24 in a game that will be talked about for years. Georgia burst out of the gate with 14 first-quarter points and looked every bit the nation's top team. Then Auburn completely seized control — outscoring the Bulldogs 17–0 across the second and third quarters to build a 24–14 lead heading into the fourth. Georgia mounted one final push, scoring 10 points in the closing period to claw back to within three, but Auburn delivered a clutch field goal to seal the 27–24 victory. The loss shattered Georgia's #1 ranking and blew the College Football Playoff picture wide open. Miami, idle this weekend, inherits the top spot. For Auburn, it was the most electric win the program has produced in over a decade.`,
  },

  // DOMINANT RESULT: #6 Alabama at #14 Tennessee (Knoxville)
  461: {
    summary: `Neyland Stadium erupted as #14 Tennessee delivered a performance for the ages, shutting down #6 Alabama completely in the second half to win 26–10. Alabama actually clawed back from a 9–0 deficit to lead 10–9 at halftime, silencing the crowd momentarily. What followed was one of the most dominant 30 minutes of football the SEC had seen all season. Tennessee outscored Alabama 17–0 over the final two quarters — holding the Crimson Tide completely off the scoreboard — while playing clean, efficient offense to seal a convincing victory. The shutout second half sent Neyland into pandemonium and launched the Vols to #11 in the new AP Poll. For Alabama, the scoreless second half raised serious questions heading into the back half of the season.`,
  },

  // UPSET: Florida at #7 Texas (Austin)
  462: {
    summary: `Unranked Florida made the trip to Austin and stunned #7 Texas 27–24 in a result that completed one of the wildest upset Saturdays in recent memory. Texas looked every bit the ranked powerhouse early, building a 17–10 halftime lead. Then Florida's defense found another gear — holding Texas scoreless in the third quarter while the Gators tied it at 17. The final quarter was a see-saw battle, with Florida scoring a go-ahead touchdown while Texas could only manage a field goal in response. The upset sent Florida jumping into the AP Poll at #20 and knocked Texas from #7 all the way down to #19. It was the second time this season Texas had been beaten in Austin, putting the Longhorns in serious must-win territory for the rest of the year.`,
  },

  // ── Week 9: Oct 24 ───────────────────────────────────────────────────────
  // ESPN GameDay + ABC Night: #6 Indiana at Michigan (Ann Arbor)
  541: {
    gameDay: true,
    abcNight: true,
    summary: `College GameDay descended on Ann Arbor for a loaded Big Ten showdown as #6 Indiana took on Michigan in the Big House on ABC's Saturday Night Football. What followed was one of the most defensive, tension-filled games of the season. Indiana grabbed an early 6–0 lead through two quarters and seemed in control — until Michigan's defense stiffened and scratched back to tie it 6–6 with a fourth-quarter field goal. The game went to overtime scoreless after regulation. Indiana's offense finally broke through in the extra session, punching in a touchdown while their defense stonewalled Michigan for the 13–6 victory. Winning on the road at Michigan in overtime was exactly the kind of résumé-building result that keeps Indiana in serious College Football Playoff contention — and launched them to #4 in the new AP Poll.`,
  },

  // FOX Big Noon: #2 BYU at UCF (Orlando, FL)
  529: {
    bigNoon: true,
    summary: `The FOX Big Noon Kickoff brought #2 BYU to Orlando for what looked like a road showcase — and turned into one of the most stunning upsets of the 2026 season. BYU grabbed an early 7–0 lead but UCF's offense erupted for 17 second-quarter points to flip the script and take a 17–14 halftime lead. The teams traded blows through the third quarter and into the fourth, with BYU scratching back to tie it at 24 and force overtime. In OT, UCF was clinical — outscoring the Cougars 15–7 to complete the 39–31 comeback victory. BYU tumbles from #2 all the way to #8 in the aftermath. For UCF, it stands as the biggest win in program history and sent shockwaves through the Big 12 and the College Football Playoff picture.`,
  },

  // DOMINANT: Pitt at #1 Miami (Miami Gardens, FL)
  537: {
    summary: `#1 Miami made a statement on their home turf, dismantling Pitt 52–23 in a performance that left no doubt about their status as the nation's best team. The Hurricanes were methodical and relentless — jumping out 10–0, exploding for 21 second-quarter points, and adding 14 more in the third to put the game completely out of reach. Pitt was never able to establish any kind of rhythm against Miami's defense, and the 29-point final margin was an accurate reflection of the gap between the two teams. Miami maintains their iron grip on #1 and the inside track to the ACC Championship Game.`,
  },

  // UPSET: #8 Texas Tech at Cincinnati
  534: {
    summary: `Cincinnati delivered one of the more convincing upsets of Week 9, dismantling #8 Texas Tech 37–24 in a game that was over by halftime. The Red Raiders took an early 6–3 lead, but Cincinnati responded with a 21-point second quarter to take a commanding 24–6 advantage at the break. Texas Tech clawed back with a respectable second half — outscoring the Bearcats 18–13 over the final two quarters — but could never close the deficit. The final 37–24 result sent Texas Tech tumbling from #8 to #13 and was a massive statement win for Cincinnati on their home turf.`,
  },

  // UPSET: #11 Tennessee at South Carolina (Columbia, SC)
  526: {
    summary: `South Carolina authored a dramatic comeback to upset #11 Tennessee 27–24 in a game that swung momentum multiple times. The Gamecocks jumped out fast with 14 first-quarter points, but Tennessee's offense erupted for 21 unanswered second-quarter points to seize a 21–17 halftime lead. A scoreless third quarter kept the Vols in control heading to the fourth — but South Carolina found a second wind, scoring 10 fourth-quarter points while holding Tennessee to just a field goal. The 27–24 final was Tennessee's second consecutive loss to an unranked opponent and sent them tumbling to #16. For South Carolina, a comeback victory over a top-15 team was exactly the kind of signature win that changes a program's trajectory.`,
  },
};
