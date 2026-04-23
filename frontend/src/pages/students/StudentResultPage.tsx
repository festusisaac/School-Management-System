import { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ReportCardTemplate, { ReportCardData } from '../../components/examination/ReportCardTemplate';
import { resolveReportCardConfig } from '../../utils/reportCardConfig';
import { useSystem } from '../../context/SystemContext';

const StudentResultPage = () => {
    const { user, selectedChildId } = useAuthStore();
    const isParent = (user?.role || user?.roleObject?.name || '').toLowerCase() === 'parent';
    const { showError, showSuccess } = useToast();
    const { settings } = useSystem();
    const reportCardConfig = resolveReportCardConfig(settings);
    const [loadingInit, setLoadingInit] = useState(true);
    const [checking, setChecking] = useState(false);
    const [showPin, setShowPin] = useState(false);
    
    const [examGroups, setExamGroups] = useState<any[]>([]);
    const [dashboardUnavailable, setDashboardUnavailable] = useState(false);
    
    const [form, setForm] = useState({
        examGroupId: '',
        code: '',
        pin: ''
    });
    
    const [resultData, setResultData] = useState<{ summary: any; subjectScores: any[] } | null>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const targetId = isParent ? selectedChildId : (user?.id || 'me');
                if (isParent && !targetId) return;
                const data = await api.getStudentExamDashboard(targetId);
                setDashboardUnavailable(false);
                if (data.examGroups) {
                    setExamGroups(data.examGroups);
                    if (data.examGroups.length > 0) {
                        setForm(f => ({ ...f, examGroupId: data.examGroups[0].id }));
                    }
                }
            } catch (error: any) {
                if (error?.response?.status === 404) {
                    setDashboardUnavailable(true);
                    setExamGroups([]);
                } else {
                    showError('Failed to load examination groups');
                }
            } finally {
                setLoadingInit(false);
            }
        };

        if (user) fetchDashboard();
    }, [user, isParent, selectedChildId]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setChecking(true);
        setResultData(null);
        
        try {
            const targetId = isParent ? selectedChildId : (user?.id || 'me');
            if (isParent && !targetId) return;

            const result = await api.verifyStudentResult(targetId, {
                examGroupId: form.examGroupId,
                code: form.code,
                pin: form.pin
            });
            
            showSuccess('Result verified successfully!');
            setResultData(result);
        } catch (error: any) {
            showError(error.response?.data?.message || 'Invalid scratch card details or constraints not met');
        } finally {
            setChecking(false);
        }
    };

    if (loadingInit) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (resultData) {
        const { summary, subjectScores, subjectStats, assessments, studentMarks, affectiveTraits, psychomotorSkills, examGroup, student, termDetails } = resultData as any;

        const formatDate = (value?: string | Date) => {
            if (!value) return '';
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
        };

        // Map backend data to official ReportCardData format
        const reportCardData: ReportCardData = {
            student: {
                name: `${student.firstName} ${student.lastName}`,
                dateOfBirth: student.dob,
                sex: student.gender,
                class: student.class?.name || 'N/A',
                admissionNumber: student.admissionNo,
                photoUrl: student.studentPhoto
            },
            examGroup: {
                name: examGroup?.name || 'Term',
                term: examGroup?.term || 'Term',
                year: examGroup?.academicYear || 'Year'
            },
            academicInfo: {
                timesOpened: summary.daysOpened || 0,
                timesPresent: summary.daysPresent || 0,
                timesAbsent: Math.max(0, (summary.daysOpened || 0) - (summary.daysPresent || 0)),
                terminalDuration: termDetails?.daysOpened ? `${termDetails.daysOpened} days` : '',
                termBegins: formatDate(termDetails?.startDate),
                termEnds: formatDate(termDetails?.endDate),
                nextTermBegins: formatDate(termDetails?.nextTermStartDate),
            },
            subjects: subjectScores.map((score: any) => {
                const marksForSubject = (studentMarks || []).filter((m: any) => m.subjectId === (score.subjectId || score.subject?.id));
                const subjectStat = (subjectStats || []).find((s: any) => s.subjectId === (score.subjectId || score.subject?.id));
                const scoresDict: Record<string, number> = {};
                
                (assessments || []).forEach((ass: any) => {
                    const mark = marksForSubject.find((m: any) => m.assessmentTypeId === ass.id);
                    if (mark) scoresDict[ass.id] = parseFloat(mark.score);
                });

                return {
                    subjectName: score.subject?.name || 'Unknown',
                    scores: scoresDict,
                    totalScore: score.totalScore || score.totalSubjectScore || 0,
                    grade: score.grade || '-',
                    remark: score.remark || '-',
                    positionInSubject: score.positionInSubject || '-',
                    highestInClass: subjectStat ? parseFloat(subjectStat.highestScore) : undefined,
                    lowestInClass: subjectStat ? parseFloat(subjectStat.lowestScore) : undefined,
                    classAvg: subjectStat ? parseFloat(subjectStat.averageScore) : undefined,
                };
            }),
            summary: {
                totalObtainable: (assessments || []).reduce((acc: number, val: any) => acc + (val.maxMarks || 0), 0) * subjectScores.length,
                totalObtained: summary.totalScore || 0,
                averageScore: summary.averageScore || 0,
                position: summary.position || '-',
                classSize: summary.totalStudents || 0
            },
            affectiveTraits: (affectiveTraits || []).map((t: any) => ({ name: t.domain?.name || 'Unknown', rating: parseInt(t.rating) || 1 })),
            psychomotorSkills: (psychomotorSkills || []).map((p: any) => ({ name: p.domain?.name || 'Unknown', rating: parseInt(p.rating) || 1 }))
        };

        return (
            <div className="space-y-6">
                <style>{`
                    @media print {
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #fff !important;
                            overflow: visible !important;
                        }

                        body * {
                            visibility: hidden !important;
                        }

                        #student-result-print-root,
                        #student-result-print-root * {
                            visibility: visible !important;
                        }

                        #student-result-print-root {
                            display: block !important;
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                    }
                `}</style>
                {/* Header Action */}
                <div className="flex justify-between items-center mb-6 mt-2 print:hidden w-full max-w-[210mm] mx-auto">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Result</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Authenticated student academic record.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                        >
                            Print Result
                        </button>
                        <button 
                            onClick={() => setResultData(null)}
                            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Check Another
                        </button>
                    </div>
                </div>

                {/* Official Report Card Template */}
                <div
                    id="student-result-print-root"
                    className="bg-white dark:bg-transparent rounded-xl shadow-sm border border-gray-200 dark:border-gray-800/50 print:shadow-none print:border-none print:p-0 overflow-x-auto w-full max-w-[215mm] mx-auto flex justify-center pb-8"
                >
                    <ReportCardTemplate
                        data={reportCardData}
                        assessments={assessments || []}
                        config={reportCardConfig}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-[2.5rem] font-bold text-gray-900 dark:text-white mb-4">Check Student Result</h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto text-lg">
                    Enter your details and scratch card information below to access your academic report.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[1.5rem] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] w-full max-w-[500px]">
                {dashboardUnavailable || examGroups.length === 0 ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center mx-auto">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Result Not Available Yet</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                                There is no published examination result available for you right now. Once the school processes and publishes results, you can check them here.
                            </p>
                        </div>
                    </div>
                ) : (
                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Term</label>
                        <select 
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            value={form.examGroupId}
                            onChange={(e) => setForm({...form, examGroupId: e.target.value})}
                            required
                        >
                            <option value="" disabled>Select Term</option>
                            {examGroups.length === 0 && <option value="" disabled>No Active Exams Available</option>}
                            {examGroups.map(group => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-8 mt-8">
                        <h3 className="text-[1.1rem] font-semibold text-gray-900 dark:text-white mb-6">Scratch Card Details</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Serial Number</label>
                                <input 
                                    type="text"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Enter Card Serial Number"
                                    value={form.code}
                                    onChange={(e) => setForm({...form, code: e.target.value})}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">PIN</label>
                                <div className="relative">
                                    <input 
                                        type={showPin ? "text" : "password"}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400"
                                        placeholder="Enter Card PIN"
                                        value={form.pin}
                                        onChange={(e) => setForm({...form, pin: e.target.value})}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPin(!showPin)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={checking || !form.examGroupId}
                        className="w-full bg-primary-600 text-white rounded-lg py-3.5 text-base font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                    >
                        {checking ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                Check Result
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </>
                        )}
                    </button>
                </form>
                )}
            </div>
        </div>
    );
};


export default StudentResultPage;
