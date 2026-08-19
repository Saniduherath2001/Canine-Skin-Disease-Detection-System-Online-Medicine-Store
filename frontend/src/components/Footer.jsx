import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

import locationIcon from '../assets/maps-and-flags.png';
import emailIcon from '../assets/email.png';
import phoneIcon from '../assets/phone-receiver-silhouette.png';

import whatsappIcon from '../assets/whatsapp.png';
import facebookIcon from '../assets/facebook (2).png';
import youtubeIcon from '../assets/youtube (2).png';
import instagramIcon from '../assets/instagram (2).png';

const Footer = () => {
  return (
    <footer className="bg-[#EFEFEF] pt-12 relative w-full">
      <div className="max-w-[1240px] mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center justify-between">
          
          {/* Left Column - Logo, Tagline & Nav */}
          <div className="flex flex-col items-center md:items-center text-center">
            {/* Logo */}
            <div className="mb-3">
              <Logo className="h-14 md:h-16" />
            </div>
            
            {/* Tagline */}
            <p className="text-gray-700 text-sm md:text-[15px] italic max-w-[360px] leading-relaxed mb-5">
              Helping dog owners detect skin diseases and care for their dogs with confidence.
            </p>
            
            {/* Quick Links */}
            <div className="flex flex-col items-center space-y-2 text-sm font-medium italic">
              <Link to="/store" className="text-gray-800 hover:text-[#FA9132] transition-colors">Store</Link>
              <Link to="/about" className="text-gray-800 hover:text-[#FA9132] transition-colors">About Us</Link>
              <Link to="/contact" className="text-gray-800 hover:text-[#FA9132] transition-colors">Contact Us</Link>
            </div>
          </div>

          {/* Right Column - Contact Info & Socials */}
          <div className="flex flex-col items-center md:items-start md:pl-16">
             {/* Contact Details */}
             <div className="flex flex-col items-start space-y-4 mb-8">
                <div className="flex items-center gap-4 text-gray-800 text-sm font-medium">
                    <img src={locationIcon} alt="Location" className="w-5 h-5 object-contain flex-shrink-0" />
                    <span>Colombo 10</span>
                </div>
                <div className="flex items-center gap-4 text-gray-800 text-sm font-medium">
                    <img src={emailIcon} alt="Email" className="w-5 h-5 object-contain flex-shrink-0" />
                    <span>doggocare@gmail.com</span>
                </div>
                <div className="flex items-center gap-4 text-gray-800 text-sm font-medium">
                    <img src={phoneIcon} alt="Phone" className="w-5 h-5 object-contain flex-shrink-0" />
                    <span>+94 123 4567</span>
                </div>
             </div>

             {/* Follow Us & Social Icons */}
             <div className="flex flex-col items-center md:items-start">
                <h4 className="font-bold text-gray-900 mb-3 text-sm">
                    Follow Us
                </h4>
                <div className="flex gap-4">
                    <a href="#" className="hover:scale-110 transition-transform">
                        <img src={whatsappIcon} alt="WhatsApp" className="w-6 h-6" />
                    </a>
                    <a href="#" className="hover:scale-110 transition-transform">
                        <img src={facebookIcon} alt="Facebook" className="w-6 h-6" />
                    </a>
                    <a href="#" className="hover:scale-110 transition-transform">
                        <img src={youtubeIcon} alt="YouTube" className="w-6 h-6" />
                    </a>
                    <a href="#" className="hover:scale-110 transition-transform">
                        <img src={instagramIcon} alt="Instagram" className="w-6 h-6" />
                    </a>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-[#222222] py-4 px-4 w-full">
        <p className="text-white text-xs md:text-sm text-center font-normal">
          © 2026 - DoggoCare - Sri Lanka. All Right Reserved. Concept & Design by <span className="text-[#FA9132] font-semibold">DEV SIX</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;

