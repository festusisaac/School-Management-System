import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Props {
    settings: any;
    onChange: (settings: any) => void;
}

const TimetableEditor: React.FC<Props> = ({ settings, onChange }) => {
    const handleChange = (field: string, value: any) => {
        onChange({ ...settings, [field]: value });
    };

    return (
        <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="space-y-4">
                <div className="flex flex-col gap-1">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Exam Schedule Display</h4>
                    <p className="text-[10px] text-gray-400 uppercase tracking-tight font-medium italic">Data is automatically pulled from the selected exam group.</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <button
                        onClick={() => handleChange('showVenue', !settings.showVenue)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${settings.showVenue !== false
                            ? 'bg-primary-50/50 border-blue-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-400'
                            : 'bg-gray-50/50 border-gray-200 text-gray-500 dark:bg-gray-900/50 dark:border-gray-800'
                            }`}
                    >
                        <div className={`p-1 rounded-md transition-all ${settings.showVenue !== false ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tight">Show Venue Column</span>
                    </button>

                    <button
                        onClick={() => handleChange('showSubjectCode', !settings.showSubjectCode)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${settings.showSubjectCode
                            ? 'bg-primary-50/50 border-blue-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-400'
                            : 'bg-gray-50/50 border-gray-200 text-gray-500 dark:bg-gray-900/50 dark:border-gray-800'
                            }`}
                    >
                        <div className={`p-1 rounded-md transition-all ${settings.showSubjectCode ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tight">Show Subject Code</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimetableEditor;
