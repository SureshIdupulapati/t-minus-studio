import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  HeartPulse,
  Stethoscope,
  Scissors,
  MapPin,
  Users,
  Clock,
  ShieldCheck,
  Sparkles,
  Plus,
} from 'lucide-react';

const ACCENT = '#E2491F';
const INK = '#2A1F16';
const PAPER = '#F2EAD9';

const tiers = [
  {
    id: 'thread',
    name: 'The Thread',
    amount: 45,
    reward: 'Hand-loomed bandana + your name stitched into the clinic wall tapestry.',
    backers: 1204,
  },
  {
    id: 'seam',
    name: 'The Seam',
    amount: 140,
    reward: 'Limited Clinic Jacket No.01 — natural indigo, dyed by the Oaxaca cooperative.',
    backers: 862,
  },
  {
    id: 'spine',
    name: 'The Spine',
    amount: 600,
    reward: 'Founders\' edition capsule + a dental chair plaque in the Jaipur clinic.',
    backers: 97,
  },
];

const sites = [
  { city: 'Oaxaca, MX', status: 'Breaking ground', pct: 82 },
  { city: 'Jaipur, IN', status: 'Permits secured', pct: 64 },
  { city: 'Hà Giang, VN', status: 'Site survey', pct: 31 },
];

const containerV = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.15 },
  },
};

