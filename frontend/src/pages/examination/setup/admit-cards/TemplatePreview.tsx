import React from 'react';
import AdmitCardRenderer, { Section, AdmitCardConfig } from './AdmitCardRenderer';

interface Props {
    sections: Section[];
    config: AdmitCardConfig;
}

const TemplatePreview: React.FC<Props> = ({ sections, config }) => {
    // Mock data for preview
    const mockStudent = {
        firstName: 'EDWARD',
        lastName: 'SMITH',
        rollNumber: '161066',
        admissionNumber: '18S168375',
        dob: '2012-05-14',
        gender: 'Male',
        currentClass: { name: 'JS 1 GOLD' },
        photoUrl: null
    };

    const mockSchedules = [
        {
            date: '2026-06-03',
            startTime: '2:00 PM',
            exam: { subject: { name: 'Mathematics' } },
            venue: 'Exam Hall 1'
        },
        {
            date: '2026-06-04',
            startTime: '9:00 AM',
            exam: { subject: { name: 'English' } },
            venue: 'Main Hall'
        }
    ];

    return (
        <div className="bg-gray-100 dark:bg-gray-900 p-8 rounded-xl border-4 border-dashed border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
            <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                    <span className="h-[1px] w-8 bg-gray-300"></span>
                    Live Design Preview
                    <span className="h-[1px] w-8 bg-gray-300"></span>
                </div>

                <AdmitCardRenderer
                    sections={sections}
                    config={config}
                    student={mockStudent}
                    schedules={mockSchedules}
                    isPreview={true}
                />

                <p className="text-[10px] text-gray-400 italic text-center max-w-xs">
                    Design updates in the builder are instantly reflected here.
                    This preview uses mock data to show you how the layout will behave.
                </p>
            </div>
        </div>
    );
};

export default TemplatePreview;
