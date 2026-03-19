import React, { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import api from '../../../../services/api';
import { useToast } from '../../../../context/ToastContext';
import { useSystem } from '../../../../context/SystemContext';

interface Props {
    value?: string;
    onChange: (url: string) => void;
    label: string;
    description?: string;
}

const ImageUpload: React.FC<Props> = ({ value, onChange, label, description }) => {
    const [uploading, setUploading] = useState(false);
    const { showError, showSuccess, showWarning } = useToast();
    const { settings } = useSystem();

    // Construct the server base URL from environment variable
    // If VITE_API_BASE_URL is 'http://localhost:3000/api/v1', we extract 'http://localhost:3000'
    const apiBaseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    const SERVER_URL = apiBaseUrl.split('/api')[0];

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Basic validation
            const maxMB = settings?.maxFileUploadSizeMb || 2;
            if (file.size > maxMB * 1024 * 1024) {
                showWarning(`File size exceeds ${maxMB}MB limit.`);
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            setUploading(true);
            try {
                const response = await api.post<any>('/examination/setup/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response && response.url) {
                    const fullUrl = response.url.startsWith('http')
                        ? response.url
                        : `${SERVER_URL}/${response.url}`;

                    onChange(fullUrl);
                    showSuccess('Image uploaded successfully');
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (error: any) {
                console.error('Upload failed', error);
                showError(error.response?.data?.message || 'Upload failed. Please check your connection.');
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
            <div className="relative group">
                {value ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                        <img src={value} className="max-w-full max-h-full object-contain" alt="Preview" />
                        <button
                            onClick={() => onChange('')}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 bg-gray-50/50 dark:bg-gray-900/50 cursor-pointer transition-all hover:bg-white dark:hover:bg-gray-900">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                            ) : (
                                <Upload className="w-8 h-8 text-gray-300 mb-2 group-hover:text-primary-500" />
                            )}
                            <p className="text-xs font-bold text-gray-500">
                                {uploading ? 'Uploading...' : 'Click to upload'}
                            </p>
                            {description && <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">{description}</p>}
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                    </label>
                )}
            </div>
        </div>
    );
};

export default ImageUpload;
