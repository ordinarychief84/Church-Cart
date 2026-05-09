export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return `₦${naira.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPhone(phone: string): string {
  // Display E.164 +234XXXXXXXXXX as +234 XXX XXX XXXX
  if (!phone.startsWith("+234") || phone.length !== 14) return phone;
  return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7, 10)} ${phone.slice(10)}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function uniqueSlug(base: string): string {
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${slugify(base)}-${suffix}`;
}
