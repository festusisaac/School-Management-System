import React from 'react';
import { PenTool, CheckCircle2 } from 'lucide-react';
import ImageUpload from '../ImageUpload';

interface Props {
    settings: any;
    onChange: (settings: any) => void;
}

const FooterEditor: React.FC<Props> = ({ settings, onChange }) => {
    const handleChange = (field: string, value: any) => {
        onChange({ ...settings, [field]: value });
    };

    return (
        <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Footer Instructions / Exam Rules</label>
                    <textarea
                        className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none min-h-[100px]"
                        value={settings.footerText || ''}
                        onChange={(e) => handleChange('footerText', e.target.value)}
                        placeholder="e.g. Please bring this card to the exam hall. No entry without admit card."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-6 border-t border-gray-50 dark:border-gray-700">
                    <ImageUpload
                        label="Authorized Signature"
                        value={settings.signatureUrl}
                        onChange={(url) => handleChange('signatureUrl', url)}
                        description="Principal or Registrar signature"
                    />

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Security & Validation</label>
                        <button
                            onClick={() => handleChange('showQrCode', !settings.showQrCode)}
                            className={`flex flex-col items-start gap-2 w-full p-4 rounded-xl border-2 transition-all group ${settings.showQrCode
                                ? 'bg-blue-50/50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                                : 'bg-gray-50/50 border-gray-200 text-gray-500 dark:bg-gray-900/50 dark:border-gray-800'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`p-1 rounded-md transition-all ${settings.showQrCode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-sm font-black uppercase tracking-tight">Show Batch QR Code</span>
                            </div>
                            <p className="text-[10px] opacity-60 font-medium">Adds a unique QR code to each card for instant verification of student status.</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FooterEditor;
