import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import PageStart from '@/components/page-start';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter, Link } from 'wouter';
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, Bell, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Copy, Download, FileImage, FileJson, Flame, FolderOpen, ImagePlus, LayoutDashboard, ListChecks, Menu, Moon, MoreHorizontal, Plus, Search, Settings2, Sparkles, Sun, Trash2, Upload, X } from 'lucide-react';
import { getHealthCheckQueryKey, useGeneratePlan, useHealthCheck } from '@workspace/api-client-react';
import type { PlanInput, PlanMilestone, PlanResponse } from '@workspace/api-client-react';

type Task = { id: string; title: string; completed: boolean };
type Milestone = PlanMilestone;
type Design = {
  template: string; format: string; background: string; backgroundStyle: string; textColor: string; accentColor: string;
  font: string; layout: string; title: string; showCountdown: boolean; showDate: boolean;
  showMilestones: boolean; showProgress: boolean; showCheckboxes: boolean; showCompletedMilestones: boolean; milestoneCount: number;
  fontScale: number; imageBrightness: number; imageBlur: number; overlayOpacity: number;
  imagePosition: string; customWidth: number; customHeight: number; coverTitle: string;
  coverSubtitle: string; coverBackground: string; coverTextColor: string; coverMockupPosition: string; image?: string;
};
type ReminderSettings = { daily: boolean; weekly: boolean; milestone: boolean; time: string; enabled: boolean };
type Project = {
  id: string; title: string; description: string; deadline: string; timeZone: string;
  availableHoursPerDay: number; unavailableDays: string[]; started: boolean; remainingTasks: string;
  milestones: Milestone[]; design: Design; reminderSettings: ReminderSettings; submissionDescription: string;
  submissionTitle?: string; submissionChecks?: boolean[]; planSummary?: string; planSource?: 'gemini' | 'manual';
  archived: boolean; createdAt: string;
};
type ModalMode = 'create' | 'edit' | null;

const queryClient = new QueryClient();
const STORE = 't-minus-studio-projects-v1';
const THEME = 't-minus-studio-colossal-theme';
const PAGE_META: Record<string, { title: string; description: string }> = {
  '/': { title: 'Your deadline, at a glance', description: 'Choose a deadline, track your progress, and see the next action toward your goal.' },
  '/plan': { title: 'Your milestone plan', description: 'Work backward from your deadline with an editable Gemini-assisted milestone plan.' },
  '/designer': { title: 'Design your countdown', description: 'Create and download a personalized countdown lock screen for your phone or computer.' },
  '/reminders': { title: 'Your reminder rhythm', description: 'Choose optional check-ins and export milestone dates to your calendar.' },
};
const templates = [
  { id: 'solstice', label: 'Solstice', bg: 'linear-gradient(155deg,#28483d,#a65f4a)', color: '#28483d', text: '#f7eddb', accent: '#d78b68' },
  { id: 'mono', label: 'Fieldnotes', bg: '#ded3bf', color: '#ded3bf', text: '#28483d', accent: '#a65f4a' },
  { id: 'night', label: 'Afterglow', bg: 'linear-gradient(160deg,#202d3a,#384855)', color: '#202d3a', text: '#f5e9d6', accent: '#78a9d4' },
  { id: 'orbit', label: 'Orbit', bg: '#efe5d1', color: '#efe5d1', text: '#315345', accent: '#cf8667' },
  { id: 'paper', label: 'Paper', bg: '#dfcfb4', color: '#dfcfb4', text: '#294638', accent: '#b77459' },
  { id: 'signal', label: 'Signal', bg: 'linear-gradient(145deg,#d4a07e,#a8604b)', color: '#a8604b', text: '#fff3df', accent: '#f1c19d' },
  { id: 'field', label: 'Evergreen', bg: '#455d4e', color: '#455d4e', text: '#f4ecd9', accent: '#d1b884' },
  { id: 'dawn', label: 'First light', bg: 'linear-gradient(180deg,#b37a69,#e2b785 46%,#41584c 47%)', color: '#b37a69', text: '#fff1dc', accent: '#e2b785' },
];
const palette = [
  { bg: '#28483d', text: '#f7eddb' }, { bg: '#ded3bf', text: '#28483d' }, { bg: '#263440', text: '#f5e9d6' },
  { bg: '#e9deca', text: '#315345' }, { bg: '#a65f4a', text: '#fff1dc' }, { bg: '#455d4e', text: '#f4ecd9' },
];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function defaultDesign(): Design {
  return {
    template: 'solstice', format: 'phone', background: '#28483d', backgroundStyle: 'gradient', textColor: '#f7eddb',
    accentColor: '#d78b68', font: 'Fraunces', layout: 'center', title: 'Make it real.',
    showCountdown: true, showDate: true, showMilestones: true, showProgress: true,
    showCheckboxes: true, showCompletedMilestones: false, milestoneCount: 4, fontScale: 1, imageBrightness: 100,
    imageBlur: 0, overlayOpacity: 46, imagePosition: 'center', customWidth: 1440,
    customHeight: 2560, coverTitle: '', coverSubtitle: 'AI-Powered Deadline Planning',
    coverBackground: '#28483d', coverTextColor: '#f7eddb', coverMockupPosition: 'right',
  };
}
function loadProjects(): Project[] {
  try {
    const value = localStorage.getItem(STORE);
    if (!value) return [];
    const projects = JSON.parse(value) as unknown;
    return Array.isArray(projects) ? (projects as Project[]).filter(project => project.id !== 'demo-project').map(project => ({
      ...project,
      design: { ...defaultDesign(), ...project.design },
      submissionTitle: project.submissionTitle || 'Your Deadline, Your Design — AI Countdown Lock Screen',
      submissionChecks: project.submissionChecks || [false, false, false, false, false],
      milestones: Array.isArray(project.milestones) ? project.milestones : [],
      reminderSettings: project.reminderSettings || { daily: true, weekly: false, milestone: true, time: '08:30', enabled: false },
    })) : [];
  } catch {
    return [];
  }
}
function uuid() { return Math.random().toString(36).slice(2, 9); }
function daysLeft(project?: Project) {
  if (!project) return 0;
  return Math.max(0, Math.ceil((new Date(project.deadline).getTime() - Date.now()) / 86400000));
}
function dateLabel(date: string, timeZone?: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const parsed = dateOnly ? new Date(`${date}T12:00:00Z`) : new Date(date);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', ...((dateOnly ? 'UTC' : timeZone) ? { timeZone: dateOnly ? 'UTC' : timeZone } : {}) }).format(parsed);
}
function dateAndTimeInZone(iso: string, timeZone: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso)).map(({ type, value }) => [type, value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}
function isoDayInZone(value: string, timeZone: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return dateAndTimeInZone(value, timeZone).date;
}
function isoFromZonedDateTime(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(({ type, value }) => [type, value]));
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    instant += target - represented;
  }
  const result = new Date(instant).toISOString();
  const verified = dateAndTimeInZone(result, timeZone);
  if (verified.date !== date || verified.time !== time) throw new Error('This local time does not exist in the selected time zone.');
  return result;
}
function countdownParts(deadline: string) {
  const remaining = Math.max(0, new Date(deadline).getTime() - Date.now());
  return {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor(remaining / 3600000) % 24,
    minutes: Math.floor(remaining / 60000) % 60,
    seconds: Math.floor(remaining / 1000) % 60,
  };
}
function calcProgress(project?: Project) {
  if (!project) return 0;
  const tasks = project.milestones.flatMap(m => m.tasks);
  return tasks.length ? Math.round(tasks.filter(t => t.completed).length / tasks.length * 100) : 0;
}

