export const THEME_STORAGE_KEY = "brcris-theme";

export const THEME_INIT_SCRIPT = `(function () {
  try {
    var storedTheme = window.localStorage.getItem("${THEME_STORAGE_KEY}");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolvedTheme = storedTheme === "dark"
      ? "dark"
      : storedTheme === "light"
        ? "light"
        : (prefersDark ? "dark" : "light");
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  } catch (error) {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  }
})();`;
