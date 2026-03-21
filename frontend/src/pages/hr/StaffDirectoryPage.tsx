import { useState, useEffect } from 'react';
import { Plus, Search, Users, UserCheck, UserX, Download, Upload, Trash2, Edit2, Eye, Facebook, Twitter, Linkedin, Instagram, FileText, History as HistoryIcon, Calendar, TrendingUp, Filter, MoreVertical, Mail, Phone, MapPin, Briefcase, User as UserIcon, Shield, Clock, CheckCircle2, XCircle, Lock, Unlock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { staffService } from '../../services/hrService';
import { systemService, Role } from '../../services/systemService';
import { useToast } from '../../context/ToastContext';
import { useSystem } from '../../context/SystemContext';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';

interface Department {
    id: string;
    name: string;
    code: string;
}

interface Staff {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: Department;
    departmentId?: string;
    employmentType: string;
    status: string;
    photo?: string;
    dateOfJoining: string;
    gender?: string;
    basicSalary?: number;
    bankName?: string;
    accountNumber?: string;
    biometricId?: string;
    qualifications?: string;

    // Extended fields
    role?: string;
    roleId?: string; // Added roleId
    isTeachingStaff?: boolean;
    fatherName?: string;
    motherName?: string;
    maritalStatus?: string;
    permanentAddress?: string;
    workExperience?: string;
    note?: string;
    facebookUrl?: string;
    twitterUrl?: string;
    linkedinUrl?: string;
    instagramUrl?: string;
    accountTitle?: string;

    // Legacy/Existing fields
    dateOfBirth?: string;
    bloodGroup?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;

    // Files (paths)
    resume?: string;
    joiningLetter?: string;
    resignationLetter?: string;
    certificates?: string[];
    idProof?: string;
    otherDocuments?: string[];
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const StaffDirectoryPage = () => {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [viewingStaff, setViewingStaff] = useState<Staff | null>(null);
    const [viewTab, setViewTab] = useState<'info' | 'history'>('info');
    const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
    const [statistics, setStatistics] = useState({
        total: 0,
        active: 0,
        onLeave: 0,
    });
    const [selectedFiles, setSelectedFiles] = useState<Record<string, string | string[]>>({});
    const [enableLogin, setEnableLogin] = useState(false);
    const toast = useToast();
    const { settings } = useSystem();

    const [employeeIdField, setEmployeeIdField] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files, multiple } = e.target;
        if (files && files.length > 0) {
            const maxSizeMb = settings?.maxFileUploadSizeMb || 2;
            const oversized = Array.from(files).find(f => f.size > maxSizeMb * 1024 * 1024);
            if (oversized) {
                toast.showWarning(`File "${oversized.name}" exceeds ${maxSizeMb}MB limit. Please choose a smaller file.`);
                e.target.value = '';
                return;
            }
            if (multiple) {
                const names = Array.from(files).map(f => f.name);
                setSelectedFiles(prev => ({ ...prev, [name]: names }));
            } else {
                setSelectedFiles(prev => ({ ...prev, [name]: files[0].name }));
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterStaff();
    }, [searchTerm, selectedDepartment, selectedStatus, staff]);

    // Handle Prefix for New Staff
    useEffect(() => {
        if (!editingStaff && showModal && settings?.staffIdPrefix && !employeeIdField) {
            setEmployeeIdField(settings.staffIdPrefix);
        }
    }, [showModal, editingStaff, settings?.staffIdPrefix]);

    useEffect(() => {
        if (editingStaff) {
            setEmployeeIdField(editingStaff.employeeId);
        } else if (!showModal) {
            setEmployeeIdField('');
        }
    }, [editingStaff, showModal, enableLogin]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [staffData, depts, rolesData, stats] = await Promise.all([
                staffService.getAllStaff(),
                staffService.getDepartments().catch(() => []),
                systemService.getRoles().catch(() => []),
                staffService.getStaffStatistics().catch(() => ({ total: 0, active: 0, onLeave: 0 }))
            ]);

            setStaff(staffData || []);
            setDepartments(depts || []);
            setRoles(rolesData || []);
            setStatistics(stats);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterStaff = () => {
        let filtered = [...staff];

        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedDepartment) {
            filtered = filtered.filter(s => s.department?.id === selectedDepartment);
        }

        if (selectedStatus) {
            filtered = filtered.filter(s => s.status === selectedStatus);
        }

        setFilteredStaff(filtered);
    };

    const handleEdit = (staffMember: Staff) => {
        setEditingStaff(staffMember);
        setSelectedFiles({});
        setEnableLogin(false); // Reset enableLogin when editing existing staff
        setShowModal(true);
    };

    const fetchSalaryHistory = async (staffId: string) => {
        try {
            const data = await staffService.getPayrolls({ staffId });
            // Sort by year/month descending for table, ascending for chart
            setSalaryHistory(data);
        } catch (error) {
            console.error('Error fetching salary history:', error);
        }
    };

    const handleViewStaff = async (staff: Staff) => {
        setViewingStaff(staff);
        setViewTab('info');
        setSalaryHistory([]);
        setShowViewModal(true);
        fetchSalaryHistory(staff.id);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this staff member?')) return;
        try {
            await staffService.deleteStaff(id);
            toast.showSuccess('Staff member deleted successfully!');
            fetchData();
        } catch (error) {
            console.error('Error deleting staff:', error);
            toast.showError('Failed to delete staff member');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800';
            case 'On Leave': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Directory</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all staff members and their information</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors">
                        <Upload size={20} />
                        Import
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors">
                        <Download size={20} />
                        Export
                    </button>
                    <button
                        onClick={() => { setEditingStaff(null); setSelectedFiles({}); setEnableLogin(false); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus size={20} />
                        Add Staff
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Staff</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{statistics.total}</p>
                        </div>
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
                            <Users size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{statistics.active}</p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                            <UserCheck size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">On Leave</p>
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{statistics.onLeave}</p>
                        </div>
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg">
                            <Users size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, ID..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>
                    <select
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                    </select>
                </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4">Loading staff directory...</p>
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        No staff members found matching your criteria.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-200">Staff Member</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-200">ID</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-200">Department</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-200">Role</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-200">Status</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-200 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredStaff.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {member.photo ? (
                                                    <img src={member.photo.startsWith('http') ? member.photo : `http://localhost:3000${member.photo}`} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold">
                                                        {member.firstName[0]}{member.lastName[0]}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{member.firstName} {member.lastName}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                            {member.employeeId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                            {member.department?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1 w-fit">
                                                <Shield size={12} />
                                                {roles.find(r => r.id === member.roleId)?.name || member.role || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(member.status)}`}>
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                {member.resume && (
                                                    <a href={member.resume.startsWith('http') ? member.resume : `http://localhost:3000${member.resume}`} target="_blank" rel="noreferrer" className="p-1 text-green-600 hover:bg-green-50 rounded" title="Download Resume">
                                                        <FileText size={18} />
                                                    </a>
                                                )}
                                                <button onClick={() => handleViewStaff(member)} className="p-1 text-primary-600 hover:bg-primary-50 rounded" title="View Staff Details"><Eye size={18} /></button>
                                                <button onClick={() => handleEdit(member)} className="p-1 text-primary-600 hover:bg-primary-50 rounded"><Edit2 size={18} /></button>
                                                <button onClick={() => handleDelete(member.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Staff Modal (Add/Edit) */}
            {
                showModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500/75 dark:bg-gray-900/80 backdrop-blur-sm"></div>
                            </div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    // The backend accepts 'dateOfBirth' and 'dateOfJoining' as date strings or objects, 
                                    // but FormData sends strings. This is fine if backend DTO checks for IsString or IsDateString.
                                    // If validation requires cleanup, we might need manual mapping, but sending FormData directly is supported by my plan.
                                    // However, checking the `create` logic, I am passing `createStaffDto` which comes from Body.
                                    // NestJS with FileInterceptor and Body populates Body with fields from multipart.
                                    // BUT: If some fields are empty strings, transformations might be needed.

                                    try {
                                        if (editingStaff) {
                                            // TODO: Editing with files requires backend update support
                                            await staffService.updateStaff(editingStaff.id, formData);
                                            toast.showSuccess('Staff member updated successfully!');
                                        } else {
                                            await staffService.createStaff(formData);
                                            toast.showSuccess('Staff member created successfully!');
                                        }
                                        setShowModal(false);
                                        setEditingStaff(null);
                                        fetchData();
                                    } catch (error: any) {
                                        console.error('Error saving staff:', error);
                                        const message = error.response?.data?.message || 'Failed to save staff member';
                                        toast.showError(Array.isArray(message) ? message.join(', ') : message);
                                    }
                                }}>
                                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingStaff ? 'Edit Staff Member' : 'Add New Staff'}</h3>
                                            <button
                                                type="button"
                                                onClick={() => { setShowModal(false); setEditingStaff(null); }}
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                            >
                                                <Plus className="rotate-45" size={24} />
                                            </button>
                                        </div>

                                        <div className="space-y-8">
                                            {/* Basic Information */}
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-2 mb-4 flex items-center gap-2">
                                                    <Users size={18} className="text-primary-600 dark:text-primary-400" />
                                                    Basic Information
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {/* Row 1 */}
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Staff ID *</label>
                                                        <div className="flex">
                                                            {settings?.staffIdPrefix && (
                                                                <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-bold select-none whitespace-nowrap">
                                                                    {settings.staffIdPrefix}
                                                                </span>
                                                            )}
                                                            <input
                                                                name="employeeId"
                                                                value={settings?.staffIdPrefix ? employeeIdField.replace(settings.staffIdPrefix, '') : employeeIdField}
                                                                required
                                                                onChange={(e) => {
                                                                    const prefix = settings?.staffIdPrefix || '';
                                                                    setEmployeeIdField(prefix + e.target.value);
                                                                }}
                                                                placeholder="e.g. 001"
                                                                className={`w-full border border-gray-300 dark:border-gray-600 p-2 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${settings?.staffIdPrefix ? 'rounded-r-lg' : 'rounded-lg'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Role</label>
                                                        <select
                                                            name="roleId"
                                                            defaultValue={editingStaff?.roleId}
                                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                            onChange={(e) => {
                                                                // Automatically enable login if a role is selected
                                                                if (e.target.value) setEnableLogin(true);
                                                            }}
                                                        >
                                                            <option value="">Select Role</option>
                                                            {roles.filter(r => r.name !== 'Super Administrator').map(role => (
                                                                <option key={role.id} value={role.id}>{role.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Department</label>
                                                        <select name="departmentId" defaultValue={editingStaff?.departmentId} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                                            <option value="">Select</option>
                                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                        </select>
                                                    </div>

                                                    {/* Row 2 */}
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">First Name *</label>
                                                        <input name="firstName" defaultValue={editingStaff?.firstName} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Last Name *</label>
                                                        <input name="lastName" defaultValue={editingStaff?.lastName} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Father Name</label>
                                                        <input name="fatherName" defaultValue={editingStaff?.fatherName} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Mother Name</label>
                                                        <input name="motherName" defaultValue={editingStaff?.motherName} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>

                                                    {/* Row 3 */}
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Email *</label>
                                                        <input type="email" name="email" defaultValue={editingStaff?.email} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Gender *</label>
                                                        <select name="gender" defaultValue={editingStaff?.gender} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                                            <option value="">Select</option>
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Date of Birth *</label>
                                                        <input type="date" name="dateOfBirth" defaultValue={editingStaff?.dateOfBirth ? new Date(editingStaff.dateOfBirth).toISOString().split('T')[0] : ''} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Date of Joining</label>
                                                        <input type="date" name="dateOfJoining" defaultValue={editingStaff?.dateOfJoining ? new Date(editingStaff.dateOfJoining).toISOString().split('T')[0] : ''} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>

                                                    {/* Row 4 */}
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Phone</label>
                                                        <input name="phone" defaultValue={editingStaff?.phone} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Emergency Contact</label>
                                                        <input name="emergencyContactPhone" defaultValue={editingStaff?.emergencyContactPhone} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Marital Status</label>
                                                        <select name="maritalStatus" defaultValue={editingStaff?.maritalStatus} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                                            <option value="">Select</option>
                                                            <option value="Single">Single</option>
                                                            <option value="Married">Married</option>
                                                            <option value="Divorced">Divorced</option>
                                                            <option value="Widowed">Widowed</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Photo</label>
                                                        <div className="flex items-center gap-3">
                                                            {editingStaff?.photo && (
                                                                <img src={editingStaff.photo.startsWith('http') ? editingStaff.photo : `http://localhost:3000${editingStaff.photo}`} alt="Current" className="w-10 h-10 rounded-full object-cover border dark:border-gray-700" />
                                                            )}
                                                            <div className="relative flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center h-10">
                                                                <input type="file" name="photo" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                                                                    <Upload size={16} />
                                                                    <span className="max-w-[150px] truncate">{selectedFiles['photo'] || (editingStaff?.photo ? 'Change' : 'Upload')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Current Address */}
                                                    <div className="lg:col-span-2">
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Current Address</label>
                                                        <textarea name="address" rows={2} defaultValue={editingStaff?.address} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"></textarea>
                                                    </div>

                                                    {/* Permanent Address */}
                                                    <div className="lg:col-span-2">
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Permanent Address</label>
                                                        <textarea name="permanentAddress" rows={2} defaultValue={editingStaff?.permanentAddress} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"></textarea>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bank Account Details */}
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-2 mb-4 flex items-center gap-2">
                                                    <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-full text-primary-600 dark:text-primary-400"><Users size={16} /></div>
                                                    Bank Account Details
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Account Name</label>
                                                        <input name="accountTitle" defaultValue={editingStaff ? `${editingStaff.firstName} ${editingStaff.lastName}` : ''} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name</label>
                                                        <input name="bankName" defaultValue={editingStaff?.bankName} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Account Number</label>
                                                        <input name="accountNumber" defaultValue={editingStaff?.accountNumber} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Payroll Details */}
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2 mb-4 flex items-center gap-2">
                                                    <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-full"><FileText size={16} /></div>
                                                    Payroll Details
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Basic Salary *</label>
                                                        <input type="number" name="basicSalary" defaultValue={editingStaff?.basicSalary || 0} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Employment Type *</label>
                                                        <select name="employmentType" defaultValue={editingStaff?.employmentType || 'Full-Time'} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                                            <option value="Full-Time">Full-Time</option>
                                                            <option value="Part-Time">Part-Time</option>
                                                            <option value="Contract">Contract</option>
                                                            <option value="Temporary">Temporary</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Biometric ID</label>
                                                        <input name="biometricId" defaultValue={editingStaff?.biometricId} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Qualification & Professional Info */}
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2 mb-4 flex items-center gap-2">
                                                    <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-full"><Users size={16} /></div>
                                                    Qualification & Professional Info
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="lg:col-span-1">
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Qualification</label>
                                                        <input name="qualifications" defaultValue={editingStaff?.qualifications} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div className="lg:col-span-1">
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Work Experience</label>
                                                        <input name="workExperience" defaultValue={editingStaff?.workExperience} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div className="lg:col-span-2">
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Note</label>
                                                        <input name="note" defaultValue={editingStaff?.note} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Social Media Links */}
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2 mb-4 flex items-center gap-2">
                                                    <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-full"><Users size={16} /></div>
                                                    Social Media Links
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Facebook URL</label>
                                                        <input name="facebookUrl" defaultValue={editingStaff?.facebookUrl} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Twitter URL</label>
                                                        <input name="twitterUrl" defaultValue={editingStaff?.twitterUrl} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Linkedin URL</label>
                                                        <input name="linkedinUrl" defaultValue={editingStaff?.linkedinUrl} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Instagram URL</label>
                                                        <input name="instagramUrl" defaultValue={editingStaff?.instagramUrl} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 outline-none focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Upload Documents */}
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2 mb-4 flex items-center gap-2">
                                                    <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-full"><FileText size={16} /></div>
                                                    Upload Documents
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="flex items-center gap-4 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="block text-sm font-semibold text-gray-900 dark:text-white">Resume</label>
                                                                {editingStaff?.resume && (
                                                                    <a href={`http://localhost:3000${editingStaff.resume}`} target="_blank" rel="noreferrer" className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                                                                        <Eye size={12} /> View Current
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <div className="relative group">
                                                                <div className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-800/50">
                                                                    <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                                                                        <Upload size={16} />
                                                                        <span className="truncate">{selectedFiles['resume'] || 'Drag & drop or click'}</span>
                                                                    </div>
                                                                    <input type="file" name="resume" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="block text-sm font-semibold text-gray-900 dark:text-white">Joining Letter</label>
                                                                {editingStaff?.joiningLetter && (
                                                                    <a href={`http://localhost:3000${editingStaff.joiningLetter}`} target="_blank" rel="noreferrer" className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                                                                        <Eye size={12} /> View Current
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <div className="relative group">
                                                                <div className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-800/50">
                                                                    <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                                                                        <Upload size={16} />
                                                                        <span className="truncate">{selectedFiles['joiningLetter'] || 'Drag & drop or click'}</span>
                                                                    </div>
                                                                    <input type="file" name="joiningLetter" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="block text-sm font-semibold text-gray-900 dark:text-white">Resignation Letter</label>
                                                                {editingStaff?.resignationLetter && (
                                                                    <a href={`http://localhost:3000${editingStaff.resignationLetter}`} target="_blank" rel="noreferrer" className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                                                                        <Eye size={12} /> View Current
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <div className="relative group">
                                                                <div className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-800/50">
                                                                    <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                                                                        <Upload size={16} />
                                                                        <span className="truncate">{selectedFiles['resignationLetter'] || 'Drag & drop or click'}</span>
                                                                    </div>
                                                                    <input type="file" name="resignationLetter" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="block text-sm font-semibold text-gray-900 dark:text-white">Other Documents (Multiple)</label>
                                                                {editingStaff?.otherDocuments && editingStaff.otherDocuments.length > 0 && (
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {editingStaff.otherDocuments.length} files exist
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="relative group">
                                                                <div className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-800/50">
                                                                    <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                                                                        <Upload size={16} />
                                                                        <span className="truncate">
                                                                            {selectedFiles['otherDocuments']
                                                                                ? (Array.isArray(selectedFiles['otherDocuments'])
                                                                                    ? `${selectedFiles['otherDocuments'].length} files selected`
                                                                                    : selectedFiles['otherDocuments'])
                                                                                : 'Drag & drop or click'}
                                                                        </span>
                                                                    </div>
                                                                    <input type="file" name="otherDocuments" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="block text-sm font-semibold text-gray-900 dark:text-white">ID Proof</label>
                                                                {editingStaff?.idProof && (
                                                                    <a href={`http://localhost:3000${editingStaff.idProof}`} target="_blank" rel="noreferrer" className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                                                                        <Eye size={12} /> View Current
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <div className="relative group">
                                                                <div className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-800/50">
                                                                    <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                                                                        <Upload size={16} />
                                                                        <span className="truncate">{selectedFiles['idProof'] || 'Drag & drop or click'}</span>
                                                                    </div>
                                                                    <input type="file" name="idProof" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <label className="block text-sm font-semibold text-gray-900 dark:text-white">Certificates (Multiple)</label>
                                                                {editingStaff?.certificates && editingStaff.certificates.length > 0 && (
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {editingStaff.certificates.length} files exist
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="relative group">
                                                                <div className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-800/50">
                                                                    <div className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                                                                        <Upload size={16} />
                                                                        <span className="truncate">
                                                                            {selectedFiles['certificates']
                                                                                ? (Array.isArray(selectedFiles['certificates'])
                                                                                    ? `${selectedFiles['certificates'].length} files selected`
                                                                                    : selectedFiles['certificates'])
                                                                                : 'Drag & drop or click'}
                                                                        </span>
                                                                    </div>
                                                                    <input type="file" name="certificates" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Login Credentials */}
                                                    {!editingStaff && (
                                                        <div className="bg-primary-50/50 dark:bg-primary-900/10 p-6 rounded-xl border border-primary-100 dark:border-primary-900/30">
                                                            <h4 className="font-bold text-gray-800 dark:text-gray-200 border-b border-primary-100 dark:border-primary-900/30 pb-2 mb-4 flex items-center gap-2">
                                                                <Lock size={18} className="text-primary-600 dark:text-primary-400" />
                                                                System Login Access
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                <div className="flex items-center">
                                                                    <label className="relative inline-flex items-center cursor-pointer group">
                                                                        <input
                                                                            type="checkbox"
                                                                            name="enableLogin"
                                                                            className="sr-only peer"
                                                                            checked={enableLogin}
                                                                            onChange={(e) => setEnableLogin(e.target.checked)}
                                                                        />
                                                                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                                                        <span className="ml-4 text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">Enable System Login</span>
                                                                    </label>
                                                                </div>

                                                                {enableLogin && (
                                                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Initial Password *</label>
                                                                        <div className="relative">
                                                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" size={16} />
                                                                            <input
                                                                                type="password"
                                                                                name="password"
                                                                                required={enableLogin}
                                                                                placeholder="Enter a secure password"
                                                                                className="w-full pl-10 pr-4 py-2.5 border border-primary-200 dark:border-primary-900/50 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                                                                            />
                                                                        </div>
                                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 italic flex items-center gap-1">
                                                                            <Shield size={10} /> Min. 6 characters. User can change this later.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex flex-row-reverse gap-3 border-t dark:border-gray-700">
                                        <button type="submit" className="px-8 py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all">
                                            {editingStaff ? 'Update Staff Member' : 'Save Staff Member'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); setEditingStaff(null); setSelectedFiles({}); }}
                                            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Staff Profile View Modal */}
            {
                showViewModal && viewingStaff && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75 backdrop-blur-sm"></div>
                            </div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full border dark:border-gray-700">
                                <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Users className="text-primary-600 dark:text-primary-400" /> Staff Profile Details
                                    </h3>
                                    <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors">
                                        <Plus className="rotate-45" size={24} />
                                    </button>
                                </div>

                                <div className="p-6 max-h-[80vh] overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                                    {/* Tabs */}
                                    <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 mb-6 w-fit mx-auto shadow-sm">
                                        <button
                                            onClick={() => setViewTab('info')}
                                            className={`px-8 py-2 text-sm font-bold rounded-lg transition-all ${viewTab === 'info' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Users size={14} /> Full Details
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setViewTab('history')}
                                            className={`px-8 py-2 text-sm font-bold rounded-lg transition-all ${viewTab === 'history' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <HistoryIcon size={14} /> Salary History
                                            </div>
                                        </button>
                                    </div>

                                    {viewTab === 'info' ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Left Column: Basic Info & Photo */}
                                            <div className="lg:col-span-1 space-y-6">
                                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                                                    {viewingStaff.photo ? (
                                                        <img
                                                            src={viewingStaff.photo.startsWith('http') ? viewingStaff.photo : `http://localhost:3000${viewingStaff.photo}`}
                                                            alt="Profile"
                                                            className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-primary-50 dark:border-gray-700 shadow-md mb-4"
                                                        />
                                                    ) : (
                                                        <div className="w-32 h-32 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-4xl mx-auto mb-4">
                                                            {viewingStaff.firstName[0]}{viewingStaff.lastName[0]}
                                                        </div>
                                                    )}
                                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">{viewingStaff.firstName} {viewingStaff.lastName}</h4>
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(viewingStaff.status)}`}>
                                                        {viewingStaff.status}
                                                    </span>

                                                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4 text-left">
                                                        <div>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Staff ID</p>
                                                            <p className="text-sm font-medium dark:text-gray-200">{viewingStaff.employeeId}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Role</p>
                                                            <p className="text-sm font-medium dark:text-gray-200">{roles.find(r => r.id === viewingStaff.roleId)?.name || viewingStaff.role || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                    <h5 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                        <Users size={16} className="text-primary-600 dark:text-primary-400" /> Social Presence
                                                    </h5>
                                                    <div className="space-y-3">
                                                        {viewingStaff.facebookUrl && (
                                                            <a href={viewingStaff.facebookUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-500">
                                                                <Facebook size={16} /> Facebook Profile
                                                            </a>
                                                        )}
                                                        {viewingStaff.twitterUrl && (
                                                            <a href={viewingStaff.twitterUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-500">
                                                                <Twitter size={16} /> Twitter Handle
                                                            </a>
                                                        )}
                                                        {viewingStaff.linkedinUrl && (
                                                            <a href={viewingStaff.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-500">
                                                                <Linkedin size={16} /> LinkedIn Profile
                                                            </a>
                                                        )}
                                                        {viewingStaff.instagramUrl && (
                                                            <a href={viewingStaff.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-500">
                                                                <Instagram size={16} /> Instagram Profile
                                                            </a>
                                                        )}
                                                        {!viewingStaff.facebookUrl && !viewingStaff.twitterUrl && !viewingStaff.linkedinUrl && !viewingStaff.instagramUrl && (
                                                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No social links provided</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Detailed Tabs/Sections */}
                                            <div className="lg:col-span-2 space-y-6">
                                                {/* Personal & Family Info */}
                                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                    <h5 className="font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">Personal & Family Information</h5>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                                                        <div>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Father Name</p>
                                                            <p className="text-sm font-medium dark:text-gray-200">{viewingStaff.fatherName || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Mother Name</p>
                                                            <p className="text-sm font-medium dark:text-gray-200">{viewingStaff.motherName || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Date of Birth</p>
                                                            <p className="text-sm font-medium dark:text-gray-200">{viewingStaff.dateOfBirth ? new Date(viewingStaff.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Gender</p>
                                                            <p className="text-sm font-medium dark:text-gray-200">{viewingStaff.gender || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Marital Status</p>
                                                            <p className="text-sm font-medium dark:text-gray-200">{viewingStaff.maritalStatus || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Contact Info */}
                                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                    <h5 className="font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">Contact Information</h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Email Address</p>
                                                                <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{viewingStaff.email}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Phone Number</p>
                                                                <p className="text-sm font-medium dark:text-gray-200">{viewingStaff.phone}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Emergency Contact</p>
                                                                <p className="text-sm font-medium dark:text-gray-200">{viewingStaff.emergencyContactPhone || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Current Address</p>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">{viewingStaff.address || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Permanent Address</p>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">{viewingStaff.permanentAddress || viewingStaff.address || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Financial & Professional */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                        <h5 className="font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">Bank Account Details</h5>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Account Name</p>
                                                                <p className="text-sm font-medium dark:text-gray-200">{viewingStaff.accountTitle || `${viewingStaff.firstName} ${viewingStaff.lastName}`}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Bank Name</p>
                                                                <p className="text-sm font-medium dark:text-gray-200">{viewingStaff.bankName || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Account Number</p>
                                                                <p className="text-sm font-medium tracking-wider dark:text-gray-200">{viewingStaff.accountNumber || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                        <h5 className="font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">Payroll & Job Info</h5>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Basic Salary</p>
                                                                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(viewingStaff.basicSalary || 0)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Employment Type</p>
                                                                <p className="text-sm font-medium dark:text-gray-200">{viewingStaff.employmentType}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Date of Joining</p>
                                                                <p className="text-sm font-medium dark:text-gray-200">{new Date(viewingStaff.dateOfJoining).toLocaleDateString()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Biometric ID</p>
                                                                <p className="text-sm font-medium dark:text-gray-200">{viewingStaff.biometricId || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Qualifications & Experience */}
                                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                    <h5 className="font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">Qualifications & Professional Info</h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Qualification</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">{viewingStaff.qualifications || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Work Experience</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">{viewingStaff.workExperience || 'N/A'}</p>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold">Note / Remark</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-dashed dark:border-gray-700">{viewingStaff.note || 'No additional notes provided'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Uploaded Documents List */}
                                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                    <h5 className="font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b dark:border-gray-700 flex justify-between items-center">
                                                        <span>Uploaded Documents</span>
                                                        <FileText size={16} className="text-gray-400 dark:text-gray-500" />
                                                    </h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {viewingStaff.resume && (
                                                            <a href={`http://localhost:3000${viewingStaff.resume}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 group">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xs">PDF</div>
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Staff Resume</span>
                                                                </div>
                                                                <Eye size={16} className="text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500" />
                                                            </a>
                                                        )}
                                                        {viewingStaff.joiningLetter && (
                                                            <a href={`http://localhost:3000${viewingStaff.joiningLetter}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 group">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs">DOC</div>
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Joining Letter</span>
                                                                </div>
                                                                <Eye size={16} className="text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500" />
                                                            </a>
                                                        )}
                                                        {viewingStaff.idProof && (
                                                            <a href={`http://localhost:3000${viewingStaff.idProof}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 group">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs">ID</div>
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Identity Proof</span>
                                                                </div>
                                                                <Eye size={16} className="text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500" />
                                                            </a>
                                                        )}
                                                        {viewingStaff.certificates?.map((cert, idx) => (
                                                            <a key={idx} href={`http://localhost:3000${cert}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 group">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-bold text-xs">CERT</div>
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Certificate {idx + 1}</span>
                                                                </div>
                                                                <Eye size={16} className="text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500" />
                                                            </a>
                                                        ))}
                                                        {viewingStaff.otherDocuments?.map((doc, idx) => (
                                                            <a key={idx} href={`http://localhost:3000${doc}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 group">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-xs">DOC</div>
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Other Doc {idx + 1}</span>
                                                                </div>
                                                                <Eye size={16} className="text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Trends Chart */}
                                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                <h5 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                                    <TrendingUp size={18} className="text-primary-600 dark:text-primary-400" />
                                                    Earnings Trend (Last 6 Months)
                                                </h5>
                                                <div className="h-64">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={[...salaryHistory].reverse().slice(-6).map(p => ({
                                                            month: months[(p.month || 1) - 1] ? `${months[(p.month || 1) - 1]} ${p.year || ''}` : `Period ${p.month}`,
                                                            total: Number(p.netSalary || 0)
                                                        }))}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-700" opacity={0.5} />
                                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `${CURRENCY_SYMBOL}${v / 1000}k`} />
                                                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                                            <Area type="monotone" dataKey="total" stroke="rgb(var(--color-primary-rgb))" strokeWidth={3} fill="rgb(var(--color-primary-rgb) / 0.1)" className="dark:fill-primary-900/20" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* History Table */}
                                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                                <table className="w-full text-left">
                                                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                                        <tr>
                                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Period</th>
                                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Basic</th>
                                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Allowances</th>
                                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Deductions</th>
                                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Net Salary</th>
                                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y dark:divide-gray-700">
                                                        {salaryHistory.length === 0 ? (
                                                            <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">No payroll history found</td></tr>
                                                        ) : salaryHistory.map((p) => (
                                                            <tr key={p.id}>
                                                                <td className="px-6 py-4 text-sm font-bold dark:text-white">{months[(p.month || 1) - 1] || 'Unknown'} {p.year || ''} {p.paymentDate && <div className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">Paid on {new Date(p.paymentDate).toLocaleDateString()}</div>}</td>
                                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{formatCurrency(p.basicSalary || 0)}</td>
                                                                <td className="px-6 py-4 text-sm text-green-600 dark:text-green-400">+{formatCurrency((p.allowances || []).reduce((s: any, a: any) => s + Number(a.amount || 0), 0))}</td>
                                                                <td className="px-6 py-4 text-sm text-red-500 dark:text-red-400">-{formatCurrency((p.deductions || []).reduce((s: any, d: any) => s + Number(d.amount || 0), 0))}</td>
                                                                <td className="px-6 py-4 text-sm font-black text-gray-900 dark:text-white">{formatCurrency(p.netSalary || 0)}</td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${p.status === 'Paid' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800'}`}>
                                                                        {p.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-gray-800 px-6 py-4 flex flex-row-reverse border-t dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setShowViewModal(false)}
                                        className="px-8 py-2.5 bg-gray-900 dark:bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-600 transition-all shadow-lg"
                                    >
                                        Close Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default StaffDirectoryPage;
