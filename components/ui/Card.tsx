
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const clickableClasses = onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : '';
  
  return (
    <div
      className={`bg-white rounded-xl shadow-sm overflow-hidden p-4 sm:p-6 ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
