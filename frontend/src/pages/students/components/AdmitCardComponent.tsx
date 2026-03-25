import React from 'react';
import { getFileUrl } from '../../../services/api';

export interface Section {
    type: 'header' | 'studentInfo' | 'timetable' | 'footer' | 'customText';
    id: string;
    settings: any;
    style?: React.CSSProperties;
}

export interface AdmitCardConfig {
    primaryColor: string;
    secondaryColor: string;
    layout: 'portrait' | 'landscape';
    cardsPerPage: number;
    watermarkText?: string;
}

interface Props {
    sections: Section[];
    config: AdmitCardConfig;
    student: any;
    schedules: any[];
    isPreview?: boolean;
}

const AdmitCardComponent: React.FC<Props> = ({ sections, config, student, schedules, isPreview = false }) => {
    const {
        primaryColor = '#1e40af',
        layout = 'portrait',
        watermarkText = ''
    } = config || {};

    const getAbsoluteUrl = (url: string) => getFileUrl(url || '');

    const renderSection = (section: Section) => {
        const settings = section.settings || {};
        
        switch (section.type) {
            case 'header':
                return (
                    <div
                        key={section.id}
                        className="p-10 pb-6 border-b flex items-center justify-between relative z-10"
                        style={{ borderBottomColor: `${primaryColor}20`, ...section.style }}
                    >
                        {settings.logoUrl && (
                            <img src={getAbsoluteUrl(settings.logoUrl)} className="h-20 w-20 object-contain" alt="Logo" />
                        )}
                        <div className="text-center flex-1 px-8">
                            <h2 className="font-extrabold uppercase tracking-tight leading-tight" style={{ color: primaryColor, fontSize: '1.75rem' }}>
                                {settings.heading || 'EXAMINATION ADMIT CARD'}
                            </h2>
                            {settings.subHeading && (
                                <p className="text-sm font-bold tracking-widest text-gray-500 mt-2 uppercase">{settings.subHeading}</p>
                            )}
                            {settings.examPeriod && (
                                <div className="inline-block mt-3 px-4 py-1 rounded-full bg-gray-50 border border-gray-100 font-bold text-xs text-gray-400">
                                    {settings.examPeriod}
                                </div>
                            )}
                        </div>
                        {settings.logoUrl2 && (
                            <img src={getAbsoluteUrl(settings.logoUrl2)} className="h-20 w-20 object-contain" alt="Logo 2" />
                        )}
                    </div>
                );

            case 'studentInfo':
                const fields = settings.fields || {};
                return (
                    <div key={section.id} className="p-10 py-8 flex gap-12 relative z-10 bg-white" style={section.style}>
                         <div className="w-40 h-48 bg-gray-50 rounded-2xl border-2 border-gray-100 flex flex-col items-center justify-center shrink-0 overflow-hidden shadow-inner order-last">
                            {(student?.photoUrl || student?.studentPhoto) ? (
                                <img src={getAbsoluteUrl(student.photoUrl || student.studentPhoto)} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Photo</span>
                            )}
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-y-6 gap-x-12">
                            <div className="col-span-2 pb-4 border-b border-gray-50">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Candidate's Full Name</p>
                                <p className="text-2xl font-black text-gray-900 uppercase tracking-tight">{student?.firstName || '---'} {student?.lastName || '---'}</p>
                            </div>

                            {fields.admissionNo && (
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Admission Number</p>
                                    <p className="text-base font-bold text-gray-900">{student?.admissionNumber || student?.admissionNo || '---'}</p>
                                </div>
                            )}

                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Current Class</p>
                                <p className="text-base font-bold text-gray-900">{(student?.currentClass?.name || student?.class?.name) || 'N/A'}</p>
                            </div>

                            {fields.gender && (
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Gender</p>
                                    <p className="text-base font-bold text-gray-900 uppercase">{student?.gender || 'N/A'}</p>
                                </div>
                            )}

                            {fields.dob && (
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Date of Birth</p>
                                    <p className="text-base font-bold text-gray-900">{student?.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'timetable':
                return (
                    <div key={section.id} className="px-10 py-6 relative z-10" style={section.style}>
                        <div className="mb-4 flex items-center gap-4 text-gray-300">
                             <span className="text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Examination Timetable</span>
                             <div className="h-px bg-gray-100 flex-1"></div>
                        </div>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-left">
                                    <th className="py-3 pr-4 font-black text-gray-400 uppercase tracking-widest text-[9px]">Date & Time</th>
                                    <th className="py-3 px-4 font-black text-gray-400 uppercase tracking-widest text-[9px]">Subject</th>
                                    <th className="py-3 pl-4 font-black text-gray-400 uppercase tracking-widest text-[9px]">Venue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {Array.isArray(schedules) && schedules.length > 0 ? schedules.map((s, idx) => (
                                    <tr key={idx}>
                                        <td className="py-4 pr-4 border-b border-gray-50">
                                            <div className="font-bold text-gray-900">{s.examDate || s.date ? new Date(s.examDate || s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{s.startTime || '---'}</div>
                                        </td>
                                        <td className="py-4 px-4 border-b border-gray-50">
                                            <div className="font-extrabold text-gray-900 uppercase tracking-tight">{s?.exam?.subject?.name || s?.subject?.name || '---'}</div>
                                        </td>
                                        <td className="py-4 pl-4 border-b border-gray-50 italic text-gray-500 font-medium">
                                            {s.roomNumber || s.venue || 'Main Hall'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="text-center py-12 text-gray-300 italic">No published schedules listed.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                );

            case 'footer':
                return (
                    <div key={section.id} className="p-10 pt-16 mt-auto flex justify-between items-end relative z-10" style={section.style}>
                        <div className="flex-1 pr-16 border-l-4 pl-6" style={{ borderColor: `${primaryColor}10` }}>
                            <p className="text-[10px] leading-relaxed text-gray-400 font-medium">
                                {settings.footerText || 'This is an official document generated by the School Management System.'}
                            </p>
                        </div>
                        <div className="text-center shrink-0 min-w-[200px]">
                            {settings.signatureUrl ? (
                                <img src={getAbsoluteUrl(settings.signatureUrl)} className="h-16 mx-auto mb-[-8px] relative z-20 grayscale brightness-110 contrast-125 mix-blend-multiply" />
                            ) : (
                                <div className="h-16"></div>
                            )}
                            <div className="h-px w-full bg-gray-200"></div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mt-2">Authorized Official</p>
                        </div>
                    </div>
                );

            case 'customText':
                return (
                    <div key={section.id} className="px-10 py-4 relative z-10" style={section.style}>
                        <p className="text-sm leading-relaxed text-gray-600 font-medium" style={settings.style}>
                            {settings.content || ''}
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div
            className={`bg-white relative transition-all overflow-hidden ${isPreview ? 'shadow-2xl rounded-2xl border border-gray-200' : ''} ${layout === 'landscape'
                ? 'aspect-[1.414/1] w-full'
                : isPreview ? 'aspect-[1/1.414] w-[600px]' : 'w-full h-full'
                }`}
            style={{
                margin: isPreview ? '2rem auto' : '0',
            }}
        >
            {watermarkText && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-25deg] select-none z-0" style={{ color: primaryColor }}>
                    <span className="text-8xl font-black whitespace-nowrap uppercase tracking-[0.5em]">{watermarkText}</span>
                </div>
            )}

            <div className="relative h-full flex flex-col antialiased">
                {Array.isArray(sections) ? sections.map(renderSection) : null}
            </div>
        </div>
    );
};

export default AdmitCardComponent;
