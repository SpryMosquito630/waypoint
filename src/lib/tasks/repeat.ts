import type { Task } from "@/types/task";

const DAY_MS = 1000 * 60 * 60 * 24;

export function getRepeatIntervalDays(task: Task): number | null {
  if (!task.is_permanent) return null;
  return task.repeat_interval_days ?? 7;
}

export function getNextRepeatAt(task: Task): Date | null {
  if (!task.is_permanent) return null;
  if (!task.completed_at) return null;
  const interval = getRepeatIntervalDays(task) ?? 7;
  const completed = new Date(task.completed_at);
  const anchor = task.repeat_anchor ?? null;

  if (interval === 1) {
    const next = new Date(completed);
    next.setDate(next.getDate() + 1);
    if (anchor?.startsWith("time:")) {
      const time = anchor.replace("time:", "");
      const [h, m] = time.split(":").map((v) => Number(v));
      if (!Number.isNaN(h) && !Number.isNaN(m)) {
        next.setHours(h, m, 0, 0);
      }
    }
    return next;
  }

  if (interval === 7) {
    const base = new Date(completed);
    base.setDate(base.getDate() + 7);
    if (anchor && anchor.includes("@")) {
      const [dayPart, timePart] = anchor.split("@");
      const weekdayMap: Record<string, number> = {
        sun: 0,
        mon: 1,
        tue: 2,
        wed: 3,
        thu: 4,
        fri: 5,
        sat: 6,
      };
      const desired = weekdayMap[dayPart];
      if (desired !== undefined) {
        const [h, m] = timePart.split(":").map((v) => Number(v));
        if (!Number.isNaN(h) && !Number.isNaN(m)) {
          base.setHours(h, m, 0, 0);
        }
        const diff = (desired - base.getDay() + 7) % 7;
        base.setDate(base.getDate() + diff);
        return base;
      }
    }
    return base;
  }

  if (interval === 30) {
    const base = new Date(completed);
    base.setMonth(base.getMonth() + 1);
    if (anchor && anchor.includes("@")) {
      const [dayPart, timePart] = anchor.split("@");
      const dayNum = Number(dayPart);
      if (!Number.isNaN(dayNum) && dayNum > 0) {
        const lastDay = new Date(
          base.getFullYear(),
          base.getMonth() + 1,
          0
        ).getDate();
        base.setDate(Math.min(dayNum, lastDay));
      }
      const [h, m] = timePart.split(":").map((v) => Number(v));
      if (!Number.isNaN(h) && !Number.isNaN(m)) {
        base.setHours(h, m, 0, 0);
      }
    }
    return base;
  }

  return new Date(completed.getTime() + interval * DAY_MS);
}

const parseTime = (time: string) => {
  const [h, m] = time.split(":").map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { h, m };
};

export function getNextScheduledAt(task: Task, now = new Date()): Date | null {
  if (!task.is_permanent) return task.deadline ? new Date(task.deadline) : null;
  const interval = getRepeatIntervalDays(task) ?? 7;
  const anchor = task.repeat_anchor ?? "";

  if (interval === 1) {
    const time = anchor.startsWith("time:") ? anchor.replace("time:", "") : null;
    if (!time) return null;
    const parsed = parseTime(time);
    if (!parsed) return null;
    const candidate = new Date(now);
    candidate.setHours(parsed.h, parsed.m, 0, 0);
    if (candidate < now) candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }

  if (interval === 7 && anchor.includes("@")) {
    const [dayPart, timePart] = anchor.split("@");
    const weekdayMap: Record<string, number> = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };
    const desired = weekdayMap[dayPart];
    const parsed = parseTime(timePart);
    if (desired === undefined || !parsed) return null;
    const candidate = new Date(now);
    candidate.setHours(parsed.h, parsed.m, 0, 0);
    let diff = (desired - candidate.getDay() + 7) % 7;
    if (diff === 0 && candidate < now) diff = 7;
    candidate.setDate(candidate.getDate() + diff);
    return candidate;
  }

  if (interval === 30 && anchor.includes("@")) {
    const [dayPart, timePart] = anchor.split("@");
    const dayNum = Number(dayPart);
    const parsed = parseTime(timePart);
    if (Number.isNaN(dayNum) || !parsed) return null;
    const candidate = new Date(now);
    const lastDay = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate();
    candidate.setDate(Math.min(dayNum, lastDay));
    candidate.setHours(parsed.h, parsed.m, 0, 0);
    if (candidate < now) {
      const next = new Date(now);
      next.setMonth(next.getMonth() + 1);
      const nextLast = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(dayNum, nextLast));
      next.setHours(parsed.h, parsed.m, 0, 0);
      return next;
    }
    return candidate;
  }

  return null;
}

export function getDueAt(task: Task, now = new Date()): Date | null {
  if (task.is_permanent) return getNextScheduledAt(task, now);
  return task.deadline ? new Date(task.deadline) : null;
}

export function getReminderWindowMs(task: Task): number {
  if (task.difficulty === 1) return 1000 * 60 * 60;
  if (task.difficulty === 2) return 1000 * 60 * 60 * 12;
  return 1000 * 60 * 60 * 24 * 2;
}

export function isRepeatDue(task: Task, now = new Date()): boolean {
  if (!task.is_permanent) return true;
  if (task.status !== "completed") return true;
  const next = getNextRepeatAt(task);
  if (!next) return true;
  return now >= next;
}

export function getRepeatAnchorLabel(task: Task): string | null {
  if (!task.is_permanent) return null;
  const anchor = task.repeat_anchor;
  if (!anchor) return null;

  if (anchor.startsWith("time:")) {
    const time = anchor.replace("time:", "");
    return time;
  }

  if (anchor === "mon") return "Monday";
  if (anchor === "tue") return "Tuesday";
  if (anchor === "wed") return "Wednesday";
  if (anchor === "thu") return "Thursday";
  if (anchor === "fri") return "Friday";
  if (anchor === "sat") return "Saturday";
  if (anchor === "sun") return "Sunday";

  if (anchor.includes("@")) {
    const [dayPart, timePart] = anchor.split("@");
    if (dayPart && timePart) {
      if (["mon", "tue", "wed", "thu", "fri", "sat", "sun"].includes(dayPart)) {
        const dayLabel = getRepeatAnchorLabel({
          ...task,
          repeat_anchor: dayPart,
        } as Task);
        return `${dayLabel} ${timePart}`;
      }
      const dayNum = Number(dayPart);
      if (!Number.isNaN(dayNum) && dayNum > 0) {
        return `Day ${dayNum} ${timePart}`;
      }
    }
  }

  const dayNum = Number(anchor);
  if (!Number.isNaN(dayNum) && dayNum > 0) return `Day ${dayNum}`;

  return null;
}

export function getRepeatLabel(task: Task): string | null {
  if (!task.is_permanent) return null;
  const interval = getRepeatIntervalDays(task);
  const anchorLabel = getRepeatAnchorLabel(task);
  let base = "Repeats";

  if (interval === 1) base = "Repeats daily";
  else if (interval === 7) base = "Repeats weekly";
  else if (interval === 30) base = "Repeats monthly";
  else if (interval) base = `Repeats every ${interval} days`;

  return anchorLabel ? `${base} (${anchorLabel})` : base;
}
