import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { AlertTriangleIcon } from './icons';

const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div 
        className="fixed bottom-16 left-4 right-4 bg-red-600 text-white p-3 text-center text-sm font-semibold z-50 flex items-center justify-center shadow-lg rounded-lg
                   lg:bottom-4 lg:left-1/2 lg:-translate-x-1/2 lg:max-w-md"
        style={{ animation: 'modal-content-scale-up 0.3s ease-out forwards' }}
    >
      <AlertTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
      <span>You are currently offline. Some features may be unavailable.</span>
    </div>
  );
};

export default OfflineBanner;
