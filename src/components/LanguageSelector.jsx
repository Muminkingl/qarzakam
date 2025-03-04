import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { Marker } from "./Marker.jsx";
import { useLanguage } from "../constants/LanguageContext.jsx";

const LanguageSelector = () => {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Languages available in your app
  const languages = [
    { code: "en", name: "English" },
    { code: "kd", name: "Kurdish" },
    // Add more languages as needed
  ];

  // Find the current language name
  const currentLanguage = languages.find(lang => lang.code === language)?.name || "English";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Language Button */}
      <button
        className="relative p-0.5 g5 rounded-2xl shadow-500 group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="relative flex items-center min-h-[40px] px-4 g4 rounded-2xl inner-before group-hover:before:opacity-100 overflow-hidden">
          <span className="absolute -left-[1px]">
            <Marker markerFill="#2EF2FF" />
          </span>
          
          <span className="relative z-2 font-poppins base-bold text-p1 uppercase">
            {currentLanguage}
          </span>
        </span>
        <span className="glow-before glow-after" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[120px] z-50 py-1 rounded-xl g5 border border-s4/25 shadow-lg">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={clsx(
                "w-full text-left px-4 py-2 font-poppins text-sm transition-colors hover:bg-s4/10",
                language === lang.code ? "text-p1 font-medium" : "text-p4"
              )}
              onClick={() => {
                changeLanguage(lang.code);
                setIsOpen(false);
              }}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;