"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem = ({ question, answer }: FAQItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className={`w-full px-6 py-4 text-left flex justify-between items-center transition-colors duration-200 ${
          isOpen 
            ? 'bg-[#fdb827] text-[#212529]' 
            : 'bg-white text-[#212529] hover:bg-[#f8f9fa]'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-lg">{question}</span>
        {isOpen ? (
          <ChevronUp className={`w-5 h-5 ${isOpen ? 'text-[#212529]' : 'text-[#6c757d]'}`} />
        ) : (
          <ChevronDown className={`w-5 h-5 ${isOpen ? 'text-[#212529]' : 'text-[#6c757d]'}`} />
        )}
      </button>
      
      {isOpen && (
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          <p className="text-[#6c757d] leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

export default FAQItem;