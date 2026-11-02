import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  GeneratePlanBody,
  GeneratePlanResponse,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

function localDateInZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function parseJsonResponse(text: string): unknown {
  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(unfenced);
}

router.post("/plan", async (req, res): Promise<void> => {
  const parsed = GeneratePlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Check the goal and schedule details, then try again." });
    return;
  }

  const input = parsed.data;
  if (input.deadline.getTime() <= Date.now()) {
    res.status(400).json({ error: "The deadline must be in the future." });
    return;
  }

  try {
    new Intl.DateTimeFormat("en", { timeZone: input.timezone }).format();
  } catch {
    res.status(400).json({ error: "Choose a valid time zone." });
    return;
  }

  const today = localDateInZone(new Date(), input.timezone);
  const deadlineDate = localDateInZone(input.deadline, input.timezone);
  const prompt = [
    "Create a realistic, concise milestone plan for this user-provided goal.",
    "Return only valid JSON with this shape:",
    '{"summary":"one concise sentence","milestones":[{"title":"under five words","tMinus":"T-14 / T-7 / T-3 / T-1 / T-0, or a useful shorter interval","date":"YYYY-MM-DD in the supplied timezone","description":"specific, actionable","tasks":[{"title":"specific task"}],"priority":"low|medium|high"}]}',
    "Work backward from the deadline. Include an appropriately adapted schedule for deadlines under 14 days, never schedule before today, sort milestones by date, and include a final milestone on the deadline day. Create distinct, practical steps grounded in the goal description and the remaining tasks the user supplied.",
    "Do not claim the user has already completed work. Do not invent personal constraints or facts. Keep tasks feasible for the stated available hours and unavailable days. If no remaining tasks were supplied, derive only reasonable work directly implied by the goal description.",
    "",
    `Goal: ${input.title}`,
    `Description: ${input.description || "(not provided)"}`,
    `Deadline: ${input.deadline.toISOString()} (${input.timezone}; local date ${deadlineDate})`,
    `Today's local date: ${today}`,
    `Available hours per working day: ${input.availableHoursPerDay}`,
    `Unavailable weekdays: ${input.unavailableDays.join(", ") || "none"}`,
    `Already started: ${input.started ? "yes" : "no"}`,
    `Remaining tasks: ${input.remainingTasks || "(not provided)"}`,
  ].join("\n");

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.25,
        maxOutputTokens: 8192,
      },
    });

    if (!result.text?.trim()) {
      throw new Error("Gemini returned an empty plan.");
    }

    const raw = parseJsonResponse(result.text) as {
      summary?: unknown;
      milestones?: Array<{
        title?: unknown;
        tMinus?: unknown;
        date?: unknown;
        description?: unknown;
        tasks?: Array<{ title?: unknown }>;
        priority?: unknown;
      }>;
    };
    if (
      typeof raw.summary !== "string" ||
      !Array.isArray(raw.milestones) ||
      raw.milestones.length === 0 ||
      raw.milestones.length > 8
    ) {
      throw new Error("Gemini returned an invalid plan structure.");
    }

    const candidate = {
      summary: raw.summary,
      milestones: raw.milestones.map((milestone) => ({
        id: randomUUID(),
        title: milestone.title,
        tMinus: milestone.tMinus,
        date: milestone.date,
        description: milestone.description,
        tasks: Array.isArray(milestone.tasks)
          ? milestone.tasks.slice(0, 8).map((task) => ({
              id: randomUUID(),
              title: task.title,
              completed: false,
            }))
          : [],
        priority: milestone.priority,
        completed: false,
      })),
    };

    const plan = GeneratePlanResponse.parse(candidate);
    const invalidDates = plan.milestones.some((milestone) => {
      const date = milestone.date.toISOString().slice(0, 10);
      return date < today || date > deadlineDate;
    });
    if (invalidDates) {
      throw new Error("Gemini returned milestone dates outside the deadline window.");
    }

    plan.milestones.sort((a, b) => a.date.getTime() - b.date.getTime());
    res.json({
      ...plan,
      milestones: plan.milestones.map((milestone) => ({
        ...milestone,
        date: milestone.date.toISOString().slice(0, 10),
      })),
    });
  } catch (error) {
    req.log.error({ err: error }, "Gemini milestone generation failed");
    res.status(503).json({
      error: "Gemini could not build a valid plan right now. Try again or create milestones manually.",
    });
  }
});

export default router;
