import { describe, expect, it } from 'vitest';
import type { PlanMilestone } from '@workspace/api-client-react';
import { buildMilestoneCalendar, changeMilestoneDay, dateAndTimeInZone, dateLabel, groupMilestonesByDay, isoDayInZone, isoFromZonedDateTime } from './planning-dates';

function milestone(date: string, id = 'checkpoint'): PlanMilestone {
  return { id, title: 'Ship it', date, description: 'Review', tMinus: 'T-0', tasks: [], completed: false, priority: 'high' };
}

describe('deadlines in the selected IANA zone', () => {
  it.each([
    ['UTC', '2026-07-15', '17:00', '2026-07-15T17:00:00.000Z'],
    ['Asia/Kolkata', '2026-07-15', '17:00', '2026-07-15T11:30:00.000Z'],
    ['Asia/Kathmandu', '2026-07-15', '17:00', '2026-07-15T11:15:00.000Z'],
    ['America/New_York', '2026-01-15', '17:00', '2026-01-15T22:00:00.000Z'],
    ['America/New_York', '2026-07-15', '17:00', '2026-07-15T21:00:00.000Z'],
    ['Pacific/Kiritimati', '2026-07-15', '00:00', '2026-07-14T10:00:00.000Z'],
    ['Australia/Sydney', '2026-01-15', '17:00', '2026-01-15T06:00:00.000Z'],
    ['Europe/London', '2026-07-15', '17:00', '2026-07-15T16:00:00.000Z'],
  ])('%s converts local %s %s to the right instant', (zone, date, time, expected) => {
    expect(isoFromZonedDateTime(date, time, zone)).toBe(expected);
    expect(dateAndTimeInZone(expected, zone)).toEqual({ date, time });
  });

  it.each([
    ['America/New_York', '2026-03-08', '02:30'],
    ['Europe/London', '2026-03-29', '01:30'],
    ['Australia/Sydney', '2026-10-04', '02:30'],
    ['Australia/Lord_Howe', '2026-10-04', '02:15'],
  ])('rejects the missing DST time in %s', (zone, date, time) => {
    expect(() => isoFromZonedDateTime(date, time, zone)).toThrow('does not exist');
  });

  it.each(['01:59', '03:00'])('accepts %s adjacent to the New York spring gap', time => {
    const iso = isoFromZonedDateTime('2026-03-08', time, 'America/New_York');
    expect(dateAndTimeInZone(iso, 'America/New_York')).toEqual({ date: '2026-03-08', time });
  });

  it('preserves the requested wall time during the repeated fall hour', () => {
    const iso = isoFromZonedDateTime('2026-11-01', '01:30', 'America/New_York');
    expect(dateAndTimeInZone(iso, 'America/New_York')).toEqual({ date: '2026-11-01', time: '01:30' });
  });

  it('rejects an unknown time zone', () => {
    expect(() => isoFromZonedDateTime('2026-07-15', '17:00', 'Mars/Olympus')).toThrow(RangeError);
  });
});

describe('milestone calendar and all-day ICS export', () => {
  it.each(['America/Los_Angeles', 'Pacific/Kiritimati', 'Asia/Kolkata', 'UTC'])('keeps date-only milestones unchanged in %s', zone => {
    const selectedDay = '2026-03-08';
    const changed = changeMilestoneDay([milestone('2026-03-01')], 'checkpoint', selectedDay);
    expect(changed[0].date).toBe(selectedDay);
    expect(isoDayInZone(changed[0].date, zone)).toBe(selectedDay);
    expect(groupMilestonesByDay(changed, zone)[selectedDay]).toEqual(changed);
    expect(dateLabel(selectedDay, zone)).toBe(dateLabel(selectedDay, 'UTC'));
    const ics = buildMilestoneCalendar({ title: 'Goal', timeZone: zone, milestones: changed });
    expect(ics).toContain('DTSTART;VALUE=DATE:20260308\nDTEND;VALUE=DATE:20260309');
    expect(ics).not.toContain('TZID=');
  });

  it.each([
    ['America/Los_Angeles', '2026-03-09T01:00:00Z', '2026-03-08', '20260309'],
    ['Pacific/Kiritimati', '2026-03-08T12:00:00Z', '2026-03-09', '20260310'],
    ['UTC', '2028-02-29', '2028-02-29', '20280301'],
    ['America/New_York', '2026-12-31', '2026-12-31', '20270101'],
    ['America/New_York', '2026-11-01', '2026-11-01', '20261102'],
  ])('calendar placement and ICS agree in %s for %s', (zone, date, day, endDay) => {
    const milestones = [milestone(date)];
    expect(Object.keys(groupMilestonesByDay(milestones, zone))).toEqual([day]);
    const ics = buildMilestoneCalendar({ title: 'Goal', timeZone: zone, milestones });
    expect(ics).toContain(`DTSTART;VALUE=DATE:${day.replace(/-/g, '')}\nDTEND;VALUE=DATE:${endDay}`);
  });

  it('keeps other milestones intact when changing a day', () => {
    const original = [milestone('2026-03-10', 'one'), milestone('2026-03-09', 'two')];
    const result = changeMilestoneDay(original, 'one', '2026-03-08');
    expect(result.map(m => m.id)).toEqual(['one', 'two']);
    expect(result[1]).toBe(original[1]);
    expect(original[0].date).toBe('2026-03-10');
  });

  it('exports separate escaped events and a deterministic timestamp', () => {
    const milestones = [milestone('2026-03-08', 'one'), { ...milestone('2026-03-09', 'two'), title: 'Review, test; ship', description: 'Line 1\nLine 2\\end' }];
    const ics = buildMilestoneCalendar({ title: 'Goal', timeZone: 'UTC', milestones }, new Date('2026-03-01T12:00:00Z'));
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('UID:one@tminus.studio');
    expect(ics).toContain('UID:two@tminus.studio');
    expect(ics).toContain('DTSTAMP:20260301T120000Z');
    expect(ics).toContain('SUMMARY:Review\\, test\\; ship');
    expect(ics).toContain('DESCRIPTION:Line 1\\nLine 2\\\\end');
  });
});
