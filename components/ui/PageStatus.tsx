import React from 'react';
import { InfoIcon } from '../icons';

interface PageStatusProps {
  icon?: React.FC<{ className?: string }>;
  title: string;
  message: string;
}

const PageStatus: React.FC<PageStatusProps> = ({ icon: Icon = InfoIcon, title, message }) => {
  return (
    <div className="text-center py-10 px-4">
      <div className="mx-auto bg-neutral-100 rounded-full w-16 h-16 flex items-center justify-center">
        <Icon className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-neutral-800">{title}</h3>
      <p className="mt-1 text-sm text-neutral-500">{message}</p>
    </div>
  );
};

export default PageStatus;
