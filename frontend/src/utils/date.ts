export function parseLocalDateString(dateStr: string): Date {
  const dateOnlyMatch = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
  const match = dateStr.match(dateOnlyMatch);

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    return new Date(year, month, day);
  }

  return new Date(dateStr);
}
