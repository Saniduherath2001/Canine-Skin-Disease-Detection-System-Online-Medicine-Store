import React from 'react';
import Hero from '../sections/Hero';
import DiseaseInfo from '../sections/DiseaseInfo';
import HowItWorks from '../sections/HowItWorks';
import Statistics from '../sections/Statistics';

const Home = () => {
    return (
        <div className="flex flex-col font-sans bg-white">
            <Hero />
            <DiseaseInfo />
            <HowItWorks />
            <Statistics />
        </div>
    );
};

export default Home;

