import React from 'react';
import { CalendarIcon } from '../icons';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id: string;
}

const DateInput: React.FC<DateInputProps> = ({ label, id, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>}
      <div className="relative">
        <input
          id={id}
          type="date"
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10 ${className}`}
          {...props}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <CalendarIcon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default DateInput;
