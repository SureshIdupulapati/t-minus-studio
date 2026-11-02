import { useState } from 'react';
import { ArrowRight, Bell, CalendarDays, Flag, Monitor, Plus, Smartphone, Sparkles } from 'lucide-react';
import './_current.css';

type Page = 'overview' | 'plan' | 'designer' | 'reminders';

const COPY: Record<Page, { eyebrow: string; title: string; lede: string; cta: string }> = {
  overview: { eyebrow: 'Start here', title: 'Your deadline, at a glance', lede: 'Name the thing that matters and the date it is due. T-Minus turns that single line into a calm home base you can return to.', cta: 'Define my deadline' },
  plan: { eyebrow: 'Work backward', title: 'Build your milestone plan', lede: 'Begin at the finish line and walk back to today. Gemini drafts checkpoints around the hours you actually have; you edit everything.', cta: 'Start a goal to plan' },
  designer: { eyebrow: 'Make it visible', title: 'Design your countdown', lede: 'Bring your deadline and next milestones onto your phone or computer. Choose a style, then download a PNG snapshot of your countdown.', cta: 'Create a goal to design for' },
  reminders: { eyebrow: 'A nudge, never a nag', title: 'Set your reminder rhythm', lede: 'Optional check-ins while the app is open, plus a calendar file so your own calendar can carry the milestones.', cta: 'Start a goal first' },
};

function Overview() {
  const steps = [['01', 'Name it', 'One goal, one date.'], ['02', 'Plan it', 'Milestones from the deadline back.'], ['03', 'See it', 'A countdown on your lock screen.']];
  return <div className="ps-flow">{steps.map(([n, t, d], i) => <div className="ps-step" key={n} style={{ ['--i' as string]: i }}><span className="ps-num">{n}</span><strong>{t}</strong><small>{d}</small></div>)}</div>;
}

function Plan() {
  const rows = ['Deadline', 'Final review', 'Midpoint check', 'First draft', 'Today'];
  return <div className="ps-ladder" aria-label="Preview of a backward plan shape"><span className="ps-label">Preview · example shape</span>{rows.map((r, i) => <div className="ps-rung" key={r} style={{ ['--i' as string]: i }}><i />{r}<em>{i === 0 ? 'T-0' : i === rows.length - 1 ? 'now' : `step ${rows.length - 1 - i}`}</em></div>)}</div>;
}

function Designer() {
  const [fmt, setFmt] = useState<'phone' | 'desktop'>('phone');
  return <div className="ps-device-wrap">
    <div className="ps-toggle" role="group" aria-label="Preview format">
      <button data-testid="button-preview-phone" aria-pressed={fmt === 'phone'} onClick={() => setFmt('phone')}><Smartphone size={14} /> Phone</button>
      <button data-testid="button-preview-desktop" aria-pressed={fmt === 'desktop'} onClick={() => setFmt('desktop')}><Monitor size={14} /> Computer</button>
    </div>
    <div className={`ps-device ${fmt}`}><span className="ps-label light">Preview only</span><div className="ps-orb" /><b>-- : -- : --</b><small>Your goal appears here</small></div>
  </div>;
}

function Reminders() {
  const beats = [['Daily', 'A small next step'], ['Weekly', 'Review and reset'], ['Milestone', 'On the day it lands']];
  return <div className="ps-rhythm"><span className="ps-label">What you can choose later</span><div className="ps-week">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className={i === 6 ? 'beat big' : 'beat'} style={{ ['--i' as string]: i }}>{d}</span>)}</div>{beats.map(([t, d]) => <div className="ps-beat-row" key={t}><Bell size={14} /><strong>{t}</strong><small>{d}</small></div>)}<div className="ps-beat-row"><CalendarDays size={14} /><strong>.ics export</strong><small>Your calendar reminds you</small></div></div>;
}

export default function PageStart({ page, onNew }: { page: Page; onNew: () => void }) {
  const c = COPY[page];
  const Icon = page === 'plan' ? Flag : page === 'reminders' ? Bell : page === 'designer' ? Smartphone : Sparkles;
  return <section className={`ps ps-${page}`} data-testid={`page-start-${page}`}>
    <div className="ps-copy">
      <div className="eyebrow ps-eyebrow"><Icon size={13} /> {c.eyebrow}</div>
      <h1 className="ps-title" data-testid={`text-title-${page}`}>{c.title}</h1>
      <p className="ps-lede">{c.lede}</p>
      <button className="btn ps-cta" data-testid={`button-new-goal-${page}`} onClick={onNew}><Plus /> {c.cta} <ArrowRight /></button>
      <p className="ps-note">Nothing is saved until you create a goal.</p>
    </div>
    <div className="ps-visual">{page === 'overview' ? <Overview /> : page === 'plan' ? <Plan /> : page === 'designer' ? <Designer /> : <Reminders />}</div>
  </section>;
}
