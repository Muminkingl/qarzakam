// src/context/LanguageContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import translations from '../constants/translations.json';

// Create the context
const LanguageContext = createContext();

// Language provider component
export const LanguageProvider = ({ children }) => {
  // Get saved language from localStorage or default to 'en'
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en';
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Function to change language
  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  // Get translations for current language
  const t = (key) => {
    // Check if the key exists directly in the translations
    if (translations[language][key] !== undefined) {
      // Make sure we're returning a string, not an object
      if (typeof translations[language][key] === 'string') {
        return translations[language][key];
      } else {
        console.warn(`Translation for key '${key}' is not a string`);
        return key; // Return the key if translation is not a string
      }
    }

    // Support for nested keys like "hero.title"
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return key; // Return the key if translation not found
      }
    }
    
    // Make sure we're returning a string, not an object
    if (typeof value === 'string') {
      return value;
    } else {
      console.warn(`Translation for key '${key}' is not a string`);
      return key; // Return the key if translation is not a string
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};