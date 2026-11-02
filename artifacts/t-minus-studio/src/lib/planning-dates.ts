import type { PlanMilestone } from '@workspace/api-client-react';

export function dateLabel(date: string, timeZone?: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const parsed = dateOnly ? new Date(`${date}T12:00:00Z`) : new Date(date);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', ...((dateOnly ? 'UTC' : timeZone) ? { timeZone: dateOnly ? 'UTC' : timeZone } : {}) }).format(parsed);
}

export function dateAndTimeInZone(iso: string, timeZone: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso)).map(({ type, value }) => [type, value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function isoDayInZone(value: string, timeZone: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return dateAndTimeInZone(value, timeZone).date;
}

export function isoFromZonedDateTime(date: string, time: string, timeZone: string) {
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

export function groupMilestonesByDay(milestones: PlanMilestone[], timeZone: string) {
  return milestones.reduce<Record<string, PlanMilestone[]>>((acc, milestone) => {
    const day = isoDayInZone(milestone.date, timeZone);
    acc[day] = [...(acc[day] || []), milestone];
    return acc;
  }, {});
}

export function changeMilestoneDay(milestones: PlanMilestone[], id: string, date: string) {
  // A date input represents a calendar day, not noon in the device's time zone.
  return milestones.map(m => m.id === id ? { ...m, date } : m)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

function icsDate(d: Date) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function icsEscape(s: string) { return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }

export function buildMilestoneCalendar(project: { title: string; timeZone: string; milestones: PlanMilestone[] }, now = new Date()) {
  const events = project.milestones.map(m => {
    const day = isoDayInZone(m.date, project.timeZone);
    const nextDay = new Date(`${day}T00:00:00Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const endDay = nextDay.toISOString().slice(0, 10).replace(/-/g, '');
    return `BEGIN:VEVENT\nUID:${m.id}@tminus.studio\nDTSTAMP:${icsDate(now)}\nDTSTART;VALUE=DATE:${day.replace(/-/g, '')}\nDTEND;VALUE=DATE:${endDay}\nSUMMARY:${icsEscape(m.title)} — ${icsEscape(project.title)}\nDESCRIPTION:${icsEscape(m.description || 'A T-Minus checkpoint')}\nEND:VEVENT`;
  }).join('\n');
  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//T-Minus Studio//EN\nCALSCALE:GREGORIAN\n${events}\nEND:VCALENDAR`;
}
