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
        teacherComment?: string;
        principalComment?: string;
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
        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return num + "th";
        switch (lastDigit) {
            case 1: return num + "st";
            case 2: return num + "nd";
            case 3: return num + "rd";
            default: return num + "th";
        }
    };

    // Styling Constants from Blade Template
    const colorPrimary = '#2aa06c';
    const colorHeaderBg = '#eaf6f0';
    const colorSectionBg = '#d9ead3';
    const colorBorderGreen = '#218b12ff';

    const containerStyle: React.CSSProperties = {
        width: '100%',
        margin: '0 auto',
        padding: '0', 
        backgroundColor: 'white',
        color: '#000',
        fontFamily: "'DejaVu Sans', sans-serif",
        fontSize: '11px',
        lineHeight: '1.2',
        boxSizing: 'border-box',
        position: 'relative'
    };

    return (
        <div style={containerStyle} className="main-container bg-white">
            {/* Header Table */}
            <table className="w-full header-table mb-1" style={{ backgroundColor: colorHeaderBg, border: `1px solid ${colorPrimary}`, borderCollapse: 'collapse' }}>
                <tbody>
                    <tr>
                        <td style={{ width: '15%', textAlign: 'center', padding: '5px' }}>
                            {(settings.printLogo || settings.primaryLogo || settings.invoiceLogo) ? (
                                <img src={getFullUrl(settings.printLogo || settings.primaryLogo || settings.invoiceLogo)} style={{ width: '60px', height: '60px', objectFit: 'contain' }} alt="Logo" />
                            ) : (
                                <div style={{ width: '60px', height: '60px', background: '#9333ea', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px' }}>LOGO</div>
                            )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>{settings.schoolName || 'HISGRACE INTERNATIONAL SCHOOL'}</div>
                            <div>{settings.schoolAddress || 'Lagos, Nigeria'}</div>
                            <div style={{ fontStyle: 'italic', marginTop: '2px' }}>"{settings.schoolMotto || 'Excellence & Integrity'}"</div>
                        </td>
                        <td style={{ width: '15%', textAlign: 'center', padding: '5px' }}>
                            {(settings.primaryLogo || settings.invoiceLogo || settings.printLogo) ? (
                                <img src={getFullUrl(settings.primaryLogo || settings.invoiceLogo || settings.printLogo)} style={{ width: '60px', height: '60px', objectFit: 'contain' }} alt="Logo" />
                            ) : (
                                <div style={{ width: '60px', height: '60px', background: '#9333ea', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px' }}>LOGO</div>
                            )}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', margin: '4px 0', textTransform: 'uppercase' }}>
                {data.examGroup.name} {data.examGroup.term?.toUpperCase()} REPORT SHEET
            </div>

            {/* Student Info Grid */}
            <table style={{ width: '100%', marginBottom: '4px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <tbody>
                    <tr>
                        {/* Col 1: Personal Data */}
                        <td style={{ width: config.showPhoto ? '35%' : '50%', verticalAlign: 'top', padding: '0 2px 0 0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${colorBorderGreen}` }}>
                                <tbody>
                                    <tr><th colSpan={2} style={{ backgroundColor: colorSectionBg, border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>STUDENT'S PERSONAL DATA</th></tr>
                                    <tr><td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px' }}>Name</td><td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', fontWeight: 'bold', textTransform: 'uppercase' }}>{data.student.name}</td></tr>
                                    <tr><td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px' }}>Date of Birth</td><td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px' }}>{data.student.dateOfBirth || ''}</td></tr>
                                    <tr><td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px' }}>Sex</td><td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textTransform: 'uppercase' }}>{data.student.sex || ''}</td></tr>
                                    <tr><td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px' }}>Class</td><td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textTransform: 'uppercase' }}>{data.student.class}</td></tr>
                                    <tr><td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px' }}>Admission No.</td><td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px' }}>{data.student.admissionNumber}</td></tr>
                                </tbody>
                            </table>
                        </td>

                        {/* Col 2: Photo */}
                        {config.showPhoto && (
                            <td style={{ width: '15%', verticalAlign: 'top', padding: '0 2px' }}>
                                <div style={{ height: '100px', width: '95px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', margin: '0 auto' }}>
                                    {data.student.photoUrl ? (
                                        <img src={getFullUrl(data.student.photoUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Student" />
                                    ) : (
                                        <span style={{ color: '#ccc', fontSize: '10px' }}>PHOTO</span>
                                    )}
                                </div>
                            </td>
                        )}

                        {/* Col 3: Attendance & Duration */}
                        <td style={{ width: config.showPhoto ? '30%' : (config.showAttendance ? '30%' : '50%'), verticalAlign: 'top', padding: '0 2px' }}>
                            {config.showAttendance ? (
                                <>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${colorBorderGreen}`, marginBottom: '3px' }}>
                                        <tbody>
                                            <tr><th colSpan={3} style={{ backgroundColor: colorSectionBg, border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>ATTENDANCE</th></tr>
                                            <tr style={{ fontSize: '9px' }}>
                                                <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '1px', textAlign: 'center' }}>No. of Times<br />School Opened</td>
                                                <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '1px', textAlign: 'center' }}>No. of Times<br />Present</td>
                                                <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '1px', textAlign: 'center' }}>No. of Times<br />Absent</td>
                                            </tr>
                                            <tr>
                                                <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{data.academicInfo.timesOpened || 0}</td>
                                                <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{data.academicInfo.timesPresent || 0}</td>
                                                <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{data.academicInfo.timesAbsent || 0}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${colorBorderGreen}` }}>
                                        <tbody>
                                            <tr><th colSpan={3} style={{ backgroundColor: colorSectionBg, border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>TERMINAL DURATION ({data.academicInfo.terminalDuration || ''})</th></tr>
                                            <tr style={{ fontSize: '9px' }}>
                                                <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '1px', textAlign: 'center' }}>Term Begins</td>
                                                <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '1px', textAlign: 'center' }}>Term Ends</td>
                                                <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '1px', textAlign: 'center' }}>Next Term Begins</td>
                                            </tr>
                                            <tr>
                                                <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{data.academicInfo.termBegins || ''}</td>
                                                <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{data.academicInfo.termEnds || ''}</td>
                                                <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{data.academicInfo.nextTermBegins || ''}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </>
                            ) : (
                                <div style={{ height: '10px' }} />
                            )}
                        </td>

                        {/* Col 4: Summary */}
                        <td style={{ width: '20%', verticalAlign: 'top', padding: '0 0 0 2px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${colorBorderGreen}`, marginBottom: '3px' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', fontWeight: 'bold', textAlign: 'center', fontSize: '9px' }}>TOTAL SCORE<br />OBTAINABLE</td>
                                        <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', fontWeight: 'bold' }}>{data.summary.totalObtainable || 0}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', fontWeight: 'bold', textAlign: 'center', fontSize: '9px' }}>TOTAL SCORE<br />OBTAINED</td>
                                        <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', fontWeight: 'bold' }}>{data.summary.totalObtained || 0}</td>
                                    </tr>
                                    {config.showAverage && (
                                        <tr>
                                            <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', fontWeight: 'bold', textAlign: 'center', fontSize: '9px' }}>TERM AVERAGE</td>
                                            <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', fontWeight: 'bold' }}>{data.summary.averageScore.toFixed(1)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {config.showClassPosition && (
                                <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${colorBorderGreen}` }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', fontWeight: 'bold', textAlign: 'center', fontSize: '9px' }}>No. in Class</td>
                                            <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', fontWeight: 'bold', textAlign: 'center', fontSize: '9px' }}>Position</td>
                                        </tr>
                                        <tr>
                                            <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{data.summary.classSize || 0}</td>
                                            <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{formatSuffix(data.summary.position)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Academic Performance Header */}
            <div style={{ backgroundColor: colorSectionBg, border: `1px solid ${colorPrimary}`, textAlign: 'center', fontWeight: 'bold', padding: '2px', marginTop: '4px', textTransform: 'uppercase' }}>
                ACADEMIC PERFORMANCE
            </div>

            {/* Academic Performance Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${colorBorderGreen}`, tableLayout: 'fixed' }}>
                <thead>
                    {(() => {
                        const examAss = assessments.find(a => a.name.toLowerCase().includes('exam'));
                        const caAsses = assessments.filter(a => a.id !== examAss?.id);
                        const caColSpan = caAsses.length || 1;

                        if (isThirdTerm) {
                            return (
                                <>
                                    <tr style={{ backgroundColor: colorSectionBg, fontSize: '9px' }}>
                                        <th rowSpan={3} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px' }}>SUBJECT</th>
                                        {config.showCumulative && <th colSpan={2} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>B/F</th>}
                                        <th colSpan={caColSpan} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>CA</th>
                                        <th rowSpan={3} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '5%' }}>EXAM</th>
                                        <th rowSpan={3} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '6%' }}>TOTAL</th>
                                        {config.showCumulative && <th rowSpan={3} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '6%' }}>CUM<br />TOT</th>}
                                        {config.showHighest && <th rowSpan={3} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '6%' }}>HIGH. IN CLASS</th>}
                                        {config.showLowest && <th rowSpan={3} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '6%' }}>LOW. IN CLASS</th>}
                                        {config.showAverage && <th rowSpan={3} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '6%' }}>CLASS<br />AVG</th>}
                                        {config.showSubjectPosition && <th rowSpan={3} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '6%' }}>POS.</th>}
                                        <th rowSpan={3} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '6%' }}>GRADE</th>
                                        <th rowSpan={3} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '9%' }}>REMARKS</th>
                                    </tr>
                                    <tr style={{ backgroundColor: colorSectionBg, fontSize: '9px' }}>
                                        {config.showCumulative && (
                                            <>
                                                <th rowSpan={2} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '6%' }}>1st</th>
                                                <th rowSpan={2} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '6%' }}>2nd</th>
                                            </>
                                        )}
                                        <th colSpan={caColSpan} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}></th>
                                    </tr>
                                    <tr style={{ backgroundColor: colorSectionBg, fontSize: '9px' }}>
                                        {caAsses.length > 0 ? caAsses.map(a => (
                                            <th key={a.id} style={{ border: `1px solid ${colorBorderGreen}`, padding: '2px', textAlign: 'center' }}>{a.maxMarks || 20}</th>
                                        )) : (
                                            <th style={{ border: `1px solid ${colorBorderGreen}`, padding: '2px', textAlign: 'center' }}>20</th>
                                        )}
                                    </tr>
                                </>
                            );
                        } else {
                            return (
                                <>
                                    <tr style={{ backgroundColor: colorSectionBg, fontSize: '10px' }}>
                                        <th rowSpan={2} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px' }}>SUBJECT</th>
                                        <th colSpan={caColSpan} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>CA</th>
                                        <th rowSpan={2} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '7%' }}>EXAM</th>
                                        <th rowSpan={2} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '8%' }}>TOTAL</th>
                                        {config.showHighest && <th rowSpan={2} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '7%' }}>HIGHEST</th>}
                                        {config.showLowest && <th rowSpan={2} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '7%' }}>LOWEST</th>}
                                        {config.showAverage && <th rowSpan={2} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '8%' }}>CLASS<br />AVG</th>}
                                        {config.showSubjectPosition && <th rowSpan={2} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '7%' }}>POS.</th>}
                                        <th rowSpan={2} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '7%' }}>GRADE</th>
                                        <th rowSpan={2} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', width: '11%' }}>REMARKS</th>
                                    </tr>
                                    <tr style={{ backgroundColor: colorSectionBg, fontSize: '10px' }}>
                                        {caAsses.length > 0 ? caAsses.map(a => (
                                            <th key={a.id} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{a.maxMarks || 20}</th>
                                        )) : (
                                            <th style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>20</th>
                                        )}
                                    </tr>
                                </>
                            );
                        }
                    })()}
                </thead>
                <tbody>
                    {(() => {
                        const examAss = assessments.find(a => a.name.toLowerCase().includes('exam'));
                        const caAsses = assessments.filter(a => a.id !== examAss?.id);
                        
                        return data.subjects.map((subj, i) => {
                            const examScore = examAss ? subj.scores[examAss.id] : undefined;
                            const cumTot = (subj.cumulative?.term1 || 0) + (subj.cumulative?.term2 || 0) + subj.totalScore;

                            return (
                                <tr key={i} style={{ fontSize: '10px' }}>
                                    <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'left' }}>{subj.subjectName}</td>
                                    {isThirdTerm && config.showCumulative && (
                                        <>
                                            <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{subj.cumulative?.term1 ?? '-'}</td>
                                            <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{subj.cumulative?.term2 ?? '-'}</td>
                                        </>
                                    )}
                                    {caAsses.length > 0 ? caAsses.map(a => (
                                        <td key={a.id} style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{subj.scores[a.id] ?? ''}</td>
                                    )) : (
                                        <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}></td>
                                    )}
                                    <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{examScore ?? ''}</td>
                                    <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{subj.totalScore || 0}</td>
                                    {isThirdTerm && config.showCumulative && (
                                        <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{cumTot}</td>
                                    )}
                                    {config.showHighest && <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{subj.highestInClass ?? '-'}</td>}
                                    {config.showLowest && <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{subj.lowestInClass ?? '-'}</td>}
                                    {config.showAverage && <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{subj.classAvg ? subj.classAvg.toFixed(1) : '-'}</td>}
                                    {config.showSubjectPosition && <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{subj.positionInSubject || '-'}</td>}
                                    <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>{subj.grade}</td>
                                    <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center', fontSize: '9px' }}>{subj.remark}</td>
                                </tr>
                            );
                        });
                    })()}
                    {/* Filler Rows */}
                    {(() => {
                        const examAss = assessments.find(a => a.name.toLowerCase().includes('exam'));
                        const caAsses = assessments.filter(a => a.id !== examAss?.id);
                        const caCount = caAsses.length || 1;
                        
                        return Array.from({ length: Math.max(0, 10 - data.subjects.length) }).map((_, i) => (
                            <tr key={i} style={{ height: '18px' }}>
                                <td style={{ border: `1px solid ${colorBorderGreen}` }}>&nbsp;</td>
                                {isThirdTerm && config.showCumulative && <><td style={{ border: `1px solid ${colorBorderGreen}` }}></td><td style={{ border: `1px solid ${colorBorderGreen}` }}></td></>}
                                {Array.from({ length: caCount }).map((_, idx) => (
                                    <td key={idx} style={{ border: `1px solid ${colorBorderGreen}` }}></td>
                                ))}
                                <td style={{ border: `1px solid ${colorBorderGreen}` }}></td><td style={{ border: `1px solid ${colorBorderGreen}` }}></td>
                                {isThirdTerm && config.showCumulative && <td style={{ border: `1px solid ${colorBorderGreen}` }}></td>}
                                {config.showHighest && <td style={{ border: `1px solid ${colorBorderGreen}` }}></td>}
                                {config.showLowest && <td style={{ border: `1px solid ${colorBorderGreen}` }}></td>}
                                {config.showAverage && <td style={{ border: `1px solid ${colorBorderGreen}` }}></td>}
                                {config.showSubjectPosition && <td style={{ border: `1px solid ${colorBorderGreen}` }}></td>}
                                <td style={{ border: `1px solid ${colorBorderGreen}` }}></td><td style={{ border: `1px solid ${colorBorderGreen}` }}></td>
                            </tr>
                        ));
                    })()}
                </tbody>
            </table>

            {/* Keys Area */}
            <div style={{ backgroundColor: colorSectionBg, border: `1px solid ${colorPrimary}`, textAlign: 'center', fontWeight: 'bold', padding: '1px', marginTop: '4px', fontSize: '9px' }}>
                KEYS TO RATING
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${colorBorderGreen}`, fontSize: '9px' }}>
                <tbody>
                    <tr>
                        <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '2px', textAlign: 'center' }}>100-70 (EXCELLENT)</td>
                        <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '2px', textAlign: 'center' }}>60-69 (VERY GOOD)</td>
                        <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '2px', textAlign: 'center' }}>50-59 (GOOD)</td>
                        <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '2px', textAlign: 'center' }}>45-49 (FAIR)</td>
                        <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '2px', textAlign: 'center' }}>40-44 (POOR)</td>
                        <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '2px', textAlign: 'center' }}>0-39 (VERY POOR)</td>
                    </tr>
                </tbody>
            </table>

            {/* Traits & Skills Row */}
            <table style={{ width: '100%', marginTop: '4px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <tbody>
                    <tr>
                        <td style={{ paddingRight: '2px', verticalAlign: 'top', width: '50%' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${colorBorderGreen}` }}>
                                <tbody>
                                    <tr><th colSpan={6} style={{ backgroundColor: colorSectionBg, border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>AFFECTIVE TRAITS</th></tr>
                                    <tr style={{ fontSize: '9px' }}>
                                        <th style={{ border: `1px solid ${colorBorderGreen}`, width: '40%' }}></th>
                                        <th style={{ border: `1px solid ${colorBorderGreen}` }}>1</th><th style={{ border: `1px solid ${colorBorderGreen}` }}>2</th><th style={{ border: `1px solid ${colorBorderGreen}` }}>3</th><th style={{ border: `1px solid ${colorBorderGreen}` }}>4</th><th style={{ border: `1px solid ${colorBorderGreen}` }}>5</th>
                                    </tr>
                                    {(data.affectiveTraits && data.affectiveTraits.length > 0 ? data.affectiveTraits : [
                                        { name: 'Punctuality', rating: 1 }, { name: 'Neatness', rating: 1 },
                                        { name: 'Politeness', rating: 1 }, { name: 'Attendance', rating: 1 },
                                        { name: 'Co-operation', rating: 1 }, { name: 'Self control', rating: 1 },
                                        { name: 'Sense of responsibility', rating: 1 }, { name: 'Industry', rating: 1 },
                                        { name: 'Persistence', rating: 1 }
                                    ]).map((t, i) => (
                                        <tr key={i}>
                                            <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '2px', fontSize: '9px' }}>{t.name}</td>
                                            {[1, 2, 3, 4, 5].map(v => (
                                                <td key={v} style={{ border: `1px solid ${colorBorderGreen}`, padding: '1px', textAlign: 'center' }}>
                                                    {t.rating === v ? <span style={{ fontFamily: 'DejaVu Sans', fontSize: '9px' }}>&#10003;</span> : ''}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </td>
                        <td style={{ paddingLeft: '2px', verticalAlign: 'top', width: '50%' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${colorBorderGreen}` }}>
                                <tbody>
                                    <tr><th colSpan={6} style={{ backgroundColor: colorSectionBg, border: `1px solid ${colorBorderGreen}`, padding: '3px', textAlign: 'center' }}>PSYCHOMOTOR SKILLS</th></tr>
                                    <tr style={{ fontSize: '9px' }}>
                                        <th style={{ border: `1px solid ${colorBorderGreen}`, width: '40%' }}></th>
                                        <th style={{ border: `1px solid ${colorBorderGreen}` }}>1</th><th style={{ border: `1px solid ${colorBorderGreen}` }}>2</th><th style={{ border: `1px solid ${colorBorderGreen}` }}>3</th><th style={{ border: `1px solid ${colorBorderGreen}` }}>4</th><th style={{ border: `1px solid ${colorBorderGreen}` }}>5</th>
                                    </tr>
                                    {(data.psychomotorSkills && data.psychomotorSkills.length > 0 ? data.psychomotorSkills : [
                                        { name: 'Hand Writing', rating: 1 }, { name: 'Fluency', rating: 1 },
                                        { name: 'Games', rating: 1 }, { name: 'Sports', rating: 1 },
                                        { name: 'Crafts', rating: 1 }, { name: 'Drawing', rating: 1 }
                                    ]).map((s, i) => (
                                        <tr key={i}>
                                            <td style={{ border: `1px solid ${colorBorderGreen}`, padding: '2px', fontSize: '9px' }}>{s.name}</td>
                                            {[1, 2, 3, 4, 5].map(v => (
                                                <td key={v} style={{ border: `1px solid ${colorBorderGreen}`, padding: '1px', textAlign: 'center' }}>
                                                    {s.rating === v ? <span style={{ fontFamily: 'DejaVu Sans', fontSize: '9px' }}>&#10003;</span> : ''}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            <div style={{ border: `1px solid ${colorPrimary}`, marginTop: '4px' }}>
                                <div style={{ backgroundColor: colorSectionBg, borderBottom: `1px solid ${colorPrimary}`, padding: '2px', fontSize: '9px', textAlign: 'center', fontWeight: 'bold' }}>KEYS TO RATING</div>
                                <div style={{ padding: '3px', fontSize: '9px' }}>
                                    <div style={{ marginBottom: '2px' }}>5. Excellent | 4. Good | 3. Fair | 2. Poor | 1. Very Poor</div>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Footer */}
            <div style={{ border: `2px solid ${colorPrimary}`, marginTop: '4px' }} className="footer-section">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '4px', verticalAlign: 'top' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ paddingBottom: '8px', borderBottom: `1px solid ${colorPrimary}` }}>
                                                <strong>Class Teacher's Comments:</strong> {data.academicInfo.teacherComment || ''}
                                                <span style={{ float: 'right' }}>
                                                    <strong>Sign.:</strong> 
                                                    {data.academicInfo.classTeacherSignature ? (
                                                        <img src={data.academicInfo.classTeacherSignature} alt="" style={{ height: '25px', maxWidth: '80px', objectFit: 'contain', verticalAlign: 'middle' }} />
                                                    ) : (
                                                        <span style={{ display: 'inline-block', width: '50px', borderBottom: '1px solid #000' }}></span>
                                                    )}
                                                    <strong>Date:</strong> {new Date().toLocaleDateString()}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ paddingTop: '8px', paddingBottom: '8px', borderBottom: `1px solid ${colorPrimary}` }}>
                                                <strong>Principal's Comments:</strong> {data.academicInfo.principalComment || ''}
                                                <span style={{ float: 'right' }}>
                                                    <strong>Sign.:</strong> 
                                                    {data.academicInfo.principalSignature || settings?.invoiceLogo ? (
                                                        <img src={data.academicInfo.principalSignature || getFullUrl(settings?.invoiceLogo || '')} alt="" style={{ height: '25px', maxWidth: '80px', objectFit: 'contain', verticalAlign: 'middle' }} />
                                                    ) : (
                                                        <span style={{ display: 'inline-block', width: '50px', borderBottom: '1px solid #000' }}></span>
                                                    )}
                                                    <strong>Date:</strong> {new Date().toLocaleDateString()}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ paddingTop: '8px' }}>
                                                <strong>Promotion Status:</strong> <span style={{ fontWeight: 'bold' }}>{data.academicInfo.promotionStatus || (data.summary.averageScore >= 50 ? 'PROMOTED TO NEXT CLASS' : 'NOT PROMOTED')}</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            <td style={{ width: '110px', borderLeft: `2px solid ${colorPrimary}`, verticalAlign: 'middle', textAlign: 'center' }}>
                                <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colorPrimary, fontWeight: 'bold' }}>
                                    {settings?.schoolStamp ? (
                                        <img src={getFullUrl(settings.schoolStamp)} alt="Stamp" style={{ maxWidth: '90px', maxHeight: '70px', objectFit: 'contain' }} />
                                    ) : (
                                        'STAMP'
                                    )}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <style>{`
                @media print {
                    @page { margin: 5mm; size: A4 portrait; }
                    body { margin: 0; padding: 0; background: white; }
                    .main-container { padding: 5mm !important; width: 100%; margin: 0; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
};

export default React.memo(ReportCardTemplate);
