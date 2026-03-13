import React from 'react';
import { GripVertical, Plus, Trash2, Layout } from 'lucide-react';
import HeaderEditor from './SectionEditors/HeaderEditor';
import StudentInfoEditor from './SectionEditors/StudentInfoEditor';
import TimetableEditor from './SectionEditors/TimetableEditor';
import FooterEditor from './SectionEditors/FooterEditor';
import { Section } from './AdmitCardRenderer';

interface Props {
    sections: Section[];
    onChange: (sections: Section[]) => void;
}

const TemplateBuilder: React.FC<Props> = ({ sections, onChange }) => {
    const addSection = (type: Section['type']) => {
        const newSection: Section = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            settings: getInitialSettings(type),
        };
        onChange([...sections, newSection]);
    };

    const removeSection = (id: string) => {
        onChange(sections.filter(s => s.id !== id));
    };

    const updateSection = (id: string, settings: any) => {
        onChange(sections.map(s => s.id === id ? { ...s, settings } : s));
    };

    const getInitialSettings = (type: Section['type']) => {
        switch (type) {
            case 'header':
                return { heading: 'SCHOOL NAME', subHeading: 'EXAMINATION 2026' };
            case 'studentInfo':
                return { fields: { rollNumber: true, admissionNo: true, photo: true, dob: true, gender: true } };
            case 'timetable':
                return { showVenue: true };
            case 'footer':
                return { footerText: 'Examination Rules...', showQrCode: true };
            default:
                return {};
        }
    };

    const renderEditor = (section: Section) => {
        switch (section.type) {
            case 'header':
                return <HeaderEditor settings={section.settings} onChange={(s) => updateSection(section.id, s)} />;
            case 'studentInfo':
                return <StudentInfoEditor settings={section.settings} onChange={(s) => updateSection(section.id, s)} />;
            case 'timetable':
                return <TimetableEditor settings={section.settings} onChange={(s) => updateSection(section.id, s)} />;
            case 'footer':
                return <FooterEditor settings={section.settings} onChange={(s) => updateSection(section.id, s)} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Layout Sections</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => addSection('header')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold hover:bg-primary-100 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Header
                    </button>
                    <button
                        onClick={() => addSection('studentInfo')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary-50 text-secondary-600 rounded-lg text-xs font-bold hover:bg-secondary-100 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Student Info
                    </button>
                    <button
                        onClick={() => addSection('timetable')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Timetable
                    </button>
                    <button
                        onClick={() => addSection('footer')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Footer
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {sections.length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center">
                        <Layout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400 text-sm">No sections added. Click the buttons above to start building your template.</p>
                    </div>
                ) : (
                    sections.map((section, index) => (
                        <div
                            key={section.id}
                            className="group bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                        >
                            <div className="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded">
                                        Section {index + 1}: {section.type}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeSection(section.id)}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4">
                                {renderEditor(section)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TemplateBuilder;
