import { useState } from 'react';
import { ArrowRight, Bell, CalendarDays, Monitor, Smartphone } from 'lucide-react';
import './page-start.css';

type Page = 'overview' | 'plan' | 'designer' | 'reminders';

const COPY: Record<Page, { eyebrow: string; title: string; lede: string; cta: string; steps: [string, string][] }> = {
  overview: { eyebrow: 'Start here', title: 'Your deadline, at a glance', lede: 'Name the thing that matters and the date it is due. T-Minus turns that single line into a home base you can return to.', cta: 'Define my deadline',
    steps: [['Name it', 'One goal, one date, your time zone.'], ['Plan it', 'Milestones counted back from the deadline.'], ['See it', 'A countdown wallpaper for every day.']] },
  plan: { eyebrow: 'Work backward', title: 'Build your milestone plan', lede: 'Begin at the finish line and walk back to today. Gemini drafts checkpoints around the hours you actually have; you edit everything.', cta: 'Start a goal to plan',
    steps: [['Set capacity', 'Hours per day and rest days.'], ['Draft with Gemini', 'Or start from a simple timeline.'], ['Edit freely', 'Rename, re-date, reorder, check off.']] },
  designer: { eyebrow: 'Make it visible', title: 'Design your countdown', lede: 'Bring your deadline and next milestones onto your phone or computer. Choose a style, then download a PNG snapshot.', cta: 'Create a goal to design for',
    steps: [['Pick a format', 'Phone, computer, or custom size.'], ['Style it', 'Templates, colors, your own photo.'], ['Download PNG', 'A static snapshot, not a live timer.']] },
  reminders: { eyebrow: 'A nudge, never a nag', title: 'Set your reminder rhythm', lede: 'Optional check-ins while the app is open, plus a calendar file so your own calendar can carry the milestones.', cta: 'Start a goal first',
    steps: [['Choose beats', 'Daily, weekly, or milestone days.'], ['Allow the browser', 'Check-ins need this tab open.'], ['Export .ics', 'Your calendar handles the rest.']] },
};

function Overview() {
  return <div className="ps-ticket" aria-label="Preview of an overview card">
    <span className="ps-label light">Preview · your goal goes here</span>
    <div className="ps-ticket-title">Your goal</div>
    <div className="ps-ticket-count">{['days', 'hrs', 'min', 'sec'].map(u => <span key={u}><b>--</b><small>{u}</small></span>)}</div>
    <div className="ps-ticket-bar"><i /></div>
    <div className="ps-ticket-foot"><span>Next checkpoint</span><span>Progress</span></div>
  </div>;
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
  const words = { overview: ['T—MINUS', 'STUDIO'], plan: ['WORK', 'BACKWARD'], designer: ['MAKE IT', 'VISIBLE'], reminders: ['STAY', 'ON TRACK'] }[page];
  return <>
    <section className={`colossal-start colossal-${page}`} data-testid={`page-start-${page}`}>
      <h1 className="colossal-type" data-testid={`text-title-${page}`} aria-label={page === 'overview' ? 'T-Minus Studio — Your deadline, at a glance' : c.title}><span>{words[0]}</span><span>{words[1]}</span></h1>
      <div className="colossal-manifesto">
        <div className="colossal-footnote">ONE GOAL.<br />ONE DEADLINE.<br />BUILT AROUND YOU.<br /><span>Saved on this device</span></div>
        <div className="colossal-intro"><p>{page === 'overview' ? 'Turn a deadline into a plan. Make it your lock screen. Keep the next step in sight.' : c.lede}</p><span>{c.eyebrow} / T—MINUS STUDIO</span></div>
        <button className="colossal-circle" data-testid={`button-new-goal-${page}`} onClick={onNew} aria-label={c.cta}><span>{page === 'overview' ? 'START A' : 'CREATE A'}</span><span>GOAL</span><ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </section>
    <section className="colossal-detail" aria-label={`${c.title} preview`}>
      <div className="colossal-detail-copy"><span className="colossal-index">0{['overview', 'plan', 'designer', 'reminders'].indexOf(page) + 1} / {c.eyebrow}</span><h2>{c.title}.</h2><ol>{c.steps.map(([title, detail], i) => <li key={title}><span>0{i + 1}</span><div><strong>{title}</strong><p>{detail}</p></div></li>)}</ol><p className="colossal-disclaimer">Preview only. Create a goal to save your settings.</p></div>
      <div className={`colossal-detail-preview ps-${page}`}>{page === 'overview' ? <Overview /> : page === 'plan' ? <Plan /> : page === 'designer' ? <Designer /> : <Reminders />}</div>
    </section>
  </>;
}
