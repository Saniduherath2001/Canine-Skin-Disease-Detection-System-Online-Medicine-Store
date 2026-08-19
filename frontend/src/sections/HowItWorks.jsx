import React from 'react';

const steps = [
  { step: '1', title: 'Upload Image' },
  { step: '2', title: 'Pet Details' },
  { step: '3', title: 'Symptoms' },
  { step: '4', title: 'AI Prediction' },
  { step: '5', title: 'Care Guide' },
];

const HowItWorks = () => {
  return (
    <section className="py-12 md:py-16 bg-white w-full flex justify-center">
      <div className="w-full max-w-[1360px] px-4 flex flex-col items-center">
        {/* Section Header */}
        <h2 className="text-2xl md:text-3xl lg:text-[36px] font-bold text-[#FA9132] text-center mb-12 tracking-tight">
          How It Works
        </h2>

        {/* 5 Steps Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 w-full">
          {steps.map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow min-h-[120px]"
            >
              <span className="text-gray-700 font-medium text-base mb-1">
                {item.step}
              </span>
              <span className="text-gray-900 font-bold text-sm md:text-[15px]">
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
