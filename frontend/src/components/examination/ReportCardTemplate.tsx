import React, { useMemo } from 'react';
import { useSystem } from '../../context/SystemContext';

export interface ReportCardSubject {
    subjectName: string;
    scores: Record<string, number | undefined>; // assessmentTypeId -> score
    totalScore: number;
    highestInClass?: number;
    lowestInClass?: number;
    classAvg?: number;
    positionInSubject?: string | number;
    grade: string;
    remark: string;
    cumulative?: {
        term1?: number;
        term2?: number;
    };
}

export interface ReportCardData {
    student: {
        name: string;
        dateOfBirth?: string;
        sex?: string;
        class: string;
        admissionNumber: string;
        photoUrl?: string;
    };
    examGroup: {
        name: string; // SESSION name
        term: string;
        year: string;
    };
    academicInfo: {
        timesOpened?: number;
        timesPresent?: number;
        timesAbsent?: number;
        termBegins?: string;
        termEnds?: string;
        nextTermBegins?: string;
        terminalDuration?: string;
        promotionStatus?: string;
        classTeacherName?: string;
        classTeacherSignature?: string;
        principalSignature?: string;
    };
    subjects: ReportCardSubject[];
    summary: {
        totalObtainable: number;
        totalObtained: number;
        averageScore: number;
        position?: string | number;
        classSize?: number;
        cumulativeAvg?: number;
    };
    affectiveTraits?: { name: string, rating: number }[];
    psychomotorSkills?: { name: string, rating: number }[];
}

export interface ReportCardConfig {
    showPhoto: boolean;
    showHighest: boolean;
    showLowest: boolean;
    showAverage: boolean;
    showSubjectPosition: boolean;
    showClassPosition: boolean;
    showAttendance: boolean;
    showCumulative: boolean;
}

interface Props {
    data: ReportCardData;
    assessments: { id: string, name: string, maxMarks: number }[];
    config?: ReportCardConfig;
}

