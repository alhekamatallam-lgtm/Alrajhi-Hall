import React from 'react';
import { SuccessIcon, ErrorIcon, CloseIcon } from './icons/Icons';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const isSuccess = type === 'success';

  const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
  const Icon = isSuccess ? SuccessIcon : ErrorIcon;

  return (
    <div 
      className={`fixed top-5 right-5 z-50 flex items-center justify-between w-full max-w-xs p-4 text-white ${bgColor} rounded-lg shadow-lg animate-fade-in-down`}
      role="alert"
    >
      <div className="flex items-center">
        <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-white bg-opacity-20">
          <Icon />
        </div>
        <div className="ms-3 text-sm font-medium">{message}</div>
      </div>
      <button 
        type="button" 
        className="ms-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 hover:bg-white hover:bg-opacity-20 inline-flex items-center justify-center h-8 w-8" 
        onClick={onClose} 
        aria-label="Close"
      >
        <CloseIcon />
      </button>
    </div>
  );
};

export default Toast;
