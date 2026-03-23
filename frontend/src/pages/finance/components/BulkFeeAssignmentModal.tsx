import { useState, useEffect } from 'react';
import { X, Search, Users, Layers, LayoutGrid, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-950 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        {/* Header */}
        <div className="p-8 pb-6 border-b border-gray-100 dark:border-gray-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              Bulk Assignment
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Fee: {feeGroupName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all group">
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 flex-1 scrollbar-none">
          {/* Target Classes */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <Layers className="w-3 h-3" /> Target Classes
            </label>
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
                    "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                    assignmentData.classIds.includes(cls.id)
                      ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20"
                      : "bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-800/50 hover:bg-gray-100"
                  )}
                >
                  {cls.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sections (Conditional) */}
          {(assignmentData.classIds.length > 0 || assignmentData.sectionIds.length > 0) && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                <LayoutGrid className="w-3 h-3" /> Specific Sections
              </label>
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
                        "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
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
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <Tag className="w-3 h-3" /> Student Categories
            </label>
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
                    "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all",
                    assignmentData.categoryIds.includes(cat.id)
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                      : "bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-800/50 hover:bg-gray-100"
                  )}
                >
                  {cat.category}
                </button>
              ))}
            </div>
          </div>

          {/* Individual Students */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <Search className="w-3 h-3" /> Specific Individuals
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students to add..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/20 text-sm font-medium transition-all"
              />
            </div>
            
            {studentSearch && (
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl max-h-[150px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/50 animate-in slide-in-from-top-2 duration-200">
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
                    className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white">{s.firstName} {s.lastName}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{s.admissionNo} • {classes.find(c => c.id === s.classId)?.name || 'No Class'}</p>
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
                    <span key={id} className="flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary-100 dark:border-primary-800/50">
                      {student.firstName} {student.lastName}
                      <button onClick={() => setAssignmentData(prev => ({ ...prev, studentIds: prev.studentIds.filter(sid => sid !== id) }))} className="hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Simulation / Results Card */}
          {simulationResult && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800/50 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                  <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Assignment Preview</h3>
                </div>
                {isSimulating && <div className="text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">RECALCULATING...</div>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-950 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Impacted</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{simulationResult.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-950 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Conflicts</p>
                  <p className="text-3xl font-black text-amber-600">{simulationResult.conflicts}</p>
                </div>
              </div>

              {simulationResult.total > 0 && (
                 <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-none">
                    {simulationResult.students.map(s => (
                        <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                            <span className={clsx("text-xs font-bold", s.alreadyHasFee ? "text-gray-300 dark:text-gray-600 line-through" : "text-gray-600 dark:text-gray-400")}>
                                {s.name} <span className="text-[9px] font-black opacity-40 ml-1 uppercase tracking-tighter">/ {s.className}</span>
                            </span>
                            {s.alreadyHasFee ? (
                                <span className="text-[8px] font-black text-amber-600 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg uppercase tracking-widest">Skipping</span>
                            ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            )}
                        </div>
                    ))}
                 </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 dark:border-gray-800/50 flex flex-col sm:flex-row gap-4 items-center">
          <button onClick={onClose} className="w-full sm:w-auto px-8 py-4 text-[10px] font-black text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors uppercase tracking-[0.2em]">
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={loading || !simulationResult || simulationResult.total === simulationResult.conflicts}
            className="w-full flex-1 px-10 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : null}
            {loading ? 'Processing...' : `Assign to ${simulationResult ? simulationResult.total - simulationResult.conflicts : 'Students'} Students`}
          </button>
        </div>
      </div>
    </div>
  );
}
