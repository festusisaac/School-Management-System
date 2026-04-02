import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReportCardTemplate, { ReportCardData, ReportCardSubject } from '../../../components/examination/ReportCardTemplate';
import { examinationService } from '../../../services/examinationService';
import { systemService } from '../../../services/systemService';
import api from '../../../services/api';
import { TablePagination } from '../../../components/ui/TablePagination';
import { createIdLookupMap, groupById, identifyTerm } from '../../../utils/reportingUtils';

const BulkReportCardPage = () => {
    const [searchParams] = useSearchParams();
    const classId = searchParams.get('classId');
    const examGroupId = searchParams.get('examGroupId');

    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState<any>(null);
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

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        const fetchData = async () => {
            if (!classId || !examGroupId) return;

            try {
                setLoading(true);
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

                setAssessments(assessmentTypes || []);
                setRawData({
                    broadsheetResponse: broadsheetResponse || {},
                    settings: settings || {},
                    allSkills: allSkills || [],
                    allPsyc: allPsyc || [],
                    affDomains: affDomains || [],
                    psycDomains: psycDomains || [],
                    allSubjects: allSubjects || [],
                    assessmentTypes: assessmentTypes || [],
                    allMarks: allMarks || []
                });
            } catch (error) {
                console.error('Error fetching bulk report card data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [classId, examGroupId]);

    const reportCards = useMemo(() => {
        if (!rawData) return [];

        // 0. Define Local Interfaces for clear typing
        interface BroadsheetResponse {
            results: any[];
            subjectScores: any[];
            subjectStats: any[];
            cumulativeSubjectScores: any[];
            cumulativeOverallResults: any[];
            termDetails?: any;
            examGroup?: any;
        }

        const {
            broadsheetResponse: broadsheetData,
            settings,
            allSkills,
            allPsyc,
            affDomains,
            psycDomains,
            allSubjects,
            assessmentTypes,
            allMarks
        } = rawData;

        const broadsheetResponse = broadsheetData as BroadsheetResponse;

        const results = broadsheetResponse.results || [];
        const subjectEnrichedScores = broadsheetResponse.subjectScores || [];
        const subjectStats = broadsheetResponse.subjectStats || [];
        const cumulativeSubjectScores = broadsheetResponse.cumulativeSubjectScores || [];
        const cumulativeOverallResults = broadsheetResponse.cumulativeOverallResults || [];

        // 1. Create Lookup Maps for O(1) Access
        const subjectMap = createIdLookupMap(allSubjects, 'id');
        const domainMap = createIdLookupMap(affDomains, 'id');
        const psycDomainMap = createIdLookupMap(psycDomains, 'id');

        const marksByStudent = groupById(allMarks, 'studentId');
        
        // Map studentId_subjectId_assessmentId -> mark object
        const marksByStudentSubjAss = new Map<string, any>();
        allMarks.forEach((m: any) => {
            const sId = (m.studentId || m.studentid)?.toString();
            const subId = (m.subjectId || m.subjectid)?.toString();
            const assId = (m.assessmentTypeId || m.assessmenttypeid)?.toString();
            if (!sId || !subId || !assId) return;
            marksByStudentSubjAss.set(`${sId}_${subId}_${assId}`, m);
        });

        const subjectEnrichedLookup = new Map<string, any>();
        subjectEnrichedScores.forEach((s: any) => {
            const sId = (s.studentId || s.studentid)?.toString();
            const subjId = (s.subjectId || s.subjectid)?.toString();
            if (sId && subjId) subjectEnrichedLookup.set(`${sId}_${subjId}`, s);
        });

        const subjectStatsLookup = createIdLookupMap<any>(subjectStats, 'subjectId');

        const cumulativeSubjLookup = new Map<string, { term1: number; term2: number }>();
        cumulativeSubjectScores.forEach((c: any) => {
            const sId = (c.studentId || c.studentid)?.toString();
            const subjId = (c.subjectId || c.subjectid)?.toString();
            if (!sId || !subjId) return;
            const key = `${sId}_${subjId}`;
            const existing = cumulativeSubjLookup.get(key) || { term1: 0, term2: 0 };
            const term = identifyTerm(c.term);
            if (term === 'first') {
                existing.term1 = parseFloat(c.termTotal || 0);
            } else if (term === 'second') {
                existing.term2 = parseFloat(c.termTotal || 0);
            }
            cumulativeSubjLookup.set(key, existing);
        });

        const cumulativeOverallLookup = new Map<string, { term1: number; term2: number }>();
        cumulativeOverallResults.forEach((r: any) => {
            const sId = (r.studentId || r.studentid || r.id)?.toString();
            if (!sId) return;
            const existing = cumulativeOverallLookup.get(sId) || { term1: 0, term2: 0 };
            const term = identifyTerm(r.examGroup?.term);
            if (term === 'first') {
                existing.term1 = r.averageScore || r.averagescore || 0;
            } else if (term === 'second') {
                existing.term2 = r.averageScore || r.averagescore || 0;
            }
            cumulativeOverallLookup.set(sId, existing);
        });

        const skillsByStudent = groupById(allSkills, 'studentId');
        const psycByStudent = groupById(allPsyc, 'studentId');

        const getFullUrl = (path: string) => {
            if (!path) return '';
            if (path.startsWith('http')) return path;
            const bUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
            return bUrl.replace('/api', '') + (path.startsWith('/') ? '' : '/') + path;
        };

        // 2. Generate Cards (using indexed O(1) lookups)
        return results.map((result: any) => {
            const student = result.student;
            if (!student) return null;

            const studentId = student.id?.toString();
            if (!studentId) return null;

            const studentTermResult = result;
            
            // Get unique subjects for this student efficiently
            const studentMarks = marksByStudent.get(studentId) || [];
            const studentSubjectIds = Array.from(new Set(studentMarks.map((m: any) => m.subjectId?.toString() || m.subjectid?.toString())));

            const processedSubjects: ReportCardSubject[] = studentSubjectIds.filter(Boolean).map((subId: any) => {
                const combinedKey = `${studentId}_${subId}`;
                const scores: Record<string, number | undefined> = {};
                
                assessmentTypes.forEach((ass: any) => {
                    const m = marksByStudentSubjAss.get(`${studentId}_${subId}_${ass.id}`);
                    scores[ass.id] = m ? m.score : undefined;
                });

                const enriched = subjectEnrichedLookup.get(combinedKey);
                const stats = subjectStatsLookup.get(subId.toString());
                const cumulative = cumulativeSubjLookup.get(combinedKey) || { term1: 0, term2: 0 };

                return {
                    subjectName: (subjectMap.get(subId.toString()) as any)?.name || 'Unknown',
                    scores,
                    totalScore: enriched?.totalSubjectScore || enriched?.totalsubjectscore || 0,
                    grade: enriched?.grade || 'F',
                    remark: enriched?.remark || 'VERY POOR',
                    highestInClass: stats ? parseFloat(stats.highestScore || stats.highestscore || 0) : undefined,
                    lowestInClass: stats ? parseFloat(stats.lowestScore || stats.lowestscore || 0) : undefined,
                    classAvg: stats ? parseFloat(stats.averageScore || stats.averagescore || 0) : undefined,
                    positionInSubject: enriched?.positionInSubject,
                    cumulative
                };
            });

            const cumOverall = cumulativeOverallLookup.get(studentId) || { term1: 0, term2: 0 };

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
                affectiveTraits: (skillsByStudent.get(studentId) || []).map((s: any) => ({
                    name: (domainMap.get(s.domainId?.toString()) as any)?.name || s.name || 'Unknown',
                    rating: parseInt(s.rating) || 1
                })),
                psychomotorSkills: (psycByStudent.get(studentId) || []).map((p: any) => ({
                    name: (psycDomainMap.get(p.domainId?.toString()) as any)?.name || p.name || 'Unknown',
                    rating: parseInt(p.rating) || 1
                })),
                summary: {
                    totalObtainable: processedSubjects.length * 100,
                    totalObtained: studentTermResult.totalScore || 0,
                    averageScore: studentTermResult.averageScore || 0,
                    position: studentTermResult.position || 0,
                    classSize: results.length,
                    cumulativeAvg: (() => {
                        const { term1, term2 } = cumOverall;
                        const curr = studentTermResult.averageScore || 0;
                        if (term1 && term2) return (term1 + term2 + curr) / 3;
                        if (term1 || term2) return (term1 + term2 + curr) / 2;
                        return curr;
                    })()
                }
            } as ReportCardData;
        }).filter((c): c is ReportCardData => c !== null);
    }, [rawData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Preparing Bulk Report Cards...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .no-print { display: none !important; }
                    .page-break { page-break-after: always !important; }
                    body { -webkit-print-color-adjust: exact !important; margin: 0 !important; padding: 0 !important; }
                }
            ` }} />
            
            <div className="no-print p-4 bg-white/80 backdrop-blur-md border-b flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-50 gap-4 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold">Bulk Report Card Preview</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500 font-medium">Showing {Math.min(reportCards.length, pageSize)} of {reportCards.length} Cards</span>
                        <div className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded border border-amber-200 font-bold uppercase animate-pulse">
                            Preview Mode: Printing only prints current page
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <TablePagination 
                        currentPage={currentPage}
                        totalItems={reportCards.length}
                        pageSize={pageSize}
                        onPageChange={(page: number) => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    />
                    <button
                        onClick={() => window.print()}
                        className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-700 shadow-lg ml-4"
                    >
                        Print Current Page
                    </button>
                </div>
            </div>

            <div className="flex flex-col items-center">
                {reportCards.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((data: ReportCardData, index: number) => (
                    <div key={index} className="page-break w-full bg-white shadow-lg my-6 print:my-0 print:shadow-none border border-gray-100">
                        <ReportCardTemplate data={data} assessments={assessments} config={config} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BulkReportCardPage;