function AppContent() {
  const [location, setLocation] = useLocation();
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [activeId, setActiveId] = useState<string>(() => loadProjects()[0]?.id ?? '');
  const [dark, setDark] = useState(() => localStorage.getItem(THEME) !== 'light');
  const [modal, setModal] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState('');
  const [menuId, setMenuId] = useState('');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(() => typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  const [showCompleted, setShowCompleted] = useState(true);
  const [, setClock] = useState(Date.now());
  const uploadRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const generatePlan = useGeneratePlan();
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 60000, retry: 1 } });
  const activeProject = projects.find(p => p.id === activeId) || projects.find(p => !p.archived) || projects[0];
  const page = location === '/' ? 'overview' : location.slice(1);

  useEffect(() => {
    const meta = PAGE_META[location] || PAGE_META['/'];
    document.title = `${meta.title} · T-Minus Studio`;
    for (const [selector, content] of [
      ['meta[name="description"]', meta.description],
      ['meta[property="og:title"]', document.title],
      ['meta[property="og:description"]', meta.description],
      ['meta[name="twitter:title"]', document.title],
      ['meta[name="twitter:description"]', meta.description],
    ]) document.querySelector(selector)?.setAttribute('content', content);
  }, [location]);

  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(projects)); } catch { setToast('Local storage is full. Export a backup or remove a large reference image.'); } }, [projects]);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); try { localStorage.setItem(THEME, dark ? 'dark' : 'light'); } catch { /* theme still applies for this session */ } }, [dark]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 2800); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!activeProject || notificationPermission !== 'granted') return;
    const settings = activeProject.reminderSettings;
    if (!settings.enabled) return;
    const zone = activeProject.timeZone;
    const check = () => {
      const now = new Date();
      const local = dateAndTimeInZone(now.toISOString(), zone);
      if (local.time < settings.time) return;
      const notifyOnce = (key: string, title: string, body: string) => {
        try {
          const storageKey = `tminus-notification:${activeProject.id}:${key}`;
          if (localStorage.getItem(storageKey)) return;
          new Notification(title, { body });
          localStorage.setItem(storageKey, local.date);
        } catch { /* notification permission or storage may be revoked while the app is open */ }
      };
      if (settings.daily) notifyOnce(`daily:${local.date}`, 'A small step, today', `Choose one clear action for ${activeProject.title}.`);
      const weekday = new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'short' }).format(now);
      if (settings.weekly && weekday === 'Mon') notifyOnce(`weekly:${local.date}`, 'Your weekly reset', `Review what moved on ${activeProject.title}, then make room for what’s next.`);
      if (settings.milestone) activeProject.milestones.filter(m => !m.completed && isoDayInZone(m.date, zone) === local.date).forEach(m => notifyOnce(`milestone:${m.id}:${local.date}`, 'A milestone is here', `${m.title} · ${activeProject.title}`));
    };
    check();
    const timer = window.setInterval(check, 30000);
    return () => window.clearInterval(timer);
  }, [activeProject, notificationPermission]);
  const patchActive = (patch: Partial<Project>) => {
    if (!activeProject) return;
    setProjects(current => current.map(p => p.id === activeProject.id ? { ...p, ...patch } : p));
  };
  const patchDesign = (patch: Partial<Design>) => {
    if (!activeProject) return;
    setProjects(current => current.map(p => p.id === activeProject.id ? { ...p, design: { ...p.design, ...patch } } : p));
  };
  const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard }, { href: '/plan', label: 'Milestone plan', icon: ListChecks },
    { href: '/designer', label: 'Lock-screen studio', icon: FileImage }, { href: '/reminders', label: 'Reminders', icon: Bell },
  ];
  const titleForPage = navItems.find(n => n.href === location)?.label || 'T-Minus Studio';
  const pickActive = (id: string) => { setActiveId(id); setMobileOpen(false); };

  const startProject = async (form: HTMLFormElement, askGemini: boolean) => {
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    if (!title) { setToast('Give your goal a name to continue.'); return; }
    const deadlineDate = String(data.get('deadlineDate') || '');
    const deadlineTime = String(data.get('deadlineTime') || '');
    const timeZone = String(data.get('timezone') || '').trim();
    let deadline: string;
    try {
      if (!deadlineDate || !deadlineTime || !timeZone) throw new Error('Missing deadline details');
      deadline = isoFromZonedDateTime(deadlineDate, deadlineTime, timeZone);
    } catch {
      setToast('Check the deadline and enter a valid IANA time zone.');
      return;
    }
    if (!editingId && new Date(deadline).getTime() <= Date.now()) {
      setToast('Choose a future date and time for this deadline.');
      return;
    }
    const unavail = data.getAll('unavailableDays').map(String);
    const project: Project = {
      id: editingId || uuid(), title, description: String(data.get('description') || ''), deadline,
      timeZone,
      availableHoursPerDay: Number(data.get('hours') || 1), unavailableDays: unavail,
      started: data.get('started') === 'on', remainingTasks: String(data.get('remainingTasks') || ''),
      milestones: editingId ? (projects.find(p => p.id === editingId)?.milestones || []) : [],
      design: editingId ? (projects.find(p => p.id === editingId)?.design || defaultDesign()) : defaultDesign(),
      reminderSettings: editingId ? (projects.find(p => p.id === editingId)?.reminderSettings || { daily: true, weekly: true, milestone: true, time: '08:30', enabled: false }) : { daily: true, weekly: true, milestone: true, time: '08:30', enabled: false },
      submissionDescription: editingId ? (projects.find(p => p.id === editingId)?.submissionDescription || '') : '',
      submissionTitle: editingId ? (projects.find(p => p.id === editingId)?.submissionTitle || 'Your Deadline, Your Design — AI Countdown Lock Screen') : 'Your Deadline, Your Design — AI Countdown Lock Screen',
      submissionChecks: editingId ? (projects.find(p => p.id === editingId)?.submissionChecks || [false, false, false, false, false]) : [false, false, false, false, false],
      planSummary: editingId ? projects.find(p => p.id === editingId)?.planSummary : undefined,
      planSource: editingId ? projects.find(p => p.id === editingId)?.planSource : undefined,
      archived: false, createdAt: editingId ? (projects.find(p => p.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };
    if (askGemini) {
      const input: PlanInput = { title, description: project.description, deadline, availableHoursPerDay: project.availableHoursPerDay, unavailableDays: unavail as PlanInput['unavailableDays'], started: project.started, remainingTasks: project.remainingTasks, timezone: project.timeZone };
      try {
        const result = await generatePlan.mutateAsync({ data: input }) as PlanResponse;
        project.milestones = result.milestones;
        project.planSummary = result.summary;
        project.planSource = 'gemini';
        if (!editingId) project.submissionDescription = `My goal is ${title}. Gemini helped me work backward from ${dateLabel(deadline, timeZone)} and turn the work into clear milestones. I learned that steady progress starts with one manageable next step.`;
      } catch {
        project.milestones = makeManualPlan(project);
        setToast('Plan generation is unavailable. A starter timeline is ready to edit.');
      }
    } else if (editingId) project.milestones = projects.find(p => p.id === editingId)?.milestones || [];
    else project.milestones = makeManualPlan(project);
    if (!editingId) {
      project.planSource = askGemini && project.planSource === 'gemini' ? 'gemini' : 'manual';
      if (!project.submissionDescription) project.submissionDescription = `My goal is ${title}. I planned backward from ${dateLabel(deadline, timeZone)} and broke the work into practical milestones. I learned that a clear next step makes a distant deadline feel manageable.`;
    }
    setProjects(current => editingId ? current.map(p => p.id === editingId ? project : p) : [project, ...current]);
    setActiveId(project.id); setModal(null); setEditingId(''); setLocation('/plan');
    if (askGemini) setToast(project.milestones.length ? 'Your deadline plan is ready.' : 'Your project is ready to shape.');
  };

  function makeManualPlan(project: Project): Milestone[] {
    const deadlineDay = isoDayInZone(project.deadline, project.timeZone);
    const today = dateAndTimeInZone(new Date().toISOString(), project.timeZone).date;
    const deadline = new Date(`${deadlineDay}T12:00:00Z`);
    const now = new Date(`${today}T12:00:00Z`);
    const left = Math.max(1, Math.round((deadline.getTime() - now.getTime()) / 86400000));
    const dateAt = (fraction: number) => new Date(now.getTime() + Math.round(left * fraction) * 86400000).toISOString().slice(0, 10);
    return [
      { id: uuid(), title: 'Set your first small proof point', tMinus: `T−${Math.max(1, Math.round(left * .7))} days`, date: dateAt(.3), description: 'Make the first step small enough to start this week.', tasks: [{ id: uuid(), title: project.remainingTasks.split(/[;\n]/)[0] || 'Choose a first action', completed: false }], priority: 'high', completed: false },
      { id: uuid(), title: 'Build a repeatable rhythm', tMinus: `T−${Math.max(1, Math.round(left * .35))} days`, date: dateAt(.65), description: 'A steady practice is more useful than a perfect sprint.', tasks: [{ id: uuid(), title: 'Review what is working and adjust', completed: false }], priority: 'medium', completed: false },
      { id: uuid(), title: 'Make it real', tMinus: 'Deadline', date: deadlineDay, description: 'Arrive prepared, with enough space to enjoy the moment.', tasks: [{ id: uuid(), title: 'Finish the final preparation', completed: false }], priority: 'high', completed: false },
    ];
  }

  function openNew() { setEditingId(''); setModal('create'); }
  function openEdit(project: Project) { setEditingId(project.id); setModal('edit'); }
  function duplicateProject(project: Project) {
    const next = { ...project, id: uuid(), title: `${project.title} — copy`, submissionTitle: 'Your Deadline, Your Design — AI Countdown Lock Screen', submissionChecks: [false, false, false, false, false], archived: false, createdAt: new Date().toISOString(), milestones: project.milestones.map(m => ({ ...m, id: uuid(), tasks: m.tasks.map(t => ({ ...t, id: uuid() })) })) };
    setProjects(p => [next, ...p]); setActiveId(next.id); setToast('Project duplicated.');
  }
  function deleteProject(project: Project) {
    if (!window.confirm(`Delete “${project.title}” and its locally saved designs?`)) return;
    const remaining = projects.filter(p => p.id !== project.id); setProjects(remaining);
    if (activeId === project.id) setActiveId(remaining[0]?.id || '');
    setToast('Project deleted.');
  }
  function exportJSON(project = activeProject) {
    if (!project) return;
    downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), `${slug(project.title)}-t-minus.json`);
    setToast('Project JSON exported.');
  }
  function importJSON(file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setToast('Choose a project backup under 5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<Project>;
        if (typeof parsed.title !== 'string' || !parsed.title.trim() || parsed.title.length > 120 || typeof parsed.deadline !== 'string' || Number.isNaN(Date.parse(parsed.deadline)) || !Array.isArray(parsed.milestones)) throw new Error('Invalid project file');
        const timeZone = typeof parsed.timeZone === 'string' ? parsed.timeZone : Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        new Intl.DateTimeFormat('en-US', { timeZone });
        const milestones: Milestone[] = parsed.milestones.map(raw => {
          const milestone = raw as Partial<Milestone>;
          if (typeof milestone.title !== 'string' || typeof milestone.date !== 'string' || Number.isNaN(Date.parse(milestone.date)) || !Array.isArray(milestone.tasks)) throw new Error('Invalid milestone');
          const tasks = milestone.tasks.map(rawTask => {
            const task = rawTask as Partial<Task>;
            if (typeof task.title !== 'string' || !task.title.trim()) throw new Error('Invalid task');
            return { id: uuid(), title: task.title.slice(0, 300), completed: Boolean(task.completed) };
          });
          const priority = milestone.priority === 'high' || milestone.priority === 'low' ? milestone.priority : 'medium';
          return { id: uuid(), title: milestone.title.slice(0, 160), tMinus: String(milestone.tMinus || ''), date: milestone.date, description: String(milestone.description || '').slice(0, 1000), tasks, priority, completed: Boolean(milestone.completed) };
        });
        const reminderSettings: ReminderSettings = { daily: true, weekly: false, milestone: true, time: '08:30', enabled: false, ...parsed.reminderSettings };
        const restored: Project = {
          id: uuid(), title: parsed.title.trim(), description: String(parsed.description || '').slice(0, 2000),
          deadline: parsed.deadline, timeZone, availableHoursPerDay: Math.min(24, Math.max(.25, Number(parsed.availableHoursPerDay) || 1)),
          unavailableDays: Array.isArray(parsed.unavailableDays) ? parsed.unavailableDays.filter((day): day is typeof DAYS[number] => DAYS.includes(day as typeof DAYS[number])) : [],
          started: Boolean(parsed.started), remainingTasks: String(parsed.remainingTasks || '').slice(0, 3000),
          milestones, design: { ...defaultDesign(), ...(parsed.design || {}) }, reminderSettings,
          submissionDescription: String(parsed.submissionDescription || '').slice(0, 500),
          submissionTitle: String(parsed.submissionTitle || 'Your Deadline, Your Design — AI Countdown Lock Screen').slice(0, 120),
          submissionChecks: Array.isArray(parsed.submissionChecks) ? Array.from({ length: 5 }, (_, i) => Boolean(parsed.submissionChecks?.[i])) : [false, false, false, false, false],
          planSummary: typeof parsed.planSummary === 'string' ? parsed.planSummary.slice(0, 2000) : undefined,
          planSource: parsed.planSource === 'gemini' ? 'gemini' : parsed.planSource === 'manual' ? 'manual' : undefined,
          archived: false, createdAt: new Date().toISOString(),
        };
        setProjects(current => [restored, ...current]); setActiveId(restored.id); setToast('Project imported and saved on this device.');
      } catch { setToast('That file is not a valid T-Minus project export.'); }
    };
    reader.readAsText(file);
  }
  function toggleTask(milestoneId: string, taskId: string) {
    if (!activeProject) return;
    const milestones = activeProject.milestones.map(m => {
      if (m.id !== milestoneId) return m;
      const tasks = m.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      return { ...m, tasks, completed: tasks.length > 0 && tasks.every(t => t.completed) };
    });
    patchActive({ milestones });
  }
  function addMilestone() {
    if (!activeProject) return;
    const title = window.prompt('What is a meaningful checkpoint?');
    if (!title?.trim()) return;
    const next: Milestone = { id: uuid(), title: title.trim(), tMinus: 'New checkpoint', date: activeProject.deadline, description: '', tasks: [{ id: uuid(), title: 'Add a first action', completed: false }], priority: 'medium', completed: false };
    patchActive({ milestones: [...activeProject.milestones, next].sort((a, b) => +new Date(a.date) - +new Date(b.date)) }); setToast('Checkpoint added.');
  }
  function addTask(milestone: Milestone) {
    const title = window.prompt('Name one clear action.');
    if (!title?.trim() || !activeProject) return;
    patchActive({ milestones: activeProject.milestones.map(m => m.id === milestone.id ? { ...m, tasks: [...m.tasks, { id: uuid(), title: title.trim(), completed: false }] } : m) });
  }
  function removeMilestone(id: string) {
    if (!activeProject || !window.confirm('Remove this checkpoint?')) return;
    patchActive({ milestones: activeProject.milestones.filter(m => m.id !== id) }); setToast('Checkpoint removed.');
  }
  function editMilestone(id: string) {
    const milestone = activeProject?.milestones.find(m => m.id === id);
    if (!milestone || !activeProject) return;
    const title = window.prompt('Checkpoint title', milestone.title);
    if (title === null || !title.trim()) return;
    const description = window.prompt('A few words about this moment', milestone.description);
    if (description === null) return;
    patchActive({ milestones: activeProject.milestones.map(m => m.id === id ? { ...m, title: title.trim(), description } : m) });
    setToast('Checkpoint updated.');
  }
  function changeMilestoneDate(id: string, date: string) {
    if (!activeProject || !date) return;
    patchActive({ milestones: activeProject.milestones.map(m => m.id === id ? { ...m, date: new Date(`${date}T12:00:00`).toISOString() } : m).sort((a, b) => +new Date(a.date) - +new Date(b.date)) });
  }
  function moveMilestone(id: string, direction: -1 | 1) {
    if (!activeProject) return;
    const milestones = [...activeProject.milestones];
    const index = milestones.findIndex(m => m.id === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= milestones.length) return;
    [milestones[index], milestones[next]] = [milestones[next], milestones[index]];
    patchActive({ milestones });
  }
  function exportCalendar() {
    if (!activeProject) return;
    const events = activeProject.milestones.map(m => {
      const day = isoDayInZone(m.date, activeProject.timeZone);
      const nextDay = new Date(`${day}T00:00:00Z`); nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      const endDay = nextDay.toISOString().slice(0, 10).replace(/-/g, '');
      return `BEGIN:VEVENT\nUID:${m.id}@tminus.studio\nDTSTAMP:${icsDate(new Date())}\nDTSTART;VALUE=DATE:${day.replace(/-/g, '')}\nDTEND;VALUE=DATE:${endDay}\nSUMMARY:${icsEscape(m.title)} — ${icsEscape(activeProject.title)}\nDESCRIPTION:${icsEscape(m.description || 'A T-Minus checkpoint')}\nEND:VEVENT`;
    }).join('\n');
    downloadBlob(new Blob([`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//T-Minus Studio//EN\nCALSCALE:GREGORIAN\n${events}\nEND:VCALENDAR`], { type: 'text/calendar;charset=utf-8' }), `${slug(activeProject.title)}-milestones.ics`);
    setToast('Milestones added to a calendar file.');
  }
  async function askNotifications() {
    if (typeof Notification === 'undefined') { setNotificationPermission('unsupported'); setToast('This browser does not support notifications.'); return; }
    const permission = await Notification.requestPermission(); setNotificationPermission(permission);
    if (permission === 'granted') { patchActive({ reminderSettings: { ...activeProject!.reminderSettings, enabled: true } }); setToast('Permission granted. Notifications require this tab to remain open.'); }
    else setToast(permission === 'denied' ? 'Notifications are blocked in browser settings.' : 'Permission was not granted.');
  }

  function handleCoverExport() {
    if (!activeProject) return;
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext('2d'); if (!ctx || !activeProject) return;
    const d = activeProject.design;
    const mockupX = d.coverMockupPosition === 'left' ? 70 : 710;
    const copyX = d.coverMockupPosition === 'left' ? 560 : 68;
    ctx.fillStyle = d.coverBackground; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const wash = ctx.createLinearGradient(0, 0, 1200, 800);
    wash.addColorStop(0, `${d.coverBackground}00`); wash.addColorStop(1, d.accentColor);
    ctx.globalAlpha = .22; ctx.fillStyle = wash; ctx.fillRect(0, 0, 1200, 800); ctx.globalAlpha = 1;
    ctx.fillStyle = d.coverTextColor; ctx.textBaseline = 'top';
    ctx.font = '500 14px "DM Mono"'; ctx.globalAlpha = .72;
    ctx.fillText('T — MINUS   /   A GOAL IN MOTION', copyX, 58);
    ctx.globalAlpha = 1;
    ctx.font = '600 48px Fraunces';
    wrapCanvasText(ctx, d.coverTitle || activeProject.submissionTitle || activeProject.title, copyX, 188, 570, 58);
    ctx.font = '18px "DM Sans"'; ctx.globalAlpha = .78;
    wrapCanvasText(ctx, d.coverSubtitle || 'AI-Powered Deadline Planning', copyX + 2, 335, 520, 28);
    ctx.globalAlpha = 1; ctx.font = '500 13px "DM Mono"';
    ctx.fillText(`${daysLeft(activeProject)} DAYS TO GO  ·  ${dateLabel(activeProject.deadline, activeProject.timeZone).toUpperCase()}`, copyX + 2, 694);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; roundRect(ctx, mockupX, 70, 420, 660, 24); ctx.fill();
    ctx.fillStyle = d.background; roundRect(ctx, mockupX + 30, 98, 360, 604, 18); ctx.fill();
    ctx.fillStyle = d.textColor; ctx.textAlign = 'center';
    ctx.font = '500 12px "DM Mono"'; ctx.globalAlpha = .72; ctx.fillText('T-MINUS COUNTDOWN', mockupX + 210, 145);
    ctx.globalAlpha = 1; ctx.font = '600 24px Fraunces'; wrapCanvasText(ctx, activeProject.title, mockupX + 60, 184, 300, 31);
    ctx.font = '500 64px "DM Mono"'; ctx.fillText(String(daysLeft(activeProject)).padStart(2, '0'), mockupX + 210, 288);
    ctx.font = '500 12px "DM Mono"'; ctx.globalAlpha = .75; ctx.fillText('DAYS REMAINING', mockupX + 210, 360);
    ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.font = '500 11px "DM Mono"'; ctx.fillText('YOUR ROADMAP', mockupX + 64, 430);
    const milestones = activeProject.milestones.filter(m => !m.completed).slice(0, 4);
    milestones.forEach((m, i) => {
      const y = 467 + i * 47; ctx.globalAlpha = .56; ctx.strokeStyle = d.textColor;
      ctx.beginPath(); ctx.arc(mockupX + 71, y + 7, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = .93; ctx.font = '14px "DM Sans"'; ctx.fillStyle = d.textColor;
      ctx.fillText(m.title.slice(0, 34), mockupX + 89, y);
    });
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
    canvas.toBlob(blob => {
      if (blob) {
        downloadBlob(blob, `${slug(activeProject.title)}-cover.png`);
        patchActive({ submissionChecks: [activeProject.submissionChecks?.[0] || false, true, ...(activeProject.submissionChecks?.slice(2) || [false, false, false])] });
        setToast('Showcase cover exported at 1200 × 800.');
      }
    }, 'image/png');
  }
  async function handleWallpaperExport() {
    if (!activeProject) return;
    const d = activeProject.design, canvas = document.createElement('canvas');
    const dimensions = wallpaperDimensions(d);
    canvas.width = dimensions[0]; canvas.height = dimensions[1];
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    await document.fonts.ready;
    paintWallpaperBackground(ctx, canvas, d);
    const finish = () => {
      paintWallpaperText(ctx, canvas, d, activeProject!);
      canvas.toBlob(blob => {
        if (blob) {
          downloadBlob(blob, `${slug(activeProject!.title)}-${d.format}-lockscreen.png`);
          patchActive({ submissionChecks: [true, ...(activeProject!.submissionChecks?.slice(1) || [false, false, false, false])] });
          setToast(`Wallpaper exported as a ${canvas.width} × ${canvas.height} PNG.`);
        }
      }, 'image/png');
    };
    if (!d.image) { finish(); return; }
    const image = new Image();
    image.onload = () => {
      const blur = Math.max(0, d.imageBlur || 0) * canvas.width / 1000;
      ctx.save(); ctx.filter = `brightness(${(d.imageBrightness ?? 100) / 100}) blur(${blur}px)`;
      const stretch = blur * 3;
      ctx.drawImage(image, -stretch, -stretch, canvas.width + stretch * 2, canvas.height + stretch * 2);
      ctx.restore();
      ctx.fillStyle = `rgba(0,0,0,${(d.overlayOpacity ?? 46) / 100})`; ctx.fillRect(0, 0, canvas.width, canvas.height);
      finish();
    };
    image.onerror = finish;
    image.src = d.image;
  }

  const onUpload = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setToast('Choose a PNG, JPG, or WebP image.'); return; }
    if (file.size > 3.5 * 1024 * 1024) { setToast('Choose an image under 3.5 MB so it can be saved on this device.'); return; }
    const reader = new FileReader(); reader.onload = () => patchDesign({ image: String(reader.result) }); reader.readAsDataURL(file);
  };

  const activeMilestones = useMemo(() => activeProject?.milestones || [], [activeProject]);

  return (
    <div className="app-shell colossal-shell">
      <div className="content-wrap">
        <header className="topbar colossal-header">
          <Link href="/" className="colossal-brand" aria-label="T-Minus Studio overview">T—MINUS STUDIO —<br />YOUR DEADLINE. YOUR DESIGN.<span className="colossal-connection">{health.data?.status === 'ok' ? 'Gemini assist connected' : health.isError ? 'Plan assist offline' : 'Local-first workspace'}</span></Link>
          <button className="icon-btn mobile-menu" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls="studio-navigation" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button>
          <nav id="studio-navigation" className={`colossal-nav ${mobileOpen ? 'open' : ''}`} aria-label="Primary navigation">{navItems.map(item => <Link key={item.href} href={item.href} className={location === item.href ? 'active' : ''} aria-current={location === item.href ? 'page' : undefined} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${item.href.slice(1) || 'overview'}`}>{item.label}</Link>)}</nav>
          <button className="icon-btn colossal-theme" onClick={() => setDark(!dark)} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} data-testid="button-theme">{dark ? <Sun /> : <Moon />}</button>
        </header>
        <main className={`main page-${page} ${!activeProject ? 'is-empty' : ''}`} aria-label={titleForPage}>
          {page === 'overview' && <Overview project={activeProject} projects={projects} onNew={openNew} onTask={toggleTask} onSetActive={pickActive} onEdit={openEdit} onCalendar={exportCalendar} />}
          {page === 'plan' && <PlanPage project={activeProject} milestones={activeMilestones} onAdd={addMilestone} onTask={toggleTask} onAddTask={addTask} onRemove={removeMilestone} onEditMilestone={editMilestone} onDate={changeMilestoneDate} onEdit={() => activeProject && openEdit(activeProject)} onNew={openNew} onMove={moveMilestone} showCompleted={showCompleted} setShowCompleted={setShowCompleted} />}
          {page === 'designer' && <Designer project={activeProject} onPatch={patchDesign} onExport={handleWallpaperExport} onUploadClick={() => uploadRef.current?.click()} onClearImage={() => patchDesign({ image: undefined })} onNew={openNew} uploadRef={uploadRef} onUpload={onUpload} onReset={() => { patchDesign(defaultDesign()); setToast('Design reset.'); }} onSave={() => setToast('Design saved on this device.')} />}
          {page === 'reminders' && <Reminders project={activeProject} onPatch={patchActive} onAsk={askNotifications} permission={notificationPermission} onCalendar={exportCalendar} onNew={openNew} />}
        </main>
      </div>
      {modal && <ProjectModal key={`${modal}-${editingId}`} mode={modal} project={projects.find(p => p.id === editingId)} loading={generatePlan.isPending} onClose={() => setModal(null)} onSubmit={startProject} />}
      {toast && <div className="toast-message" role="status">{toast}</div>}
    </div>
  );
}

function Overview({ project, projects, onNew, onTask, onSetActive, onEdit, onCalendar }: { project?: Project; projects: Project[]; onNew: () => void; onTask: (m: string, t: string) => void; onSetActive: (id: string) => void; onEdit: (p: Project) => void; onCalendar: () => void }) {
  if (!project) return <PageStart page="overview" onNew={onNew} />;
  const upcoming = project.milestones.find(m => !m.completed) || project.milestones[0];
  const tasks = project.milestones.flatMap(m => m.tasks.map(t => ({ ...t, milestone: m.title, milestoneId: m.id }))).filter(t => !t.completed).slice(0, 4);
  const remain = daysLeft(project);
  const countdown = countdownParts(project.deadline);
  return <>
    <div className="eyebrow">A little closer, every day</div>
    <div className="section-head" style={{ margin: '9px 0 0', alignItems: 'center' }}>
      <div><h1 className="page-title" style={{ margin: 0 }}>Your deadline, at a glance.</h1><p className="page-subtitle" style={{ marginTop: 10 }}>Your progress, next actions, and time remaining in one place.</p></div>
      <button className="btn" onClick={onNew}><Plus /> Start a goal</button>
    </div>
    <div className="grid-main">
      <section className="hero-panel">
        <div className="hero-content"><div className="hero-kicker">Your focus · {projects.filter(p => !p.archived).length} active {projects.filter(p => !p.archived).length === 1 ? 'project' : 'projects'}</div><h2 className="hero-title">{project.title}</h2><div className="hero-description">{project.description || 'A meaningful goal deserves a plan that fits your real life.'}</div></div>
        <div className="hero-bottom"><div><div className="countdown-label">Time to make it real</div><div className="countdown-units" data-testid="text-days-remaining">{Object.entries(countdown).map(([unit, value]) => <span key={unit}><b>{String(value).padStart(2, '0')}</b><small>{unit}</small></span>)}</div></div><button className="btn" onClick={() => onEdit(project)}>Shape the plan <ArrowRight /></button></div>
      </section>
      <div className="aside-stack">
        <div className="stat-panel"><div><div className="stat-label">Progress so far</div><div className="stat-value">{calcProgress(project)}<span style={{ fontSize: 20 }}>%</span></div></div><div><div className="progress-track"><i style={{ width: `${calcProgress(project)}%` }} /></div><div className="stat-foot">{project.milestones.flatMap(m => m.tasks).filter(t => t.completed).length} things already done</div></div></div>
        <div className="stat-panel"><div className="stat-label">Next checkpoint</div><div className="stat-value" style={{ fontSize: 25, margin: '14px 0 5px' }}>{upcoming?.title || 'Your first step'}</div><div className="stat-foot">{upcoming ? `${dateLabel(upcoming.date, project.timeZone)} · ${upcoming.tMinus}` : 'Build your milestone plan'}</div></div>
      </div>
    </div>
    <div className="two-col">
      <section className="card">
        <div className="card-head"><div><h2 className="card-title">Next right things</h2><div className="section-note">Small actions that move the whole thing forward.</div></div><Link href="/plan" className="text-button">Full plan <ArrowUpRight size={14} /></Link></div>
        {tasks.length ? <div className="checklist">{tasks.map(task => <label className="checklist-item" key={task.id}><input type="checkbox" checked={task.completed} onChange={() => onTask(task.milestoneId, task.id)} /><span><strong>{task.title}</strong><span style={{ display: 'block', color: 'hsl(var(--muted-foreground))', marginTop: 3, fontSize: 10 }}>{task.milestone}</span></span></label>)}</div> : <div className="alert">You have cleared every action in this plan. Add a checkpoint to keep the momentum kind.</div>}
      </section>
      <section className="card"><div className="card-head"><div><h2 className="card-title">A small ritual</h2><div className="section-note">Make the goal visible on ordinary days.</div></div><Flame size={19} color="hsl(var(--accent))" /></div><p style={{ font: '19px/1.35 var(--app-font-serif)', margin: '10px 0 17px' }}>“What is the smallest honest step I can take today?”</p><div className="tool-row"><Link className="btn small secondary" href="/designer">Design a lock screen <ArrowRight /></Link><button className="btn small secondary" onClick={onCalendar}><CalendarDays /> Save calendar</button></div></section>
    </div>
    {projects.filter(p => !p.archived).length > 1 && <><div className="section-head"><div><h2 className="section-title">Your other goals</h2><div className="section-note">Choose the goal you want to focus on today.</div></div></div><div className="project-grid">{projects.filter(p => !p.archived && p.id !== project.id).map(p => <button key={p.id} className="card project-card" style={{ textAlign: 'left', color: 'inherit' }} onClick={() => onSetActive(p.id)}><div className="project-meta"><span className="tag">{daysLeft(p)} days left</span><ArrowUpRight size={16} /></div><div className="project-title">{p.title}</div><div className="project-desc">{p.description}</div></button>)}</div></>}
  </>;
}

function PlanPage({ project, milestones, onAdd, onTask, onAddTask, onRemove, onEditMilestone, onDate, onEdit, onNew, onMove, showCompleted, setShowCompleted }: { project?: Project; milestones: Milestone[]; onAdd: () => void; onTask: (m: string, t: string) => void; onAddTask: (m: Milestone) => void; onRemove: (id: string) => void; onEditMilestone: (id: string) => void; onDate: (id: string, date: string) => void; onEdit: () => void; onNew: () => void; onMove: (id: string, direction: -1 | 1) => void; showCompleted: boolean; setShowCompleted: (v: boolean) => void }) {
  const [view, setView] = useState<'timeline' | 'calendar'>('timeline');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  if (!project) return <PageStart page="plan" onNew={onNew} />;
  const visible = milestones.filter(m => showCompleted || !m.completed);
  const [year, monthNumber] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const firstDayOffset = (new Date(year, monthNumber - 1, 1).getDay() + 6) % 7;
  const calendarCells = [...Array(firstDayOffset).fill(0), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (calendarCells.length % 7) calendarCells.push(0);
  const milestonesByDay = visible.reduce<Record<string, Milestone[]>>((acc, m) => {
    const day = isoDayInZone(m.date, project.timeZone);
    acc[day] = [...(acc[day] || []), m];
    return acc;
  }, {});
  const monthName = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(year, monthNumber - 1, 1));
  const shiftMonth = (step: number) => {
    const next = new Date(year, monthNumber - 1 + step, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };
  return <>
    <div className="eyebrow">The path, not the pressure</div><div className="section-head" style={{ marginTop: 10 }}><div><h1 className="page-title">Your milestone plan.</h1><p className="page-subtitle">{project.title} · {daysLeft(project)} days until your deadline. Your milestones are editable and saved as you go.</p></div><div className="tool-row"><button className="btn secondary" onClick={onEdit}><Settings2 /> Edit goal</button><button className="btn" onClick={onAdd}><Plus /> Add checkpoint</button></div></div>
    {project.planSummary && <div className="alert" style={{ marginTop: 19 }}><strong>Gemini’s plan summary</strong><br />{project.planSummary}</div>}
    <div className="tool-row" style={{ marginTop: 20 }}><button className={`btn small ${view === 'timeline' ? '' : 'secondary'}`} onClick={() => setView('timeline')}><ListChecks size={15} /> Timeline</button><button className={`btn small ${view === 'calendar' ? '' : 'secondary'}`} onClick={() => setView('calendar')}><CalendarDays size={15} /> Calendar</button></div>
    <div className="two-col" style={{ gridTemplateColumns: '1.1fr .9fr' }}>
      <section className="card"><div className="card-head"><div><h2 className="card-title">{view === 'calendar' ? 'Milestone calendar' : 'Your timeline'}</h2><div className="section-note">{milestones.length} milestones · {project.timeZone}</div></div><label className="check-row"><input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)} /> Show completed</label></div>
        {view === 'calendar' ? <div className="calendar-wrap"><div className="calendar-toolbar"><button className="icon-btn" aria-label="Previous month" onClick={() => shiftMonth(-1)}><ChevronLeft /></button><strong>{monthName}</strong><button className="icon-btn" aria-label="Next month" onClick={() => shiftMonth(1)}><ChevronRight /></button><input aria-label="Choose calendar month" type="month" value={month} onChange={e => e.target.value && setMonth(e.target.value)} /></div><div className="calendar-grid">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div className="calendar-weekday" key={day}>{day}</div>)}{calendarCells.map((day, index) => {
          const key = day ? `${month}-${String(day).padStart(2, '0')}` : `empty-${index}`;
          return <div className={`calendar-day ${day ? '' : 'blank'}`} key={key}>{day > 0 && <><span className="calendar-day-number">{day}</span>{(milestonesByDay[key] || []).map(m => <button className={`calendar-event ${m.completed ? 'done' : ''}`} key={m.id} title={m.title} onClick={() => onEditMilestone(m.id)}>{m.title}</button>)}</>}</div>;
        })}</div>{visible.length === 0 && <div className="section-note" style={{ marginTop: 12 }}>No milestones yet. Add a checkpoint to put it on the calendar.</div>}</div>
          : visible.length ? <div className="timeline">{visible.map((m, i) => <article className={`milestone-row ${m.completed ? 'completed' : ''}`} key={m.id}><div><div className="tool-row" style={{ gap: 8 }}><div className="mile-title">{m.title}</div>{m.priority === 'high' && <span className="tag warm">Key moment</span>}</div><div className="mile-desc">{m.description || 'A checkpoint to help you stay on course.'}</div><div style={{ display: 'grid', gap: 9, marginTop: 12 }}>{m.tasks.map(task => <label key={task.id} className="check-row"><input type="checkbox" checked={task.completed} onChange={() => onTask(m.id, task.id)} /><span style={{ textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? .6 : 1 }}>{task.title}</span></label>)}</div><div className="tool-row"><button className="text-button" style={{ paddingLeft: 0, marginTop: 7 }} onClick={() => onAddTask(m)}>+ Add an action</button><button className="text-button" style={{ marginTop: 7 }} onClick={() => onEditMilestone(m.id)}>Edit checkpoint</button></div></div><div className="mile-date"><div className="reorder-buttons"><button aria-label={`Move ${m.title} up`} disabled={i === 0} onClick={() => onMove(m.id, -1)}><ArrowUp size={13} /></button><button aria-label={`Move ${m.title} down`} disabled={i === visible.length - 1} onClick={() => onMove(m.id, 1)}><ArrowDown size={13} /></button></div><input aria-label={`Date for ${m.title}`} type="date" value={isoDayInZone(m.date, project.timeZone)} onChange={e => onDate(m.id, e.target.value)} style={{ width: 116, background: 'transparent', border: '0', color: 'inherit', font: '10px var(--app-font-mono)' }} /><div style={{ textAlign: 'right', marginTop: 6 }}>{m.tMinus || `Step ${i + 1}`}</div><button className="text-button" aria-label={`Remove ${m.title}`} onClick={() => onRemove(m.id)} style={{ color: 'hsl(var(--muted-foreground))', paddingRight: 0 }}><Trash2 size={13} /></button></div></article>)}</div> : <div className="empty-state"><div className="empty-symbol"><ListChecks /></div><h3>One clear checkpoint changes everything.</h3><p>Add a milestone, or start with an AI-generated plan shaped around your time and deadline.</p><button className="btn" onClick={onAdd}>Add a checkpoint</button></div>}
      </section>
      <div style={{ display: 'grid', gap: 17 }}>
        <div className="card"><div className="card-head"><div><h2 className="card-title">Your capacity</h2><div className="section-note">A plan built around your actual week.</div></div><Clock3 size={19} /></div><div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}><span style={{ font: '40px var(--app-font-serif)' }}>{project.availableHoursPerDay}</span><span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>hours each available day</span></div><div className="section-note" style={{ marginTop: 11 }}>Rest days: {project.unavailableDays.length ? project.unavailableDays.map(d => d.slice(0, 3)).join(', ') : 'none set'}</div><button className="btn small secondary" style={{ marginTop: 17 }} onClick={onEdit}>Adjust capacity <ArrowRight /></button></div>
        <div className="card"><div className="card-head"><div><h2 className="card-title">Keep it portable</h2><div className="section-note">Bring your milestones into your calendar.</div></div><CalendarDays size={19} /></div><p style={{ fontSize: 12, lineHeight: 1.6, color: 'hsl(var(--muted-foreground))' }}>Export an .ics file to add each checkpoint to Apple Calendar, Google Calendar, or Outlook.</p><Link href="/reminders" className="btn small">Reminder settings <ArrowRight /></Link></div>
      </div>
    </div>
  </>;
}

function Designer({ project, onPatch, onExport, onUploadClick, onClearImage, onNew, uploadRef, onUpload, onReset, onSave }: { project?: Project; onPatch: (p: Partial<Design>) => void; onExport: () => void; onUploadClick: () => void; onClearImage: () => void; onNew: () => void; uploadRef: React.RefObject<HTMLInputElement | null>; onUpload: (f?: File) => void; onReset: () => void; onSave: () => void }) {
  if (!project) return <PageStart page="designer" onNew={onNew} />;
  const d = project.design;
  const format = d.format === 'laptop' || d.format === 'desktop' ? 'desktop' : d.format === 'cover' ? 'cover' : d.format === 'custom' ? 'custom' : 'phone';
  const aspectRatio = format === 'phone' ? '9/16' : format === 'cover' ? '3/2' : format === 'custom' ? `${d.customWidth}/${d.customHeight}` : '16/9';
  const visibleMilestones = project.milestones.filter(m => d.showCompletedMilestones || !m.completed).slice(0, d.milestoneCount);
  const clock = countdownParts(project.deadline);
  return <>
    <div className="eyebrow">A reminder that fits in your pocket</div><div className="section-head" style={{ marginTop: 10 }}><div><h1 className="page-title">Design your countdown.</h1><p className="page-subtitle">Make a lock screen that brings your intention back into view. Changes save automatically on this device.</p></div><div className="tool-row"><button className="btn secondary" onClick={onSave}>Save design</button><button className="btn" onClick={onExport}><Download /> Download lock screen</button></div></div>
    <div className="designer-layout">
      <div className="preview-stage">
        <div className={`wallpaper template-${d.template} ${d.image ? 'has-image' : ''}`} style={{ color: d.textColor, aspectRatio, background: d.backgroundStyle === 'gradient' ? `linear-gradient(145deg, ${d.background}, ${d.accentColor})` : d.background, width: format === 'desktop' || format === 'cover' ? '100%' : format === 'custom' ? `min(100%,${Math.round(410 * d.customWidth / d.customHeight)}px)` : undefined, borderRadius: format === 'phone' ? 28 : 16 }}>
          {d.image && <div className="wallpaper-bg-image" style={{ backgroundImage: `url(${d.image})`, backgroundPosition: d.imagePosition, filter: `brightness(${d.imageBrightness / 100}) blur(${d.imageBlur}px)` }} />}
          <div className="wallpaper-shade" style={{ opacity: d.overlayOpacity / 100 }} />
          <div className="wallpaper-content" style={{ marginTop: format === 'phone' ? 25 : 0, textAlign: d.layout as 'center' | 'left' | 'right', alignSelf: d.layout === 'left' ? 'flex-start' : d.layout === 'right' ? 'flex-end' : 'center', fontFamily: d.font === 'DM Mono' ? 'var(--app-font-mono)' : d.font === 'DM Sans' ? 'var(--app-font-sans)' : 'var(--app-font-serif)', transform: `scale(${d.fontScale})` }}>
            <div className="wallpaper-kicker">T-MINUS COUNTDOWN</div>
            <div className="wallpaper-project-name">{project.title}</div>
            {d.showCountdown && <div className="wallpaper-timer">{Object.entries(clock).map(([unit, value]) => <div className="wallpaper-time-unit" key={unit}><strong>{String(value).padStart(2, '0')}</strong><span>{unit}</span></div>)}</div>}
            <div className="wallpaper-title">{d.title || 'Make it real.'}</div>
            {d.showDate && <div className="wallpaper-date">{dateLabel(project.deadline, project.timeZone)} · {new Date(project.deadline).getFullYear()}</div>}
            {d.showProgress && <div className="wallpaper-progress"><div className="wallpaper-progress-track"><i style={{ width: `${calcProgress(project)}%`, background: d.accentColor }} /></div><span>{calcProgress(project)}% complete</span></div>}
            {d.showMilestones && <div className="wallpaper-roadmap"><div className="wallpaper-roadmap-label">YOUR ROADMAP</div>{visibleMilestones.map(m => <div className={`wallpaper-milestone ${m.completed ? 'done' : ''}`} key={m.id}><span className="wallpaper-check">{d.showCheckboxes ? m.completed ? '✓' : '○' : '—'}</span><span>{m.tMinus} · {m.title}</span></div>)}</div>}
          </div>
          <div className="wallpaper-footer">T—MINUS STUDIO · ONE DAY AT A TIME</div>
        </div>
      </div>
      <aside className="card control-panel">
        <div className="card-head"><div><h2 className="card-title">Make it yours</h2><div className="section-note">Live preview · saved locally</div></div><Settings2 size={18} /></div>
        <div className="field"><label>Template · 8 moods</label><div className="template-grid">{templates.map(t => <button key={t.id} aria-label={`Use ${t.label} template`} title={t.label} className={`template-choice ${d.template === t.id ? 'selected' : ''}`} style={{ background: t.bg }} onClick={() => onPatch({ template: t.id, background: t.color, textColor: t.text, accentColor: t.accent, backgroundStyle: ['mono', 'orbit', 'paper', 'field'].includes(t.id) ? 'solid' : 'gradient' })}><span>{t.label}</span></button>)}</div></div>
        <div className="field"><label>Format</label><select value={d.format} onChange={e => onPatch({ format: e.target.value })}><option value="phone">Phone · 1440 × 2560</option><option value="laptop">Laptop · 1920 × 1080</option><option value="desktop">Desktop · 1920 × 1080</option><option value="cover">Showcase · 1200 × 800</option><option value="custom">Custom dimensions</option></select></div>
        {format === 'custom' && <div className="field-row"><div className="field"><label>Width px</label><input type="number" min="320" max="5000" value={d.customWidth} onChange={e => onPatch({ customWidth: Math.min(5000, Math.max(320, Number(e.target.value))) })} /></div><div className="field"><label>Height px</label><input type="number" min="320" max="5000" value={d.customHeight} onChange={e => onPatch({ customHeight: Math.min(5000, Math.max(320, Number(e.target.value))) })} /></div></div>}
        <div className="field"><label>Background style</label><select value={d.backgroundStyle} onChange={e => onPatch({ backgroundStyle: e.target.value })}><option value="solid">Solid color</option><option value="gradient">Gradient</option></select></div>
        <div className="field"><label>Background · accent · text</label><div className="color-controls"><label>Background<input type="color" value={d.background} onChange={e => onPatch({ background: e.target.value })} /></label><label>Accent<input type="color" value={d.accentColor} onChange={e => onPatch({ accentColor: e.target.value })} /></label><label>Text<input type="color" value={d.textColor} onChange={e => onPatch({ textColor: e.target.value })} /></label></div><div className="swatches">{palette.map(p => <button key={p.bg} className="swatch" aria-label={`Set color ${p.bg}`} style={{ background: p.bg }} onClick={() => onPatch({ background: p.bg, textColor: p.text, backgroundStyle: 'solid' })} />)}</div></div>
        <div className="field"><label>Type</label><select value={d.font} onChange={e => onPatch({ font: e.target.value })}><option>Fraunces</option><option>DM Sans</option><option>DM Mono</option></select></div>
        <div className="field"><label>Text scale · {Math.round(d.fontScale * 100)}%</label><input type="range" min=".7" max="1.4" step=".05" value={d.fontScale} onChange={e => onPatch({ fontScale: Number(e.target.value) })} /></div>
        <div className="field"><label>Alignment</label><select value={d.layout} onChange={e => onPatch({ layout: e.target.value })}><option value="center">Centered</option><option value="left">Left aligned</option><option value="right">Right aligned</option></select></div>
        <div className="field"><label>Words to come back to</label><input value={d.title} maxLength={48} onChange={e => onPatch({ title: e.target.value })} /></div>
        <div className="field"><label>Visible milestones</label><select value={d.milestoneCount} onChange={e => onPatch({ milestoneCount: Number(e.target.value) })}>{[1, 2, 3, 4, 5, 6].map(n => <option value={n} key={n}>{n} milestones</option>)}</select></div>
        <div className="tool-row" style={{ margin: '4px 0 10px', flexWrap: 'wrap' }}><label className="check-row"><input type="checkbox" checked={d.showCountdown} onChange={e => onPatch({ showCountdown: e.target.checked })} /> Countdown</label><label className="check-row"><input type="checkbox" checked={d.showDate} onChange={e => onPatch({ showDate: e.target.checked })} /> Deadline date</label><label className="check-row"><input type="checkbox" checked={d.showMilestones} onChange={e => onPatch({ showMilestones: e.target.checked })} /> Milestones</label><label className="check-row"><input type="checkbox" checked={d.showProgress} onChange={e => onPatch({ showProgress: e.target.checked })} /> Progress bar</label><label className="check-row"><input type="checkbox" checked={d.showCheckboxes} onChange={e => onPatch({ showCheckboxes: e.target.checked })} /> Checkboxes</label><label className="check-row"><input type="checkbox" checked={d.showCompletedMilestones} onChange={e => onPatch({ showCompletedMilestones: e.target.checked })} /> Include completed</label></div>
        <div className="tool-row"><button className="btn small secondary" onClick={onUploadClick}><ImagePlus /> Reference image</button>{d.image && <button className="text-button" onClick={onClearImage}>Remove image</button>}</div>
        {d.image && <><div className="field"><label>Brightness · {d.imageBrightness}%</label><input type="range" min="35" max="145" value={d.imageBrightness} onChange={e => onPatch({ imageBrightness: Number(e.target.value) })} /></div><div className="field"><label>Blur · {d.imageBlur}px</label><input type="range" min="0" max="12" value={d.imageBlur} onChange={e => onPatch({ imageBlur: Number(e.target.value) })} /></div><div className="field"><label>Overlay · {d.overlayOpacity}%</label><input type="range" min="0" max="85" value={d.overlayOpacity} onChange={e => onPatch({ overlayOpacity: Number(e.target.value) })} /></div><div className="field"><label>Image position</label><select value={d.imagePosition} onChange={e => onPatch({ imagePosition: e.target.value })}><option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option></select></div></>}
        <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => { onUpload(e.target.files?.[0]); e.currentTarget.value = ''; }} />
        <div className="section-note" style={{ marginTop: 10 }}>Your photo stays in this browser. Export creates a high-resolution PNG.</div>
        <button className="text-button" style={{ marginTop: 15 }} onClick={onReset}>Reset design</button>
      </aside>
    </div>
  </>;
}

function Reminders({ project, onPatch, onAsk, permission, onCalendar, onNew }: { project?: Project; onPatch: (p: Partial<Project>) => void; onAsk: () => void; permission: string; onCalendar: () => void; onNew: () => void }) {
  if (!project) return <PageStart page="reminders" onNew={onNew} />;
  const settings = project.reminderSettings;
  const update = (patch: Partial<ReminderSettings>) => onPatch({ reminderSettings: { ...settings, ...patch } });
  return <>
    <div className="eyebrow">A nudge, never a nag</div><div className="section-head" style={{ marginTop: 10 }}><div><h1 className="page-title">Your reminder rhythm.</h1><p className="page-subtitle">Choose a gentle rhythm. Browser notifications are permission-based and only appear while this app is open.</p></div><button className="btn" onClick={onCalendar}><CalendarDays /> Export calendar file</button></div>
    <div className="two-col">
      <section className="card"><div className="card-head"><div><h2 className="card-title">Your reminder rhythm</h2><div className="section-note">Settings are stored on this device.</div></div><Bell size={20} /></div>
        <div className="reminder-row"><div><div className="reminder-title">Daily check-in</div><div className="reminder-desc">A small prompt to choose your next right thing.</div></div><button className={`switch ${settings.daily ? 'on' : ''}`} aria-label="Toggle daily check-in" aria-pressed={settings.daily} onClick={() => update({ daily: !settings.daily })}><i /></button></div>
        <div className="reminder-row"><div><div className="reminder-title">Weekly reset</div><div className="reminder-desc">Review what moved and make room for what’s next.</div></div><button className={`switch ${settings.weekly ? 'on' : ''}`} aria-label="Toggle weekly reset" aria-pressed={settings.weekly} onClick={() => update({ weekly: !settings.weekly })}><i /></button></div>
        <div className="reminder-row"><div><div className="reminder-title">Milestone day</div><div className="reminder-desc">A note on the day a checkpoint arrives.</div></div><button className={`switch ${settings.milestone ? 'on' : ''}`} aria-label="Toggle milestone reminder" aria-pressed={settings.milestone} onClick={() => update({ milestone: !settings.milestone })}><i /></button></div>
        <div className="field" style={{ maxWidth: 230 }}><label>Preferred check-in time</label><input type="time" value={settings.time} onChange={e => update({ time: e.target.value })} /></div>
        <div className="alert" style={{ marginTop: 18 }}><strong>Permission clarity</strong><br />Browser notifications are optional. T-Minus does not run in the background or schedule server notifications. You can revoke permission in your browser settings at any time.</div>
        <div className="tool-row" style={{ marginTop: 17 }}><button className="btn" onClick={onAsk}>{permission === 'granted' ? <CheckCircle2 /> : <Bell />}{permission === 'granted' ? 'Permission granted' : 'Request browser permission'}</button><span className="tag">{permission === 'unsupported' ? 'Unsupported' : `Permission · ${permission}`}</span></div>
      </section>
      <div style={{ display: 'grid', gap: 17 }}>
        <div className="card"><div className="card-head"><div><h2 className="card-title">Never miss the date</h2><div className="section-note">Use your calendar’s own reminders.</div></div><CalendarDays size={20} /></div><p style={{ fontSize: 12, lineHeight: 1.6, color: 'hsl(var(--muted-foreground))' }}>Download an .ics calendar containing each project milestone. Your calendar app can then send reminders on its own schedule.</p><button className="btn" onClick={onCalendar}><Download /> Download .ics file</button></div>
        <div className="card"><div className="card-head"><div><h2 className="card-title">This project</h2><div className="section-note">{project.title}</div></div><Clock3 size={19} /></div><div style={{ font: '35px var(--app-font-serif)' }}>{daysLeft(project)}<span style={{ font: '12px var(--app-font-sans)', color: 'hsl(var(--muted-foreground))', marginLeft: 7 }}>days remaining</span></div><div className="section-note" style={{ marginTop: 6 }}>Deadline · {dateLabel(project.deadline, project.timeZone)}</div></div>
      </div>
    </div>
  </>;
}

function ProjectsPage({ projects, search, setSearch, showArchived, setShowArchived, activeId, onNew, onPick, onEdit, onDuplicate, onDelete, onArchive, onExport, onImport }: { projects: Project[]; search: string; setSearch: (s: string) => void; showArchived: boolean; setShowArchived: (b: boolean) => void; activeId: string; onNew: () => void; onPick: (id: string) => void; onEdit: (p: Project) => void; onDuplicate: (p: Project) => void; onDelete: (p: Project) => void; onArchive: (p: Project) => void; onExport: (p?: Project) => void; onImport: () => void }) {
  const [openMenu, setOpenMenu] = useState('');
  const filtered = projects.filter(p => p.archived === showArchived && `${p.title} ${p.description}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="eyebrow">Every ambition gets its own space</div><div className="section-head" style={{ marginTop: 10 }}><div><h1 className="page-title">Your projects, in progress.</h1><p className="page-subtitle">Shape, find, duplicate, or archive the goals you’re making real.</p></div><div className="tool-row"><button className="btn secondary" onClick={onImport}><Upload /> Import JSON</button><button className="btn" onClick={onNew}><Plus /> New project</button></div></div>
    <div className="section-head" style={{ margin: '27px 0 0', alignItems: 'center' }}><div className="tool-row"><button className={`btn small ${!showArchived ? '' : 'secondary'}`} onClick={() => setShowArchived(false)}>In motion</button><button className={`btn small ${showArchived ? '' : 'secondary'}`} onClick={() => setShowArchived(true)}>Archived</button><span className="tag">{filtered.length} projects</span></div><div style={{ position: 'relative', width: 260, maxWidth: '100%' }}><Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'hsl(var(--muted-foreground))' }} /><input className="search-input" style={{ paddingLeft: 35 }} placeholder="Find a project" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search projects" /></div></div>
    {filtered.length ? <div className="project-grid">{filtered.map(p => <article className="card project-card" key={p.id}><div className="project-meta"><span className={`tag ${p.id === activeId ? 'warm' : ''}`}>{p.id === activeId ? 'Current focus' : p.archived ? 'Archived' : `${daysLeft(p)} days left`}</span><div className="menu-wrap"><button className="icon-btn" aria-label={`More actions for ${p.title}`} onClick={() => setOpenMenu(openMenu === p.id ? '' : p.id)}><MoreHorizontal /></button>{openMenu === p.id && <div className="menu-pop">{[['Edit details', () => onEdit(p)], ['Make a copy', () => onDuplicate(p)], ['Export JSON', () => onExport(p)], [p.archived ? 'Restore project' : 'Archive project', () => onArchive(p)], ['Delete project', () => onDelete(p)]].map(([label, fn]) => <button key={String(label)} onClick={() => { (fn as () => void)(); setOpenMenu(''); }}>{String(label)}</button>)}</div>}</div></div><button onClick={() => onPick(p.id)} style={{ display: 'block', border: 0, background: 'none', padding: 0, color: 'inherit', textAlign: 'left', width: '100%' }}><h2 className="project-title">{p.title}</h2><div className="project-desc">{p.description || 'A good goal, ready to take shape.'}</div></button><div className="progress-track"><i style={{ width: `${calcProgress(p)}%` }} /></div><div className="project-footer"><span className="section-note" style={{ margin: 0 }}>{calcProgress(p)}% complete · {dateLabel(p.deadline)}</span><button className="text-button" onClick={() => onPick(p.id)}>Open <ArrowRight size={13} /></button></div></article>)}</div> : <div className="empty-state" style={{ marginTop: 23 }}><div className="empty-symbol">{showArchived ? <FolderOpen /> : <Sparkles />}</div><h3>{search ? 'Nothing by that name.' : showArchived ? 'No archived projects.' : 'Give one goal a little room.'}</h3><p>{search ? 'Try a different search, or clear the field.' : 'Start with the thing you keep meaning to make happen.'}</p>{!showArchived && !search && <button className="btn" onClick={onNew}>Start your first goal</button>}</div>}
  </>;
}

