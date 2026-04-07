"use client";

import { useTranslations } from 'next-intl';
import FAQItem from './FAQItem';

type FAQEntry = {
  question: string;
  answer: string;
};

const FAQList = ({ title, items }: { title?: string; items?: FAQEntry[] }) => {
  const t = useTranslations('services.faq');
  const questions = items ?? ['q1', 'q2', 'q3', 'q4', 'q5'].map((q) => ({
    question: t(`${q}.question`),
    answer: t(`${q}.answer`),
  }));

  return (
    <div className="max-w-4xl mx-auto mt-12">
      <h2 className="text-3xl font-bold text-center mb-8 text-[#212529]">{title ?? t('title')}</h2>
      <div className="space-y-4">
        {questions.map((q, index) => (
          <FAQItem
            key={index}
            question={q.question}
            answer={q.answer}
          />
        ))}
      </div>
    </div>
  );
};

export default FAQList;
