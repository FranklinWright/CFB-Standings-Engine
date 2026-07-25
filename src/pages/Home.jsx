/**
 * @file Home.jsx
 * @description Serves as the premium landing page with interactive instructions on how to use the site.
 */

import React from 'react';
import { Link } from 'react-router-dom';

const CONFERENCES = [
  'SEC', 'BIG TEN', 'ACC', 'BIG 12', 'AMERICAN', 'MOUNTAIN WEST',
  'SUN BELT', 'CONFERENCE USA', 'MAC', 'FBS INDEPENDENTS',
];

const DISPLAY_FONT = "'Anton', sans-serif";
const CONDENSED_FONT = "'Barlow Condensed', sans-serif";

/**
 * Home Component
 * A stylized, high-energy dashboard for quick access and instructions,
 * framed as a broadcast scoreboard: a scrolling conference ticker up top,
 * a floodlit "kickoff" hero, and four steps presented as quarters of a game.
 */
function Home() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@500;600;700&display=swap');

        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll 34s linear infinite;
          width: max-content;
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track { animation: none; }
        }
      `}</style>

      {/* Conference Ticker */}
      <div className="bg-white overflow-hidden border-b border-gray-200 shadow-sm">
        <div className="flex ticker-track py-2">
          {[...CONFERENCES, ...CONFERENCES].map((c, i) => (
            <span
              key={i}
              className="mx-6 text-[11px] font-bold uppercase tracking-[0.35em] text-slate-400 whitespace-nowrap"
              style={{ fontFamily: CONDENSED_FONT }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Premium Light Hero Banner */}
      <div className="relative bg-white border-b border-gray-200 pt-20 pb-32 px-6 text-center overflow-hidden shadow-sm">
        {/* Restrained floodlight glow for light mode */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full pointer-events-none">
          <div className="absolute top-6 left-10 w-56 h-56 bg-[#25bee8] rounded-full opacity-15 filter blur-[90px]" />
          <div className="absolute top-6 right-10 w-56 h-56 bg-[#f5ce42] rounded-full opacity-15 filter blur-[90px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-6 inline-flex items-center gap-2 shadow-sm border border-gray-200 bg-gray-50 text-[#25bee8]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5ce42] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#f5ce42]" />
            </span>
            2026 Season Planner
          </div>
          <h1
            className="text-6xl md:text-8xl lg:text-9xl uppercase tracking-tight leading-none text-slate-900 drop-shadow-sm"
            style={{ fontFamily: DISPLAY_FONT }}
          >
            <span style={{ color: '#25bee8' }}>College Football</span><br />
            <span style={{ color: '#f5ce42' }}>Games</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto mt-8 text-base md:text-lg">
            Pick every games and take your 2026 season all the way from Week 0 to a national champion. See how this season might play out!
          </p>
        </div>
      </div>

      {/* Interactive Grid Section, framed as four quarters */}
      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">

          {/* 1st Quarter: The Main Focus */}
          <Link to="/teams" className="group bg-white rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden block">
            <div className="h-1.5 bg-red-500" />
            <div className="p-8 md:p-10 relative">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-500 mb-2" style={{ fontFamily: CONDENSED_FONT }}>1st Quarter</p>
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-2xl mb-3">Plan the Season</h3>
                <p className="text-slate-500 font-medium leading-relaxed">This is the main event. Pick a winner in every matchup, or run the simulator to fast-forward through the entire 2026 season on your terms.</p>
                <div className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 group-hover:text-red-600">
                  Start Picking <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 2nd Quarter: Schedules and History */}
          <Link to="/teams" className="group bg-white rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden block">
            <div className="h-1.5" style={{ backgroundColor: '#25bee8' }} />
            <div className="p-8 md:p-10 relative">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-100 text-[#25bee8] rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-2" style={{ fontFamily: CONDENSED_FONT, color: '#25bee8' }}>2nd Quarter</p>
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-2xl mb-3">Explore History</h3>
                <p className="text-slate-500 font-medium leading-relaxed">Search any team or browse the Directory for full 2026 schedules, past results, and head-to-head history going back years.</p>
                <div className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group-hover:text-sky-500" style={{ color: '#25bee8' }}>
                  Browse Teams <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 3rd Quarter: Polls & Standings */}
          <Link to="/poll" className="group bg-white rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden block">
            <div className="h-1.5" style={{ backgroundColor: '#f5ce42' }} />
            <div className="p-8 md:p-10 relative">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-amber-100 text-[#f5ce42] rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-2" style={{ fontFamily: CONDENSED_FONT, color: '#f5ce42' }}>3rd Quarter</p>
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-2xl mb-3">Polls & Standings</h3>
                <p className="text-slate-500 font-medium leading-relaxed">See how your picks stack up. Check the Poll for your projected Top 25, or the Standings for conference rankings built from your predictions.</p>
                <div className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 group-hover:text-amber-600">
                  View Rankings <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 4th Quarter: Postseason */}
          <Link to="/postseason" className="group bg-white rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden block">
            <div className="h-1.5 bg-emerald-500" />
            <div className="p-8 md:p-10 relative">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-500 mb-2" style={{ fontFamily: CONDENSED_FONT }}>4th Quarter</p>
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-2xl mb-3">Simulate the Playoff</h3>
                <p className="text-slate-500 font-medium leading-relaxed">Once the regular season is locked in, step into your generated 12-team playoff bracket and crown a national champion.</p>
                <div className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 group-hover:text-emerald-600">
                  View Bracket <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </Link>

        </div>

        {/* Kickoff strip */}
        <div className="mt-8 rounded-3xl bg-white border border-gray-200 shadow-sm px-8 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
          <div className="relative z-10 text-center md:text-left">
            <p className="text-slate-900 text-xl md:text-2xl" style={{ fontFamily: DISPLAY_FONT }}>Everything starts with your picks.</p>
            <p className="text-slate-500 text-sm mt-1 font-medium">Head to the Team Directory to make your first call.</p>
          </div>
          <Link
            to="/teams"
            className="relative z-10 shrink-0 px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs bg-[#25bee8] text-white hover:bg-[#1aa0c7] shadow-md transition-colors"
          >
            Start With Teams →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;