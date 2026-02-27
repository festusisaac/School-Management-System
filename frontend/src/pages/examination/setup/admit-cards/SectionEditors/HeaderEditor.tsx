import React from 'react';
import { Type, Calendar } from 'lucide-react';
import ImageUpload from '../ImageUpload';

interface Props {
    settings: any;
    onChange: (settings: any) => void;
}

const HeaderEditor: React.FC<Props> = ({ settings, onChange }) => {
    const handleChange = (field: string, value: any) => {
        onChange({ ...settings, [field]: value });
    };

    return (
        <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Main Heading</label>
                    <div className="relative group">
                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            value={settings.heading || ''}
                            onChange={(e) => handleChange('heading', e.target.value)}
                            placeholder="e.g. BOARD OF SECONDARY EDUCATION"
                        />
                    </div>
                </div>

                <div className="col-span-2 space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Sub-Heading / Examination Name</label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                        value={settings.subHeading || ''}
                        onChange={(e) => handleChange('subHeading', e.target.value)}
                        placeholder="e.g. HIGHER SECONDARY SCHOOL CERTIFICATE..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Exam Period</label>
                    <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            value={settings.examPeriod || ''}
                            onChange={(e) => handleChange('examPeriod', e.target.value)}
                            placeholder="e.g. May-June 2026"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 col-span-2 mt-2 pt-6 border-t border-gray-50 dark:border-gray-700">
                    <ImageUpload
                        label="Left Logo"
                        value={settings.logoUrl}
                        onChange={(url) => handleChange('logoUrl', url)}
                        description="School crest or icon"
                    />
                    <ImageUpload
                        label="Right Logo (Optional)"
                        value={settings.logoUrl2}
                        onChange={(url) => handleChange('logoUrl2', url)}
                        description="Board or sponsor logo"
                    />
                </div>
            </div>
        </div>
    );
};

export default HeaderEditor;
