/**
 * @file NotFound.jsx
 * @description Serves as the 404 catch-all page for invalid routes.
 */

import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
      <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none text-slate-900 mb-2">
        <span style={{ color: '#25bee8' }}>4</span>
        <span style={{ color: '#f5ce42' }}>0</span>
        <span style={{ color: '#25bee8' }}>4</span>
      </h1>
      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-slate-400 mb-6">
        Fumble! Page Not Found
      </h2>
      <p className="text-slate-500 font-medium mb-10 max-w-md mx-auto">
        It looks like the page you are looking for has been intercepted or doesn't exist on this server.
      </p>
    </div>
  );
}

export default NotFound;