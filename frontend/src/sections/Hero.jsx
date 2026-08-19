import React from 'react';
import { Link } from 'react-router-dom';
import heroBg from '../assets/gomepage omage.jpeg';

const Hero = () => {
    return (
        <section className="bg-white px-4 md:px-12 lg:px-16 pt-4 pb-10 w-full flex justify-center overflow-hidden">
            <div 
                className="w-full max-w-[1360px] min-h-[520px] lg:min-h-[560px] rounded-[32px] md:rounded-[36px] relative flex flex-col items-center justify-center text-center px-6 md:px-12 py-16 md:py-20 shadow-sm overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: `url(${heroBg})` }}
            >
                {/* Dark Overlay for text legibility */}
                <div className="absolute inset-0 bg-black/40 rounded-[32px] md:rounded-[36px] z-0"></div>

                {/* Content */}
                <div className="relative z-10 max-w-[800px] flex flex-col items-center">
                    <h1 className="font-sans font-bold text-white text-3xl md:text-5xl lg:text-[56px] leading-[1.15] mb-5 tracking-tight">
                        Canine Skin Disease Detection
                    </h1>
                    
                    <p className="font-sans text-white/95 text-sm md:text-base lg:text-[17px] font-normal leading-relaxed max-w-[720px] mb-8">
                        Upload your dog's skin image, answer a few questions and receive an AI powered prediction with care guidance and medicine recommendations.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-5">
                        <Link 
                            to="/detect" 
                            className="bg-[#FA9132] text-white font-sans font-semibold text-sm md:text-base px-7 py-3 rounded-[12px] hover:bg-[#e07f28] transition-all shadow-sm"
                        >
                            Start Detection
                        </Link>
                        <a 
                            href="#diseases" 
                            className="bg-[#FA9132] text-white font-sans font-semibold text-sm md:text-base px-7 py-3 rounded-[12px] hover:bg-[#e07f28] transition-all shadow-sm"
                        >
                            Learn More
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;






