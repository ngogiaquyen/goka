export function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}
