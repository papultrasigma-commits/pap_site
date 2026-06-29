import React from "react";
import { useLanguage } from "../i18n/ContextoIdioma";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div>
      <label
        htmlFor="app-language"
        className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
      >
        {t("languageSwitcher.label")}
      </label>

      <select
        id="app-language"
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="w-full bg-[#181a1b] border border-gray-800 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
      >
        <option value="pt">{t("languageSwitcher.portuguese")}</option>
        <option value="en">{t("languageSwitcher.english")}</option>
      </select>
    </div>
  );
}