function Submission({ project, onPatch, checks, setChecks, onCover, onWallpaper, onDesignPatch, onExportJSON, onNew, onToast }: { project?: Project; onPatch: (p: Partial<Project>) => void; checks: boolean[]; setChecks: (v: boolean[]) => void; onCover: () => void; onWallpaper: () => void; onDesignPatch: (p: Partial<Design>) => void; onExportJSON: () => void; onNew: () => void; onToast: (message: string) => void }) {
  if (!project) return <EmptyProject onNew={onNew} />;
  const checklist = ['Customized lock-screen PNG downloaded', '1200 × 800 showcase cover downloaded', 'Submission title finalized', 'Description reviewed and complete', 'Images and project proof ready to upload'];
  const count = project.submissionDescription.length;
  const title = project.submissionTitle || 'Your Deadline, Your Design — AI Countdown Lock Screen';
  const design = project.design;
  const copyDescription = async () => {
    try { await navigator.clipboard.writeText(project.submissionDescription); onToast('Description copied to clipboard.'); }
    catch { onToast('Clipboard access was blocked. Select and copy the description manually.'); }
  };
  return <>
    <div className="eyebrow">The work is yours. Tell its story.</div><div className="section-head" style={{ marginTop: 10 }}><div><h1 className="page-title">Ready for Handshake.</h1><p className="page-subtitle">Review the editable copy, download both PNG assets, then upload them to Handshake yourself.</p></div><span className="tag warm">{count}/500 characters</span></div>
    <div className="two-col">
      <section className="card"><div className="card-head"><div><h2 className="card-title">Your submission</h2><div className="section-note">An editable starting draft. Adjust personal details before you upload.</div></div><ArrowUpRight size={19} /></div>
        <div className="field"><label htmlFor="submission-title">Project title</label><input id="submission-title" maxLength={120} value={title} onChange={e => onPatch({ submissionTitle: e.target.value })} /></div>
        <div className="field"><label htmlFor="submission-description">Project description · 500 characters max</label><textarea id="submission-description" maxLength={500} value={project.submissionDescription} placeholder="What did you set out to do? How did planning help? What did you learn?" onChange={e => onPatch({ submissionDescription: e.target.value })} style={{ minHeight: 160 }} /></div>
        <div className="tool-row" style={{ justifyContent: 'space-between' }}><span className="section-note">{count}/500 characters</span><button className="btn small secondary" onClick={() => void copyDescription()}><Copy size={15} /> Copy description</button></div>
        <div style={{ marginTop: 24, borderTop: '1px solid hsl(var(--border))', paddingTop: 21 }}><div className="card-head"><div><h2 className="card-title">Final checklist</h2><div className="section-note">Files download to your device; upload them to Handshake manually.</div></div><span className="tag">{checks.filter(Boolean).length}/{checklist.length} ready</span></div><div className="checklist">{checklist.map((item, i) => <label className="checklist-item" key={item}><input type="checkbox" checked={Boolean(checks[i])} onChange={() => setChecks(checklist.map((_, j) => j === i ? !checks[j] : Boolean(checks[j])))} /><span>{item}</span></label>)}</div></div>
      </section>
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="card"><div className="card-head"><div><h2 className="card-title">Cover image · 1200 × 800</h2><div className="section-note">A project story beside a live lock-screen mockup.</div></div><FileImage size={19} /></div>
          <div className="cover-preview" style={{ background: design.coverBackground, color: design.coverTextColor, gridTemplateColumns: design.coverMockupPosition === 'left' ? '1fr 1.3fr' : '1.3fr 1fr' }}>
            <div className="cover-copy" style={{ order: design.coverMockupPosition === 'left' ? 2 : 1 }}><div className="eyebrow" style={{ color: 'inherit' }}>T—MINUS · A GOAL IN MOTION</div><h3>{design.coverTitle || title}</h3><p>{design.coverSubtitle}</p><small>{daysLeft(project)} DAYS LEFT · {dateLabel(project.deadline, project.timeZone).toUpperCase()}</small></div>
            <div className="cover-mini-phone" style={{ order: design.coverMockupPosition === 'left' ? 1 : 2, background: design.background, color: design.textColor }}><div className="eyebrow" style={{ color: 'inherit' }}>T-MINUS</div><strong>{project.title}</strong><b>{String(countdownParts(project.deadline).days).padStart(2, '0')}</b><span>DAYS REMAINING</span><small>{project.milestones.find(m => !m.completed)?.title || 'Your next milestone'}</small></div>
          </div>
          <div className="field" style={{ marginTop: 16 }}><label>Cover title</label><input maxLength={100} value={design.coverTitle || title} onChange={e => onDesignPatch({ coverTitle: e.target.value })} /></div>
          <div className="field"><label>Cover subtitle</label><input maxLength={120} value={design.coverSubtitle} onChange={e => onDesignPatch({ coverSubtitle: e.target.value })} /></div>
          <div className="field"><label>Mockup position</label><select value={design.coverMockupPosition} onChange={e => onDesignPatch({ coverMockupPosition: e.target.value })}><option value="right">Right side</option><option value="left">Left side</option></select></div>
          <div className="color-controls"><label>Cover background<input type="color" value={design.coverBackground} onChange={e => onDesignPatch({ coverBackground: e.target.value })} /></label><label>Cover text<input type="color" value={design.coverTextColor} onChange={e => onDesignPatch({ coverTextColor: e.target.value })} /></label></div>
          <button className="btn" style={{ width: '100%' }} onClick={onCover}><Download /> Download cover PNG</button>
          <button className="btn secondary" style={{ marginTop: 9, width: '100%' }} onClick={onWallpaper}><Download /> Download lock-screen PNG</button>
          <button className="btn secondary" style={{ marginTop: 16, width: '100%' }} onClick={onExportJSON}><Download /> Export project backup</button><div className="section-note" style={{ marginTop: 8 }}>A portable copy of milestones, tasks, and design settings.</div>
        </div>
      </div>
    </div>
  </>;
}

