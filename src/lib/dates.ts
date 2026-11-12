const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function formatLongDate(value: string | Date): string {
  const date = typeof value === "string" ? parseIsoDate(value) : value;
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(value: string | Date): string {
  const date = typeof value === "string" ? parseIsoDate(value) : value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function formatRelativeDay(value: string, today = new Date()): string {
  const target = startOfDay(parseIsoDate(value)).getTime();
  const now = startOfDay(today).getTime();
  const delta = Math.round((target - now) / 86_400_000);
  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta === -1) return "Yesterday";
  if (delta < 0) return `${Math.abs(delta)} days ago`;
  return `In ${delta} days`;
}

export function isOverdue(value: string, today = new Date()): boolean {
  return startOfDay(parseIsoDate(value)).getTime() < startOfDay(today).getTime();
}

export function isDueSoon(value: string, today = new Date(), withinDays = 3): boolean {
  const target = startOfDay(parseIsoDate(value)).getTime();
  const now = startOfDay(today).getTime();
  const delta = Math.round((target - now) / 86_400_000);
  return delta >= 0 && delta <= withinDays;
}

export function nextWeekday(from: Date, weekday: number): Date {
  const date = startOfDay(from);
  const current = date.getDay();
  const delta = (weekday - current + 7) % 7 || 7;
  return addDays(date, delta);
}

export function resolveRelativeDate(
  text: string,
  meetingDate: Date,
): string | undefined {
  const lower = text.toLowerCase();

  if (/\b(today|tonight|eod|end of day|by today)\b/.test(lower)) {
    return isoDate(meetingDate);
  }
  if (/\b(tomorrow|tmrw)\b/.test(lower)) {
    return isoDate(addDays(meetingDate, 1));
  }
  if (/\bnext week\b/.test(lower)) {
    return isoDate(addDays(meetingDate, 7));
  }
  if (/\bend of (the )?month\b/.test(lower)) {
    const end = new Date(meetingDate.getFullYear(), meetingDate.getMonth() + 1, 0);
    return isoDate(end);
  }

  const inDays = lower.match(/\bin\s+(\d+)\s+days?\b/);
  if (inDays) return isoDate(addDays(meetingDate, Number(inDays[1])));

  for (let weekday = 0; weekday < WEEKDAYS.length; weekday += 1) {
    const name = WEEKDAYS[weekday];
    const pattern = new RegExp(`\\b(this |next |by |on )?${name}\\b`);
    if (pattern.test(lower)) {
      const target = nextWeekday(meetingDate, weekday);
      if (lower.includes("this ") && target.getDay() === meetingDate.getDay()) {
        return isoDate(meetingDate);
      }
      return isoDate(target);
    }
  }

  const ordinal = lower.match(
    /\b(?:by |on |before )?(?:the )?(\d{1,2})(?:st|nd|rd|th)?(?:\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?))?\b/,
  );
  if (ordinal) {
    const day = Number(ordinal[1]);
    if (day >= 1 && day <= 31) {
      const monthName = ordinal[2];
      const month = monthName
        ? monthFromName(monthName)
        : meetingDate.getMonth();
      const year = meetingDate.getFullYear();
      let candidate = new Date(year, month, day);
      if (candidate.getTime() < startOfDay(meetingDate).getTime()) {
        candidate = new Date(year, month + 1, day);
      }
      if (candidate.getMonth() !== month % 12 && !monthName) {
        return undefined;
      }
      return isoDate(candidate);
    }
  }

  return undefined;
}

function monthFromName(name: string): number {
  const key = name.slice(0, 3).toLowerCase();
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  return Math.max(0, months.indexOf(key));
}
