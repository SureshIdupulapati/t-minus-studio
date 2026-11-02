import './fonts.css';
import asset0 from "./assets/lp-03-hero.png";

import React from "react";
import { ArrowRight, ChevronRight, Play, Check } from "lucide-react";

export default function Lp03() {
  return (
    <div
      style={{ width: "100%", height: "100%" }}
      className="relative overflow-hidden bg-black text-white selection:bg-white selection:text-black flex font-['Inter']"
    >
      {/* Left Content Area */}
      <div className="w-1/2 h-full flex flex-col justify-between p-16 relative z-10">
        <header className="flex items-center justify-between">
          <div className="text-2xl font-black tracking-tighter uppercase font-['Anton']">
            Forge.
          </div>
          <nav className="flex gap-8 text-sm font-medium tracking-wide text-zinc-400">
            <a href="#" className="text-white transition-colors">Programs</a>
            <a href="#" className="hover:text-white transition-colors">Coaches</a>
            <a href="#" className="hover:text-white transition-colors">Results</a>
          </nav>
        </header>

        <main className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs font-semibold tracking-widest uppercase text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Accepting New Athletes
          </div>
          
          <h1 className="text-[100px] leading-[0.85] font-['Anton'] uppercase tracking-tight mb-8">
            Iron <br/> Sharpens <br/> Iron.
          </h1>
          
          <p className="text-xl text-zinc-400 mb-12 font-light leading-relaxed max-w-md">
            Elite strength coaching and personalized programming for those who refuse to remain average. Built by champions, for contenders.
          </p>

          <div className="flex items-center gap-6">
            <button className="bg-white text-black px-8 py-5 text-sm font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center gap-3 group">
              Start Your Trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest hover:text-zinc-300 transition-colors group">
              <div className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center group-hover:border-zinc-500 transition-colors">
                <Play className="w-4 h-4 ml-1" />
              </div>
              Watch Anthem
            </button>
          </div>
        </main>

        <footer className="flex items-center gap-12 text-sm text-zinc-500">
          <div>
            <div className="text-white font-['Anton'] text-3xl mb-1 tracking-wider">12K+</div>
            <div className="uppercase tracking-widest text-[10px] font-bold">Active Athletes</div>
          </div>
          <div>
            <div className="text-white font-['Anton'] text-3xl mb-1 tracking-wider">4.9/5</div>
            <div className="uppercase tracking-widest text-[10px] font-bold">App Store Rating</div>
          </div>
        </footer>
      </div>

      {/* Right Image Area */}
      <div className="w-1/2 h-full relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10" />
        <img 
          src={asset0} 
          alt="Athlete training" 
          className="w-full h-full object-cover object-center grayscale contrast-125 brightness-90"
        />
        
        {/* Floating Stat Card */}
        <div className="absolute bottom-16 right-16 z-20 bg-black/40 backdrop-blur-md border border-zinc-800 p-6 max-w-xs">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-white flex items-center justify-center shrink-0">
              <Check className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="text-sm font-bold uppercase tracking-wider mb-1">Custom Macro Plan</div>
              <div className="text-xs text-zinc-400 leading-relaxed">Your nutrition adapts weekly based on your performance and goals.</div>
            </div>
          </div>
          <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-white w-3/4" />
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            <span>Progress</span>
            <span className="text-white">75%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

