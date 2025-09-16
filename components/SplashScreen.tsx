
import React from 'react';
import { LogoIcon, LogoText } from './icons';

const SplashScreen: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center bg-neutral-900 animate-fade-in">
      <div className="flex flex-col items-center">
        <LogoIcon 
          className="w-24 h-24 text-white" 
          style={{ animation: 'splash-logo-in 1s ease-out forwards' }} 
        />
        <LogoText 
          className="h-12 text-white mt-4" 
          style={{ animation: 'splash-text-in 1.2s ease-out forwards', animationDelay: '0.3s', opacity: 0 }} 
        />
      </div>
    </div>
  );
};

export default SplashScreen;