function ProjectModal({ mode, project, loading, onClose, onSubmit }: { mode: ModalMode; project?: Project; loading: boolean; onClose: () => void; onSubmit: (form: HTMLFormElement, askGemini: boolean) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(1);
  const p = project;
  const due = p ? dateAndTimeInZone(p.deadline, p.timeZone) : { date: '', time: '17:00' };
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="goal-modal-title">
    <div className="modal-head"><div><div className="eyebrow">{mode === 'edit' ? 'Make the plan fit' : `Step ${step} of 2 · ${step === 1 ? 'Define your goal' : 'Understand your week'}`}</div><h2 className="modal-title" id="goal-modal-title">{mode === 'edit' ? 'Shape your goal.' : step === 1 ? 'What are you moving toward?' : 'Make room for the work.'}</h2></div><button className="close-btn" aria-label="Close dialog" onClick={onClose}><X /></button></div>
    <p className="section-note" style={{ marginBottom: 19 }}>Share a little context. Gemini can turn it into a practical milestone plan, or you can make one by hand.</p>
    <form ref={formRef} onSubmit={e => { e.preventDefault(); if (step === 1) { if (formRef.current?.reportValidity()) setStep(2); return; } onSubmit(e.currentTarget, false); }}>
      <div hidden={step !== 1}>
        <div className="field"><label htmlFor="goal-title">Goal name</label><input id="goal-title" name="title" required maxLength={120} defaultValue={p?.title || ''} placeholder="Run a half marathon, launch a portfolio…" /></div>
        <div className="field"><label htmlFor="goal-description">What makes this important?</label><textarea id="goal-description" name="description" maxLength={2000} defaultValue={p?.description || ''} placeholder="A sentence or two is enough to begin." /></div>
        <div className="field-row"><div className="field"><label htmlFor="goal-deadline">Deadline date</label><input id="goal-deadline" type="date" name="deadlineDate" required defaultValue={due.date} min={due.date || new Date().toISOString().slice(0, 10)} /></div><div className="field"><label htmlFor="goal-time">Deadline time</label><input id="goal-time" type="time" name="deadlineTime" required defaultValue={due.time} /></div></div>
        <div className="field"><label htmlFor="goal-timezone">Time zone</label><input id="goal-timezone" name="timezone" required defaultValue={p?.timeZone || deviceZone} placeholder="Europe/London" list="time-zone-suggestions" /><datalist id="time-zone-suggestions">{[deviceZone, 'UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'].map(zone => <option value={zone} key={zone} />)}</datalist><div className="field-hint">Use an IANA time zone, such as Asia/Kolkata.</div></div>
      </div>
      <div hidden={step !== 2}>
        <div className="field"><label htmlFor="goal-hours">Hours per available day</label><input id="goal-hours" name="hours" type="number" min=".25" max="24" step=".25" defaultValue={p?.availableHoursPerDay || 1} /></div>
        <div className="field"><label>Days you’re unavailable</label><div className="day-picker">{DAYS.map(day => <label key={day}><input type="checkbox" name="unavailableDays" value={day} defaultChecked={p?.unavailableDays.includes(day)} hidden /><span className={`day-chip ${p?.unavailableDays.includes(day) ? 'selected' : ''}`} onClick={e => { e.preventDefault(); const input = e.currentTarget.previousElementSibling as HTMLInputElement; input.checked = !input.checked; e.currentTarget.classList.toggle('selected', input.checked); }}>{day.slice(0, 3)}</span></label>)}</div></div>
        <div className="field"><label htmlFor="goal-remaining">What remains to be done?</label><textarea id="goal-remaining" name="remainingTasks" maxLength={3000} defaultValue={p?.remainingTasks || ''} placeholder="Separate ideas with a semicolon, or leave it blank." /></div>
        <label className="check-row"><input type="checkbox" name="started" defaultChecked={p?.started} /> I’ve already begun</label>
      </div>
      <div className="tool-row" style={{ justifyContent: 'space-between', marginTop: 24 }}><button type="button" className="btn secondary" onClick={step === 1 ? onClose : () => setStep(1)}>{step === 1 ? 'Not now' : 'Back'}</button><div className="tool-row">{step === 1 ? <button type="button" className="btn" onClick={() => { if (formRef.current?.reportValidity()) setStep(2); }}>Continue <ArrowRight /></button> : <><button type="submit" className="btn secondary" disabled={loading}>{mode === 'edit' ? 'Save details' : 'Build it by hand'}</button>{mode !== 'edit' && <button type="button" className="btn terracotta" disabled={loading} onClick={() => { if (formRef.current?.reportValidity()) onSubmit(formRef.current, true); }}>{loading ? <><span className="loader" /> Thinking…</> : <><Sparkles /> Plan with Gemini</>}</button>}</>}</div></div>
    </form>
  </section></div>;
}

function EmptyProject({ onNew }: { onNew: () => void }) {
  return <div style={{ maxWidth: 680, margin: '7vh auto' }}><div className="eyebrow">Your next chapter starts here</div><h1 className="page-title">Make a deadline feel possible.</h1><div className="empty-state" style={{ marginTop: 28 }}><div className="empty-symbol"><Sparkles /></div><h3>One goal. A plan that fits your life.</h3><p>Tell T-Minus what you’re working toward. We’ll help you turn the distant thing into a few clear next steps.</p><button className="btn" onClick={onNew}><Plus /> Start a goal</button></div></div>;
}

function slug(text: string) { return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'project'; }
function downloadBlob(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1200); }
function icsDate(d: Date) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function icsEscape(s: string) { return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lineHeight: number) { const words = text.split(' '); let line = ''; for (const word of words) { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > max && line) { ctx.fillText(line, x, y); line = word; y += lineHeight; } else line = test; } if (line) ctx.fillText(line, x, y); }
function wallpaperDimensions(d: Design): [number, number] {
  if (d.format === 'laptop' || d.format === 'desktop') return [1920, 1080];
  if (d.format === 'cover') return [1200, 800];
  if (d.format === 'custom') return [Math.min(5000, Math.max(320, Math.round(d.customWidth || 1440))), Math.min(5000, Math.max(320, Math.round(d.customHeight || 2560)))];
  return [1440, 2560];
}
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r); ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r); ctx.closePath();
}
function paintWallpaperBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, d: Design) {
  const { width, height } = canvas;
  if (d.backgroundStyle === 'gradient') {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, d.background); gradient.addColorStop(1, d.accentColor);
    ctx.fillStyle = gradient;
  } else ctx.fillStyle = d.background;
  ctx.fillRect(0, 0, width, height);
  ctx.save(); ctx.strokeStyle = `${d.textColor}36`; ctx.fillStyle = `${d.accentColor}24`;
  ctx.lineWidth = Math.max(2, Math.min(width, height) * .0012);
  const unit = Math.min(width, height);
  if (d.template === 'solstice') {
    ctx.beginPath(); ctx.arc(width * .78, height * .22, unit * .12, 0, Math.PI * 2); ctx.fill();
    for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.arc(width * .78, height * .22, unit * (.12 + i * .055), 0, Math.PI * 2); ctx.stroke(); }
  } else if (d.template === 'mono') {
    ctx.strokeStyle = `${d.accentColor}aa`; ctx.lineWidth = Math.max(3, unit * .003);
    ctx.beginPath(); ctx.moveTo(width * .12, height * .17); ctx.lineTo(width * .12, height * .83); ctx.stroke();
  } else if (d.template === 'night') {
    ctx.fillStyle = `${d.textColor}50`;
    for (let i = 0; i < 60; i++) { const x = (i * 97 % 997) / 997 * width; const y = (i * 173 % 991) / 991 * height; ctx.beginPath(); ctx.arc(x, y, Math.max(2, unit * .0012), 0, Math.PI * 2); ctx.fill(); }
  } else if (d.template === 'orbit') {
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(width * .5, height * .22, unit * (.12 + i * .055), unit * (.07 + i * .025), -.2, 0, Math.PI * 2); ctx.stroke(); }
  } else if (d.template === 'paper') {
    ctx.strokeStyle = `${d.textColor}32`; ctx.lineWidth = Math.max(1, unit * .0008);
    for (let i = 0; i < 9; i++) { const y = height * (.2 + i * .07); ctx.beginPath(); ctx.moveTo(width * .1, y); ctx.lineTo(width * .9, y); ctx.stroke(); }
  } else if (d.template === 'signal') {
    ctx.fillStyle = `${d.accentColor}40`; ctx.fillRect(0, height * .17, width, height * .03); ctx.fillRect(0, height * .79, width, height * .02);
  } else if (d.template === 'field') {
    ctx.beginPath(); ctx.ellipse(width * .5, height * .44, width * .34, height * .47, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `${d.textColor}42`; ctx.beginPath(); ctx.ellipse(width * .5, height * .44, width * .29, height * .42, 0, Math.PI, Math.PI * 2); ctx.stroke();
  } else {
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(width * .5, height * .74, width * (.4 - i * .04), height * (.15 - i * .02), 0, Math.PI, Math.PI * 2); ctx.stroke(); }
  }
  ctx.restore();
}
function paintWallpaperText(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, d: Design, p: Project) {
  const { width, height } = canvas;
  const landscape = width > height;
  const unit = Math.min(width, height);
  const align = d.layout === 'left' ? 'left' : d.layout === 'right' ? 'right' : 'center';
  const x = d.layout === 'left' ? width * .12 : d.layout === 'right' ? width * .88 : width * .5;
  const maxWidth = width * .76;
  const clock = countdownParts(p.deadline);
  const font = d.font === 'DM Mono' ? 'DM Mono' : d.font === 'DM Sans' ? 'DM Sans' : 'Fraunces';
  ctx.fillStyle = d.textColor; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.font = `500 ${Math.round(unit * .021 * d.fontScale)}px "DM Mono"`;
  ctx.fillText('T-MINUS COUNTDOWN', x, height * .105, maxWidth);
  ctx.font = `600 ${Math.round(unit * .058 * d.fontScale)}px "${font}"`;
  wrapCanvasText(ctx, p.title, x, height * .17, maxWidth, unit * .068);
  if (d.showCountdown) {
    const values = [clock.days, clock.hours, clock.minutes, clock.seconds];
    const labels = ['DAYS', 'HOURS', 'MINUTES', 'SECONDS'];
    const colWidth = width * .17;
    ctx.textAlign = 'center';
    values.forEach((value, index) => {
      const cellX = width * .5 + (index - 1.5) * colWidth;
      ctx.font = `500 ${Math.round(unit * (landscape ? .075 : .065) * d.fontScale)}px "DM Mono"`;
      ctx.fillText(String(value).padStart(2, '0'), cellX, height * .32);
      ctx.font = `500 ${Math.round(unit * .013)}px "DM Mono"`;
      ctx.globalAlpha = .78; ctx.fillText(labels[index], cellX, height * .36); ctx.globalAlpha = 1;
    });
  }
  const titleY = d.showCountdown ? .43 : .32;
  ctx.textAlign = align; ctx.font = `500 ${Math.round(unit * .043 * d.fontScale)}px "${font}"`;
  wrapCanvasText(ctx, d.title || 'Make it real.', x, height * titleY, maxWidth, unit * .055);
  if (d.showDate) {
    ctx.font = `500 ${Math.round(unit * .017)}px "DM Mono"`; ctx.globalAlpha = .78;
    ctx.fillText(`${dateLabel(p.deadline, p.timeZone).toUpperCase()} · ${new Date(p.deadline).getFullYear()}`, x, height * (titleY + .065), maxWidth);
    ctx.globalAlpha = 1;
  }
  const taskList = p.milestones.flatMap(m => m.tasks);
  const progress = taskList.length ? taskList.filter(task => task.completed).length / taskList.length : 0;
  const progressY = height * (titleY + (d.showDate ? .11 : .07));
  if (d.showProgress) {
    ctx.fillStyle = `${d.textColor}50`; roundRect(ctx, width * .12, progressY, width * .76, unit * .006, unit * .003); ctx.fill();
    ctx.fillStyle = d.accentColor; roundRect(ctx, width * .12, progressY, width * .76 * progress, unit * .006, unit * .003); ctx.fill();
    ctx.font = `500 ${Math.round(unit * .014)}px "DM Mono"`; ctx.textAlign = 'right'; ctx.globalAlpha = .8;
    ctx.fillText(`${Math.round(progress * 100)}% COMPLETE`, width * .88, progressY + unit * .025); ctx.globalAlpha = 1;
  }
  if (d.showMilestones) {
    const list = p.milestones.filter(m => d.showCompletedMilestones || !m.completed).slice(0, d.milestoneCount);
    const top = height * (landscape ? .68 : .59);
    ctx.textAlign = 'left'; ctx.font = `500 ${Math.round(unit * .018)}px "DM Mono"`;
    ctx.fillText('YOUR ROADMAP', width * .12, top, width * .76);
    list.forEach((milestone, index) => {
      const y = top + unit * (.05 + index * .049);
      ctx.globalAlpha = milestone.completed ? .52 : .94;
      ctx.fillStyle = d.accentColor;
      ctx.font = `500 ${Math.round(unit * .018)}px "DM Mono"`;
      ctx.fillText(d.showCheckboxes ? (milestone.completed ? '✓' : '○') : '—', width * .12, y);
      ctx.fillStyle = d.textColor; ctx.font = `500 ${Math.round(unit * .018)}px "DM Sans"`;
      ctx.fillText(`${milestone.tMinus} · ${milestone.title}`, width * .12 + unit * .04, y, width * .69);
    });
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'center'; ctx.font = `500 ${Math.round(unit * .012)}px "DM Mono"`; ctx.globalAlpha = .7;
  ctx.fillText('T-MINUS STUDIO  ·  ONE DAY AT A TIME', width * .5, height * .95);
  ctx.globalAlpha = 1;
}

function Router() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={() => <AppContent />} />
    <Route path="/plan" component={() => <AppContent />} />
    <Route path="/designer" component={() => <AppContent />} />
    <Route path="/reminders" component={() => <AppContent />} />
    <Route path="/projects" component={() => <Redirect to="/" replace />} />
    <Route path="/submission" component={() => <Redirect to="/" replace />} />
    <Route component={NotFound} />
  </Switch></RoutedErrorBoundary>;
}
function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;
