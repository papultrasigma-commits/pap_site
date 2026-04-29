import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import translations from "./translations";

const DEFAULT_LANGUAGE = "pt";
const STORAGE_KEY = "app_language";
const SUPPORTED_LANGUAGES = Object.keys(translations);

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => key,
});

const getTranslationValue = (language, key) =>
  key.split(".").reduce((value, part) => {
    if (value && typeof value === "object") {
      return value[part];
    }

    return undefined;
  }, translations[language]);

const getInitialLanguage = () => {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  try {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);

    if (SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      return savedLanguage;
    }
  } catch (error) {
    console.warn("Não foi possível ler o idioma guardado:", error);
  }

  return DEFAULT_LANGUAGE;
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      console.warn("Não foi possível guardar o idioma:", error);
    }
  }, [language]);

  const setLanguage = useCallback((nextLanguage) => {
    if (SUPPORTED_LANGUAGES.includes(nextLanguage)) {
      setLanguageState(nextLanguage);
    }
  }, []);

  const t = useCallback(
    (key) => {
      const currentTranslation = getTranslationValue(language, key);

      if (typeof currentTranslation === "string") {
        return currentTranslation;
      }

      const fallbackTranslation = getTranslationValue(DEFAULT_LANGUAGE, key);

      if (typeof fallbackTranslation === "string") {
        return fallbackTranslation;
      }

      return key;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
