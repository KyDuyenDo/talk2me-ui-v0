import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does Talk2Me LearnTube turn YouTube videos into interactive courses?',
      a: 'Our platform uses Gemini 3.6 Flash to analyze the video transcript, extract key timestamps, and generate structured Markdown theory notes, multiple-choice quizzes, dictation typing drills, shadowing sentences, and AI writing prompts.'
    },
    {
      q: 'Can I paste any YouTube link?',
      a: 'Yes! You can paste links to educational videos, coding tutorials, TED Talks, language lessons, business lectures, or tech talks. Our AI processes the transcript instantly.'
    },
    {
      q: 'What are the 6 interactive learning modes?',
      a: '1. Theory (Markdown notes & key takeaways)\n2. Quiz (Instant feedback & explanations)\n3. Dictation (Listening & typing segment player)\n4. Shadowing (Echo speaking drill with audio recording)\n5. Writing (AI essay rubric scoring)\n6. Speaking (AI pronunciation assessment)'
    },
    {
      q: 'Is my progress saved?',
      a: 'Yes, your completed lessons, quiz scores, study streak, and SRS flashcard review progress are persisted locally so you can continue seamlessly across sessions.'
    }
  ];

  return (
    <section className="py-12 bg-white dark:bg-[#1E293B] rounded-3xl border border-[#E4E8F0] dark:border-[#334155] p-6 sm:p-10 shadow-sm max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <span className="px-3.5 py-1 rounded-full bg-blue-50 text-[#2E68FF] text-xs font-bold uppercase">
          FAQ
        </span>
        <h2 className="text-3xl font-extrabold text-[#1B1F2E] dark:text-white tracking-tight">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="p-5 rounded-2xl bg-[#F1F4F9] dark:bg-[#273449] border border-[#E4E8F0] dark:border-[#334155] cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-center justify-between font-bold text-sm sm:text-base text-[#1B1F2E] dark:text-white">
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-[#95A0B4] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
              {isOpen && (
                <p className="text-xs sm:text-sm text-[#5A6478] dark:text-[#CBD5E1] pt-2 border-t border-[#E4E8F0] dark:border-[#334155] leading-relaxed whitespace-pre-line">
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
