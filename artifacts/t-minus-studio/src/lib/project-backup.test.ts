import { describe, expect, it } from 'vitest';
import type { Design, Project } from '../App';
import { parseProjectBackup } from './project-backup';

// Only overridden design fields matter to this parser; no UI or browser globals are needed.
const design = { template: 'solstice', background: '#28483d' } as Design;
function backup() {
  return {
    id: 'original-project', title: 'A meaningful goal', deadline: '2026-12-31T22:00:00Z', timeZone: 'America/New_York',
    milestones: [{
      id: 'original-milestone', title: 'Checkpoint', date: '2026-12-30', description: 'Review the work', priority: 'high', tMinus: 'T-1', completed: true,
      tasks: [{ id: 'original-task', title: 'Review', completed: true }, { id: 'original-task', title: 'Submit', completed: false }],
    }],
    design: { background: '#ffffff' }, archived: true,
  };
}
function ids(project: Project) {
  return [project.id, ...project.milestones.flatMap(m => [m.id, ...m.tasks.map(t => t.id)])];
}

describe('project backup validation', () => {
  it.each([
    null, [], {}, { title: '  ' }, { title: 'x', deadline: 'bad', milestones: [] },
    { ...backup(), timeZone: 'Not/AZone' }, { ...backup(), milestones: {} },
  ])('rejects malformed project %j', value => {
    expect(() => parseProjectBackup(JSON.stringify(value), design)).toThrow();
  });

  it('rejects invalid JSON', () => {
    expect(() => parseProjectBackup('{"title":', design)).toThrow();
  });

  it.each([
    null, [], {}, { title: ' ', date: '2026-12-30', tasks: [] },
    { title: 'x', date: 'not-a-date', tasks: [] },
    { title: 'x', date: '2026-02-30', tasks: [] },
    { title: 'x', date: '2026-02-29', tasks: [] },
    { title: 'x', date: '2026-02-30T12:00:00Z', tasks: [] },
    { title: 'x', date: '12/30/2026', tasks: [] },
    { title: 'x', date: '2026-12-30T12:00:00', tasks: [] },
    { title: 'x', date: '2026-13-01', tasks: [] },
    { title: 12, date: '2026-12-30', tasks: [] },
    { title: 'x', date: '2026-12-30', tasks: null },
    { title: 'x', date: '2026-12-30', tasks: [null] },
    { title: 'x', date: '2026-12-30', tasks: [{ title: ' ' }] },
    { title: 'x', date: '2026-12-30', tasks: [{ title: 123 }] },
  ])('rejects malformed milestone or task %j', milestone => {
    expect(() => parseProjectBackup(JSON.stringify({ ...backup(), milestones: [backup().milestones[0], milestone] }), design)).toThrow();
  });

  it.each(['2028-02-29', '2026-12-30', '2026-12-30T23:00:00Z', '2026-12-30T23:00:00.000+05:30'])('preserves valid milestone date %s', date => {
    const value = backup();
    value.milestones[0].date = date;
    expect(parseProjectBackup(JSON.stringify(value), design).milestones[0].date).toBe(date);
  });

  it('replaces every ID, including duplicate source IDs, on every import', () => {
    const source = backup();
    source.milestones.push({ ...source.milestones[0] });
    const text = JSON.stringify(source);
    const first = parseProjectBackup(text, design);
    const second = parseProjectBackup(text, design);
    const allIds = [...ids(first), ...ids(second)];
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(allIds.every(id => !['original-project', 'original-milestone', 'original-task'].includes(id))).toBe(true);
    expect(first.milestones[0]).toMatchObject({
      title: 'Checkpoint', date: '2026-12-30', priority: 'high', completed: true,
      tasks: [{ title: 'Review', completed: true }, { title: 'Submit', completed: false }],
    });
    expect(first.design).toMatchObject({ template: 'solstice', background: '#ffffff' });
    expect(first.archived).toBe(false);
    expect(JSON.stringify(source)).toBe(text);
  });

  it('allows an empty manually created plan', () => {
    expect(parseProjectBackup(JSON.stringify({ ...backup(), milestones: [] }), design).milestones).toEqual([]);
  });
});
