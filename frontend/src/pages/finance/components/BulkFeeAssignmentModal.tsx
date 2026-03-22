import { useState, useEffect } from 'react';
import { X, Search, Users, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface BulkFeeAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeGroupId: string;
  feeGroupName: string;
}

export default function BulkFeeAssignmentModal({ isOpen, onClose, feeGroupId, feeGroupName }: BulkFeeAssignmentModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Data for filters
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // Selection state
  const [studentSearch, setStudentSearch] = useState('');
  const [assignmentData, setAssignmentData] = useState({
    classIds: [] as string[],
    sectionIds: [] as string[],
    categoryIds: [] as string[],
    studentIds: [] as string[],
    excludeIds: [] as string[]
  });
  
  // Preview / Simulation state
  const [simulationResult, setSimulationResult] = useState<{
    total: number;
    conflicts: number; // In this context, conflicts means already assigned
    students: any[];
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFilters();
      setSimulationResult(null);
      setAssignmentData({ classIds: [], sectionIds: [], categoryIds: [], studentIds: [], excludeIds: [] });
    }
  }, [isOpen]);

  // Re-simulate whenever selection changes
  useEffect(() => {
    if (isOpen && (assignmentData.classIds.length > 0 || assignmentData.sectionIds.length > 0 || assignmentData.categoryIds.length > 0 || assignmentData.studentIds.length > 0)) {
      const timer = setTimeout(() => handleSimulate(), 500);
      return () => clearTimeout(timer);
    } else {
        setSimulationResult(null);
    }
  }, [assignmentData.classIds, assignmentData.sectionIds, assignmentData.categoryIds, assignmentData.studentIds]);

  const fetchFilters = async () => {
    try {
      const [classesRes, sectionsRes, catsRes, studentsRes] = await Promise.all([
        api.getClasses(),
        api.getSections(),
        api.getStudentCategories(),
        api.getStudents()
      ]);
      setClasses(classesRes || []);
      setSections(sectionsRes || []);
      setCategories(catsRes || []);
      setStudents(studentsRes || []);
    } catch (error) {
      console.error('Failed to fetch filters', error);
    }
  };

  const handleSimulate = async () => {
    try {
      setIsSimulating(true);
      const res = await api.simulateFeeGroup(feeGroupId, assignmentData);
      setSimulationResult(res);
    } catch (error) {
      console.error('Simulation failed', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApply = async () => {
    if (simulationResult && simulationResult.total === 0) return;
    try {
      setLoading(true);
      const res = await api.bulkAssignFeeGroup(feeGroupId, assignmentData);
      toast.showSuccess(`Successfully assigned to ${res.updatedCount} students. ${res.skippedCount} students were skipped (already assigned).`);
      onClose();
    } catch (error) {
      toast.showError('Failed to perform bulk assignment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-gray-900/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-br from-primary-50/50 to-white dark:from-primary-900/10 dark:to-gray-900">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="text-primary-600" />
              Assign Fee: {feeGroupName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Select target students for bulk allocation.</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 flex-1">
          {/* Target Classes */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Target Classes</label>
            <div className="flex flex-wrap gap-2">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => {
                    const isRemoving = assignmentData.classIds.includes(cls.id);
                    setAssignmentData(prev => ({
                      ...prev,
                      classIds: isRemoving
                        ? prev.classIds.filter(id => id !== cls.id)
                        : [...prev.classIds, cls.id],
                      sectionIds: isRemoving
                        ? prev.sectionIds.filter(sid => sections.find(s => s.id === sid)?.classId !== cls.id)
                        : prev.sectionIds
                    }));
                  }}
                  className={clsx(
                    "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                    assignmentData.classIds.includes(cls.id)
                      ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20"
                      : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800/50 hover:bg-gray-100"
                  )}
                >
                  {cls.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sections (Conditional) */}
          {(assignmentData.classIds.length > 0 || assignmentData.sectionIds.length > 0) && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Specific Sections (Optional)</label>
              <div className="flex flex-wrap gap-2">
                {sections
                  .filter(sec => assignmentData.classIds.length === 0 || assignmentData.classIds.includes(sec.classId))
                  .map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setAssignmentData(prev => ({
                          ...prev,
                          sectionIds: prev.sectionIds.includes(sec.id)
                            ? prev.sectionIds.filter(id => id !== sec.id)
                            : [...prev.sectionIds, sec.id]
                        }));
                      }}
                      className={clsx(
                        "px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all",
                        assignmentData.sectionIds.includes(sec.id)
                          ? "bg-primary-500 text-white border-primary-500 shadow-md"
                          : "bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-800/50 hover:bg-gray-100"
                      )}
                    >
                      {sec.name} ({classes.find(c => c.id === sec.classId)?.name})
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Student Categories */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Student Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setAssignmentData(prev => ({
                      ...prev,
                      categoryIds: prev.categoryIds.includes(cat.id)
                        ? prev.categoryIds.filter(id => id !== cat.id)
                        : [...prev.categoryIds, cat.id]
                    }));
                  }}
                  className={clsx(
                    "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                    assignmentData.categoryIds.includes(cat.id)
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                      : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800/50 hover:bg-gray-100"
                  )}
                >
                  {cat.category}
                </button>
              ))}
            </div>
          </div>

          {/* Individual Students */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Specific Individuals</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students to add..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            
            {studentSearch && (
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800/50 rounded-2xl shadow-xl max-h-[150px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
                {students.filter(s => {
                  const matchesSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) || 
                                       s.admissionNo.toLowerCase().includes(studentSearch.toLowerCase());
                  return matchesSearch;
                }).map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setAssignmentData(prev => ({
                        ...prev,
                        studentIds: prev.studentIds.includes(s.id) ? prev.studentIds : [...prev.studentIds, s.id]
                      }));
                      setStudentSearch('');
                    }}
                    className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{s.firstName} {s.lastName}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-black">{s.admissionNo} • {classes.find(c => c.id === s.classId)?.name || 'No Class'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {assignmentData.studentIds.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {assignmentData.studentIds.map(id => {
                  const student = students.find(s => s.id === id);
                  if (!student) return null;
                  return (
                    <span key={id} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl text-[10px] font-bold border border-primary-100 dark:border-primary-800">
                      {student.firstName} {student.lastName}
                      <button onClick={() => setAssignmentData(prev => ({ ...prev, studentIds: prev.studentIds.filter(sid => sid !== id) }))}>
                        <X className="w-3 h-3 hover:text-red-500" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Simulation / Results Card */}
          {simulationResult && (
            <div className="bg-primary-50 dark:bg-primary-900/10 p-5 rounded-3xl border border-primary-100 dark:border-primary-800/50 space-y-4 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary-600" />
                  <h3 className="text-sm font-bold text-primary-900 dark:text-primary-100 uppercase tracking-widest">Assignment Preview</h3>
                </div>
                {isSimulating && <div className="text-[10px] font-black text-primary-600 animate-pulse">Calculating...</div>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-primary-100 dark:border-primary-700">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Impacted Students</p>
                  <p className="text-2xl font-black text-primary-600">{simulationResult.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-primary-100 dark:border-primary-700">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Already Assigned</p>
                  <p className="text-2xl font-black text-amber-600">{simulationResult.conflicts}</p>
                </div>
              </div>

              {simulationResult.total > 0 && (
                 <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 scrollbar-thin">
                    {simulationResult.students.map(s => (
                        <div key={s.id} className="flex items-center justify-between py-1 border-b border-primary-100/30 dark:border-primary-800/30 last:border-0">
                            <span className={clsx("text-xs font-bold", s.alreadyHasFee ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300")}>
                                {s.name} <span className="text-[8px] opacity-50 ml-1">({s.className})</span>
                            </span>
                            {s.alreadyHasFee ? (
                                <span className="text-[8px] font-black text-amber-600 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded">SKIPPING</span>
                            ) : (
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            )}
                        </div>
                    ))}
                 </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-gray-100 dark:border-gray-800/50">
          <button onClick={onClose} className="px-8 py-4 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-widest">
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={loading || !simulationResult || simulationResult.total === simulationResult.conflicts}
            className="w-full sm:w-auto px-10 py-4 bg-primary-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : `Assign to ${simulationResult ? simulationResult.total - simulationResult.conflicts : 'Students'} Students`}
          </button>
        </div>
      </div>
    </div>
  );
}
