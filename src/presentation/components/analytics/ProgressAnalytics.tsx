import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Flame, BookOpen, Clock, Target } from 'lucide-react';

export const ProgressAnalytics: React.FC = () => {
  const weeklyData = [
    { day: 'Mon', minutes: 45, accuracy: 88 },
    { day: 'Tue', minutes: 60, accuracy: 92 },
    { day: 'Wed', minutes: 30, accuracy: 85 },
    { day: 'Thu', minutes: 75, accuracy: 95 },
    { day: 'Fri', minutes: 50, accuracy: 90 },
    { day: 'Sat', minutes: 90, accuracy: 94 },
    { day: 'Sun', minutes: 40, accuracy: 89 },
  ];

  const skillData = [
    { name: 'Theory', value: 30, color: '#7C5CFC' },
    { name: 'Quiz', value: 25, color: '#2E68FF' },
    { name: 'Dictation', value: 20, color: '#0EA5C4' },
    { name: 'Shadowing', value: 15, color: '#EC4899' },
    { name: 'Writing/Speaking', value: 10, color: '#12B76A' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Header Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#1B1F2E] dark:text-white">5 Days</p>
            <p className="text-xs text-[#5A6478] dark:text-[#CBD5E1]">Current Streak</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#2E68FF] flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#1B1F2E] dark:text-white">390m</p>
            <p className="text-xs text-[#5A6478] dark:text-[#CBD5E1]">Study Time This Week</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#1B1F2E] dark:text-white">91.5%</p>
            <p className="text-xs text-[#5A6478] dark:text-[#CBD5E1]">Avg Quiz Accuracy</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-[#1B1F2E] dark:text-white">14 Lessons</p>
            <p className="text-xs text-[#5A6478] dark:text-[#CBD5E1]">Completed Courses</p>
          </div>
        </div>

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Weekly Minutes Bar Chart */}
        <div className="lg:col-span-8 p-6 sm:p-8 bg-white dark:bg-[#1E293B] rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-[#1B1F2E] dark:text-white">
              Weekly Learning Activity (Minutes)
            </h3>
            <span className="text-xs font-bold text-[#2E68FF] bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full">
              Target: 45m / day
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" stroke="#95A0B4" fontSize={12} tickLine={false} />
                <YAxis stroke="#95A0B4" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Bar dataKey="minutes" fill="#2E68FF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Learning Skill Breakdown Pie Chart */}
        <div className="lg:col-span-4 p-6 sm:p-8 bg-white dark:bg-[#1E293B] rounded-3xl border border-[#E4E8F0] dark:border-[#334155] shadow-sm space-y-4">
          <h3 className="font-bold text-base text-[#1B1F2E] dark:text-white">
            Skill Breakdown
          </h3>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={skillData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {skillData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#E4E8F0] dark:border-[#334155]">
            {skillData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#5A6478] dark:text-[#CBD5E1]">{item.name}</span>
                </div>
                <span className="text-[#1B1F2E] dark:text-white font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
