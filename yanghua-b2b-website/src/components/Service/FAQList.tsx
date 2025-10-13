"use client";

import { useTranslations } from 'next-intl';
import FAQItem from './FAQItem';

const FAQList = () => {
  const t = useTranslations('services.faq');
  const questions = ['q1', 'q2', 'q3', 'q4', 'q5'];

  return (
    <div className="max-w-4xl mx-auto mt-12">
      <h2 className="text-3xl font-bold text-center mb-8 text-[#212529]">{t('title')}</h2>
      <div className="space-y-4">
        {questions.map((q, index) => (
          <FAQItem
            key={index}
            question={t(`${q}.question`)}
            answer={t(`${q}.answer`)}
          />
        ))}
      </div>
    </div>
  );
};

export default FAQList;