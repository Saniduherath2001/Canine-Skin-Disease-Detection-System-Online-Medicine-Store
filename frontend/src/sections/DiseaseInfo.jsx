import React from 'react';
import ringwormImg from '../assets/Ringworm.jpeg';
import demodicosisImg from '../assets/Demodicosis.jpg';
import dermatitisImg from '../assets/Dermatitis.jpeg';

const diseases = [
  {
    id: 'ringworm',
    title: 'Ringworm',
    description: 'Fungal infection causing circular hair loss and scaly skin.',
    image: ringwormImg,
  },
  {
    id: 'demodicosis',
    title: 'Demodicosis',
    description: 'Skin disease caused by Demodex mites leading to hair loss.',
    image: demodicosisImg,
  },
  {
    id: 'dermatitis',
    title: 'Dermatitis',
    description: 'Inflammatory skin condition causing redness and itching.',
    image: dermatitisImg,
  },
];

const DiseaseInfo = () => {
  return (
    <section id="diseases" className="py-12 md:py-16 bg-white w-full flex justify-center">
      <div className="w-full max-w-[1360px] px-4 flex flex-col items-center">
        {/* Section Header */}
        <h2 className="text-2xl md:text-3xl lg:text-[36px] font-bold text-[#FA9132] text-center mb-12 tracking-tight">
          Common Diseases We Detect
        </h2>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full">
          {diseases.map((disease) => (
            <div
              key={disease.id}
              className="bg-white rounded-2xl md:rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              {/* Image Container */}
              <div className="w-full h-[210px] sm:h-[230px] overflow-hidden bg-gray-100">
                <img
                  src={disease.image}
                  alt={disease.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {disease.title}
                </h3>
                <p className="text-gray-600 text-sm md:text-[15px] leading-relaxed">
                  {disease.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DiseaseInfo;

