import React from 'react';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const Stepper: React.FC<StepperProps> = ({ value, onChange, min = 0, max = Infinity }) => (
    <div className="flex items-center space-x-2 bg-neutral-100 border border-neutral-200 rounded-lg p-1">
        <button 
            type="button" 
            onClick={() => onChange(Math.max(min, value - 1))} 
            disabled={value <= min}
            className="bg-white w-8 h-8 rounded-md font-bold text-lg text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:bg-neutral-50 active:scale-95 transition-transform"
        >
            -
        </button>
        <span className="w-12 text-center font-semibold text-lg text-neutral-800">{value}</span>
        <button 
            type="button" 
            onClick={() => onChange(Math.min(max, value + 1))} 
            disabled={value >= max}
            className="bg-white w-8 h-8 rounded-md font-bold text-lg text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:bg-neutral-50 active:scale-95 transition-transform"
        >
            +
        </button>
    </div>
);

export default Stepper;