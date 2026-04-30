import React from 'react';
import { getFileUrl } from '../../services/api';

export interface TranscriptData {
    student: {
        name: string;
        admissionNumber: string;
        gender: string;
        dob: string;
        photoUrl?: string;
        class?: string;
        status?: string;
        deactivateReason?: string;
    };
    sessions: Array<{
        id: string;
        name: string;
        terms: Array<{
            id: string;
            name: string;
            subjects: Array<{
                id: string;
                name: string;
                totalScore: number;
                grade: string;
                remark: string;
            }>;
            summary: {
                totalScore: number;
                averageScore: number;
                position?: number;
                totalStudents?: number;
            } | null;
        }>;
    }>;
}

interface TranscriptTemplateProps {
    data: TranscriptData;
    settings: any;
}

const TranscriptTemplate: React.FC<TranscriptTemplateProps> = ({ data, settings }) => {
    return (
        <div className="transcript-container bg-white shadow-none mx-auto text-gray-900 font-serif leading-tight">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-gray-900 pb-6 mb-8">
                <div className="w-24 h-24 flex items-center justify-center">
                    {(settings?.printLogo || settings?.primaryLogo) ? (
                        <img 
                            src={getFileUrl(settings.printLogo || settings.primaryLogo)} 
                            alt="School Logo" 
                            className="w-24 h-24 object-contain"
                        />
                    ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-400">LOGO</div>
                    )}
                </div>

                <div className="flex-1 text-center px-4">
                    <h1 className="text-3xl font-bold uppercase tracking-tighter text-gray-900 mb-1">
                        {settings?.schoolName || 'ACADEMIC INSTITUTION'}
                    </h1>
                    <p className="text-sm italic font-medium text-gray-700 mb-2">
                        {settings?.schoolMotto || 'Excellence in Learning'}
                    </p>
                    <p className="text-xs text-gray-600 max-w-md mx-auto">
                        {settings?.schoolAddress}
                    </p>
                    <div className="flex justify-center gap-4 mt-2 text-xs font-semibold">
                        {settings?.schoolPhone && <span>Tel: {settings.schoolPhone}</span>}
                        {settings?.schoolEmail && <span>Email: {settings.schoolEmail}</span>}
                    </div>
                </div>

                <div className="w-24 h-24 flex items-center justify-center">
                    {(settings?.primaryLogo || settings?.printLogo) ? (
                        <img 
                            src={getFileUrl(settings.primaryLogo || settings.printLogo)} 
                            alt="School Logo" 
                            className="w-24 h-24 object-contain"
                        />
                    ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-400">LOGO</div>
                    )}
                </div>
            </div>

            {/* Document Title */}
            <div className="text-center mb-8">
                <h2 className="text-xl font-bold underline decoration-2 underline-offset-4 uppercase tracking-widest">
                    OFFICIAL ACADEMIC TRANSCRIPT
                </h2>
                {(data.student.status === 'Inactive' || data.student.status === 'Deactivated') && (
                    <div className={`mt-2 inline-block px-4 py-1 border-2 font-black text-xs uppercase tracking-widest rounded ${
                        (data.student.deactivateReason || '').toLowerCase().includes('graduate') 
                            ? 'border-green-600 text-green-600' 
                            : 'border-amber-600 text-amber-600'
                    }`}>
                        {data.student.deactivateReason ? data.student.deactivateReason.toUpperCase() : 'INACTIVE'}
                    </div>
                )}
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
                <div className="space-y-2">
                    <div className="flex border-b border-gray-200 py-1">
                        <span className="w-40 font-bold uppercase text-[10px] text-gray-500">Student Name:</span>
                        <span className="font-bold">{data.student.name}</span>
                    </div>
                    <div className="flex border-b border-gray-200 py-1">
                        <span className="w-40 font-bold uppercase text-[10px] text-gray-500">Admission No:</span>
                        <span className="font-mono font-bold">{data.student.admissionNumber}</span>
                    </div>
                    <div className="flex border-b border-gray-200 py-1">
                        <span className="w-40 font-bold uppercase text-[10px] text-gray-500">Gender:</span>
                        <span>{data.student.gender}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex border-b border-gray-200 py-1">
                        <span className="w-40 font-bold uppercase text-[10px] text-gray-500">Date of Birth:</span>
                        <span>{data.student.dob ? new Date(data.student.dob).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex border-b border-gray-200 py-1">
                        <span className="w-40 font-bold uppercase text-[10px] text-gray-500">
                            {data.student.status === 'Inactive' ? 'Last Class Attended:' : 'Current Class:'}
                        </span>
                        <span>{data.student.class || 'N/A'}</span>
                    </div>
                    <div className="flex border-b border-gray-200 py-1">
                        <span className="w-40 font-bold uppercase text-[10px] text-gray-500">Date Issued:</span>
                        <span>{new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Academic Records - Compact Year-Based Matrix */}
            <div className="space-y-10">
                {data.sessions.map((session) => {
                    // Group subjects across all terms in this session
                    const subjectMap = new Map<string, { name: string, scores: Record<string, number>, grades: Record<string, string> }>();
                    const termNames = session.terms.map(t => t.name);
                    
                    session.terms.forEach(term => {
                        term.subjects.forEach(sub => {
                            if (!subjectMap.has(sub.name)) {
                                subjectMap.set(sub.name, { name: sub.name, scores: {}, grades: {} });
                            }
                            subjectMap.get(sub.name)!.scores[term.name] = sub.totalScore;
                            subjectMap.get(sub.name)!.grades[term.name] = sub.grade;
                        });
                    });

                    const subjects = Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name));

                    return (
                        <div key={session.id} className="session-block break-inside-avoid">
                            <div className="flex items-center justify-between border-b-2 border-gray-900 mb-4 pb-1">
                                <h3 className="text-sm font-black uppercase tracking-wider">
                                    ACADEMIC SESSION: {session.name}
                                </h3>
                                <span className="text-[10px] font-bold text-gray-500 uppercase italic">
                                    Cumulative Performance Record
                                </span>
                            </div>

                            <div className="overflow-hidden border border-gray-900">
                                <table className="w-full text-[11px] text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="px-3 py-2 border-b border-r border-gray-900 font-bold uppercase w-1/3">Subject</th>
                                            {session.terms.map(term => (
                                                <th key={term.id} colSpan={2} className="px-2 py-2 border-b border-r border-gray-900 font-bold uppercase text-center text-[9px]">
                                                    {term.name}
                                                </th>
                                            ))}
                                            <th colSpan={2} className="px-2 py-2 border-b border-gray-900 font-bold uppercase text-center text-[9px] bg-gray-200">
                                                Sessional Avg
                                            </th>
                                        </tr>
                                        <tr className="bg-gray-50 text-[8px] font-bold uppercase">
                                            <th className="px-3 py-1 border-b border-r border-gray-900"></th>
                                            {session.terms.map(term => (
                                                <React.Fragment key={`${term.id}-sub`}>
                                                    <th className="px-1 py-1 border-b border-r border-gray-300 text-center">Score</th>
                                                    <th className="px-1 py-1 border-b border-r border-gray-900 text-center">Grade</th>
                                                </React.Fragment>
                                            ))}
                                            <th className="px-1 py-1 border-b border-r border-gray-300 text-center bg-gray-100">Avg</th>
                                            <th className="px-1 py-1 border-b border-gray-900 text-center bg-gray-100">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {subjects.map((subject) => {
                                            const scores = session.terms.map(t => subject.scores[t.name] || 0);
                                            const validScores = scores.filter(s => s > 0);
                                            const sessionalAvg = validScores.length > 0 
                                                ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
                                                : 0;

                                            // Simple grade calculation for sessional avg
                                            const getGrade = (s: number) => {
                                                if (s >= 75) return 'A';
                                                if (s >= 65) return 'B';
                                                if (s >= 50) return 'C';
                                                if (s >= 45) return 'D';
                                                if (s >= 40) return 'E';
                                                return 'F';
                                            };

                                            return (
                                                <tr key={subject.name} className="hover:bg-gray-50">
                                                    <td className="px-3 py-1.5 border-r border-gray-900 font-medium">{subject.name}</td>
                                                    {session.terms.map(term => (
                                                        <React.Fragment key={`${subject.name}-${term.id}`}>
                                                            <td className="px-1 py-1.5 border-r border-gray-300 text-center font-mono">{subject.scores[term.name] || '-'}</td>
                                                            <td className="px-1 py-1.5 border-r border-gray-900 text-center font-bold text-[9px]">{subject.grades[term.name] || '-'}</td>
                                                        </React.Fragment>
                                                    ))}
                                                    <td className="px-1 py-1.5 border-r border-gray-300 text-center font-bold bg-gray-50/50">{sessionalAvg > 0 ? sessionalAvg.toFixed(1) : '-'}</td>
                                                    <td className="px-1 py-1.5 text-center font-black bg-gray-50/50">{sessionalAvg > 0 ? getGrade(sessionalAvg) : '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-900 text-white font-bold text-[9px]">
                                            <td className="px-3 py-1.5 uppercase tracking-wider">Term / Session Averages</td>
                                            {session.terms.map(term => (
                                                <td key={`${term.id}-avg`} colSpan={2} className="px-1 py-1.5 border-l border-gray-700 text-center">
                                                    {term.summary?.averageScore.toFixed(2)}%
                                                </td>
                                            ))}
                                            <td colSpan={2} className="px-1 py-1.5 border-l border-gray-700 text-center bg-gray-800">
                                                {(() => {
                                                    const validTerms = session.terms.filter(t => (t.summary?.averageScore || 0) > 0);
                                                    const termCount = validTerms.length || session.terms.length || 1;
                                                    const totalAvg = session.terms.reduce((acc, t) => acc + (t.summary?.averageScore || 0), 0);
                                                    return (totalAvg / termCount).toFixed(2);
                                                })()}%
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Signatures */}
            <div className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-end break-inside-avoid">
                <div className="text-center w-64">
                    {settings?.principalSignature && (
                        <img 
                            src={getFileUrl(settings.principalSignature)} 
                            alt="Principal Signature" 
                            className="h-12 w-auto mb-[-8px] mx-auto object-contain"
                            style={{ mixBlendMode: 'multiply' }}
                        />
                    )}
                    <div className="h-px bg-gray-900 mb-2"></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest">School Principal</p>
                    <p className="text-[8px] italic text-gray-500 mt-1">Official Signature & Date</p>
                </div>

                <div className="text-center w-64">
                    <div className="h-12 mb-[-8px]"></div>
                    <div className="h-px bg-gray-900 mb-2"></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest">Registrar / Exam Officer</p>
                    <p className="text-[8px] italic text-gray-500 mt-1">Official Seal & Date</p>
                </div>
            </div>

            {/* Bottom Disclaimer */}
            <div className="mt-16 text-center break-inside-avoid">
                <p className="text-[8px] text-gray-400 uppercase tracking-[0.2em]">
                    This document is an official academic record. Any alteration or unauthorized reproduction renders it invalid.
                </p>
                <p className="text-[7px] text-gray-300 mt-2 font-mono">
                    System Generated Transcript • ID: {data.student.admissionNumber}-{Date.now()}
                </p>
            </div>

            <style>{`
                .transcript-container {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 20mm;
                    margin: auto;
                }

                @media print {
                    @page {
                        margin: 0;
                        size: A4 portrait;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    .transcript-container {
                        width: 210mm;
                        padding: 15mm;
                        margin: 0;
                        box-shadow: none;
                    }
                    .session-block {
                        page-break-inside: avoid;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default TranscriptTemplate;
