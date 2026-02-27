import React from 'react';

export interface ReportCardSubject {
    subjectName: string;
    ca1?: number;
    ca2?: number;
    examScore?: number;
    totalScore: number;
    highestInClass?: number;
    lowestInClass?: number;
    classAvg?: number;
    positionInSubject?: string | number;
    grade: string;
    remark: string;
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
    };
    subjects: ReportCardSubject[];
    summary: {
        totalObtainable: number;
        totalObtained: number;
        averageScore: number;
        position?: string | number;
        classSize?: number;
    };
}

interface Props {
    data: ReportCardData;
}

const ReportCardTemplate: React.FC<Props> = ({ data }) => {
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

    // Constants from the Blade template
    const colorPrimary = '#2aa06c';
    const colorHeaderBg = '#eaf6f0';
    const colorSectionBg = '#d9ead3';
    const colorBorder = '#218b12ff';

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
                                {data.student.photoUrl ? (
                                    <img src="/logo.png" className="w-[60px] h-[60px] object-contain mx-auto" alt="Logo" />
                                ) : (
                                    <div className="w-[60px] h-[60px] bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-[10px] mx-auto uppercase">Logo</div>
                                )}
                            </td>
                            <td className="text-center">
                                <div className="text-[16px] font-bold uppercase">HISGRACE INTERNATIONAL SCHOOL</div>
                                <div className="text-[11px]">Lagos, Nigeria</div>
                                <div className="italic mt-0.5 text-[11px]">"Excellence & Integrity"</div>
                            </td>
                            <td width="15%" className="text-center p-1">
                                <div className="w-[60px] h-[60px] bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-[10px] mx-auto uppercase">Logo</div>
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

                            {/* Photo */}
                            <td width="15%" style={{ verticalAlign: 'top', padding: '0 2px' }}>
                                <div className="mx-auto flex items-center justify-center border border-gray-300 overflow-hidden" style={{ width: '95px', height: '100px' }}>
                                    {data.student.photoUrl ? (
                                        <img src={data.student.photoUrl} className="w-full h-full object-cover" alt="Student" />
                                    ) : (
                                        <span className="text-gray-300 text-[10px] font-bold">PHOTO</span>
                                    )}
                                </div>
                            </td>

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
                                        <tr>
                                            <td className="text-center font-bold p-[3px] border" style={{ fontSize: '9px', borderColor: colorBorder }}>TERM AVERAGE</td>
                                            <td className="text-center font-bold p-[3px] border font-black" style={{ borderColor: colorBorder }}>{data.summary.averageScore.toFixed(1)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table className="w-full border-collapse" style={{ border: `1px solid ${colorBorder}` }}>
                                    <tbody>
                                        <tr>
                                            <td className="text-center font-bold p-[3px] border" style={{ fontSize: '9px', borderColor: colorBorder }}>No. in Class</td>
                                            <td className="text-center font-bold p-[3px] border" style={{ fontSize: '9px', borderColor: colorBorder }}>Position</td>
                                        </tr>
                                        <tr>
                                            <td className="text-center p-[3px] border font-black" style={{ borderColor: colorBorder }}>{data.summary.classSize || 0}</td>
                                            <td className="text-center p-[3px] border font-black" style={{ borderColor: colorBorder }}>{formatSuffix(data.summary.position)}</td>
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
                            <th className="border p-1 text-left" width="20%" rowSpan={2} style={{ borderColor: colorBorder }}>SUBJECT</th>
                            <th className="border p-0 text-center" colSpan={2} style={{ borderColor: colorBorder }}>CA</th>
                            <th className="border p-1 text-center" width="5%" rowSpan={2} style={{ borderColor: colorBorder }}>EXAM</th>
                            <th className="border p-1 text-center" width="7%" rowSpan={2} style={{ borderColor: colorBorder }}>TOTAL<br />SCORE</th>
                            <th className="border p-1 text-center" width="7%" rowSpan={2} style={{ borderColor: colorBorder }}>HIGHEST<br />IN CLASS</th>
                            <th className="border p-1 text-center" width="7%" rowSpan={2} style={{ borderColor: colorBorder }}>LOWEST<br />IN CLASS</th>
                            <th className="border p-1 text-center" width="7%" rowSpan={2} style={{ borderColor: colorBorder }}>CLASS<br />AVERAGE</th>
                            <th className="border p-1 text-center" width="7%" rowSpan={2} style={{ borderColor: colorBorder }}>POSITION IN<br />SUBJECT</th>
                            <th className="border p-1 text-center" width="5%" rowSpan={2} style={{ borderColor: colorBorder }}>GRADE</th>
                            <th className="border p-1 text-center" width="10%" rowSpan={2} style={{ borderColor: colorBorder }}>REMARKS</th>
                        </tr>
                        <tr style={{ backgroundColor: colorSectionBg, fontSize: '10px' }}>
                            <th className="border p-1" width="5%" style={{ borderColor: colorBorder }}>20</th>
                            <th className="border p-1" width="5%" style={{ borderColor: colorBorder }}>20</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.subjects.map((score, i) => (
                            <tr key={i} style={{ fontSize: '10px' }}>
                                <td className="border p-[3px] text-left font-bold" style={{ borderColor: colorBorder }}>{score.subjectName}</td>
                                <td className="border p-[3px] text-center" style={{ borderColor: colorBorder }}>{score.ca1 || ''}</td>
                                <td className="border p-[3px] text-center" style={{ borderColor: colorBorder }}>{score.ca2 || ''}</td>
                                <td className="border p-[3px] text-center" style={{ borderColor: colorBorder }}>{score.examScore || ''}</td>
                                <td className="border p-[3px] text-center font-bold" style={{ borderColor: colorBorder }}>{score.totalScore || 0}</td>
                                <td className="border p-[3px] text-center" style={{ borderColor: colorBorder }}>{score.highestInClass || '-'}</td>
                                <td className="border p-[3px] text-center" style={{ borderColor: colorBorder }}>{score.lowestInClass || '-'}</td>
                                <td className="border p-[3px] text-center" style={{ borderColor: colorBorder }}>{score.classAvg ? score.classAvg.toFixed(1) : '-'}</td>
                                <td className="border p-[3px] text-center" style={{ borderColor: colorBorder }}>{score.positionInSubject || '-'}</td>
                                <td className="border p-[3px] text-center font-bold" style={{ borderColor: colorBorder }}>{score.grade}</td>
                                <td className="border p-[3px] text-center font-bold" style={{ fontSize: '9px', borderColor: colorBorder }}>{score.remark}</td>
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
                                            <th width="40%" className="border" style={{ borderColor: colorBorder }}></th>
                                            <th className="border" style={{ borderColor: colorBorder }}>1</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>2</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>3</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>4</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>5</th>
                                        </tr>
                                        {[
                                            { n: 'Punctuality', r: 1 }, { n: 'Neatness', r: 1 },
                                            { n: 'Politeness', r: 1 }, { n: 'Attendance', r: 1 },
                                            { n: 'Co-operation', r: 1 }, { n: 'Self control', r: 1 },
                                            { n: 'Sense of responsibility', r: 1 }, { n: 'Industry', r: 1 },
                                            { n: 'Persistence', r: 1 }
                                        ].map((t, i) => (
                                            <tr key={i}>
                                                <td className="border p-0.5 px-1 truncate" style={{ fontSize: '9px', borderColor: colorBorder }}>{t.n}</td>
                                                {[1, 2, 3, 4, 5].map(v => (
                                                    <td key={v} className="border text-center p-0.5" style={{ borderColor: colorBorder, minWidth: '20px' }}>
                                                        {t.r === v ? '✓' : ''}
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
                                            <th width="40%" className="border" style={{ borderColor: colorBorder }}></th>
                                            <th className="border" style={{ borderColor: colorBorder }}>1</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>2</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>3</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>4</th>
                                            <th className="border" style={{ borderColor: colorBorder }}>5</th>
                                        </tr>
                                        {[
                                            { n: 'Hand Writing', r: 1 }, { n: 'Fluency', r: 1 },
                                            { n: 'Games', r: 1 }, { n: 'Sports', r: 1 },
                                            { n: 'Crafts', r: 1 }, { n: 'Drawing', r: 1 }
                                        ].map((s, i) => (
                                            <tr key={i}>
                                                <td className="border p-0.5 px-1 truncate" style={{ fontSize: '9px', borderColor: colorBorder }}>{s.n}</td>
                                                {[1, 2, 3, 4, 5].map(v => (
                                                    <td key={v} className="border text-center p-0.5" style={{ borderColor: colorBorder, minWidth: '20px' }}>
                                                        {s.r === v ? '✓' : ''}
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
                                        <span className="font-bold">Class Teacher's Comments:</span> <span className="font-bold italic uppercase">Very Good Result</span>
                                        <div className="float-right font-bold text-[10px] mt-1">
                                            <span>Sign.:</span> <span className="inline-block w-[60px] border-b border-black text-center h-[20px] align-middle opacity-60">✒️</span>
                                            <span className="ml-4">Date:</span> <span>04/02/2026</span>
                                        </div>
                                        <div className="clear-both"></div>
                                    </div>
                                    <div className="pb-2 mb-2 border-b" style={{ borderColor: colorPrimary }}>
                                        <span className="font-bold">Principal's Comments:</span> <span className="font-bold italic uppercase">Very Good Result, Keep it up</span>
                                        <div className="float-right font-bold text-[10px] mt-1">
                                            <span>Sign.:</span> <span className="inline-block w-[60px] border-b border-black text-center h-[20px] align-middle opacity-60">🖊️</span>
                                            <span className="ml-4">Date:</span> <span>04/02/2026</span>
                                        </div>
                                        <div className="clear-both"></div>
                                    </div>
                                    <div>
                                        <span className="font-bold underline italic">Promotion Status:</span> <span className="font-black uppercase ml-1">PROMOTED TO (JSS 3)</span>
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

            <style jsx>{`
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
