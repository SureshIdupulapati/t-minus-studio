import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Instagram, ArrowRight, Check, Flame, Clock } from 'lucide-react';

const OPENING = new Date('2025-09-12T17:00:00');

const tickerItems = [
  'WOOD-FIRED SOURDOUGH CRUST',
  '72-HOUR COLD PROOF',
  'SAN MARZANO TOMATOES',
  'CORNER OF 9TH & MAPLE',
  'BYO NATURAL WINE',
  'CASH & CARD',
  'SLICES TIL MIDNIGHT',
];

const menuTeasers = [
  {
    num: '01',
    name: 'The Landlord',
    desc: 'Vodka sauce, fresh mozz, hot soppressata, hot honey drizzle. Rent is due.',
    tag: 'house favorite',
  },
  {
    num: '02',
    name: 'Green Thumb',
    desc: 'Pistachio pesto, stracciatella, charred broccolini, lemon zest, chili crisp.',
    tag: 'vegetarian',
  },
  {
    num: '03',
    name: 'Sunday Gravy',
    desc: 'Slow-braised short rib ragù, smoked provolone, pickled fresno, basil.',
    tag: 'weekends only',
  },
];

function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs };
}

const pad = (n) => String(n).padStart(2, '0');

export default function App() {
  const { days, hours, mins, secs } = useCountdown(OPENING);
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) setJoined(true);
  };

  return (
    <div className="min-h-screen bg-[#F3ECDC] text-[#1C1812] antialiased overflow-x-hidden selection:bg-[#C8331D] selection:text-[#F3ECDC]">
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700;12..96,800&family=Caveat:wght@600;700&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .font-display { font-family: 'Bricolage Grotesque', sans-serif; }
        .font-hand { font-family: 'Caveat', cursive; }
        .font-mono-x { font-family: 'Space Mono', monospace; }

        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker 28s linear infinite;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-badge { animation: spin-slow 18s linear infinite; }

        .grain::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 50;
          opacity: 0.5;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
        }

        .dotted-rule {
          background-image: radial-gradient(circle, #1C1812 1.2px, transparent 1.3px);
          background-size: 12px 12px;
          background-repeat: repeat-x;
          background-position: left center;
          height: 12px;
        }

        input::placeholder { color: rgba(28,24,18,0.4); }
      `,
        }}
      />

      <div className="grain" />

      {/* ===== Top ticker ===== */}
      <div className="bg-[#C8331D] text-[#F3ECDC] overflow-hidden border-b-2 border-[#1C1812]">
        <div className="ticker-track py-2">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center shrink-0">
              {tickerItems.map((item, i) => (
                <span key={`${dup}-${i}`} className="font-mono-x text-[11px] tracking-[0.2em] flex items-center">
                  <span className="px-5">{item}</span>
                  <span className="text-[#F2B23B]">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ===== Header ===== */}
      <header className="flex items-center justify-between px-6 md:px-12 py-5 border-b-2 border-[#1C1812]">
        <div className="font-display font-extrabold text-xl tracking-tight">
          SLICE SOCIETY<span className="text-[#C8331D]">.</span>
        </div>
        <div className="hidden md:flex items-center gap-2 font-mono-x text-xs tracking-wider">
          <MapPin className="w-3.5 h-3.5 text-[#C8331D]" />
          412 MAPLE AVE — RIVERSIDE
        </div>
        <a
          href="#"
          className="flex items-center gap-2 font-mono-x text-xs tracking-wider border-2 border-[#1C1812] px-4 py-2 rounded-full hover:bg-[#1C1812] hover:text-[#F3ECDC] transition-colors"
        >
          <Instagram className="w-3.5 h-3.5" />
          @SLICESOCIETY
        </a>
      </header>

      {/* ===== Hero ===== */}
      <main className="relative px-6 md:px-12 pt-14 md:pt-20 pb-10">
        {/* Spinning badge */}
        <div className="absolute right-6 md:right-16 top-8 md:top-14 w-28 h-28 md:w-40 md:h-40 z-10">
          <div className="relative w-full h-full spin-badge">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <path id="circlePath" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
              </defs>
              <circle cx="50" cy="50" r="48" fill="#C8331D" />
              <circle cx="50" cy="50" r="48" fill="none" stroke="#1C1812" strokeWidth="2" />
              <circle cx="50" cy="50" r="27" fill="none" stroke="#F3ECDC" strokeWidth="1" strokeDasharray="3 3" />
              <text fill="#F3ECDC" fontSize="9.5" fontFamily="'Space Mono', monospace" letterSpacing="2.5">
                <textPath href="#circlePath">EST. 2025 • WOOD FIRED • NEIGHBORHOOD PIES •</textPath>
              </text>
              <text x="50" y="56" textAnchor="middle" fontSize="22" fill="#F2B23B">🍕</text>
            </svg>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-hand text-2xl md:text-3xl text-[#C8331D] -rotate-2 mb-3"
        >
          something's in the oven...
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display font-extrabold leading-[0.92] tracking-[-0.03em] text-[15vw] md:text-[9.5vw] uppercase"
        >
          Good pizza
          <br />
          takes <span className="text-[#C8331D] italic">time.</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-8 md:mt-10 grid md:grid-cols-12 gap-8 items-end"
        >
          <p className="md:col-span-5 text-base md:text-lg leading-relaxed text-[#1C1812]/80 max-w-md">
            Slice Society is a neighborhood pizzeria opening on the corner of 9th &amp; Maple this fall.
            Naturally leavened dough, a 900° oven we named Gloria, and slices served until the streetlights
            give up. Membership is free — you just have to show up hungry.
          </p>

          {/* Countdown */}
          <div className="md:col-span-7">
            <div className="font-mono-x text-[11px] tracking-[0.25em] text-[#1C1812]/60 mb-3 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-[#C8331D]" />
              GLORIA REACHES TEMPERATURE IN
            </div>
            <div className="grid grid-cols-4 border-2 border-[#1C1812] bg-[#FBF6EA] divide-x-2 divide-[#1C1812]">
              {[
                { v: days, l: 'DAYS' },
                { v: hours, l: 'HOURS' },
                { v: mins, l: 'MINUTES' },
                { v: secs, l: 'SECONDS' },
              ].map((u) => (
                <div key={u.l} className="py-5 md:py-7 text-center">
                  <div className="font-display font-extrabold text-4xl md:text-6xl tabular-nums tracking-tight">
                    {pad(u.v)}
                  </div>
                  <div className="font-mono-x text-[10px] tracking-[0.3em] mt-1 text-[#1C1812]/50">{u.l}</div>
                </div>
              ))}
            </div>
            <div className="font-mono-x text-[11px] tracking-wider mt-2 text-right text-[#1C1812]/50">
              FRIDAY, SEPTEMBER 12 — DOORS AT 5PM
            </div>
          </div>
        </motion.div>
      </main>

      {/* ===== Email signup band ===== */}
      <section className="border-y-2 border-[#1C1812] bg-[#1C1812] text-[#F3ECDC]">
        <div className="px-6 md:px-12 py-10 md:py-14 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight">
              Join the Society<span className="text-[#F2B23B]">.</span>
            </h2>
            <p className="mt-2 text-[#F3ECDC]/70 max-w-sm">
              First 200 members get a free margherita on opening night and dibs on Sunday Gravy reservations.
            </p>
          </div>

          {!joined ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@theblock.com"
                className="flex-1 bg-transparent border-2 border-[#F3ECDC]/40 focus:border-[#F2B23B] outline-none px-5 py-4 font-mono-x text-sm tracking-wider rounded-none transition-colors"
              />
              <button
                type="submit"
                className="group flex items-center justify-center gap-2 bg-[#C8331D] hover:bg-[#F2B23B] hover:text-[#1C1812] text-[#F3ECDC] font-display font-bold px-8 py-4 transition-colors"
              >
                CLAIM MY SLICE
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 border-2 border-[#F2B23B] px-6 py-5"
            >
              <div className="w-10 h-10 rounded-full bg-[#F2B23B] text-[#1C1812] flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-bold">You're in. Member #0147.</div>
                <div className="font-mono-x text-xs text-[#F3ECDC]/60 mt-0.5">
                  We'll write when the dough's ready. We don't spam — we barely email.
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ===== Menu teaser ===== */}
      <section className="px-6 md:px-12 py-14 md:py-20">
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight uppercase">
            Sneak the menu
          </h2>
          <span className="font-hand text-2xl text-[#C8331D] rotate-2 hidden sm:block">
            still arguing about #4
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-[#1C1812] border-2 border-[#1C1812]">
          {menuTeasers.map((m, i) => (
            <motion.div
              key={m.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="group bg-[#FBF6EA] hover:bg-[#C8331D] hover:text-[#F3ECDC] transition-colors duration-300 p-7 md:p-9 flex flex-col min-h-[280px]"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono-x text-sm">{m.num}</span>
                <span className="font-mono-x text-[10px] tracking-[0.2em] uppercase border border-current px-2.5 py-1 rounded-full">
                  {m.tag}
                </span>
              </div>
              <h3 className="font-display font-extrabold text-3xl mt-auto tracking-tight">{m.name}</h3>
              <div className="dotted-rule my-4 opacity-30 group-hover:opacity-50" />
              <p className="text-sm leading-relaxed opacity-75">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t-2 border-[#1C1812] px-6 md:px-12 py-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="font-display font-extrabold text-lg">SLICE SOCIETY<span className="text-[#C8331D]">.</span></div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 font-mono-x text-[11px] tracking-wider text-[#1C1812]/60">
          <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> 412 MAPLE AVE, RIVERSIDE</span>
          <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> TUE–SUN, 5PM – LATE</span>
          <span>HELLO@SLICESOCIETY.PIZZA</span>
        </div>
        <div className="font-hand text-xl text-[#C8331D] -rotate-1">see you in line, neighbor</div>
      </footer>
    </div>
  );
}