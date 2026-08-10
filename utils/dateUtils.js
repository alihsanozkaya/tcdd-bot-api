export const parseTravelDate = (dateStr) => {
  const match = String(dateStr ?? "")
    .trim()
    .match(/^(\d{2}) (\d{2}) (\d{4})$/);

  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const isPastDate = (dateStr) => {
  const date = parseTravelDate(dateStr);
  if (!date) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date < today;
};