const ReportCardTemplate: React.FC<Props> = ({ 
    data, 
    assessments, 
    config = {
        showPhoto: true,
        showHighest: true,
        showLowest: true,
        showAverage: true,
        showSubjectPosition: true,
        showClassPosition: true,
        showAttendance: true,
        showCumulative: true
    } 
}) => {
    const { settings, getFullUrl } = useSystem();

    const isThirdTerm = useMemo(() => {
        const t = data.examGroup.term?.toLowerCase() || '';
        return t.includes('third') || t.includes('3rd');
    }, [data.examGroup.term]);

    // Helper to format position (e.g., 1 -> 1st)
    const formatSuffix = (n: number | string | undefined | null) => {
        if (n === undefined || n === null || n === 0 || n === '0') return '-';
        const num = typeof n === 'string' ? parseInt(n) : n;
        if (isNaN(num)) return n;

        const lastDigit = num % 10;
        const lastTwoDigits = num % 100;

        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
            return num + "th";
        }

        switch (lastDigit) {
            case 1: return num + "st";
            case 2: return num + "nd";
            case 3: return num + "rd";
            default: return num + "th";
        }
    };

    // Constants from the settings
    const colorPrimary = settings.primaryColor || '#2aa06c';
    const colorHeaderBg = '#f8fafc';
    const colorSectionBg = settings.secondaryColor ? `${settings.secondaryColor}20` : '#eaf6f0';
    const colorBorder = settings.primaryColor || '#218b12ff';

    const getTeacherComment = (avg: number) => {
        if (avg >= 95) return "AN EXTRAORDINARY PERFORMANCE! KEEP BLAZING THE TRAIL.";
        if (avg >= 90) return "AN OUTSTANDING RESULT! KEEP UP THE GOOD WORK.";
        if (avg >= 80) return "EXCELLENT PERFORMANCE. KEEP MAINTAINING THIS VITALITY.";
        if (avg >= 70) return "A VERY GOOD RESULT. AIM FOR THE TOP NEXT TERM.";
        if (avg >= 60) return "A GOOD PERFORMANCE. SUSTAIN YOUR EFFORTS.";
        if (avg >= 50) return "A FAIR RESULT. YOU CAN DO MUCH BETTER.";
        if (avg >= 40) return "AVERAGE PERFORMANCE. YOU NEED TO BE MORE SERIOUS.";
        return "POOR RESULT, REDOUBLE YOUR EFFORTS TO IMPROVE.";
    };

    const getPrincipalComment = (avg: number) => {
        if (avg >= 90) return "OUTSTANDING PERFORMANCE. KEEP IT UP!";
        if (avg >= 75) return "EXCELLENT WORK. HIGHLY RECOMMENDED.";
        if (avg >= 50) return "GOOD EFFORT. PROMOTED.";
        if (avg >= 45) return "FAIR PERFORMANCE. PROMOTED ON TRIAL.";
        return "WEAK PERFORMANCE. NOT PROMOTED.";
    };

    return (
        <div
            className="bg-white mx-auto text-black print:p-0"
            style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '5mm',
                fontFamily: "'DejaVu Sans', sans-serif",
                fontSize: '11px',
                lineHeight: '1.2',
                WebkitPrintColorAdjust: 'exact',
            }}
        >
            <div className="main-container w-full max-w-full m-0 p-0 box-border">
                {/* HEADER TABLE */}
                <table className="w-full border-collapse mb-1" style={{ backgroundColor: colorHeaderBg, border: `1px solid ${colorPrimary}` }}>
                    <tbody>
                        <tr>
                            <td width="15%" className="text-center p-1">
                                {(settings.printLogo || settings.primaryLogo || settings.invoiceLogo) ? (
                                    <img src={getFullUrl(settings.printLogo || settings.primaryLogo || settings.invoiceLogo)} className="w-[80px] h-[80px] object-contain mx-auto" alt="Logo" />
                                ) : (
                                    <div className="w-[60px] h-[60px] bg-primary text-white rounded-full flex items-center justify-center font-bold text-[10px] mx-auto uppercase text-center font-black">LOGO</div>
                                )}
                            </td>
                            <td className="text-center">
                                <div className="text-[20px] font-black uppercase text-primary tracking-tight">{settings.schoolName || 'HISGRACE INTERNATIONAL SCHOOL'}</div>
                                <div className="text-[12px] font-bold text-gray-700">{settings.schoolAddress || 'Lagos, Nigeria'}</div>
                                <div className="italic mt-1 text-[11px] text-gray-500 font-medium">"{settings.schoolMotto || 'Excellence & Integrity'}"</div>
                            </td>
                            <td width="15%" className="text-center p-1">
                                {(settings.primaryLogo || settings.invoiceLogo || settings.printLogo) ? (
                                    <img src={getFullUrl(settings.primaryLogo || settings.invoiceLogo || settings.printLogo)} className="w-[80px] h-[80px] object-contain mx-auto" alt="Logo" />
                                ) : (
                                    <div className="w-[60px] h-[60px] bg-primary text-white rounded-full flex items-center justify-center font-bold text-[10px] mx-auto uppercase text-center font-black">LOGO</div>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* TERM TITLE */}
                <div className="text-center font-bold text-[12px] my-1 uppercase">
                    {data.examGroup.name} {data.examGroup.term} REPORT SHEET
                </div>

                {/* STUDENT INFO GRID */}
                <table className="w-full mb-1 border-collapse" style={{ tableLayout: 'fixed' }}>
                    <tbody>
                        <tr>
                            {/* Personal Data */}
                            <td width="35%" style={{ verticalAlign: 'top', padding: '0 2px 0 0' }}>
                                <table className="w-full border-collapse" style={{ border: `1px solid ${colorBorder}` }}>
                                    <tbody>
                                        <tr>
                                            <th colSpan={2} className="text-center font-bold p-[3px]" style={{ backgroundColor: colorSectionBg, border: `1px solid ${colorBorder}` }}>
                                                STUDENT'S PERSONAL DATA
                                            </th>
                                        </tr>
                                        <tr>
                                            <td className="p-[3px] border" style={{ borderColor: colorBorder }}>Name</td>
                                            <td className="p-[3px] border font-bold uppercase" style={{ borderColor: colorBorder }}>{data.student.name}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-[3px] border" style={{ borderColor: colorBorder }}>Date of Birth</td>
                                            <td className="p-[3px] border" style={{ borderColor: colorBorder }}>{data.student.dateOfBirth || ''}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-[3px] border" style={{ borderColor: colorBorder }}>Sex</td>
                                            <td className="p-[3px] border uppercase" style={{ borderColor: colorBorder }}>{data.student.sex || ''}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-[3px] border" style={{ borderColor: colorBorder }}>Class</td>
                                            <td className="p-[3px] border uppercase" style={{ borderColor: colorBorder }}>{data.student.class}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-[3px] border" style={{ borderColor: colorBorder }}>Admission No.</td>
                                            <td className="p-[3px] border" style={{ borderColor: colorBorder }}>{data.student.admissionNumber}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>

                            {config.showPhoto && (
                                <td width="15%" style={{ verticalAlign: 'top', padding: '0 2px' }}>
                                    <div className="mx-auto flex items-center justify-center border border-gray-300 overflow-hidden" style={{ width: '95px', height: '100px' }}>
                                        {data.student.photoUrl ? (
                                            <img src={getFullUrl(data.student.photoUrl)} className="w-full h-full object-cover" alt="Student" />
                                        ) : (
                                            <span className="text-gray-300 text-[10px] font-bold">PHOTO</span>
                                        )}
                                    </div>
                                </td>
                            )}

                            {/* Attendance & Duration */}
                            <td width="30%" style={{ verticalAlign: 'top', padding: '0 2px' }}>
                                <table className="w-full border-collapse mb-1" style={{ border: `1px solid ${colorBorder}` }}>
                                    <tbody>
                                        <tr>
                                            <th colSpan={3} className="text-center font-bold p-[3px]" style={{ backgroundColor: colorSectionBg, border: `1px solid ${colorBorder}` }}>
                                                ATTENDANCE
                                            </th>
                                        </tr>
                                        <tr style={{ fontSize: '9px' }}>
                                            <td className="text-center p-[3px] border border-b-0" style={{ borderColor: colorBorder }}>No. of Times<br />School Opened</td>
                                            <td className="text-center p-[3px] border border-b-0" style={{ borderColor: colorBorder }}>No. of Times<br />Present</td>
                                            <td className="text-center p-[3px] border border-b-0" style={{ borderColor: colorBorder }}>No. of Times<br />Absent</td>
                                        </tr>
                                        <tr>
                                            <td className="text-center p-[3px] border" style={{ borderColor: colorBorder }}>{data.academicInfo.timesOpened || 0}</td>
                                            <td className="text-center p-[3px] border" style={{ borderColor: colorBorder }}>{data.academicInfo.timesPresent || 0}</td>
                                            <td className="text-center p-[3px] border" style={{ borderColor: colorBorder }}>{data.academicInfo.timesAbsent || 0}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table className="w-full border-collapse" style={{ border: `1px solid ${colorBorder}` }}>
                                    <tbody>
                                        <tr>
                                            <th colSpan={3} className="text-center font-bold p-[3px]" style={{ backgroundColor: colorSectionBg, border: `1px solid ${colorBorder}` }}>
                                                TERMINAL DURATION ({data.academicInfo.terminalDuration || ''})
                                            </th>
                                        </tr>
                                        <tr style={{ fontSize: '9px' }}>
                                            <td className="text-center p-[3px] border border-b-0" style={{ borderColor: colorBorder }}>Term Begins</td>
                                            <td className="text-center p-[3px] border border-b-0" style={{ borderColor: colorBorder }}>Term Ends</td>
                                            <td className="text-center p-[3px] border border-b-0" style={{ borderColor: colorBorder }}>Next Term Begins</td>
                                        </tr>
                                        <tr>
                                            <td className="text-center p-[3px] border font-bold" style={{ borderColor: colorBorder }}>{data.academicInfo.termBegins || ''}</td>
                                            <td className="text-center p-[3px] border font-bold" style={{ borderColor: colorBorder }}>{data.academicInfo.termEnds || ''}</td>
                                            <td className="text-center p-[3px] border font-bold" style={{ borderColor: colorBorder }}>{data.academicInfo.nextTermBegins || ''}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>

                            {/* Summary */}
                            <td width="20%" style={{ verticalAlign: 'top', padding: '0 0 0 2px' }}>
                                <table className="w-full border-collapse mb-1" style={{ border: `1px solid ${colorBorder}` }}>
                                    <tbody>
                                        <tr>
                                            <td className="text-center font-bold p-[3px] border" style={{ fontSize: '9px', borderColor: colorBorder }}>TOTAL SCORE<br />OBTAINABLE</td>
                                            <td className="text-center font-bold p-[3px] border font-black" style={{ borderColor: colorBorder }}>{data.summary.totalObtainable || 0}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-center font-bold p-[3px] border" style={{ fontSize: '9px', borderColor: colorBorder }}>TOTAL SCORE<br />OBTAINED</td>
                                            <td className="text-center font-bold p-[3px] border font-black" style={{ borderColor: colorBorder }}>{data.summary.totalObtained || 0}</td>
                                        </tr>
                                        {config.showAverage && (
                                            <tr>
                                                <td className="text-center font-bold p-[3px] border" style={{ fontSize: '9px', borderColor: colorBorder }}>{data.examGroup.term?.toLowerCase() === 'third term' ? 'TERM AVG' : 'AVERAGE SCORE'}</td>
                                                <td className="text-center font-bold p-[3px] border font-black" style={{ borderColor: colorBorder }}>{data.summary.averageScore.toFixed(1)}</td>
                                            </tr>
                                        )}
                                        {isThirdTerm && config.showCumulative && data.summary.cumulativeAvg && (
                                            <tr style={{ backgroundColor: '#f0fdf4' }}>
                                                <td className="text-center font-black p-[3px] border" style={{ fontSize: '9px', borderColor: colorBorder }}>CUM. AVG</td>
                                                <td className="text-center font-black p-[3px] border font-black text-primary" style={{ borderColor: colorBorder }}>{data.summary.cumulativeAvg.toFixed(1)}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                <table className="w-full border-collapse" style={{ border: `1px solid ${colorBorder}` }}>
                                    <tbody>
                                        <tr>
                                            <td className="text-center font-bold p-[3px] border" style={{ fontSize: '9px', borderColor: colorBorder }}>No. in Class</td>
                                            {config.showClassPosition && <td className="text-center font-bold p-[3px] border" style={{ fontSize: '9px', borderColor: colorBorder }}>Position</td>}
                                        </tr>
                                        <tr>
                                            <td className="text-center p-[3px] border font-black" style={{ borderColor: colorBorder }}>{data.summary.classSize || 0}</td>
                                            {config.showClassPosition && <td className="text-center p-[3px] border font-black" style={{ borderColor: colorBorder }}>{formatSuffix(data.summary.position)}</td>}
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ACADEMIC PERFORMANCE HEADER */}
                <div
                    className="text-center font-bold p-0.5 uppercase mb-0 mt-1"
                    style={{ backgroundColor: colorSectionBg, border: `1px solid ${colorPrimary}` }}
                >
                    ACADEMIC PERFORMANCE
                </div>

                {/* ACADEMIC PERFORMANCE TABLE */}
                <table className="w-full border-collapse" style={{ border: `1px solid ${colorBorder}` }}>
                    <thead>
                        <tr style={{ backgroundColor: colorSectionBg, fontSize: '10px' }}>
                            <th className="border p-1 text-left" rowSpan={2} style={{ borderColor: colorBorder, width: '20%' }}>SUBJECT</th>
                            <th className="border p-0 text-center" colSpan={assessments.length} style={{ borderColor: colorBorder }}>ASSESSMENTS</th>
                            <th className="border p-1 text-center" rowSpan={2} style={{ borderColor: colorBorder, width: '7%' }}>TOTAL<br />SCORE</th>
                            {config.showHighest && <th className="border p-1 text-center" rowSpan={2} style={{ borderColor: colorBorder, width: '7%' }}>HIGHEST<br />IN CLASS</th>}
                            {config.showLowest && <th className="border p-1 text-center" rowSpan={2} style={{ borderColor: colorBorder, width: '7%' }}>LOWEST<br />IN CLASS</th>}
                            {config.showAverage && <th className="border p-1 text-center" rowSpan={2} style={{ borderColor: colorBorder, width: '7%' }}>CLASS<br />AVERAGE</th>}
                            {config.showSubjectPosition && <th className="border p-1 text-center" rowSpan={2} style={{ borderColor: colorBorder, width: '7%' }}>POS.</th>}
                            {isThirdTerm && config.showCumulative && (
                                <>
                                    <th className="border p-1 text-center" rowSpan={2} style={{ borderColor: colorBorder, width: '5%' }}>1ST T</th>
                                    <th className="border p-1 text-center" rowSpan={2} style={{ borderColor: colorBorder, width: '5%' }}>2ND T</th>
                                    <th className="border p-1 text-center font-bold" rowSpan={2} style={{ borderColor: colorBorder, width: '6%', backgroundColor: '#f0fdf4' }}>CUM.<br />TOT</th>
                                    <th className="border p-1 text-center font-bold" rowSpan={2} style={{ borderColor: colorBorder, width: '6%', backgroundColor: '#f0fdf4' }}>CUM.<br />AVG</th>
                                </>
                            )}
                            <th className="border p-1 text-center" rowSpan={2} style={{ borderColor: colorBorder, width: '5%' }}>GRADE</th>
                            <th className="border p-1 text-center" rowSpan={2} style={{ borderColor: colorBorder, width: '12%' }}>REMARKS</th>
                        </tr>
                        <tr style={{ backgroundColor: colorSectionBg, fontSize: '9px' }}>
                            {assessments.map(ass => (
                                <th key={ass.id} className="border p-1 text-center" style={{ borderColor: colorBorder }}>
                                    {ass.name}<br />({ass.maxMarks})
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.subjects.map((subj, i) => (
                            <tr key={i} style={{ fontSize: '10px' }}>
                                <td className="border p-[3px] text-left font-bold" style={{ borderColor: colorBorder }}>{subj.subjectName}</td>
                                {assessments.map(ass => (
                                    <td key={ass.id} className="border p-[3px] text-center" style={{ borderColor: colorBorder }}>
                                        {subj.scores[ass.id] ?? ''}
                                    </td>
                                ))}
                                <td className="border p-[3px] text-center font-bold" style={{ borderColor: colorBorder }}>{subj.totalScore || 0}</td>
                                {config.showHighest && <td className="border p-[3px] text-center" style={{ borderColor: colorBorder }}>{subj.highestInClass || '-'}</td>}
                                {config.showLowest && <td className="border p-[3px] text-center" style={{ borderColor: colorBorder }}>{subj.lowestInClass || '-'}</td>}
                                {config.showAverage && <td className="border p-[3px] text-center" style={{ borderColor: colorBorder }}>{subj.classAvg ? subj.classAvg.toFixed(1) : '-'}</td>}
                                {config.showSubjectPosition && <td className="border p-[3px] text-center" style={{ borderColor: colorBorder }}>{subj.positionInSubject || '-'}</td>}
                                {isThirdTerm && config.showCumulative && (
                                    <>
                                        <td className="border p-[3px] text-center" style={{ borderColor: colorBorder }}>{subj.cumulative?.term1 ?? '-'}</td>
                                        <td className="border p-[3px] text-center" style={{ borderColor: colorBorder }}>{subj.cumulative?.term2 ?? '-'}</td>
                                        <td className="border p-[3px] text-center font-bold" style={{ borderColor: colorBorder, backgroundColor: '#f0fdf4' }}>
                                            {(subj.cumulative?.term1 || 0) + (subj.cumulative?.term2 || 0) + subj.totalScore}
                                        </td>
                                        <td className="border p-[3px] text-center font-bold" style={{ borderColor: colorBorder, backgroundColor: '#f0fdf4' }}>
                                            {(((subj.cumulative?.term1 || 0) + (subj.cumulative?.term2 || 0) + subj.totalScore) / 3).toFixed(1)}
                                        </td>
                                    </>
                                )}
                                <td className="border p-[3px] text-center font-bold" style={{ borderColor: colorBorder }}>{subj.grade}</td>
                                <td className="border p-[3px] text-center font-bold" style={{ fontSize: '9px', borderColor: colorBorder }}>{subj.remark}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* KEYS TO RATING */}
                <div
                    className="text-center font-bold p-0.5 uppercase mt-1"
                    style={{ backgroundColor: colorSectionBg, border: `1px solid ${colorPrimary}`, fontSize: '9px' }}
                >
                    KEYS TO RATING
                </div>
                <table className="w-full border-collapse" style={{ fontSize: '9px', border: `1px solid ${colorBorder}` }}>
                    <tbody>
                        <tr>
                            <td className="text-center border p-0.5" style={{ borderColor: colorBorder }}>100-70 (EXCELLENT)</td>
                            <td className="text-center border p-0.5" style={{ borderColor: colorBorder }}>60-69 (VERY GOOD)</td>
                            <td className="text-center border p-0.5" style={{ borderColor: colorBorder }}>50-59 (GOOD)</td>
                            <td className="text-center border p-0.5" style={{ borderColor: colorBorder }}>45-49 (FAIR)</td>
                            <td className="text-center border p-0.5" style={{ borderColor: colorBorder }}>40-44 (POOR)</td>
                            <td className="text-center border p-0.5" style={{ borderColor: colorBorder }}>0-39 (VERY POOR)</td>
                        </tr>
                    </tbody>
                </table>

                {/* TRAITS & SKILLS GRID */}
                <table className="w-full mt-1 border-collapse" style={{ tableLayout: 'fixed' }}>
                    <tbody>
                        <tr>
                            <td width="50%" style={{ paddingRight: '2px', verticalAlign: 'top' }}>
                                <table className="w-full border-collapse" style={{ border: `1px solid ${colorBorder}` }}>
                                    <tbody>
                                        <tr>
                                            <th colSpan={6} className="text-center font-bold p-[3px]" style={{ backgroundColor: colorSectionBg, border: `1px solid ${colorBorder}` }}>
                                                AFFECTIVE TRAITS
                                            </th>
                                        </tr>
                                        <tr style={{ fontSize: '9px' }}>
                                            <th className="border" style={{ borderColor: colorBorder, width: '40%' }}></th>
                                            <th className="border" style={{ borderColor: colorBorder }}>1</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>2</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>3</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>4</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>5</th>
                                        </tr>
                                        {/* Dynamic Affective Traits */}
                                        {(data.affectiveTraits && data.affectiveTraits.length > 0 ? data.affectiveTraits : [
                                            { name: 'Punctuality', rating: 1 }, { name: 'Neatness', rating: 1 },
                                            { name: 'Politeness', rating: 1 }, { name: 'Attendance', rating: 1 },
                                            { name: 'Co-operation', rating: 1 }, { name: 'Self control', rating: 1 },
                                            { name: 'Sense of responsibility', rating: 1 }, { name: 'Industry', rating: 1 },
                                            { name: 'Persistence', rating: 1 }
                                        ]).map((t, i) => (
                                            <tr key={i}>
                                                <td className="border p-0.5 px-1 truncate" style={{ fontSize: '9px', borderColor: colorBorder }}>{t.name}</td>
                                                {[1, 2, 3, 4, 5].map(v => (
                                                    <td key={v} className="border text-center p-0.5" style={{ borderColor: colorBorder, minWidth: '20px' }}>
                                                        {t.rating === v ? '✓' : ''}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </td>
                            <td width="50%" style={{ paddingLeft: '2px', verticalAlign: 'top' }}>
                                <table className="w-full border-collapse" style={{ border: `1px solid ${colorBorder}` }}>
                                    <tbody>
                                        <tr>
                                            <th colSpan={6} className="text-center font-bold p-[3px]" style={{ backgroundColor: colorSectionBg, border: `1px solid ${colorBorder}` }}>
                                                PSYCHOMOTOR SKILLS
                                            </th>
                                        </tr>
                                        <tr style={{ fontSize: '9px' }}>
                                            <th className="border" style={{ borderColor: colorBorder, width: '40%' }}></th>
                                            <th className="border" style={{ borderColor: colorBorder }}>1</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>2</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>3</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>4</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>5</th>
                                        </tr>
                                        {/* Dynamic Psychomotor Skills */}
                                        {(data.psychomotorSkills && data.psychomotorSkills.length > 0 ? data.psychomotorSkills : [
                                            { name: 'Hand Writing', rating: 1 }, { name: 'Fluency', rating: 1 },
                                            { name: 'Games', rating: 1 }, { name: 'Sports', rating: 1 },
                                            { name: 'Crafts', rating: 1 }, { name: 'Drawing', rating: 1 }
                                        ]).map((s, i) => (
                                            <tr key={i}>
                                                <td className="border p-0.5 px-1 truncate" style={{ fontSize: '9px', borderColor: colorBorder }}>{s.name}</td>
                                                {[1, 2, 3, 4, 5].map(v => (
                                                    <td key={v} className="border text-center p-0.5" style={{ borderColor: colorBorder, minWidth: '20px' }}>
                                                        {s.rating === v ? '✓' : ''}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="mt-1" style={{ border: `1px solid ${colorPrimary}` }}>
                                    <div className="p-0.5 font-bold uppercase text-center" style={{ backgroundColor: colorSectionBg, borderBottom: `1px solid ${colorPrimary}`, fontSize: '9px' }}>
                                        KEYS TO RATING
                                    </div>
                                    <div className="p-1 px-2" style={{ fontSize: '9px' }}>
                                        <div className="mb-px font-bold">5. Excellent</div>
                                        <div className="mb-px font-bold">4. Good</div>
                                        <div className="mb-px font-bold">3. Fair</div>
                                        <div className="mb-px font-bold">2. Poor</div>
                                        <div className="font-bold">1. Very Poor</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* FOOTER SECTION */}
                <div className="mt-1 border-[2px]" style={{ borderColor: colorPrimary }}>
                    <table className="w-full border-collapse">
                        <tbody>
                            <tr>
                                <td className="p-1 pr-2 align-top">
                                    <div className="pb-2 mb-2 border-b" style={{ borderColor: colorPrimary }}>
                                        <span className="font-bold">Class Teacher's Comments:</span> <span className="font-bold italic uppercase">{getTeacherComment(data.summary.averageScore)}</span>
                                        <div className="float-right font-bold text-[10px] mt-1">
                                            <span>Sign.:</span> 
                                            <span className="inline-block w-[60px] border-b border-black text-center h-[24px] align-middle relative">
                                                {data.academicInfo.classTeacherSignature ? (
                                                    <img src={data.academicInfo.classTeacherSignature} alt="Teacher Sign" className="absolute inset-0 w-full h-full object-contain -top-2" />
                                                ) : <span className="opacity-60">✒️</span>}
                                            </span>
                                            <span className="ml-4">Date:</span> <span>{new Date().toLocaleDateString()}</span>
                                        </div>
                                        <div className="clear-both"></div>
                                    </div>
                                    <div className="pb-2 mb-2 border-b" style={{ borderColor: colorPrimary }}>
                                        <span className="font-bold">Principal's Comments:</span> <span className="font-bold italic uppercase">{getPrincipalComment(data.summary.averageScore)}</span>
                                        <div className="float-right font-bold text-[10px] mt-1 md:mt-2">
                                            <span>Sign.:</span> 
                                            <span className="inline-block w-[60px] border-b border-black text-center h-[24px] align-middle relative">
                                                {data.academicInfo.principalSignature || settings?.invoiceLogo ? (
                                                    <img src={data.academicInfo.principalSignature || getFullUrl(settings?.invoiceLogo || '')} alt="Principal Sign" className="absolute inset-0 w-full h-full object-contain -top-2" />
                                                ) : <span className="opacity-60">🖊️</span>}
                                            </span>
                                            <span className="ml-4">Date:</span> <span>{new Date().toLocaleDateString()}</span>
                                        </div>
                                        <div className="clear-both"></div>
                                    </div>
                                    <div>
                                        <span className="font-bold underline italic">Promotion Status:</span> <span className="font-black uppercase ml-1">{data.academicInfo.promotionStatus || (data.summary.averageScore >= 50 ? 'PROMOTED' : data.summary.averageScore >= 45 ? 'PROMOTED ON TRIAL' : 'NOT PROMOTED')}</span>
                                    </div>
                                </td>
                                <td className="w-[110px] border-l-[2px] align-middle text-center p-2" style={{ borderColor: colorPrimary }}>
                                    <div className="h-[70px] flex items-center justify-center font-bold uppercase" style={{ color: colorPrimary }}>
                                        <div className="w-16 h-16 rounded-full border-[3px] border-red-600 flex items-center justify-center p-1 -rotate-[22deg] opacity-60">
                                            <span className="text-[7px] text-red-600 leading-tight">STAMP/<br />SEAL</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 5mm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    .main-container {
                        width: 100%;
                        max-width: 100%;
                        margin: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default ReportCardTemplate;
