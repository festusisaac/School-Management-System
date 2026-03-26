import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReportCardTemplate, { ReportCardData, ReportCardSubject } from '../../../components/examination/ReportCardTemplate';
import { examinationService } from '../../../services/examinationService';
import { systemService } from '../../../services/systemService';
import api from '../../../services/api';

const BulkReportCardPage = () => {
    const [searchParams] = useSearchParams();
    const classId = searchParams.get('classId');
    const examGroupId = searchParams.get('examGroupId');

    const [loading, setLoading] = useState(true);
    const [reportCards, setReportCards] = useState<ReportCardData[]>([]);
    const [assessments, setAssessments] = useState<any[]>([]);

    const [config] = useState<any>({
        showPhoto: true,
        showHighest: true,
        showLowest: true,
        showAverage: true,
        showSubjectPosition: true,
        showClassPosition: true,
        showAttendance: true,
        showCumulative: true,
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!classId || !examGroupId) return;

            try {
                // Fetch everything needed for all students
                const [
                    broadsheetResponse,
                    settings,
                    allSkills,
                    allPsyc,
                    affDomains,
                    psycDomains,
                    allSubjects,
                    assessmentTypes,
                    allMarks
                ] = await Promise.all([
                    examinationService.getBroadsheet(classId, examGroupId),
                    systemService.getSettings(),
                    examinationService.getSkills(examGroupId),
                    examinationService.getPsychomotor(examGroupId),
                    examinationService.getAffectiveDomains(),
                    examinationService.getPsychomotorDomains(),
                    api.getSubjects(),
                    examinationService.getAssessmentTypes(examGroupId),
                    examinationService.getClassMarks(classId, examGroupId)
                ]);

                setAssessments(assessmentTypes);

                const subjectMap = new Map();
                allSubjects.forEach((s: any) => subjectMap.set(s.id, s.name));

                const results = broadsheetResponse.results || [];
                const subjectEnrichedScores = broadsheetResponse.subjectScores || [];
                const subjectStats = broadsheetResponse.subjectStats || [];
                const cumulativeSubjectScores = broadsheetResponse.cumulativeSubjectScores || [];
                const cumulativeOverallResults = broadsheetResponse.cumulativeOverallResults || [];

                const getFullUrl = (path: string) => {
                    if (!path) return '';
                    if (path.startsWith('http')) return path;
                    const bUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
                    return bUrl.replace('/api', '') + (path.startsWith('/') ? '' : '/') + path;
                };
                
                const cards: ReportCardData[] = results.map((result: any) => {
                    const student = result.student;
                    if (!student) return null;

                    const studentMarks = allMarks.filter((m: any) => m.studentId === student.id);
                    const studentSubjects = Array.from(new Set(studentMarks.map((m: any) => m.subjectId)));

                    const processedSubjects: ReportCardSubject[] = studentSubjects.map((subId: any) => {
                        const scores: Record<string, number | undefined> = {};
                        assessmentTypes.forEach((ass: any) => {
                            const m = studentMarks.find((mark: any) => mark.assessmentTypeId === ass.id && mark.subjectId === subId);
                            scores[ass.id] = m ? m.score : undefined;
                        });

                        const enriched = subjectEnrichedScores.find((s: any) => (s.studentId || s.studentid) === student.id && (s.subjectId || s.subjectid) === subId);
                        const stats = subjectStats.find((s: any) => s.subjectId === subId);

                        return {
                            subjectName: subjectMap.get(subId) || 'Unknown',
                            scores,
                            totalScore: enriched?.totalSubjectScore || enriched?.totalsubjectscore || 0,
                            grade: enriched?.grade || 'F',
                            remark: enriched?.remark || 'VERY POOR',
                            highestInClass: stats ? parseFloat(stats.highestScore) : undefined,
                            lowestInClass: stats ? parseFloat(stats.lowestScore) : undefined,
                            classAvg: stats ? parseFloat(stats.averageScore) : undefined,
                            positionInSubject: enriched?.positionInSubject,
                            cumulative: {
                                term1: parseFloat(cumulativeSubjectScores.find((c: any) => 
                                    (c.studentId || c.studentid) === student.id && 
                                    (c.subjectId || c.subjectid) === subId && 
                                    (c.term?.toLowerCase().includes('first') || c.term?.toLowerCase().includes('1st'))
                                )?.termTotal || 0),
                                term2: parseFloat(cumulativeSubjectScores.find((c: any) => 
                                    (c.studentId || c.studentid) === student.id && 
                                    (c.subjectId || c.subjectid) === subId && 
                                    (c.term?.toLowerCase().includes('second') || c.term?.toLowerCase().includes('2nd'))
                                )?.termTotal || 0),
                            }
                        };
                    });

                    const studentSkills = allSkills
                        .filter((s: any) => s.studentId === student.id)
                        .map((s: any) => ({
                            name: affDomains.find((d: any) => d.id === s.domainId)?.name || 'Unknown',
                            rating: parseInt(s.rating) || 1
                        }));

                    const studentPsyc = allPsyc
                        .filter((p: any) => p.studentId === student.id)
                        .map((p: any) => ({
                            name: psycDomains.find((d: any) => d.id === p.domainId)?.name || 'Unknown',
                            rating: parseInt(p.rating) || 1
                        }));

                    return {
                        student: {
                            name: `${student.firstName} ${student.lastName}`,
                            dateOfBirth: student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A',
                            sex: student.gender || 'N/A',
                            admissionNumber: student.admissionNo || student.admissionNumber || 'N/A',
                            class: student.class?.name || 'N/A',
                            photoUrl: student.studentPhoto ? getFullUrl(student.studentPhoto) : undefined,
                        },
                        examGroup: {
                            name: broadsheetResponse.examGroup?.name || settings?.activeSessionName || 'N/A',
                            term: broadsheetResponse.examGroup?.term || settings?.activeTermName || 'N/A',
                            year: broadsheetResponse.examGroup?.academicYear || new Date().getFullYear().toString()
                        },
                        academicInfo: {
                            timesOpened: result.daysOpened || broadsheetResponse.termDetails?.daysOpened || 0,
                            timesPresent: result.daysPresent || 0,
                            timesAbsent: (result.daysOpened || broadsheetResponse.termDetails?.daysOpened || 0) - (result.daysPresent || 0),
                            termBegins: broadsheetResponse.termDetails?.startDate 
                                ? new Date(broadsheetResponse.termDetails.startDate).toLocaleDateString()
                                : (settings?.sessionStartDate ? new Date(settings.sessionStartDate).toLocaleDateString() : ''),
                            termEnds: broadsheetResponse.termDetails?.endDate 
                                ? new Date(broadsheetResponse.termDetails.endDate).toLocaleDateString()
                                : (settings?.sessionEndDate ? new Date(settings.sessionEndDate).toLocaleDateString() : ''),
                            nextTermBegins: broadsheetResponse.termDetails?.nextTermStartDate 
                                ? new Date(broadsheetResponse.termDetails.nextTermStartDate).toLocaleDateString()
                                : (settings?.nextTermStartDate ? new Date(settings.nextTermStartDate).toLocaleDateString() : 'To be announced'),
                            classTeacherName: 'Class Teacher',
                            classTeacherSignature: '',
                            principalSignature: settings?.invoiceLogo ? getFullUrl(settings.invoiceLogo) : ''
                        },
                        subjects: processedSubjects,
                        affectiveTraits: studentSkills,
                        psychomotorSkills: studentPsyc,
                        summary: {
                            totalObtainable: processedSubjects.length * 100,
                            totalObtained: result.totalScore || 0,
                            averageScore: result.averageScore || 0,
                            position: result.position || 0,
                            classSize: results.length,
                            cumulativeAvg: (() => {
                                const t1Avg = cumulativeOverallResults.find((r: any) => 
                                    r.studentId === student.id && 
                                    (r.examGroup?.term?.toLowerCase().includes('first') || r.examGroup?.term?.toLowerCase().includes('1st'))
                                )?.averageScore || 0;
                                const t2Avg = cumulativeOverallResults.find((r: any) => 
                                    r.studentId === student.id && 
                                    (r.examGroup?.term?.toLowerCase().includes('second') || r.examGroup?.term?.toLowerCase().includes('2nd'))
                                )?.averageScore || 0;
                                
                                if (t1Avg && t2Avg) return (t1Avg + t2Avg + result.averageScore) / 3;
                                if (t1Avg || t2Avg) return (t1Avg + t2Avg + result.averageScore) / 2;
                                return result.averageScore;
                            })()
                        }
                    };
                }).filter((c: any): c is ReportCardData => c !== null);

                setReportCards(cards);
            } catch (error) {
                console.error('Error fetching bulk report card data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [classId, examGroupId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Preparing Bulk Report Cards...</p>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .no-print { display: none !important; }
                    .page-break { page-break-after: always !important; }
                    body { -webkit-print-color-adjust: exact !important; margin: 0 !important; padding: 0 !important; }
                }
            ` }} />
            
            <div className="no-print p-4 bg-gray-100 border-b flex justify-between items-center sticky top-0 z-50">
                <div>
                    <h1 className="text-xl font-bold">Bulk Report Card Preview</h1>
                    <p className="text-sm text-gray-500">Total: {reportCards.length} Cards</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-700 shadow-lg"
                >
                    Print All
                </button>
            </div>

            <div className="flex flex-col items-center">
                {reportCards.map((data, index) => (
                    <div key={index} className="page-break w-full max-w-4xl bg-white shadow-xl my-8 print:my-0 print:shadow-none">
                        <ReportCardTemplate data={data} assessments={assessments} config={config} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BulkReportCardPage;
