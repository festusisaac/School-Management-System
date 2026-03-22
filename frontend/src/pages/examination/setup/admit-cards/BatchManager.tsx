import React, { useState } from 'react';
import { Search, UserCheck, Users, Printer } from 'lucide-react';
import { getFileUrl } from '../../../../services/api';

interface Props {
    students: any[];
    onPrintBatch: (selectedIds: string[]) => void;
    loading?: boolean;
}

const BatchManager: React.FC<Props> = ({ students, onPrintBatch, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const getAbsoluteUrl = (url: string) => getFileUrl(url || '');

    const filteredStudents = students.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleStudent = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === filteredStudents.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredStudents.map(s => s.id));
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary-600" />
                        Batch Selection
                    </h3>
                    <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded tracking-widest uppercase">
                        {selectedIds.length} Selected
                    </span>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or admission number..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <button
                        onClick={toggleAll}
                        className="text-xs font-black uppercase tracking-wider text-primary-600 hover:text-primary-700"
                    >
                        {selectedIds.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                        onClick={() => onPrintBatch(selectedIds)}
                        disabled={selectedIds.length === 0 || loading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-all disabled:opacity-50 shadow-lg shadow-primary-600/20"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        Print Batch
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[400px]">
                {loading ? (
                    <div className="p-12 text-center text-gray-400 italic">Loading students...</div>
                ) : filteredStudents.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic">No students found.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 z-10">
                            <tr>
                                <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest w-10">#</th>
                                <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Name</th>
                                <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Adm. No</th>
                                <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest w-10">Select</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student, idx) => (
                                <tr
                                    key={student.id}
                                    className={`group hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-50 dark:border-gray-800 transition-colors ${selectedIds.includes(student.id) ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                                    onClick={() => toggleStudent(student.id)}
                                >
                                    <td className="px-5 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                                {(student.photoUrl || student.studentPhoto) ? (
                                                    <img src={getAbsoluteUrl(student.photoUrl || student.studentPhoto)} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px] font-black text-gray-400 uppercase">
                                                        {(student.firstName?.[0] || '')}{(student.lastName?.[0] || '')}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{student.firstName} {student.lastName}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-xs font-medium text-gray-500">{student.admissionNumber || student.admissionNo}</td>
                                    <td className="px-5 py-3">
                                        <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selectedIds.includes(student.id) ? 'bg-primary-600 border-primary-600 shadow-sm shadow-primary-600/30' : 'border-gray-300 dark:border-gray-700'}`}>
                                            {selectedIds.includes(student.id) && <UserCheck className="w-3 h-3 text-white" />}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default BatchManager;
