import { useState, useEffect } from 'react';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { RefreshCw, Eye } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

type DeactivatedStudent = {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    class: { name: string; };
    section: { name: string; };
    fatherName: string;
    deactivateReason: { reason: string; };
    deactivatedAt: string;
};

export default function DeactivatedStudents() {
    const [data, setData] = useState<DeactivatedStudent[]>([]);
    const toast = useToast();
    const { hasPermission } = usePermissions();
    const [loading, setLoading] = useState(true);

    const fetchDeactivatedStudents = async () => {
        setLoading(true);
        try {
            const result = await api.getDeactivatedStudents();
            setData(result);
        } catch (error) {
            console.error("Failed to fetch deactivated students", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeactivatedStudents();
    }, []);

    const handleEnable = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to re-activate ${name}?`)) return;

        try {
            await api.activateStudent(id);
            toast.showSuccess(`Student ${name} has been re-activated.`);
            fetchDeactivatedStudents();
        } catch (error: any) {
            console.error("Failed to re-activate student", error);
            toast.showError("Failed to re-activate student: " + (error.response?.data?.message || 'Error occurred'));
        }
    };

    const columns: ColumnDef<DeactivatedStudent>[] = [
        { accessorKey: 'admissionNo', header: 'Admission No' },
        { accessorKey: 'firstName', header: 'Name', cell: ({ row }) => `${row.original.firstName} ${row.original.lastName || ''}` },
        {
            id: 'class',
            header: 'Class',
            cell: ({ row }) => `${row.original.class?.name || 'N/A'} - ${row.original.section?.name || 'N/A'}`
        },
        { accessorKey: 'fatherName', header: 'Father Name' },
        {
            id: 'deactivateReason',
            header: 'Reason',
            cell: ({ row }) => row.original.deactivateReason?.reason || 'N/A'
        },
        {
            accessorKey: 'deactivatedAt',
            header: 'Deactivated Date',
            cell: ({ row }) => row.original.deactivatedAt ? new Date(row.original.deactivatedAt).toLocaleDateString() : 'N/A'
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    {hasPermission('students:view_profile') && (
                        <button
                            onClick={() => window.location.href = `/students/profile/${row.original.id}`}
                            className="text-primary-600 hover:underline flex items-center gap-1 font-medium"
                        >
                            <Eye className="w-3.5 h-3.5" /> Profile
                        </button>
                    )}
                    {hasPermission('students:delete') && (
                        <button
                            onClick={() => handleEnable(row.original.id, `${row.original.firstName} ${row.original.lastName || ''}`)}
                            className="text-green-600 hover:underline flex items-center gap-1 font-medium"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Enable
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deactivated Students</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View and manage deactivated student records</p>
                </div>
                <button onClick={fetchDeactivatedStudents} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {loading && data.length === 0 ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <DataTable columns={columns} data={data} searchKey="firstName" placeholder="Search deactivated students..." />
            )}
        </div>
    );
}
