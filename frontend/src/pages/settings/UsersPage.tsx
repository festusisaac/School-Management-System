import { useState, useEffect } from 'react';
import { 
    Users, 
    Search, 
    UserPlus, 
    Shield, 
    Mail, 
    Trash2, 
    Edit2, 
    CheckCircle2, 
    XCircle,
    ArrowUpDown,
    Lock
} from 'lucide-react';
import { systemService, Role } from '../../services/systemService';
import { useToast } from '../../context/ToastContext';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    roleId?: string;
    status: string;
    lastLogin?: string;
    isActive: boolean;
}

const UsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, rolesData] = await Promise.all([
                systemService.getUsers(),
                systemService.getRoles()
            ]);
            setUsers(usersData);
            // Filter out roles that are managed outside of system user management
            setRoles((rolesData || []).filter(r => !['Parent', 'Student'].includes(r.name)));
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.showError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.firstName + ' ' + user.lastName + ' ' + user.email)
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === '' || user.roleId === selectedRole || user.role === selectedRole;
        return matchesSearch && matchesRole;
    });

    const handleDeleteUser = async (id: string, email: string) => {
        if (email === 'admin@sms.school') {
            toast.showError('Default Super Admin account cannot be deleted');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this user? This will revoke all system access.')) return;
        
        try {
            await systemService.deleteUser(id);
            toast.showSuccess('User deleted successfully');
            fetchData();
        } catch (error) {
            toast.showError('Failed to delete user');
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            await systemService.updateUser(user.id, { isActive: !user.isActive });
            toast.showSuccess(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
            fetchData();
        } catch (error) {
            toast.showError('Failed to update user status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="text-primary-600" />
                        User Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage system users, roles, and access control</p>
                </div>
                <button
                    onClick={() => { setEditingUser(null); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
                >
                    <UserPlus size={20} />
                    Add System User
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Admins</p>
                    <p className="text-2xl font-bold text-primary-600">{users.filter(u => (u.role === 'Admin' || u.roleId === roles.find(r => r.name === 'Admin')?.id) && u.isActive).length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Staff</p>
                    <p className="text-2xl font-bold text-green-600">{users.filter(u => u.role !== 'Admin' && u.isActive).length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Inactive Accounts</p>
                    <p className="text-2xl font-bold text-red-600">{users.filter(u => !u.isActive).length}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[150px]"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        {roles.filter(r => r.name !== 'Super Administrator').map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                    <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <ArrowUpDown size={20} />
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">User</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Role</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">System Permissions</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Last Login</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4 bg-gray-50/50 h-16"></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No users found matching your search.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center font-bold">
                                                    {user.firstName[0]}{user.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12} /> {user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                                                user.role === 'Admin' || roles.find(r => r.id === user.roleId)?.name === 'Admin'
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                                <Shield size={12} />
                                                {roles.find(r => r.id === user.roleId)?.name || user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {roles.find(r => r.id === user.roleId)?.isSystem ? (
                                                    <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold uppercase">System Access</span>
                                                ) : (
                                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 font-medium">Standard</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => handleToggleStatus(user)}
                                                className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                                    user.isActive 
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}
                                            >
                                                {user.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                {user.isActive ? 'Active' : 'Deactivated'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => { setEditingUser(user); setShowModal(true); }}
                                                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {editingUser ? <Edit2 className="text-primary-600" /> : <UserPlus className="text-primary-600" />}
                                {editingUser ? 'Edit System User' : 'Create New User'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const data = Object.fromEntries(formData.entries());
                            
                            try {
                                if (editingUser) {
                                    await systemService.updateUser(editingUser.id, data);
                                    toast.showSuccess('User updated successfully');
                                } else {
                                    await systemService.createUser(data);
                                    toast.showSuccess('User account created successfully');
                                }
                                setShowModal(false);
                                fetchData();
                            } catch (error) {
                                toast.showError('Operation failed');
                            }
                        }} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
                                    <input name="firstName" defaultValue={editingUser?.firstName} required className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 bg-white" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
                                    <input name="lastName" defaultValue={editingUser?.lastName} required className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 bg-white" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                                <input type="email" name="email" defaultValue={editingUser?.email} required className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 bg-white" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">System Role</label>
                                <select name="roleId" defaultValue={editingUser?.roleId || editingUser?.role} required className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 bg-white">
                                    <option value="">Assign a role</option>
                                    {roles.filter(r => r.name !== 'Super Administrator').map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>
                            {!editingUser && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Initial Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input type="password" name="password" required className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 bg-white" placeholder="Min. 6 characters" />
                                    </div>
                                </div>
                            )}
                            
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold dark:text-white">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 shadow-lg shadow-primary-500/30">
                                    {editingUser ? 'Save Changes' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
