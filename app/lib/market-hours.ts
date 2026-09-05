const MARKET_TZ = "Asia/Colombo";

const FRIDAY_CLOSE_HOUR = 18; // Friday 6:00 PM — "Friday night"
const MONDAY_OPEN_HOUR = 10; // Monday 10:00 AM

type ColomboClock = {
  weekday: string;
  hour: number;
  minute: number;
};

function getColomboClock(now = new Date()): ColomboClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MARKET_TZ,
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  return {
    weekday: parts.find((p) => p.type === "weekday")?.value ?? "",
    hour: Number(parts.find((p) => p.type === "hour")?.value ?? 0),
    minute: Number(parts.find((p) => p.type === "minute")?.value ?? 0),
  };
}

function minutesSinceMidnight(hour: number, minute: number): number {
  return hour * 60 + minute;
}

/** Global gold/FX markets treated as closed Fri 6 PM – Mon 10 AM Sri Lanka time. */
export function isWeekendMarketClosed(now = new Date()): boolean {
  const { weekday, hour, minute } = getColomboClock(now);
  const time = minutesSinceMidnight(hour, minute);

  if (weekday === "Friday" && time >= FRIDAY_CLOSE_HOUR * 60) return true;
  if (weekday === "Saturday" || weekday === "Sunday") return true;
  if (weekday === "Monday" && time < MONDAY_OPEN_HOUR * 60) return true;

  return false;
}

export function weekendMarketClosedCopy(): { title: string; detail: string } {
  return {
    title: "Markets closed for the weekend",
    detail:
      "Global gold and FX markets are closed from Friday night until Monday 10:00 AM (Sri Lanka time). Prices shown are from the last session and may not update until markets reopen.",
  };
}
