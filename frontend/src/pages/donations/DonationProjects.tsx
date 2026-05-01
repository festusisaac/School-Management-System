import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Calendar, Target, TrendingUp, Download, Image as ImageIcon, X, Upload } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api, { getFileUrl } from '../../services/api';
import { Modal } from '../../components/ui/modal';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { exportDonationProjects } from '../../utils/excelExport';

interface Project {
    id: string;
    title: string;
    description: string;
    goalAmount: number;
    currentAmount: number;
    endDate?: string;
    status: string;
    bannerImage?: string;
}

const DonationProjects = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { showSuccess, showError } = useToast();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        goalAmount: '',
        endDate: '',
        status: 'active'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await api.getAdminDonationProjects();
            setProjects(data);
        } catch (error) {
            showError("Failed to fetch projects");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('goalAmount', formData.goalAmount);
            if (formData.endDate) submitData.append('endDate', formData.endDate);
            submitData.append('status', formData.status);
            
            if (selectedFile) {
                submitData.append('bannerImage', selectedFile);
            }

            if (editingProject) {
                await api.updateDonationProject(editingProject.id, submitData);
                showSuccess("Project updated successfully");
            } else {
                await api.createDonationProject(submitData);
                showSuccess("Project created successfully");
            }
            setIsModalOpen(false);
            setPreviewUrl(null);
            setSelectedFile(null);
            fetchData();
        } catch (error) {
            showError("Failed to save project");
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;
        try {
            await api.deleteDonationProject(id);
            showSuccess("Project deleted");
            fetchData();
        } catch (error) {
            showError("Failed to delete project");
        }
    };

    const columns: ColumnDef<Project>[] = [
        {
            accessorKey: 'bannerImage',
            header: 'Banner',
            cell: ({ row }) => (
                <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {row.original.bannerImage ? (
                        <img 
                            src={getFileUrl(row.original.bannerImage)} 
                            alt="" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            )
        },
        {
            accessorKey: 'title',
            header: 'Project Name',
            cell: ({ row }) => (
                <div>
                    <div className="font-bold text-gray-900 dark:text-white">{row.original.title}</div>
                    <div className="text-[10px] text-gray-500 line-clamp-1">{row.original.description}</div>
                </div>
            )
        },
        {
            accessorKey: 'progress',
            header: 'Funding Progress',
            cell: ({ row }) => {
                const progress = (row.original.currentAmount / row.original.goalAmount) * 100;
                return (
                    <div className="w-48">
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="font-bold">₦{Number(row.original.currentAmount).toLocaleString()}</span>
                            <span className="text-gray-400">of ₦{Number(row.original.goalAmount).toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary-600 rounded-full" 
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    row.original.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'
                }`}>
                    {row.original.status}
                </span>
            )
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            setEditingProject(row.original);
                            setFormData({
                                title: row.original.title,
                                description: row.original.description,
                                goalAmount: row.original.goalAmount.toString(),
                                endDate: row.original.endDate ? row.original.endDate.split('T')[0] : '',
                                status: row.original.status
                            });
                            setPreviewUrl(row.original.bannerImage ? getFileUrl(row.original.bannerImage) : null);
                            setIsModalOpen(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleDeleteProject(row.original.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Fundraising Projects</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Create and manage campaigns for school development</p>
                </div>
                <button 
                    onClick={() => {
                        setEditingProject(null);
                        setFormData({ title: '', description: '', goalAmount: '', endDate: '', status: 'active' });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                >
                    <Plus className="w-5 h-5" />
                    Create Campaign
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Search projects..." className="pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-700 border-none outline-none w-64" />
                        </div>
                    </div>
                    <button 
                        onClick={() => exportDonationProjects(projects)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Export List
                    </button>
                </div>
                <DataTable columns={columns} data={projects} />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProject ? 'Edit Project' : 'New Fundraising Project'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Project Title</label>
                            <input 
                                required
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                                placeholder="e.g. Science Laboratory Upgrade"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Description</label>
                            <textarea 
                                required
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm min-h-[120px]"
                                placeholder="Describe why this project is important..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Project Banner</label>
                            <div className="mt-2">
                                {previewUrl ? (
                                    <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            type="button"
                                            onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all group">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl group-hover:scale-110 transition-transform mb-3">
                                                <Upload className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Click to upload</p>
                                            <p className="text-[10px] text-gray-400 mt-1 uppercase">PNG, JPG or WEBP (Max 5MB)</p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Goal Amount (₦)</label>
                                <input 
                                    required
                                    type="number"
                                    value={formData.goalAmount}
                                    onChange={e => setFormData({...formData, goalAmount: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Target End Date</label>
                                <input 
                                    type="date"
                                    value={formData.endDate}
                                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Status</label>
                            <select 
                                value={formData.status}
                                onChange={e => setFormData({...formData, status: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                            >
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
                        <button type="submit" className="px-8 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all">
                            {editingProject ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DonationProjects;
