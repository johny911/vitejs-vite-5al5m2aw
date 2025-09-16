import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, id }) => {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer" 
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
    </label>
  );
};

export default Switch;