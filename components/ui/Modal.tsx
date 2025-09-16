
import React, { FC, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from '../icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal: FC<ModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
      style={{ animation: 'modal-fade-in 0.3s ease-out forwards' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative"
        style={{ animation: 'modal-content-scale-up 0.3s ease-out forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10"
          aria-label="Close modal"
        >
          <XIcon className="w-6 h-6" />
        </button>
        {children}
      </div>
    </div>,
    document.getElementById('modal-root')!
  );
};

export default Modal;