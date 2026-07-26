export const colors = {
  base: "#050B18",
  panel: "#0A1526",
  panel2: "#0D1B30",
  line: "#1B2C46",
  accent: "#FF8A3D",
  accent2: "#FF5A36",
  blue: "#3FA9FF",
  blue2: "#1E6FD9",
  muted: "#7C8AA6",
  white: "#E6ECF7",
  emerald: "#34D399",
  red: "#F87171",
};

export const severityColor: Record<string, string> = {
  critical: colors.accent2,
  warning: colors.accent,
  info: colors.blue,
};

export const riskBandColor: Record<string, string> = {
  Critical: colors.accent2,
  High: colors.accent,
  Moderate: colors.blue,
  Low: "#2E5C99",
};
