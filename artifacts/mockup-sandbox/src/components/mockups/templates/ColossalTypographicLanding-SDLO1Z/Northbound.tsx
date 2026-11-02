import React from 'react';

export default function Northbound() {
  return (
    <div className="w-full h-full bg-black text-white overflow-hidden flex flex-col p-10 relative font-['Inter',sans-serif] antialiased">
      {/* Top Nav */}
      <header className="flex justify-between items-start z-20 text-[11px] font-bold uppercase tracking-[0.2em]">
        <div className="leading-relaxed">
          Northbound &mdash; <br />
          Brand & Strategy Creative Agency
        </div>
        <nav className="flex gap-16">
          <a href="#" className="hover:opacity-50 transition-opacity">Work</a>
          <a href="#" className="hover:opacity-50 transition-opacity">Practice</a>
          <a href="#" className="hover:opacity-50 transition-opacity">Insights</a>
          <a href="#" className="hover:opacity-50 transition-opacity">Inquiries</a>
        </nav>
      </header>

      {/* Colossal Type */}
      <div className="absolute inset-0 flex flex-col justify-center px-10 pointer-events-none select-none">
        <h1 className="text-[340px] leading-[0.78] font-black tracking-[-0.04em] uppercase flex flex-col justify-center h-full">
          <span className="block text-left -ml-6">NORTH</span>
          <span className="block text-right -mr-6">BOUND</span>
        </h1>
      </div>

      {/* Footer / Manifesto */}
      <footer className="mt-auto flex justify-between items-end z-20">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed">
          Est. 2024 <br />
          Global Operations <br />
          &copy; All Rights Reserved
        </div>
        
        <div className="text-[20px] font-semibold tracking-[-0.02em] leading-snug max-w-[460px] ml-auto mr-16">
          We forge brand identities and strategic narratives that refuse to be ignored. Confident design for ambitious companies.
        </div>

        <a href="#" className="flex flex-col items-center justify-center w-36 h-36 bg-white text-black rounded-full font-bold uppercase tracking-[0.1em] text-[11px] hover:scale-105 transition-transform leading-relaxed text-center">
          <span>Start a</span>
          <span>Project</span>
        </a>
      </footer>
      
      {/* Grid overlay for subtle texture */}
      <div className="absolute inset-0 pointer-events-none opacity-10" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
        backgroundSize: '80px 80px'
      }}></div>
    </div>
  );
}
