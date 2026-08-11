import React from 'react';

export const StatsRibbon: React.FC = () => {
  const stats = [
    { value: '100%', label: 'Satisfaction rate' },
    { value: '12+', label: 'Years of experience' },
    { value: '20k+', label: 'Total Courses' },
    { value: '90+', label: 'Course Category' },
  ];

  return (
    <section className="py-8 bg-[#F1F4F9] dark:bg-[#273449]/50 border-y border-[#E4E8F0] dark:border-[#334155]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E4E8F0] dark:border-[#334155]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 divide-x-0 md:divide-x divide-[#E4E8F0] dark:divide-[#334155]">
            {stats.map((stat, idx) => (
              <div key={idx} className={`text-center space-y-1 ${idx !== 0 ? 'md:pl-6' : ''}`}>
                <p className="text-3xl sm:text-4xl font-extrabold text-[#1B1F2E] dark:text-white font-display tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-[#5A6478] dark:text-[#CBD5E1] font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