const cardV = {
  hidden: { opacity: 0, y: 28, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

function Label({ children, light = false, className = '' }) {
  return (
    <span
      className={`sc-label ${light ? 'text-[#F2EAD9]/70' : 'text-[#2A1F16]/60'} ${className}`}
    >
      {children}
    </span>
  );
}

export default function App() {
  const [tier, setTier] = useState('seam');
  const [pledged, setPledged] = useState(false);

  const raised = 412380;
  const goal = 525000;
  const pct = Math.round((raised / goal) * 100);

  return (
    <div className="min-h-screen w-full antialiased" style={{ background: PAPER, color: INK }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..700,100&family=Karla:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        body { margin: 0; }
        .font-serif-x { font-family: 'Fraunces', serif; }
        .font-sans-x { font-family: 'Karla', sans-serif; }
        .sc-label {
          font-family: 'Karla', sans-serif;
          font-variant-caps: all-small-caps;
          letter-spacing: 0.18em;
          font-weight: 700;
          font-size: 0.82rem;
          line-height: 1;
        }
        .grain::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.5;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
          z-index: 1;
        }
        .duotone img {
          filter: grayscale(1) contrast(1.05) brightness(0.95);
        }
        .duotone::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(160deg, rgba(226,73,31,0.55), rgba(42,31,22,0.65));
          mix-blend-mode: multiply;
          pointer-events: none;
        }
        .duotone::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(242,234,217,0.12);
          mix-blend-mode: screen;
          pointer-events: none;
          z-index: 2;
        }
        .ring-organic {
          border-radius: 58% 42% 55% 45% / 48% 55% 45% 52%;
        }
        .card-hover { transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.45s; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 24px 48px -24px rgba(42,31,22,0.35); }
        ::selection { background: ${ACCENT}; color: ${PAPER}; }
        .marquee { animation: marquee 26s linear infinite; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `,
        }}
      />

      <div className="font-sans-x relative mx-auto max-w-[1320px] px-5 pb-20 pt-7 md:px-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-7 flex items-center justify-between border-b border-[#2A1F16]/15 pb-6"
        >
          <div className="flex items-center gap-3">
            <div
              className="ring-organic flex h-11 w-11 items-center justify-center"
              style={{ background: ACCENT }}
            >
              <HeartPulse size={20} color={PAPER} strokeWidth={2.4} />
            </div>
            <div className="leading-tight">
              <div className="font-serif-x text-xl font-semibold tracking-tight">Marrow &amp; Loom</div>
              <Label>The Clinic Project · 002</Label>
            </div>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <Label className="cursor-pointer transition-colors hover:!text-[#E2491F]">The Mission</Label>
            <Label className="cursor-pointer transition-colors hover:!text-[#E2491F]">The Garments</Label>
            <Label className="cursor-pointer transition-colors hover:!text-[#E2491F]">The Makers</Label>
          </nav>
          <button
            onClick={() => setPledged(true)}
            className="group flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all hover:gap-3"
            style={{ background: INK, color: PAPER }}
          >
            Back the build
            <ArrowUpRight size={16} className="transition-transform group-hover:rotate-45" />
          </button>
        </motion.header>

        {/* Bento grid */}
        <motion.div
          variants={containerV}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 md:grid-cols-12"
        >
          {/* HERO — large card */}
          <motion.div
            variants={cardV}
            className="grain card-hover relative overflow-hidden rounded-[28px] p-8 md:col-span-7 md:row-span-2 md:p-12"
            style={{ background: INK, color: PAPER }}
          >
            <div className="relative z-10 flex h-full flex-col justify-between gap-12">
              <div className="flex items-center justify-between">
                <Label light>Crowdfund · Spring ’25</Label>
                <Label light className="!text-[#E2491F]">Day 14 of 40</Label>
              </div>
              <div>
                <h1 className="font-serif-x text-[clamp(2.6rem,5.2vw,4.6rem)] font-light leading-[1.02] tracking-tight">
                  Every garment we sell will{' '}
                  <em className="font-serif-x font-semibold not-italic" style={{ color: ACCENT }}>
                    fix a tooth,
                  </em>{' '}
                  mend a back, and steady the hands that made it.
                </h1>
                <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[#F2EAD9]/70">
                  We are a fashion house. We are also done waiting. This campaign builds three free
                  dental &amp; medical clinics inside the weaving villages of our supply chain —
                  staffed, stocked, and standing for fifty years.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setPledged(true)}
                  className="flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold transition-transform hover:scale-[1.03]"
                  style={{ background: ACCENT, color: PAPER }}
                >
                  Pledge now <ArrowUpRight size={16} />
                </button>
                <div className="flex items-center gap-2 text-sm text-[#F2EAD9]/60">
                  <ShieldCheck size={16} style={{ color: ACCENT }} />
                  All-or-nothing · funds held in escrow
                </div>
              </div>
            </div>
            <div
              className="ring-organic absolute -right-24 -top-24 h-72 w-72 opacity-20"
              style={{ background: ACCENT }}
            />
          </motion.div>

          {/* FUNDING PROGRESS */}
          <motion.div
            variants={cardV}
            className="card-hover relative overflow-hidden rounded-[28px] border border-[#2A1F16]/12 bg-[#FBF6EB] p-7 md:col-span-5"
          >
            <div className="flex items-start justify-between">
              <Label>Raised so far</Label>
              <Label className="!text-[#E2491F]">{pct}% funded</Label>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-serif-x text-5xl font-semibold tracking-tight">$412,380</span>
              <span className="text-sm text-[#2A1F16]/50">of $525k</span>
            </div>
            <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-[#2A1F16]/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${ACCENT}, #B33312)` }}
              />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#2A1F16]/10 pt-5">
              <div>
                <div className="font-serif-x text-2xl font-semibold">2,163</div>
                <Label>Backers</Label>
              </div>
              <div>
                <div className="font-serif-x text-2xl font-semibold">26</div>
                <Label>Days left</Label>
              </div>
              <div>
                <div className="font-serif-x text-2xl font-semibold" style={{ color: ACCENT }}>3</div>
                <Label>Clinics</Label>
              </div>
            </div>
          </motion.div>

          {/* IMAGE — artisan hands */}
          <motion.div
            variants={cardV}
            className="duotone card-hover relative h-64 overflow-hidden rounded-[28px] md:col-span-5 md:h-auto"
          >
            <img
              src="https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1000&h=700&fit=crop"
              alt="Hands of an artisan weaving textile"
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-5 left-5 z-10">
              <Label light className="!text-[#F2EAD9]">Rosa Méndez · master weaver, 34 yrs at the loom</Label>
            </div>
          </motion.div>

          {/* STAT — equation */}
          <motion.div
            variants={cardV}
            className="card-hover relative flex flex-col justify-between overflow-hidden rounded-[28px] p-7 md:col-span-3"
            style={{ background: ACCENT, color: PAPER }}
          >
            <div className="flex items-center justify-between">
              <Scissors size={20} />
              <Plus size={16} className="opacity-60" />
              <Stethoscope size={20} />
            </div>
            <div className="mt-10">
              <div className="font-serif-x text-[2.6rem] font-semibold leading-none">1 = 3</div>
              <p className="mt-3 text-sm leading-snug text-[#F2EAD9]/85">
                One jacket sold funds three full dental check-ups. Forever. It's stitched into our margin.
              </p>
            </div>
            <Label light className="mt-8 !text-[#F2EAD9]/80">The maker's covenant</Label>
          </motion.div>

          {/* IMAGE — clinic */}
          <motion.div
            variants={cardV}
            className="duotone card-hover relative h-56 overflow-hidden rounded-[28px] md:col-span-4 md:h-auto"
          >
            <img
              src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=900&h=700&fit=crop"
              alt="Clinic care"
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-5 left-5 z-10">
              <Label light className="!text-[#F2EAD9]">Pilot clinic · Oaxaca, week one</Label>
            </div>
          </motion.div>

          {/* QUOTE */}
          <motion.div
            variants={cardV}
            className="card-hover relative flex flex-col justify-between rounded-[28px] border border-[#2A1F16]/12 bg-[#FBF6EB] p-8 md:col-span-5"
          >
            <Sparkles size={20} style={{ color: ACCENT }} />
            <blockquote className="font-serif-x mt-6 text-[1.55rem] font-light leading-snug tracking-tight">
              "A brand brave enough to put molars on the balance sheet. We measured: 71% of our
              weavers had never seen a dentist. That number ends with us."
            </blockquote>
            <div className="mt-7 flex items-center gap-3 border-t border-[#2A1F16]/10 pt-5">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                alt="Founder"
                className="h-11 w-11 rounded-full object-cover"
                style={{ filter: 'grayscale(1) sepia(0.3)' }}
              />
              <div>
                <div className="text-sm font-bold">Amara Sotelo</div>
                <Label>Founder &amp; creative director</Label>
              </div>
            </div>
          </motion.div>

          {/* REWARD TIERS — interactive */}
          <motion.div
            variants={cardV}
            className="card-hover rounded-[28px] border border-[#2A1F16]/12 bg-[#FBF6EB] p-7 md:col-span-7"
          >
            <div className="mb-5 flex items-center justify-between">
              <Label>Choose your stake</Label>
              <Label className="!text-[#E2491F]">Limited runs · ships Oct ’25</Label>
            </div>
            <div className="space-y-3">
              {tiers.map((t) => {
                const active = tier === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTier(t.id)}
                    className="group w-full rounded-2xl border p-5 text-left transition-all duration-300"
                    style={{
                      borderColor: active ? ACCENT : 'rgba(42,31,22,0.14)',
                      background: active ? INK : 'transparent',
                      color: active ? PAPER : INK,
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="flex items-baseline gap-3">
                        <span
                          className="font-serif-x text-2xl font-semibold"
                          style={{ color: active ? ACCENT : INK }}
                        >
                          ${t.amount}
                        </span>
                        <span className="font-serif-x text-lg">{t.name}</span>
                      </div>
                      <Label light={active}>{t.backers.toLocaleString()} backers</Label>
                    </div>
                    <p
                      className="mt-2 max-w-xl text-sm leading-relaxed"
                      style={{ color: active ? 'rgba(242,234,217,0.7)' : 'rgba(42,31,22,0.6)' }}
                    >
                      {t.reward}
                    </p>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPledged(true)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold transition-transform hover:scale-[1.01]"
              style={{ background: ACCENT, color: PAPER }}
            >
              {pledged
                ? 'You\'re in. Confirmation sent — welcome to the build crew.'
                : `Pledge $${tiers.find((t) => t.id === tier).amount} · ${tiers.find((t) => t.id === tier).name}`}
              {!pledged && <ArrowUpRight size={16} />}
            </button>
          </motion.div>

          {/* SITES */}
          <motion.div
            variants={cardV}
            className="grain card-hover relative overflow-hidden rounded-[28px] p-7 md:col-span-5"
            style={{ background: INK, color: PAPER }}
          >
            <div className="relative z-10">
              <div className="mb-6 flex items-center justify-between">
                <Label light>Three sites · one promise</Label>
                <MapPin size={18} style={{ color: ACCENT }} />
              </div>
              <div className="space-y-5">
                {sites.map((s) => (
                  <div key={s.city}>
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="font-serif-x text-xl font-medium">{s.city}</span>
                      <Label light>{s.status}</Label>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F2EAD9]/15">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 1.2, delay: 0.9, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: ACCENT }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex items-center gap-5 border-t border-[#F2EAD9]/15 pt-5">
                <div className="flex items-center gap-2 text-sm text-[#F2EAD9]/70">
                  <Users size={15} style={{ color: ACCENT }} /> 4,800 makers covered
                </div>
                <div className="flex items-center gap-2 text-sm text-[#F2EAD9]/70">
                  <Clock size={15} style={{ color: ACCENT }} /> Doors open in 9 months
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Marquee footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-10 overflow-hidden rounded-full border border-[#2A1F16]/12 py-3"
        >
          <div className="marquee flex w-max gap-10 whitespace-nowrap">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-10">
                {[
                  'Courage is a supply chain decision',
                  'Free dental care for every maker',
                  '0% of pledges to overhead',
                  'Built to outlast the brand',
                  'Wear the proof',
                ].map((t) => (
                  <span key={t} className="sc-label flex items-center gap-10 !text-[#2A1F16]/60">
                    {t} <span style={{ color: ACCENT }}>✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}