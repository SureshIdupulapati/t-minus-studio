import type { Design, Project } from '../App';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validMilestoneDate(value: unknown): value is string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return false;
  // Date.parse normalizes impossible dates (e.g. February 30) instead of rejecting them.
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day) return false;
  return value === day || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

export function parseProjectBackup(text: string, defaultDesign: Design): Project {
  const parsed: unknown = JSON.parse(text);
  if (!record(parsed) || typeof parsed.title !== 'string' || !parsed.title.trim() || parsed.title.length > 120 || typeof parsed.deadline !== 'string' || Number.isNaN(Date.parse(parsed.deadline)) || !Array.isArray(parsed.milestones)) throw new Error('Invalid project file');
  const timeZone = typeof parsed.timeZone === 'string' ? parsed.timeZone : Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  new Intl.DateTimeFormat('en-US', { timeZone });
  const milestones = parsed.milestones.map((milestone: unknown) => {
    if (!record(milestone) || typeof milestone.title !== 'string' || !milestone.title.trim() || !validMilestoneDate(milestone.date) || !Array.isArray(milestone.tasks)) throw new Error('Invalid milestone');
    const tasks = milestone.tasks.map((task: unknown) => {
      if (!record(task) || typeof task.title !== 'string' || !task.title.trim()) throw new Error('Invalid task');
      return { id: crypto.randomUUID(), title: task.title.slice(0, 300), completed: Boolean(task.completed) };
    });
    const priority: Project['milestones'][number]['priority'] = milestone.priority === 'high' || milestone.priority === 'low' ? milestone.priority : 'medium';
    return { id: crypto.randomUUID(), title: milestone.title.slice(0, 160), tMinus: String(milestone.tMinus || ''), date: milestone.date, description: String(milestone.description || '').slice(0, 1000), tasks, priority, completed: Boolean(milestone.completed) };
  });
  return {
    id: crypto.randomUUID(), title: parsed.title.trim(), description: String(parsed.description || '').slice(0, 2000),
    deadline: parsed.deadline, timeZone, availableHoursPerDay: Math.min(24, Math.max(.25, Number(parsed.availableHoursPerDay) || 1)),
    unavailableDays: Array.isArray(parsed.unavailableDays) ? parsed.unavailableDays.filter((day): day is string => typeof day === 'string' && DAYS.includes(day)) : [],
    started: Boolean(parsed.started), remainingTasks: String(parsed.remainingTasks || '').slice(0, 3000),
    milestones, design: { ...defaultDesign, ...(record(parsed.design) ? parsed.design : {}) },
    reminderSettings: { daily: true, weekly: false, milestone: true, time: '08:30', enabled: false, ...(record(parsed.reminderSettings) ? parsed.reminderSettings : {}) },
    submissionDescription: String(parsed.submissionDescription || '').slice(0, 500),
    submissionTitle: String(parsed.submissionTitle || 'Your Deadline, Your Design — AI Countdown Lock Screen').slice(0, 120),
    submissionChecks: Array.from({ length: 5 }, (_, i) => Boolean(Array.isArray(parsed.submissionChecks) && parsed.submissionChecks[i])),
    planSummary: typeof parsed.planSummary === 'string' ? parsed.planSummary.slice(0, 2000) : undefined,
    planSource: parsed.planSource === 'gemini' ? 'gemini' : parsed.planSource === 'manual' ? 'manual' : undefined,
    archived: false, createdAt: new Date().toISOString(),
  };
}
