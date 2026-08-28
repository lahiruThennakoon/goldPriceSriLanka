export function applyTheme(theme: "system" | "light" | "dark") {
  if (typeof document === "undefined") return;
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

// Inlined into <head> as a blocking script string to avoid a flash of the wrong theme.
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var raw = window.localStorage.getItem("goldpwa.v1");
    var theme = raw ? (JSON.parse(raw).settings || {}).theme : "system";
    if (theme && theme !== "system") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  } catch (e) {}
})();
`;
