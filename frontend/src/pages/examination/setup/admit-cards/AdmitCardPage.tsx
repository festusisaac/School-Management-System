import { useState, useEffect } from 'react';
import { Plus, Layout, Printer, Save, Trash2, Edit3 } from 'lucide-react';
import { examinationService, ExamGroup, AdmitCard } from '../../../../services/examinationService';
import api from '../../../../services/api';
import { useToast } from '../../../../context/ToastContext';
import TemplateBuilder from './TemplateBuilder';
import TemplatePreview from './TemplatePreview';
import BatchManager from './BatchManager';
import BatchPrintView from './BatchPrintView';
import { Modal } from '../../../../components/ui/modal';
import { DataTable } from '../../../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

const AdmitCardPage = () => {
    const [groups, setGroups] = useState<ExamGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [admitCards, setAdmitCards] = useState<AdmitCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'design' | 'print'>('design');

    // Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [templateName, setTemplateName] = useState('');
    const [sections, setSections] = useState<any[]>([]);
    const [config, setConfig] = useState({
        primaryColor: '#1e40af',
        secondaryColor: '#ffffff',
        layout: 'portrait' as 'portrait' | 'landscape',
        cardsPerPage: 1,
        watermarkText: ''
    });

    // Batch Print State
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [students, setStudents] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [selectedTemplateForPrint, setSelectedTemplateForPrint] = useState<AdmitCard | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [printStudents, setPrintStudents] = useState<any[]>([]);

    const { showSuccess, showError } = useToast();

    useEffect(() => {
        fetchGroups();
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            fetchAdmitCards();
            fetchSchedules();
        }
    }, [selectedGroup]);

    useEffect(() => {
        if (selectedClass) {
            fetchStudents();
        }
    }, [selectedClass]);

    const fetchGroups = async () => {
        try {
            const data = await examinationService.getExamGroups();
            setGroups(data || []);
            if (data && data.length > 0 && !selectedGroup) setSelectedGroup(data[0].id);
        } catch (error) {
            showError('Failed to fetch exam groups');
        }
    };

    const fetchClasses = async () => {
        try {
            const data = await api.getClasses();
            setClasses(data || []);
        } catch (error) {
            console.error('Failed to fetch classes', error);
        }
    };

    const fetchAdmitCards = async () => {
        if (!selectedGroup) return;
        setLoading(true);
        try {
            const data = await examinationService.getAdmitCards(selectedGroup);
            setAdmitCards(data || []);
            if (data && data.length > 0) setSelectedTemplateForPrint(data[0]);
        } catch (error) {
            showError('Failed to fetch templates');
        } finally {
            setLoading(false);
        }
    };

    const fetchSchedules = async () => {
        if (!selectedGroup) return;
        try {
            const data = await examinationService.getSchedules(selectedGroup);
            setSchedules(data || []);
        } catch (error) {
            console.error('Failed to fetch schedules', error);
        }
    };

    const fetchStudents = async () => {
        if (!selectedClass) return;
        try {
            const data = await api.getStudents({ classId: selectedClass });
            setStudents(data || []);
        } catch (error) {
            showError('Failed to fetch students');
        }
    };

    const handleCreateNew = () => {
        setEditingId(null);
        setTemplateName('New Template');
        setSections([
            { id: '1', type: 'header', settings: { heading: 'SCHOOL NAME', subHeading: 'EXAMINATION 2026' } },
            { id: '2', type: 'studentInfo', settings: { fields: { rollNumber: true, admissionNo: true, photo: true } } },
            { id: '3', type: 'timetable', settings: { showVenue: true } },
            { id: '4', type: 'footer', settings: { footerText: 'Rules & Regulations...', showQrCode: true } }
        ]);
        setIsEditorOpen(true);
    };

    const handleEdit = (card: AdmitCard) => {
        setEditingId(card.id);
        setTemplateName(card.templateName);
        setSections(card.sections);
        setConfig(card.config);
        setIsEditorOpen(true);
    };

    const handleSaveTemplate = async () => {
        if (!templateName) {
            showError('Template name is required');
            return;
        }

        const payload = {
            templateName,
            sections,
            config,
            examGroupId: selectedGroup
        };

        try {
            if (editingId) {
                await examinationService.updateAdmitCard(editingId, payload);
                showSuccess('Template updated successfully');
            } else {
                await examinationService.createAdmitCard(payload);
                showSuccess('Template created successfully');
            }
            setIsEditorOpen(false);
            fetchAdmitCards();
        } catch (error) {
            showError('Failed to save template');
        }
    };

    const handleBatchPrint = (selectedStudentIds: string[]) => {
        if (!selectedTemplateForPrint) {
            showError('Please select a template for printing');
            return;
        }

        const studentsToPrint = students.filter(s => selectedStudentIds.includes(s.id));
        if (studentsToPrint.length === 0) {
            showError('Please select at least one student');
            return;
        }

        setPrintStudents(studentsToPrint);
        setIsPrinting(true);
        showSuccess(`Preparing ${studentsToPrint.length} cards for printing...`);
    };

    const columns: ColumnDef<AdmitCard>[] = [
        {
            accessorKey: 'templateName',
            header: 'Template Name',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{row.original.templateName}</span>
                    <span className="text-xs text-gray-500">ID: {row.original.id.slice(0, 8)}</span>
                </div>
            )
        },
        {
            accessorKey: 'examGroupId',
            header: 'Exam Group',
            cell: ({ row }) => {
                const group = groups.find(g => g.id === row.original.examGroupId);
                return (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                        {group?.name || 'Unknown Group'}
                    </span>
                );
            }
        },
        {
            accessorKey: 'config',
            header: 'Theme',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div
                        className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm"
                        style={{ backgroundColor: row.original.config.primaryColor || '#2563eb' }}
                    />
                    <span className="text-xs text-gray-500">{row.original.config.layout === 'modern' ? 'Modern Block' : 'Compact'}</span>
                </div>
            )
        },
        {
            accessorKey: 'sections',
            header: 'Design',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <div className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
                        {row.original.sections.length} blocks
                    </div>
                </div>
            )
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => handleEdit(row.original)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit Template"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm('Are you sure you want to delete this template? This cannot be undone.')) {
                                try {
                                    await examinationService.deleteAdmitCard(row.original.id);
                                    showSuccess('Template deleted successfully');
                                    fetchAdmitCards();
                                } catch (error) {
                                    showError('Failed to delete template');
                                }
                            }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Template"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admit Card System</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Professional admit card generation</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1 mb-1">Active Exam Group</label>
                        <select
                            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm min-w-[200px]"
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                        >
                            <option value="">Select Exam Group</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end gap-3 h-full pb-0.5">
                        <button
                            onClick={handleCreateNew}
                            disabled={!selectedGroup}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm h-[38px]"
                        >
                            <Plus className="w-4 h-4" />
                            Create Template
                        </button>

                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg h-[38px] items-center">
                            <button
                                onClick={() => setActiveTab('design')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'design' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                            >
                                <Layout className="w-3.5 h-3.5" /> Design
                            </button>
                            <button
                                onClick={() => setActiveTab('print')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'print' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                            >
                                <Printer className="w-3.5 h-3.5" /> Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {activeTab === 'design' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-3">
                        <DataTable columns={columns} data={admitCards} searchKey="templateName" />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm space-y-5">
                            <h3 className="font-bold text-gray-900 border-b pb-2">Print Configuration</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Template</label>
                                <select
                                    className="w-full rounded-md border border-gray-300 p-2 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedTemplateForPrint?.id || ''}
                                    onChange={(e) => setSelectedTemplateForPrint(admitCards.find(c => c.id === e.target.value) || null)}
                                >
                                    {admitCards.map(c => <option key={c.id} value={c.id}>{c.templateName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Class</label>
                                <select
                                    className="w-full rounded-md border border-gray-300 p-2 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                >
                                    <option value="">Choose Class...</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-3">
                        <BatchManager
                            students={students}
                            onPrintBatch={handleBatchPrint}
                            loading={loading}
                        />
                    </div>
                </div>
            )}

            <Modal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                title={editingId ? "Edit Template" : "Create Template"}
                size="full"
            >
                <div className="flex flex-col h-full bg-white dark:bg-gray-800">
                    {/* Toolbelt - Second Header */}
                    <div className="flex items-center justify-between px-6 py-3 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <label className="absolute -top-2 left-2 px-1 bg-gray-50 dark:bg-gray-900 text-xs font-medium text-gray-500 transition-colors group-focus-within:text-blue-500">Template Name</label>
                                <input
                                    type="text"
                                    className="text-lg font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 w-[350px] transition-all"
                                    placeholder="Enter template name..."
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-500 mb-1">Assigned To</span>
                                <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium border border-blue-100 dark:border-blue-900/50">
                                    {groups.find(g => g.id === (editingId ? admitCards.find(c => c.id === editingId)?.examGroupId : selectedGroup))?.name || 'No Group'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3 pr-6 border-r border-gray-100 dark:border-gray-700">
                                <div className="text-right">
                                    <p className="text-xs font-medium text-gray-500">Layout Style</p>
                                    <div className="flex gap-1 mt-1">
                                        <button
                                            onClick={() => setConfig({ ...config, layout: 'portrait' })}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${config.layout === 'portrait' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                                        >
                                            Portrait
                                        </button>
                                        <button
                                            onClick={() => setConfig({ ...config, layout: 'landscape' })}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${config.layout === 'landscape' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                                        >
                                            Landscape
                                        </button>
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <p className="text-xs font-medium text-gray-500">Brand Color</p>
                                    <input
                                        type="color"
                                        className="w-10 h-6 rounded mt-1 cursor-pointer bg-transparent border-none block ml-auto"
                                        value={config.primaryColor}
                                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveTemplate}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                            >
                                <Save className="w-4 h-4" /> Save Design
                            </button>
                        </div>
                    </div>

                    {/* Main Split Interface */}
                    <div className="flex-1 overflow-hidden flex">
                        {/* Builder Sidebar */}
                        <div className="w-[450px] overflow-y-auto p-6 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 custom-scrollbar">
                            <TemplateBuilder
                                sections={sections}
                                onChange={setSections}
                            />
                        </div>

                        {/* Preview Area */}
                        <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-10 overflow-y-auto flex items-start justify-center custom-scrollbar">
                            <TemplatePreview
                                sections={sections}
                                config={config}
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {isPrinting && selectedTemplateForPrint && (
                <BatchPrintView
                    template={{
                        sections: selectedTemplateForPrint.sections,
                        config: selectedTemplateForPrint.config
                    }}
                    students={printStudents}
                    schedules={schedules}
                    onClose={() => setIsPrinting(false)}
                />
            )}
        </div>
    );
};

export default AdmitCardPage;
