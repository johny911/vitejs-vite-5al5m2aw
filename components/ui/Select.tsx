
import React from 'react';
import { ChevronDownIcon } from '../icons';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  id: string;
}

const Select: React.FC<SelectProps> = ({ label, id, children, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
      </label>}
      <div className="relative">
        <select
          id={id}
          className={`w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm appearance-none ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-700">
          <ChevronDownIcon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default Select;
