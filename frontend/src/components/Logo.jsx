import React from 'react';
import logoSrc from '../assets/logo_transparent.png';
import logoFallback from '../assets/logo.png';

const Logo = ({ className = "h-14 md:h-16" }) => {
  return (
    <img 
      src={logoSrc} 
      alt="DoggoCare Logo" 
      className={`${className} w-auto object-contain`}
      onError={(e) => {
        if (e.target.src !== logoFallback) {
          e.target.src = logoFallback;
        }
      }}
    />
  );
};

export default Logo;




