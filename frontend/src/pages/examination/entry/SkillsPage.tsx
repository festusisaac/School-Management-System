import React, { useState, useEffect } from 'react';
import { Save, Plus, Settings, Edit2, Trash2, AlertTriangle, Heart } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { examinationService, ExamGroup, AffectiveDomain } from '../../../services/examinationService';
import api from '../../../services/api';
import { Modal } from '../../../components/ui/modal';
import { useSystem } from '../../../context/SystemContext';
import { systemService, AcademicTerm } from '../../../services/systemService';

interface StudentRow {
    studentId: string;
    studentName: string;
    admissionNumber: string;
    ratings: Record<string, string>; // domainId -> rating
}

const SkillsPage = () => {
    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [domains, setDomains] = useState<AffectiveDomain[]>([]);

    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

    const { settings } = useSystem();
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<string>(settings?.activeTermName || '');

    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(false);

    const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
    const [isDeleteDomainOpen, setIsDeleteDomainOpen] = useState(false);
    const [newDomainName, setNewDomainName] = useState('');
    const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
    const [deletingDomain, setDeletingDomain] = useState<AffectiveDomain | null>(null);

    const { showSuccess, showError } = useToast();

    useEffect(() => {
        const init = async () => {
            try {
                const [g, c, d, t] = await Promise.all([
                    examinationService.getExamGroups(),
                    api.getClasses(),
                    examinationService.getAffectiveDomains(),
                    systemService.getTerms()
                ]);
                setGroups(g || []);
                setClasses(c || []);
                setDomains(d || []);
                setTerms(t || []);

                // Select matching group if possible
                const sessionToUse = settings?.activeSessionName;
                const termToUse = selectedTerm || settings?.activeTermName;

                if (g?.length > 0) {
                    const filtered = g.filter(group =>
                        (!sessionToUse || group.academicYear === sessionToUse) &&
                        (!termToUse || group.term === termToUse)
                    );
                    if (filtered.length > 0) {
                        setSelectedGroup(filtered[0].id);
                    } else {
                        setSelectedGroup(g[0].id);
                    }
                }
            } catch (e) {
                showError('Failed to load initial data');
            }
        };
        init();
    }, []);

    // Filtered Groups for Selection
    const filteredGroups = groups.filter(g =>
        (g.academicYear === settings?.activeSessionName) &&
        (!selectedTerm || g.term === selectedTerm)
    );

    useEffect(() => {
        if (selectedGroup && selectedClass) {
            fetchData();
        } else {
            setStudents([]);
        }
    }, [selectedGroup, selectedClass, domains]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [classStudents, existingSkills] = await Promise.all([
                api.getStudents({ classId: selectedClass, limit: 1000 }),
                examinationService.getSkills(selectedGroup)
            ]);

            const rows: StudentRow[] = classStudents.map((s: any) => {
                const studentSkills = existingSkills.filter(sk => sk.studentId === s.id);
                const ratings: Record<string, string> = {};
                studentSkills.forEach(sk => {
                    ratings[sk.domainId] = sk.rating;
                });

                return {
                    studentId: s.id,
                    studentName: `${s.firstName} ${s.lastName}`,
                    admissionNumber: s.admissionNumber || s.admissionNo || 'N/A',
                    ratings
                };
            });

            rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
            setStudents(rows);
        } catch (error) {
            showError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleRatingChange = (studentIndex: number, domainId: string, value: string) => {
        const newStudents = [...students];
        newStudents[studentIndex].ratings[domainId] = value;
        setStudents(newStudents);
    };

    const handleSave = async () => {
        try {
            const skillsToSave = [];
            for (const student of students) {
                for (const domainId in student.ratings) {
                    if (student.ratings[domainId]) {
                        skillsToSave.push({
                            studentId: student.studentId,
                            domainId,
                            rating: student.ratings[domainId]
                        });
                    }
                }
            }

            if (skillsToSave.length === 0) {
                showError('No ratings to save');
                return;
            }

            await examinationService.saveSkills({
                examGroupId: selectedGroup,
                skills: skillsToSave
            });

            showSuccess('Skills and attributes saved successfully');
        } catch (error) {
            showError('Failed to save data');
        }
    };

    const handleAddOrUpdateDomain = async () => {
        if (!newDomainName.trim()) return;
        try {
            if (editingDomainId) {
                await examinationService.updateAffectiveDomain(editingDomainId, newDomainName);
                showSuccess('Attribute updated');
            } else {
                await examinationService.createAffectiveDomain(newDomainName);
                showSuccess('Attribute added');
            }
            const updatedDomains = await examinationService.getAffectiveDomains();
            setDomains(updatedDomains);
            setNewDomainName('');
            setEditingDomainId(null);
        } catch (error) {
            showError('Failed to save attribute');
        }
    };

    const handleEditDomain = (domain: AffectiveDomain) => {
        setNewDomainName(domain.name);
        setEditingDomainId(domain.id);
    };

    const handleDeleteDomainClick = (domain: AffectiveDomain) => {
        setDeletingDomain(domain);
        setIsDeleteDomainOpen(true);
    };

    const confirmDeleteDomain = async () => {
        if (!deletingDomain) return;
        try {
            await examinationService.deleteAffectiveDomain(deletingDomain.id);
            showSuccess('Attribute deleted');
            setIsDeleteDomainOpen(false);
            setDeletingDomain(null);
            const updatedDomains = await examinationService.getAffectiveDomains();
            setDomains(updatedDomains);
        } catch (error) {
            showError('Failed to delete attribute');
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Skills & Attributes</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Assess student character, punctuality, and conduct</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsDomainModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm text-sm font-medium"
                    >
                        <Settings className="w-4 h-4" />
                        Manage Attributes
                    </button>
                    {students.length > 0 && (
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm text-sm font-medium"
                        >
                            <Save className="w-4 h-4" />
                            Save Attributes
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">


                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
                    <select
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedTerm}
                        onChange={(e) => {
                            setSelectedTerm(e.target.value);
                            setSelectedGroup('');
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
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="">Select Class</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-[400px] grid grid-cols-1 w-full">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-3"></div>
                        <p className="text-sm font-medium">Loading skill sheet...</p>
                    </div>
                ) : !selectedGroup || !selectedClass ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8 text-gray-400">
                        <Heart className="w-12 h-12 mb-4 opacity-10" />
                        <p className="font-medium text-gray-900 dark:text-white">Ready to Assess</p>
                        <p className="text-sm mt-1">Select an Exam Group and Class to begin.</p>
                    </div>
                ) : domains.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8 text-gray-400">
                        <Settings className="w-12 h-12 mb-4 opacity-10" />
                        <p className="font-medium text-gray-900 dark:text-white">No Attributes Configured</p>
                        <p className="text-sm mt-1 mb-4">You need to define what you want to assess (e.g. Punctuality).</p>
                        <button
                            onClick={() => setIsDomainModalOpen(true)}
                            className="text-sm text-primary-600 font-medium hover:underline"
                        >
                            Manage Attributes
                        </button>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider min-w-[200px]">
                                        Student Information
                                    </th>
                                    {domains.map(d => (
                                        <th key={d.id} className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-center min-w-[140px]">
                                            {d.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {students.map((student, sIdx) => (
                                    <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">{student.studentName}</span>
                                                <span className="text-xs text-gray-400 font-medium">ID: {student.admissionNumber}</span>
                                            </div>
                                        </td>
                                        {domains.map(d => (
                                            <td key={d.id} className="px-4 py-3 text-center">
                                                <div className="relative">
                                                    <select
                                                        className="w-full text-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all cursor-pointer hover:border-gray-300"
                                                        value={student.ratings[d.id] || ''}
                                                        onChange={(e) => handleRatingChange(sIdx, d.id, e.target.value)}
                                                    >
                                                        <option value="">-</option>
                                                        <option value="5">5 - Excellent</option>
                                                        <option value="4">4 - Very Good</option>
                                                        <option value="3">3 - Good</option>
                                                        <option value="2">2 - Fair</option>
                                                        <option value="1">1 - Poor</option>
                                                    </select>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Manage Domains Modal */}
            <Modal
                isOpen={isDomainModalOpen}
                onClose={() => { setIsDomainModalOpen(false); setEditingDomainId(null); setNewDomainName(''); }}
                title="Manage Attributes"
            >
                <div className="p-6 space-y-6">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Attribute Name (e.g. Punctuality)"
                            value={newDomainName}
                            onChange={(e) => setNewDomainName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddOrUpdateDomain()}
                        />
                        <button
                            onClick={handleAddOrUpdateDomain}
                            disabled={!newDomainName.trim()}
                            className="bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm font-medium flex items-center gap-2"
                        >
                            {editingDomainId ? "Update" : <><Plus className="w-4 h-4" /> Add</>}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-900 dark:text-white">Existing Attributes</label>
                            <span className="text-xs text-gray-500">{domains.length} items</span>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {domains.map(d => (
                                <div key={d.id} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:border-gray-300 transition-colors">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {d.name}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEditDomain(d)}
                                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-all"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDomainClick(d)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {domains.length === 0 && (
                                <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-500">No attributes added yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                        <button
                            onClick={() => setIsDomainModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteDomainOpen}
                onClose={() => setIsDeleteDomainOpen(false)}
                title="Delete Attribute"
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium">This will remove all student ratings for this attribute.</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">"{deletingDomain?.name}"</span>?
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setIsDeleteDomainOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteDomain}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                        >
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SkillsPage;
