import React from 'react';
import aboutBannerBg from '../assets/about_banner.jpg';

const About = () => {
  return (
    <div className="min-h-screen bg-white font-sans flex flex-col items-center py-4 px-4">
      {/* Top Banner Section */}
      <section className="w-full max-w-[1360px] mb-8 px-4 md:px-12 lg:px-16">
        <div
          className="w-full h-[240px] sm:h-[280px] md:h-[320px] rounded-[32px] md:rounded-[36px] relative flex items-center justify-start px-8 md:px-16 py-8 shadow-sm overflow-hidden bg-cover bg-[center_35%]"
          style={{ backgroundImage: `url(${aboutBannerBg})` }}
        >
          {/* Soft Dark Overlay */}
          <div className="absolute inset-0 bg-black/25 z-0 rounded-[32px] md:rounded-[36px]"></div>

          <h1 className="relative z-10 text-3xl md:text-5xl font-bold text-white tracking-tight ml-4 md:ml-12">
            About Us
          </h1>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="w-full max-w-[1360px] px-4 md:px-12 lg:px-16 mb-16 flex flex-col text-left">
        {/* Intro */}
        <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-8">
          <strong className="text-[#FA9132] font-bold">DoggoCare</strong> began its journey in 2026 with the vision of making dog healthcare smarter and more accessible through modern technology. By combining Artificial Intelligence with pet care, DoggoCare helps dog owners detect common skin diseases at an early stage and provides essential care guidance along with a convenient online pet item store. Our goal is to support healthier lives for dogs while making pet care simple, reliable, and affordable for everyone.
        </p>

        {/* What We Offer */}
        <h2 className="text-base md:text-lg font-bold text-[#FA9132] mb-3">
          What We Offer
        </h2>
        <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-4">
          We provide an all in one digital platform designed for dog owners, offering a range of smart features including:
        </p>
        <ul className="list-disc list-inside text-sm md:text-base text-gray-700 space-y-1.5 mb-8 pl-2">
          <li>AI Powered Dog Skin Disease Detection</li>
          <li>Symptom Based Disease Analysis</li>
          <li>Care Guidance and Treatment Information</li>
          <li>Online Pet Item Store</li>
          <li>Shopping Cart and Order Management</li>
          <li>User Account Management</li>
          <li>Feedback and Review System</li>
        </ul>
        <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-8">
          Our platform combines advanced technology with a passion for animal care, helping pet owners make informed decisions anytime and anywhere.
        </p>

        {/* Who We Are */}
        <h2 className="text-base md:text-lg font-bold text-[#FA9132] mb-3">
          Who We Are
        </h2>
        <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-4">
          DoggoCare is an innovative pet healthcare platform developed to improve the early detection of canine skin diseases and simplify pet care management. Using deep learning technology, our system analyzes uploaded dog skin images together with symptom information to provide accurate preliminary disease predictions and practical care guidance.
        </p>
        <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-4">
          In addition to disease detection, DoggoCare offers an integrated online pet item store where users can purchase essential pet care products in one convenient place. Our platform is designed with simplicity, reliability, and user experience in mind, making it suitable for every dog owner.
        </p>
        <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-8">
          As we continue to grow, DoggoCare aims to introduce more intelligent healthcare features, expand our range of pet products, and become a trusted digital companion for pet owners across Sri Lanka.
        </p>

        {/* Our Vision */}
        <h2 className="text-base md:text-lg font-bold text-[#FA9132] mb-2">
          Our Vision
        </h2>
        <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-8">
          To become Sri Lanka's most trusted and innovative digital platform for canine healthcare and pet care solutions.
        </p>

        {/* Our Mission */}
        <h2 className="text-base md:text-lg font-bold text-[#FA9132] mb-2">
          Our Mission
        </h2>
        <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-8">
          To empower dog owners with AI-powered disease detection, reliable care guidance, and high-quality pet care products through an easy-to-use and affordable digital platform.
        </p>
      </section>
    </div>
  );
};

export default About;

