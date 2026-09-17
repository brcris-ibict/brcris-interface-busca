import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { THEME_STORAGE_KEY } from "../lib/theme";

export { THEME_STORAGE_KEY } from "../lib/theme";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  cycleThemePreference: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(themePreference: ThemePreference | null): ResolvedTheme {
  if (!themePreference || themePreference === "system") {
    return getSystemTheme();
  }

  return themePreference;
}

function applyTheme(resolvedTheme: ResolvedTheme) {
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextThemePreference = isThemePreference(storedTheme)
      ? storedTheme
      : null;

    const nextResolvedTheme = resolveTheme(nextThemePreference);
    setThemePreferenceState(nextThemePreference ?? "system");
    setResolvedTheme(nextResolvedTheme);
    applyTheme(nextResolvedTheme);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = () => {
      const nextResolvedTheme = resolveTheme(themePreference);
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextResolvedTheme);
    };

    updateTheme();

    const handleChange = () => {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (!isThemePreference(storedTheme) || storedTheme === "system") {
        const nextResolvedTheme = getSystemTheme();
        if (storedTheme === "system") {
          setThemePreferenceState("system");
        }
        setResolvedTheme(nextResolvedTheme);
        applyTheme(nextResolvedTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [themePreference]);

  const setThemePreference = useCallback((theme: ThemePreference) => {
    setThemePreferenceState(theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreference(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setThemePreference]);

  const cycleThemePreference = useCallback(() => {
    setThemePreference(
      themePreference === "light"
        ? "dark"
        : themePreference === "dark"
          ? "system"
          : "light",
    );
  }, [themePreference, setThemePreference]);

  const value = useMemo(
    () => ({
      themePreference,
      resolvedTheme,
      setThemePreference,
      toggleTheme,
      cycleThemePreference,
    }),
    [
      themePreference,
      resolvedTheme,
      setThemePreference,
      toggleTheme,
      cycleThemePreference,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
