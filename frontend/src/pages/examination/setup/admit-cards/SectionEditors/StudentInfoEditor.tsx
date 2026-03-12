import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Props {
    settings: any;
    onChange: (settings: any) => void;
}

const StudentInfoEditor: React.FC<Props> = ({ settings, onChange }) => {
    const fields = settings.fields || {
        rollNumber: true,
        admissionNo: true,
        dob: true,
        gender: true,
        photo: true,
        fatherName: true,
        motherName: true
    };

    const toggleField = (field: string) => {
        onChange({
            ...settings,
            fields: { ...fields, [field]: !fields[field] }
        });
    };

    const fieldLabels: Record<string, string> = {
        rollNumber: 'Roll Number',
        admissionNo: 'Admission No',
        dob: 'Date of Birth',
        gender: 'Gender',
        photo: 'Student Photo',
        fatherName: "Father's Name",
        motherName: "Mother's Name"
    };

    return (
        <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="space-y-4">
                <div className="flex flex-col gap-1">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Visible Information Fields</h4>
                    <p className="text-[10px] text-gray-400 uppercase tracking-tight font-medium">Toggle which student data points appear on the card.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(fieldLabels).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => toggleField(key)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all group ${fields[key]
                                ? 'bg-primary-50/50 border-blue-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-400'
                                : 'bg-gray-50/50 border-gray-200 text-gray-500 dark:bg-gray-900/50 dark:border-gray-800'
                                }`}
                        >
                            <div className={`p-1 rounded-md transition-all ${fields[key] ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-tight">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StudentInfoEditor;
