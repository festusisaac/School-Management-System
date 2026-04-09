import React from 'react';
import { useSystem } from '../../context/SystemContext';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const { settings, getFullUrl } = useSystem();
  
  const schoolName = settings?.schoolName || 'YOUR SCHOOL';
  const logoUrl = settings?.primaryLogo ? getFullUrl(settings.primaryLogo) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col items-center justify-center transition-colors duration-500">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          {/* Subtle Pulse Logo */}
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
            ) : (
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400 font-heading">
                {schoolName.charAt(0)}
              </span>
            )}
          </div>
          
          {/* Minimal Spinner */}
          <div className="absolute -inset-2 border-2 border-primary-500/20 rounded-2xl"></div>
          <div className="absolute -inset-2 border-t-2 border-primary-500 rounded-2xl animate-spin"></div>
        </div>

        <div className="flex flex-col items-center space-y-1">
          <h2 className="text-slate-900 dark:text-white font-heading font-semibold text-base">
            {message || schoolName}
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
