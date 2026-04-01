export type AppTheme = "light" | "dark";

const THEME_KEY = "trip_theme";

export const getSavedTheme = (): AppTheme => {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(THEME_KEY);
  return saved === "dark" ? "dark" : "light";
};

export const applyTheme = (theme: AppTheme) => {
  if (typeof window === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
};

export const initTheme = () => {
  if (typeof window === "undefined") return;
  applyTheme(getSavedTheme());
};