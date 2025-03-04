import { useState } from 'react';
import { useLanguage } from '../constants/LanguageContext';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const { t } = useLanguage();

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Use the translations directly from the t function
  const faqItems = Array.from({ length: 9 }, (_, index) => ({
    id: index.toString(),
    question: t(`faq_section.questions.${index}.question`),
    answer: t(`faq_section.questions.${index}.answer`)
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-12 text-p4">{t('faq')}</h2>
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <div
            key={item.id}
            className="border border-s4/25 rounded-lg overflow-hidden bg-s2"
          >
            <button
              className="w-full p-4 text-left flex justify-between items-center hover:bg-s3/10 transition-colors"
              onClick={() => toggleFAQ(index)}
            >
              <span className="text-p4 font-medium">{item.question}</span>
              <span className={`transform transition-transform duration-200 text-p4 ${
                openIndex === index ? 'rotate-180' : ''
              }`}>
                ▼
              </span>
            </button>
            {openIndex === index && (
              <div className="p-4 pt-0 text-p3">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ; 