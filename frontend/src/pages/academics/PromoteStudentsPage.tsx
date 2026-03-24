import { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  ArrowRight,
  Filter,
  Loader2,
  Calendar,
  AlertCircle,
  ArrowRightLeft
} from 'lucide-react';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import api from '../../services/api';
import { systemService, AcademicSession } from '../../services/systemService';
import { useSystem } from '../../context/SystemContext';
import { useToast } from '../../context/ToastContext';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
}

export default function PromoteStudentsPage() {
  const { settings } = useSystem();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Filter State
  const [availableSessions, setAvailableSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [fromSections, setFromSections] = useState<any[]>([]);
  const [toSections, setToSections] = useState<any[]>([]);

  const [fromSession, setFromSession] = useState('');
  const [toSession, setToSession] = useState('');
  const [fromClass, setFromClass] = useState('');
  const [fromSection, setFromSection] = useState('');
  
  const [toClass, setToClass] = useState('');
  const [toSection, setToSection] = useState('');

  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (fromClass) {
        (async () => {
            try {
                const res = await api.getSections();
                setFromSections(res.filter((s: any) => s.classId === fromClass));
            } catch (error) {
                console.error('Failed to load from-sections');
            }
        })();
    } else {
      setFromSections([]);
    }
  }, [fromClass]);

  useEffect(() => {
    if (toClass) {
        (async () => {
            try {
                const res = await api.getSections();
                setToSections(res.filter((s: any) => s.classId === toClass));
            } catch (error) {
                console.error('Failed to load to-sections');
            }
        })();
    } else {
      setToSections([]);
    }
  }, [toClass]);

  useEffect(() => {
    if (!fromSession && settings?.activeSessionName) {
      setFromSession(settings.activeSessionName);
    }
    if (!toSession && settings?.activeSessionName) {
      setToSession(settings.activeSessionName);
    }
  }, [settings, fromSession, toSession]);


  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, classesRes] = await Promise.all([
        systemService.getSessions(),
        api.getClasses()
      ]);
      setAvailableSessions(sessionsRes || []);
      setClasses(classesRes || []);
    } catch (error) {
      showError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // fetchSections removed as it's handled by inline async in useEffects for better scoping

  const handleFetchStudents = async () => {
    if (!fromSession || !fromClass) {
      showError('Please select From Session and Class');
      return;
    }

    setStudentsLoading(true);
    try {
      // The current getStudents API might not fully support session-based filtering 
      // if session isn't stored in student record. 
      // However, for this UI, we fetch students currently in the selected class/section.
      const res = await api.getStudents({
        classId: fromClass,
        sectionId: fromSection || undefined,
        isActive: true
      });
      setStudents(res || []);
      setSelectedIds([]); // Reset selection
    } catch (error) {
      showError('Failed to fetch students');
    } finally {
      setStudentsLoading(false);
    }
  };

  const handlePromote = async () => {
    if (selectedIds.length === 0) return showError('Select at least one student');
    if (!toClass) return showError('Select Target Class');

    setLoading(true);
    try {
      await api.promoteStudents({
        studentIds: selectedIds,
        classId: toClass,
        sectionId: toSection || undefined
      });
      showSuccess(`Successfully promoted ${selectedIds.length} students`);
      
      // Clear data or re-fetch
      setStudents([]);
      setSelectedIds([]);
      setFromClass('');
      setFromSection('');
      setToClass('');
      setToSection('');
    } catch (error) {
      showError('Promotion failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map(s => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const columns: ColumnDef<Student>[] = [
    {
      id: 'select',
      header: () => (
        <div className="px-1">
          <input
            type="checkbox"
            checked={selectedIds.length === students.length && students.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-1">
          <input
            type="checkbox"
            checked={selectedIds.includes(row.original.id)}
            onChange={() => toggleSelectOne(row.original.id)}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
      ),
    },
    {
      id: 'studentDetails',
      header: 'Student Details',
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {row.original.firstName} {row.original.lastName}
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
            Student Record
          </span>
        </div>
      ),
    },
    {
      id: 'admissionNo',
      header: 'Admission No',
      accessorKey: 'admissionNo',
      cell: ({ row }) => (
        <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
          {row.original.admissionNo}
        </span>
      ),
    },
    {
      id: 'currentClass',
      header: () => <div className="text-right">Current Class</div>,
      accessorFn: (row) => row.class?.name || '',
      cell: ({ row }) => (
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
            {row.original.class?.name || 'Unassigned'}
          </span>
          <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">
            {row.original.section?.name || 'No Section'}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Student Promotion</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Promote students to next class and session</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Configuration Card */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
             
             <div>
                <h2 className="text-sm font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Filter size={16} />
                    Promote From
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Academic Session</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select 
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
                                value={fromSession}
                                onChange={e => setFromSession(e.target.value)}
                            >
                                <option value="">Select Session</option>
                                {availableSessions.map(s => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Class</label>
                            <select 
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500"
                                value={fromClass}
                                onChange={e => setFromClass(e.target.value)}
                            >
                                <option value="">Class</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Section</label>
                            <select 
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500"
                                value={fromSection}
                                onChange={e => setFromSection(e.target.value)}
                            >
                                {(() => {
                                    if (fromClass && fromSections.length === 0) {
                                        return <option value="">General / No Sections</option>;
                                    }
                                    return (
                                        <>
                                            <option value="">General (All Sections)</option>
                                            {fromSections.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </>
                                    );
                                })()}
                            </select>
                        </div>
                    </div>
                    <button 
                        onClick={handleFetchStudents}
                        disabled={studentsLoading}
                        className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {studentsLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                        Find Students
                    </button>
                </div>
             </div>

             <div className="pt-6 border-t border-gray-50 dark:border-gray-700">
                <h2 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ArrowRight size={16} />
                    Promote To
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Target Session</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select 
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all"
                                value={toSession}
                                onChange={e => setToSession(e.target.value)}
                            >
                                <option value="">Select Session</option>
                                {availableSessions.map(s => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Next Class</label>
                            <select 
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500"
                                value={toClass}
                                onChange={e => setToClass(e.target.value)}
                            >
                                <option value="">Class</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Section</label>
                            <select 
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500"
                                value={toSection}
                                onChange={e => setToSection(e.target.value)}
                            >
                                {(() => {
                                    if (toClass && toSections.length === 0) {
                                        return <option value="">General / No Sections</option>;
                                    }
                                    return (
                                        <>
                                            <option value="">General (All Sections)</option>
                                            {toSections.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </>
                                    );
                                })()}
                            </select>
                        </div>
                    </div>

                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20 text-emerald-800 dark:text-emerald-400 text-xs leading-relaxed">
                        <div className="flex gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <p>Promoting will update the selected students' class and section. This should be done only at the end of a session.</p>
                        </div>
                    </div>

                    <button 
                        onClick={handlePromote}
                        disabled={loading || selectedIds.length === 0}
                        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                        Confirm Promotion ({selectedIds.length})
                    </button>
                </div>
             </div>
          </div>
        </div>

        {/* Student List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm min-h-[600px]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Students List</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{selectedIds.length} students selected for promotion</p>
              </div>
            </div>
            
            <DataTable 
              columns={columns} 
              data={students}
              loading={studentsLoading}
              searchKey="studentDetails"
              placeholder="Search by name..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
