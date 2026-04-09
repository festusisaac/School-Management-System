import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Megaphone } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

const NoticeBar = () => {
    const { settings, getFullUrl } = useSystem();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show immediately on load if active
        if (settings?.isNoticeActive) {
            // Tiny delay to ensure smooth entrance
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [settings?.isNoticeActive]);

    if (!settings?.isNoticeActive || !isVisible) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in"
                onClick={() => setIsVisible(false)}
            />
            
            {/* Modal Container */}
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                {/* Close Button */}
                <button 
                    onClick={() => setIsVisible(false)}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all backdrop-blur-md"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col">
                    {/* Image Section */}
                    {settings.noticeImage ? (
                        <div className="relative w-full aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <img 
                                src={getFullUrl(settings.noticeImage)} 
                                alt="Announcement" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-full aspect-video bg-primary-600 flex items-center justify-center p-12">
                            <Megaphone size={64} className="text-white/20" />
                        </div>
                    )}

                    {/* Content Section */}
                    {settings.noticeText && (
                        <div className="p-8 text-center space-y-4">
                            <h3 className="text-2xl font-heading font-black text-slate-900 dark:text-white leading-tight">
                                {settings.noticeText}
                            </h3>
                            
                            {settings.noticeLink && (
                                <a 
                                    href={settings.noticeLink}
                                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-primary-500/20 active:scale-95"
                                >
                                    Learn More <ArrowRight size={18} />
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoticeBar;
