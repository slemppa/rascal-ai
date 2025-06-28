import React from "react";
import { i18n } from "@lingui/core";
import { messages as fiMessages } from '../locales/fi/messages.mjs';
import { messages as enMessages } from '../locales/en/messages.mjs';

const languages = [
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export default function LanguageSelector() {
  const handleChange = (e) => {
    const lang = e.target.value;
    let messages = fiMessages;
    if (lang === 'en') messages = enMessages;
    i18n.load(lang, messages);
    i18n.activate(lang);
  };

  return (
    <select onChange={handleChange} value={i18n.locale} style={{margin: 8, padding: 6, borderRadius: 6}}>
      {languages.map(l => (
        <option key={l.code} value={l.code}>
          {l.flag} {l.label}
        </option>
      ))}
    </select>
  );
} 