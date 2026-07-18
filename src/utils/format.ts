export const formatPercent = (value: number): string => `${Math.round(value)}%`;

export const formatNumber = (value: number, digits = 1): string =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export const formatRuntime = (minutes: number): string => {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export const formatTime = (timestamp: number): string =>
  new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
