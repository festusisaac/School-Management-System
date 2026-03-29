import { useState, useEffect } from 'react';
import { Save, AlertCircle, FileText, Calendar, Info } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { examinationService, ExamGroup, Exam, AssessmentType } from '../../../services/examinationService';
import api from '../../../services/api';
import BulkScoreImport from './BulkScoreImport';
import { useSystem } from '../../../context/SystemContext';
import { systemService, AcademicTerm } from '../../../services/systemService';

interface StudentRow {
    studentId: string;
    studentName: string;
    admissionNumber: string;
    scores: { [assessmentTypeId: string]: string }; // Map assessmentTypeId -> score
    status: { [assessmentTypeId: string]: string }; // Map assessmentTypeId -> status
}

const ScoresheetPage = () => {
    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [assessments, setAssessments] = useState<AssessmentType[]>([]);

    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    const { settings } = useSystem();
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<string>(settings?.activeTermName || '');

    const [currentExam, setCurrentExam] = useState<Exam | null>(null);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    const { showSuccess, showError } = useToast();

    // 1. Load Classes and Exam Groups
    useEffect(() => {
        const init = async () => {
            try {
                const [g, c] = await Promise.all([
                    examinationService.getExamGroups(),
                    api.getClasses(),
                ]);
                setGroups(g || []);
                setClasses(c || []);
            } catch (e) {
                showError('Failed to load initial metadata');
            }
        };
        init();
    }, []);

    // 2. Load Terms for the Active Session
    useEffect(() => {
        const fetchSessionTerms = async () => {
            if (!settings?.currentSessionId) return;
            try {
                const sessionTerms = await systemService.getTermsBySession(settings.currentSessionId);
                setTerms(sessionTerms || []);
            } catch (e) {
                showError('Failed to load terms for the active session');
            }
        };
        fetchSessionTerms();
    }, [settings?.currentSessionId]);

    useEffect(() => {
        if (!selectedTerm && settings?.activeTermName) {
            setSelectedTerm(settings.activeTermName);
        }
    }, [settings?.activeTermName, selectedTerm]);

    const filteredGroups = groups.filter(g =>
        (g.academicYear === settings?.activeSessionName) &&
        (!selectedTerm || g.term === selectedTerm)
    );

    // 2. Load Assessment Types when Group Changes
    useEffect(() => {
        if (selectedGroup) {
            examinationService.getAssessmentTypes(selectedGroup)
                .then(setAssessments)
                .catch(() => setAssessments([]));
        } else {
            setAssessments([]);
        }
    }, [selectedGroup]);

    // 3. Load Subjects when Class Changes
    useEffect(() => {
        if (selectedClass) {
            api.getClassSubjects(selectedClass).then(setSubjects).catch(() => setSubjects([]));
        } else {
            setSubjects([]);
        }
        setSelectedSubject('');
    }, [selectedClass]);

    // 4. Load Scoresheet Data
    useEffect(() => {
        if (selectedGroup && selectedClass && selectedSubject) {
            fetchScoresheet();
        } else {
            setStudents([]);
            setCurrentExam(null);
        }
    }, [selectedGroup, selectedClass, selectedSubject]);

    const fetchScoresheet = async () => {
        setLoading(true);
        try {
            // Find the Exam
            const exams = await examinationService.getExams(selectedGroup);
            const exam = exams.find(e => e.classId === selectedClass && e.subjectId === selectedSubject);

            if (!exam) {
                setCurrentExam(null);
                setStudents([]);
                return;
            }
            setCurrentExam(exam);

            // Fetch Students and Marks
            const [classStudents, existingMarks] = await Promise.all([
                api.getStudents({ classId: selectedClass, limit: 1000 }),
                examinationService.getMarks(exam.id)
            ]);

            // Map Data
            const rows: StudentRow[] = classStudents.map((s: any) => {
                const studentMarks = existingMarks.filter(m => m.studentId === s.id);

                const scoresMap: { [key: string]: string } = {};
                const statusMap: { [key: string]: string } = {};

                assessments.forEach(ass => {
                    // Match by assessmentTypeId (preferred) or fallback logic could go here
                    const mark = studentMarks.find(m => m.assessmentTypeId === ass.id);
                    scoresMap[ass.id] = mark ? mark.score.toString() : '';
                    statusMap[ass.id] = mark ? mark.status || 'PRESENT' : 'PRESENT';
                });

                return {
                    studentId: s.id,
                    studentName: `${s.firstName} ${s.lastName}`,
                    admissionNumber: s.admissionNumber || s.admissionNo || 'N/A',
                    scores: scoresMap,
                    status: statusMap
                };
            });

            // Sort by Name
            rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
            setStudents(rows);

        } catch (error: any) {
            console.error('Scoresheet load error:', error);
            showError(`Failed to load scoresheet: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (studentIndex: number, assessmentId: string, value: string) => {
        const newStudents = [...students];
        newStudents[studentIndex] = {
            ...newStudents[studentIndex],
            scores: {
                ...newStudents[studentIndex].scores,
                [assessmentId]: value
            }
        };
        setStudents(newStudents);
    };


    const handleSave = async () => {
        if (!currentExam) return;

        // Validation: Check for invalid scores
        const hasErrors = students.some(student => {
            return assessments.some(assessment => {
                const scoreValue = student.scores[assessment.id];
                if (!scoreValue) return false;
                const score = parseFloat(scoreValue);
                return !isNaN(score) && score > assessment.maxMarks;
            });
        });

        if (hasErrors) {
            showError('Please fix invalid scores (marked in red) before saving.');
            return;
        }

        try {
            // Save individually for each assessment type
            for (const assessment of assessments) {
                const marksToSave = students
                    .filter(s => s.scores[assessment.id] !== '' && s.scores[assessment.id] !== undefined)
                    .map(s => ({
                        studentId: s.studentId,
                        score: parseFloat(s.scores[assessment.id]),
                        status: s.status[assessment.id] || 'PRESENT'
                    }));

                if (marksToSave.length > 0) {
                    await examinationService.saveMarks({
                        examId: currentExam.id,
                        assessmentTypeId: assessment.id,
                        marks: marksToSave
                    });
                }
            }

            showSuccess('Scores saved successfully');
            fetchScoresheet();
        } catch (error) {
            showError('Failed to save scores');
        }
    };

    // Calculate Dynamic Total (Simple Sum)
    const calculateTotal = (student: StudentRow) => {
        const total = assessments.reduce((sum, ass) => {
            const val = student.scores[ass.id];
            if (!val) return sum;

            const score = parseFloat(val);
            return sum + (isNaN(score) ? 0 : score);
        }, 0);

        // Handle floating point errors
        return Math.round(total * 100) / 100;
    };

    const calculateMaxTotal = () => {
        return assessments.reduce((sum, ass) => sum + Number(ass.maxMarks), 0);
    }

    const handleBulkImport = async (data: any[]) => {
        const newStudents = [...students];
        let matchCount = 0;

        newStudents.forEach(student => {
            const importedRow = data.find(d =>
                d.admissionNumber.toString().toLowerCase() === student.admissionNumber.toLowerCase()
            );

            if (importedRow) {
                matchCount++;
                Object.keys(importedRow.scores).forEach(assId => {
                    student.scores[assId] = importedRow.scores[assId];
                });
            }
        });

        setStudents(newStudents);
        showSuccess(`Imported scores for ${matchCount} students. Please review and save.`);
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scoresheet Entry</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Enter academic marks for examinations</p>
                </div>
                {currentExam && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsImportOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                        >
                            <FileText className="w-4 h-4" />
                            Import
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            Save Scores
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
                    <select
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedTerm}
                        onChange={(e) => {
                            const term = e.target.value;
                            setSelectedTerm(term);
                            
                            // Auto-select the first group of the new term
                            const termGroups = groups.filter(g => 
                                (g.academicYear === settings?.activeSessionName) && 
                                (!term || g.term === term)
                            );
                            if (termGroups.length > 0) {
                                setSelectedGroup(termGroups[0].id);
                            } else {
                                setSelectedGroup('');
                            }
                        }}
                    >
                        <option value="">All Terms</option>
                        {terms.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam Group</label>
                    <select
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                    >
                        <option value="">Select Exam Group</option>
                        {filteredGroups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
                    <select
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="">Select Class</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                    <select
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        disabled={!selectedClass}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map(s => (
                            <option key={s.subject.id} value={s.subject.id}>{s.subject.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-3"></div>
                        <p className="text-sm font-medium">Loading scoresheet...</p>
                    </div>
                ) : !selectedGroup || !selectedClass || !selectedSubject ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center p-8">
                        <FileText className="w-16 h-16 mb-4 opacity-10" />
                        <p className="font-bold text-gray-900 dark:text-white">Measurement Ready</p>
                        <p className="text-sm mt-1">Select an Exam Group, Class, and Subject to begin entering scores.</p>
                    </div>
                ) : !currentExam ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-amber-50/50 dark:ring-amber-900/10">
                            <AlertCircle className="w-10 h-10 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">No Schedule Found</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-3 leading-relaxed">
                            This subject hasn't been added to the examination calendar yet. You need to schedule it before you can enter scores.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => window.location.hash = '#/examination/setup/exam-schedules'}
                                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4" />
                                Go to Scheduler
                            </button>
                        </div>
                    </div>
                ) : assessments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                        <Info className="w-12 h-12 text-primary-500 mb-4" />
                        <h3 className="text-lg font-bold">No Assessment Types Configured</h3>
                        <p className="text-sm text-gray-500 mt-2">Please configure Assessment Types (e.g., CA1, Exam) in Setup first.</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Students Found</h3>
                        <p className="text-sm text-gray-500 mt-2">There are no students registered in this class.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider w-16">#</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Student Details</th>

                                    {assessments.map(ass => (
                                        <th key={ass.id} className="px-4 py-4 text-center min-w-[140px]">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-tight">{ass.name}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">Max: {ass.maxMarks}</span>
                                            </div>
                                        </th>
                                    ))}

                                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-24 bg-gray-50 dark:bg-gray-800">
                                        Total <span className="block text-gray-400 font-normal">/{calculateMaxTotal()}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {students.map((student, index) => (
                                    <tr key={student.studentId} className="group hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-mono text-gray-400">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">{student.studentName}</span>
                                                <span className="text-xs text-gray-500">{student.admissionNumber}</span>
                                            </div>
                                        </td>

                                        {assessments.map(ass => {
                                            const currentScore = parseFloat(student.scores[ass.id]);

                                            return (
                                                <td key={ass.id} className="px-4 py-3">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={ass.maxMarks}
                                                            className={`w-full text-center border-2 rounded-md py-1.5 px-2 text-sm outline-none transition-all
                                                                ${currentScore > ass.maxMarks
                                                                    ? 'border-red-300 bg-red-50 text-red-600 focus:border-red-500'
                                                                    : 'border-transparent bg-gray-50 focus:bg-white focus:border-primary-500 focus:shadow-sm dark:bg-gray-800 dark:border-transparent'}`}
                                                            value={student.scores[ass.id] || ''}
                                                            onChange={(e) => handleScoreChange(index, ass.id, e.target.value)}
                                                            placeholder="-"
                                                        />
                                                    </div>
                                                </td>
                                            );
                                        })}

                                        <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800">
                                            {calculateTotal(student)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <BulkScoreImport
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onImport={handleBulkImport}
                assessments={assessments}
            />
        </div>
    );
};

export default ScoresheetPage;
