import React from 'react';
import { Megaphone, X, ArrowRight } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

const NoticeBar = () => {
    const { settings } = useSystem();
    const [isVisible, setIsVisible] = React.useState(true);

    if (!settings?.isNoticeActive || !settings?.noticeText || !isVisible) {
        return null;
    }

    const content = (
        <div className="flex items-center justify-center gap-3 py-2.5 px-4">
            <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1 rounded-md animate-pulse">
                    <Megaphone size={14} className="text-white" />
                </div>
                <p className="text-sm font-bold text-white tracking-wide">
                    {settings.noticeText}
                </p>
            </div>
            {settings.noticeLink && (
                <a 
                    href={settings.noticeLink}
                    className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-white text-primary-600 px-2 py-0.5 rounded shadow-sm hover:bg-primary-50 transition-colors ml-2"
                >
                    Learn More <ArrowRight size={10} />
                </a>
            )}
            <button 
                onClick={() => setIsVisible(false)}
                className="absolute right-4 p-1 hover:bg-white/10 rounded-full transition-colors group"
                aria-label="Close notice"
            >
                <X size={14} className="text-white/60 group-hover:text-white" />
            </button>
        </div>
    );

    return (
        <div className="relative bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 shadow-md border-b border-primary-400/20 z-[100] animate-in slide-in-from-top duration-500">
            {content}
        </div>
    );
};

export default NoticeBar;
