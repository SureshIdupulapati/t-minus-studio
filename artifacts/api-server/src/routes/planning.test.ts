import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));
vi.mock('@workspace/integrations-gemini-ai', () => ({
  ai: { models: { generateContent } },
}));
import router from './planning';

let server: Server;
let url: string;
const deadline = '2026-03-10T01:00:00Z';
function input(timezone: string) {
  return { title: 'Ship a project', description: 'Finish and review', deadline, timezone, availableHoursPerDay: 2, unavailableDays: [], started: false, remainingTasks: 'Review' };
}
function aiPlan(date: string) {
  return { summary: 'A practical plan', milestones: [{
    title: 'Final review', date, tMinus: 'T-0', description: 'Check the work', priority: 'high',
    tasks: [{ title: 'Review' }],
  }] };
}
async function post(body: unknown) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await response.json() as {
    error?: string;
    milestones: { id: string; date: string; completed: boolean; tasks: { id: string; title: string; completed: boolean }[] }[];
  };
  return { status: response.status, body: json };
}

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.log = { error: vi.fn() } as unknown as typeof req.log; next(); });
  app.use('/api', router);
  server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/plan`;
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-03-01T01:00:00Z'));
  generateContent.mockReset();
});
afterEach(() => vi.useRealTimers());

describe('planning API time zones and local milestone dates', () => {
  it.each([
    ['America/Los_Angeles', '2026-02-28', '2026-03-09'],
    ['Pacific/Kiritimati', '2026-03-01', '2026-03-10'],
    ['Asia/Kolkata', '2026-03-01', '2026-03-10'],
    ['UTC', '2026-03-01', '2026-03-10'],
  ])('accepts %s and uses its local planning window', async (zone, today, lastDay) => {
    generateContent.mockResolvedValue({ text: JSON.stringify(aiPlan(lastDay)) });
    const result = await post(input(zone));
    expect(result.status).toBe(200);
    expect(result.body.milestones[0].date).toBe(lastDay);
    const prompt = generateContent.mock.calls[0][0].contents[0].parts[0].text;
    expect(prompt).toContain(`Today's local date: ${today}`);
    expect(prompt).toContain(`local date ${lastDay}`);
    expect(result.body.milestones[0]).toMatchObject({ completed: false, tasks: [{ title: 'Review', completed: false }] });
  });

  it('rejects invalid IANA zones before calling AI', async () => {
    expect(await post(input('Mars/Olympus'))).toMatchObject({ status: 400, body: { error: 'Choose a valid time zone.' } });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it.each(['2026-02-28', '2026-03-10'])('rejects generated dates outside the local window: %s', async date => {
    // In Los Angeles, today is Feb 28 and the deadline is Mar 9.
    const zone = date === '2026-02-28' ? 'UTC' : 'America/Los_Angeles';
    generateContent.mockResolvedValue({ text: JSON.stringify(aiPlan(date)) });
    expect((await post(input(zone))).status).toBe(503);
  });

  it('sorts milestones and generates unique milestone and task IDs', async () => {
    const plan = aiPlan('2026-03-09');
    plan.milestones.push(aiPlan('2026-03-02').milestones[0]);
    generateContent.mockResolvedValue({ text: `\`\`\`json\n${JSON.stringify(plan)}\n\`\`\`` });
    const { status, body } = await post(input('UTC'));
    expect(status).toBe(200);
    expect(body.milestones.map((m: { date: string }) => m.date)).toEqual(['2026-03-02', '2026-03-09']);
    const ids = body.milestones.flatMap((m: { id: string; tasks: { id: string }[] }) => [m.id, ...m.tasks.map(t => t.id)]);
    expect(new Set(ids).size).toBe(4);
  });

  it('rejects expired deadlines without calling AI', async () => {
    expect((await post({ ...input('UTC'), deadline: '2026-02-01T00:00:00Z' })).status).toBe(400);
    expect(generateContent).not.toHaveBeenCalled();
  });
});
