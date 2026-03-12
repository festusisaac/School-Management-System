import { useState, useEffect } from 'react';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/ui/modal';

type OnlineApplication = {
    id: string;
    firstName: string;
    lastName: string;
    gender: string;
    dob: string;
    guardianName: string;
    guardianPhone: string;
    guardianRelation: string;
    currentAddress: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    preferredClassId?: string;
};

export default function OnlineAdmission() {
    const [data, setData] = useState<OnlineApplication[]>([]);
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [selectedApplication, setSelectedApplication] = useState<OnlineApplication | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchAdmissions = async () => {
        setLoading(true);
        try {
            const result = await api.getOnlineAdmissions();
            setData(result);
        } catch (error) {
            console.error("Failed to fetch online admissions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmissions();
    }, []);

    const handleView = (app: OnlineApplication) => {
        setSelectedApplication(app);
        setIsModalOpen(true);
    };

    const handleApprove = async (id: string) => {
        if (!confirm('Are you sure you want to approve this application? This will create a new student record.')) return;

        setActionLoading(true);
        try {
            await api.approveOnlineAdmission(id);
            toast.showSuccess('Application approved successfully! Student record created.');
            fetchAdmissions();
            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Failed to approve application", error);
            toast.showError('Failed to approve application: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject this application?')) return;

        setActionLoading(true);
        try {
            await api.updateOnlineAdmissionStatus(id, 'rejected');
            toast.showSuccess('Application rejected.');
            fetchAdmissions();
            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Failed to reject application", error);
            toast.showError('Failed to reject application: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const columns: ColumnDef<OnlineApplication>[] = [
        { accessorKey: 'firstName', header: 'Student Name', cell: ({ row }) => `${row.original.firstName} ${row.original.lastName || ''}` },
        { accessorKey: 'guardianName', header: 'Guardian Name' },
        { accessorKey: 'guardianPhone', header: 'Guardian Phone' },
        { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.original.status === 'approved' ? 'bg-green-100 text-green-800' :
                    row.original.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {row.original.status.toUpperCase()}
                </span>
            )
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => handleView(row.original)} className="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100" title="View">
                        <Eye className="w-4 h-4" />
                    </button>
                    {row.original.status === 'pending' && (
                        <>
                            <button onClick={() => handleApprove(row.original.id)} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="Approve">
                                <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleReject(row.original.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Reject">
                                <XCircle className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Online Admissions</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Review pending admission applications</p>
                </div>
                <button onClick={fetchAdmissions} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {loading && data.length === 0 ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <DataTable columns={columns} data={data} searchKey="firstName" placeholder="Search applicants..." />
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Application Details"
            >
                {selectedApplication && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Student Name</h4>
                                <p className="font-semibold">{selectedApplication.firstName} {selectedApplication.lastName}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Gender</h4>
                                <p className="font-semibold">{selectedApplication.gender}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Date of Birth</h4>
                                <p className="font-semibold">{new Date(selectedApplication.dob).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                                <p className={`font-semibold capitalize ${selectedApplication.status === 'approved' ? 'text-green-600' :
                                    selectedApplication.status === 'rejected' ? 'text-red-600' :
                                        'text-yellow-600'
                                    }`}>{selectedApplication.status}</p>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="text-sm font-bold text-gray-900 mb-2">Guardian Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Name</h4>
                                    <p className="font-semibold">{selectedApplication.guardianName}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Relation</h4>
                                    <p className="font-semibold">{selectedApplication.guardianRelation}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                                    <p className="font-semibold">{selectedApplication.guardianPhone}</p>
                                </div>
                                <div className="col-span-2">
                                    <h4 className="text-sm font-medium text-gray-500">Address</h4>
                                    <p className="font-semibold">{selectedApplication.currentAddress || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {selectedApplication.status === 'pending' && (
                            <div className="flex gap-3 pt-4 border-t mt-4">
                                <button
                                    onClick={() => handleApprove(selectedApplication.id)}
                                    disabled={actionLoading}
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(selectedApplication.id)}
                                    disabled={actionLoading}
                                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

