import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Shield, Check, AlertTriangle, Lock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { systemService, Role, Permission } from '../../services/systemService';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Modal } from '../../components/ui/modal';

const RolesPermissionsPage = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);
    const { showSuccess, showError, showWarning } = useToast();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissionIds: [] as string[]
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rolesData, permsData] = await Promise.all([
                systemService.getRoles(),
                systemService.getPermissions()
            ]);
            setRoles(rolesData || []);
            setPermissions(permsData || []);
        } catch (error: any) {
            console.error('Fetch Error:', error);
            const message = error.response?.data?.message || error.message || 'Failed to fetch roles and permissions';
            showError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Group permissions by module
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        permissions.forEach(p => {
            if (!groups[p.module]) groups[p.module] = [];
            groups[p.module].push(p);
        });
        return groups;
    }, [permissions]);

    const resetForm = () => {
        setFormData({ name: '', description: '', permissionIds: [] });
        setEditingId(null);
        setIsCreateOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await systemService.updateRole(editingId, formData);
                showSuccess('Role updated successfully');
            } else {
                await systemService.createRole(formData);
                showSuccess('Role created successfully');
            }
            resetForm();
            fetchData();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to save role');
        }
    };

    const handleEdit = (role: Role) => {
        setFormData({
            name: role.name,
            description: role.description || '',
            permissionIds: role.permissions?.map(p => p.id) || []
        });
        setEditingId(role.id);
        setIsCreateOpen(true);
    };

    const handleDeleteClick = (role: Role) => {
        if (role.isSystem) {
            showWarning('System roles cannot be deleted');
            return;
        }
        setDeletingRole(role);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingRole) return;
        try {
            await systemService.deleteRole(deletingRole.id);
            showSuccess('Role deleted successfully');
            setIsDeleteOpen(false);
            setDeletingRole(null);
            fetchData();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to delete role');
        }
    };

    const togglePermission = (id: string) => {
        setFormData(prev => ({
            ...prev,
            permissionIds: prev.permissionIds.includes(id)
                ? prev.permissionIds.filter(pid => pid !== id)
                : [...prev.permissionIds, id]
        }));
    };

    const toggleModulePermissions = (moduleName: string, checked: boolean) => {
        const modulePermIds = groupedPermissions[moduleName].map(p => p.id);
        setFormData(prev => {
            const otherPermIds = prev.permissionIds.filter(id => !modulePermIds.includes(id));
            return {
                ...prev,
                permissionIds: checked ? [...otherPermIds, ...modulePermIds] : otherPermIds
            };
        });
    };

    const columns: ColumnDef<Role>[] = [
        {
            accessorKey: 'name',
            header: 'Role Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{row.original.name}</span>
                    {row.original.isSystem && (
                        <span title="System Role">
                            <Lock className="w-3 h-3 text-amber-500" />
                        </span>
                    )}
                </div>
            )
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => <span className="text-gray-500 dark:text-gray-400 text-sm">{row.original.description || '-'}</span>
        },
        {
            id: 'permissions_count',
            header: 'Permissions',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-medium">{row.original.permissions?.length || 0}</span>
                </div>
            )
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Action</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => handleEdit(row.original)}
                        className="p-1.5 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                        title="Edit Permissions"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    {!row.original.isSystem && (
                        <button
                            onClick={() => handleDeleteClick(row.original)}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage user roles and their granular access permissions</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsCreateOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
                >
                    <Plus className="w-4 h-4" />
                    New Role
                </button>
            </div>

            {loading ? (
                <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading roles and permissions data...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={roles}
                        searchKey="name"
                    />
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={resetForm}
                title={editingId ? `Edit Role: ${formData.name}` : 'Create New Role'}
                size="xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                    placeholder="e.g. Exam Coordinator"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                                <textarea
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow min-h-[100px]"
                                    placeholder="Describe the responsibilities of this role..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                            <div className="flex gap-3">
                                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">Permission Matrix</h4>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                        Select the granular permissions for this role. Grouped by system module.
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-[10px] font-bold text-blue-700 dark:text-blue-200">
                                            {formData.permissionIds.length} Selected
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Modules & Permissions</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                                const modulePermIds = perms.map(p => p.id);
                                const isAllSelected = modulePermIds.every(id => formData.permissionIds.includes(id));

                                return (
                                    <div key={moduleName} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 group hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white capitalize">{moduleName}</h4>
                                            <button
                                                type="button"
                                                onClick={() => toggleModulePermissions(moduleName, !isAllSelected)}
                                                className={`text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors ${
                                                    isAllSelected 
                                                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                                                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                }`}
                                            >
                                                {isAllSelected ? 'Unselect All' : 'Select All'}
                                            </button>
                                        </div>
                                        <div className="space-y-2.5">
                                            {perms.map(p => (
                                                <label key={p.id} className="flex items-start gap-3 cursor-pointer group/item">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="peer sr-only"
                                                            checked={formData.permissionIds.includes(p.id)}
                                                            onChange={() => togglePermission(p.id)}
                                                        />
                                                        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 peer-checked:bg-primary-600 peer-checked:border-primary-600 transition-all flex items-center justify-center">
                                                            <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all" />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400 transition-colors">
                                                            {p.name}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 dark:text-gray-500">{p.slug}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-lg shadow-primary-600/30 transition-all active:scale-95"
                        >
                            {editingId ? 'Update Role' : 'Create Role'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Delete Role"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800/50">
                        <AlertTriangle className="w-6 h-6 shrink-0" />
                        <p className="text-sm font-medium">
                            Warning: Deleting a role might affect users assigned to it. Ensure they are moved to a different role first.
                        </p>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 px-1">
                        Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">"{deletingRole?.name}"</span>?
                    </p>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setIsDeleteOpen(false)}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-8 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 active:scale-95"
                        >
                            Yes, Delete Role
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default RolesPermissionsPage;
