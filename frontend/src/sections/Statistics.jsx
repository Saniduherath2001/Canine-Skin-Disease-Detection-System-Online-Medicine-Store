import React from 'react';

const stats = [
  { value: '3', label: 'Diseases' },
  { value: '95%+', label: 'Accuracy' },
  { value: '1000+', label: 'Training Images' },
  { value: '24/7', label: 'Availability' },
];

const Statistics = () => {
  return (
    <section className="py-12 md:py-16 bg-white w-full flex justify-center">
      <div className="w-full max-w-[1360px] px-4 flex flex-col items-center">
        {/* Section Header */}
        <h2 className="text-2xl md:text-3xl lg:text-[36px] font-bold text-[#FA9132] text-center mb-12 tracking-tight">
          DoggoCare Statistics
        </h2>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-[#FA9132] rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-md hover:scale-[1.02] transition-transform min-h-[130px]"
            >
              <span className="text-white font-extrabold text-2xl md:text-3xl lg:text-4xl mb-1">
                {stat.value}
              </span>
              <span className="text-white/90 font-medium text-xs md:text-sm tracking-wide">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Statistics;
