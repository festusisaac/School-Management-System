import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Layers, Search, Sparkles, Users, X } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useSystem } from '../../../context/SystemContext';

interface BulkFeeAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeGroupId: string;
  feeGroupName: string;
}

export default function BulkFeeAssignmentModal({ isOpen, onClose, feeGroupId, feeGroupName }: BulkFeeAssignmentModalProps) {
  const toast = useToast();
  const { activeSectionId } = useSystem();
  const [loading, setLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [assignmentData, setAssignmentData] = useState({
    classIds: [] as string[],
    sectionIds: [] as string[],
    categoryIds: [] as string[],
    studentIds: [] as string[],
    excludeIds: [] as string[],
  });
  const [simulationResult, setSimulationResult] = useState<{ total: number; conflicts: number; students: any[] } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchFilters();
    setSimulationResult(null);
    setStudentSearch('');
    setAssignmentData({ classIds: [], sectionIds: [], categoryIds: [], studentIds: [], excludeIds: [] });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (assignmentData.classIds.length || assignmentData.sectionIds.length || assignmentData.categoryIds.length || assignmentData.studentIds.length) {
      const timer = setTimeout(() => handleSimulate(), 400);
      return () => clearTimeout(timer);
    }
    setSimulationResult(null);
  }, [assignmentData.classIds, assignmentData.sectionIds, assignmentData.categoryIds, assignmentData.studentIds, activeSectionId, isOpen]);

  const fetchFilters = async () => {
    try {
      const [classesRes, sectionsRes, catsRes, studentsRes] = await Promise.all([
        api.getClasses(),
        api.getSections(),
        api.getStudentCategories(),
        api.getStudents({ schoolSectionId: activeSectionId || undefined }),
      ]);
      const activeClasses = activeSectionId && Array.isArray(classesRes)
        ? classesRes.filter((c: any) => c.schoolSectionId === activeSectionId)
        : (classesRes || []);
      setClasses(activeClasses);
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
      setSimulationResult(await api.simulateFeeGroup(feeGroupId, assignmentData));
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
    } catch {
      toast.showError('Failed to perform bulk assignment');
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = useMemo(
    () => sections.filter((sec) => assignmentData.classIds.length === 0 || assignmentData.classIds.includes(sec.classId)),
    [sections, assignmentData.classIds]
  );

  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return [];
    return students.filter((s) => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const admissionNo = (s.admissionNo || '').toLowerCase();
      return fullName.includes(term) || admissionNo.includes(term);
    });
  }, [students, studentSearch]);

  const selectedStudents = useMemo(
    () => assignmentData.studentIds.map((id) => students.find((s) => s.id === id)).filter(Boolean),
    [assignmentData.studentIds, students]
  );

  const selectedClasses = classes.filter((c) => assignmentData.classIds.includes(c.id));
  const selectedCategories = categories.filter((c) => assignmentData.categoryIds.includes(c.id));
  const readyCount = simulationResult ? simulationResult.total - simulationResult.conflicts : 0;

  const toggleClass = (id: string) => {
    const removing = assignmentData.classIds.includes(id);
    setAssignmentData((prev) => ({
      ...prev,
      classIds: removing ? prev.classIds.filter((item) => item !== id) : [...prev.classIds, id],
      sectionIds: removing ? prev.sectionIds.filter((sid) => sections.find((s) => s.id === sid)?.classId !== id) : prev.sectionIds,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div>
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Bulk Assignment</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Fee group: <span className="font-bold text-gray-700 dark:text-gray-200">{feeGroupName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_320px]">
          <div className="min-h-0 overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <section className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Target Classes</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose one or more classes.</p>
                  </div>
                  <span className="rounded-xl bg-gray-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-gray-500 dark:bg-gray-900 dark:text-gray-300">
                    {assignmentData.classIds.length} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {classes.map((cls) => {
                    const selected = assignmentData.classIds.includes(cls.id);
                    return (
                      <button
                        key={cls.id}
                        onClick={() => toggleClass(cls.id)}
                        className={clsx(
                          "rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] transition",
                          selected
                            ? "border-primary-600 bg-primary-600 text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900"
                        )}
                      >
                        {cls.name}
                      </button>
                    );
                  })}
                </div>
              </section>

              {(assignmentData.classIds.length > 0 || assignmentData.sectionIds.length > 0) && (
                <section className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Sections</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Optional refinement for selected classes.</p>
                    </div>
                    <span className="rounded-xl bg-gray-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-gray-500 dark:bg-gray-900 dark:text-gray-300">
                      {assignmentData.sectionIds.length} picked
                    </span>
                  </div>
                  {assignmentData.classIds.length > 0 && filteredSections.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Selected classes do not have separate sections.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {filteredSections.map((sec) => {
                        const selected = assignmentData.sectionIds.includes(sec.id);
                        return (
                          <button
                            key={sec.id}
                            onClick={() => setAssignmentData((prev) => ({
                              ...prev,
                              sectionIds: prev.sectionIds.includes(sec.id) ? prev.sectionIds.filter((id) => id !== sec.id) : [...prev.sectionIds, sec.id],
                            }))}
                            className={clsx(
                              "rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition",
                              selected
                                ? "border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-500/10 dark:text-primary-300"
                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900"
                            )}
                          >
                            {sec.name} ({classes.find((c) => c.id === sec.classId)?.name || 'Class'})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              <section className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Student Categories</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Apply category filters if needed.</p>
                  </div>
                  <span className="rounded-xl bg-gray-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-gray-500 dark:bg-gray-900 dark:text-gray-300">
                    {assignmentData.categoryIds.length} active
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const selected = assignmentData.categoryIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setAssignmentData((prev) => ({
                          ...prev,
                          categoryIds: prev.categoryIds.includes(cat.id) ? prev.categoryIds.filter((id) => id !== cat.id) : [...prev.categoryIds, cat.id],
                        }))}
                        className={clsx(
                          "rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] transition",
                          selected
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900"
                        )}
                      >
                        {cat.category}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Specific Individuals</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Search and add named students.</p>
                <div className="relative mt-3">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students to add..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/10"
                  />
                </div>
                {studentSearch && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
                    <div className="max-h-52 overflow-y-auto">
                      {filteredStudents.length === 0 ? (
                        <div className="px-4 py-5 text-center text-sm text-gray-400">No students matched your search.</div>
                      ) : (
                        filteredStudents.map((student) => (
                          <button
                            key={student.id}
                            onClick={() => {
                              setAssignmentData((prev) => ({
                                ...prev,
                                studentIds: prev.studentIds.includes(student.id) ? prev.studentIds : [...prev.studentIds, student.id],
                              }));
                              setStudentSearch('');
                            }}
                            className="block w-full border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50 last:border-b-0 dark:border-gray-800 dark:hover:bg-gray-900"
                          >
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{student.firstName} {student.lastName}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-gray-400">
                              {student.admissionNo} • {classes.find((c) => c.id === student.classId)?.name || 'No Class'}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
                {selectedStudents.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedStudents.map((student: any) => (
                      <span key={student.id} className="inline-flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                        {student.firstName} {student.lastName}
                        <button
                          onClick={() => setAssignmentData((prev) => ({ ...prev, studentIds: prev.studentIds.filter((sid) => sid !== student.id) }))}
                          className="text-primary-500 transition hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          <aside className="min-h-0 overflow-y-auto border-t border-gray-100 bg-gray-50/70 px-6 py-5 lg:border-l lg:border-t-0 dark:border-gray-800 dark:bg-gray-900/30">
            <div className="space-y-4">
              <section className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Summary</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Impacted</p>
                    <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{simulationResult?.total || 0}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">Conflicts</p>
                    <p className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-300">{simulationResult?.conflicts || 0}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Current Scope</p>
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">Classes</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedClasses.length > 0 ? selectedClasses.map((item: any) => (
                        <span key={item.id} className="rounded-xl bg-gray-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                          {item.name}
                        </span>
                      )) : <span className="text-gray-400">No classes selected yet.</span>}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">Categories</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedCategories.length > 0 ? selectedCategories.map((item: any) => (
                        <span key={item.id} className="rounded-xl bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          {item.category}
                        </span>
                      )) : <span className="text-gray-400">No category filters applied.</span>}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">Direct Students</p>
                    <p className="mt-2 text-gray-400">
                      {selectedStudents.length > 0 ? `${selectedStudents.length} named students selected.` : 'No direct student overrides selected.'}
                    </p>
                  </div>
                </div>
              </section>

              {simulationResult && (
                <section className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Live Preview</p>
                    {isSimulating && (
                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300">
                        Updating
                      </span>
                    )}
                  </div>
                  {simulationResult.total === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                      No students currently match this scope.
                    </div>
                  ) : (
                    <div className="max-h-72 space-y-2 overflow-y-auto">
                      {simulationResult.students.map((student) => (
                        <div key={student.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-3 dark:border-gray-800">
                          <div>
                            <p className={clsx("text-sm font-bold", student.alreadyHasFee ? "text-gray-400 line-through dark:text-gray-500" : "text-gray-900 dark:text-gray-100")}>
                              {student.name}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-gray-400">{student.className}</p>
                          </div>
                          {student.alreadyHasFee ? (
                            <span className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                              Skipping
                            </span>
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </aside>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {simulationResult ? `${readyCount} students are ready to receive this fee group.` : 'Choose a target scope to generate a live preview.'}
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              onClick={onClose}
              className="rounded-2xl border border-gray-200 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-gray-500 transition hover:text-gray-700 dark:border-gray-800 dark:text-gray-300 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={loading || !simulationResult || simulationResult.total === simulationResult.conflicts}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? 'Processing...' : `Assign To ${readyCount || 0} Students`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
